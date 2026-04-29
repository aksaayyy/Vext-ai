import { GroqProvider, NVIDIAProvider, OpenRouterProvider, smartCall, type Provider } from '../providers/router';
import { prisma } from '../db/client';
import { withRetry } from '../utils/retry';
import { checkProviderOutage } from '../monitoring/alerts';
import { groqSmoother, nvidiaSmoother, openRouterSmoother } from '../utils/rate-limit';
import { 
  VideoClassification, 
  VideoClassificationType,
  CardOutputSchema, 
  CardSchema, 
  type CardOutputType, 
  type CardType,
  SetupTutorialSchema,
  StrategyFrameworkSchema,
  ToolDemoSchema,
  FinanceSetupSchema,
  ProductTeardownSchema,
  InterviewTalkSchema,
  ResearchPaperSchema,
  DebateDiscussionSchema,
  SaaSBlueprintSchema
} from './schemas';
import { z } from 'zod';
import { jsonrepair } from 'jsonrepair';

const classificationPrompt = (transcript: string) => `
You are Vext, a video intelligence tool. Classify the following transcript into exactly one of these types:
- saas/blueprint: deep technical and business blueprint for a SaaS
- setup/tutorial: step‑by‑step instructions, installation guides
- strategy/framework: high‑level methodology, decision trees
- tool demo: showcasing a product's features
- finance/setup: trading, backtesting, portfolio configuration
- product teardown: analysis of strengths/weaknesses of a competitor
- interview/talk: Q&A, keynote, presentation
- research/paper: academic, reproducibility, code implementation
- debate/discussion: multiple viewpoints, argument mapping

Transcript: """${transcript}"""

Return only the category name.
`;

const godModePrompt = (transcript: string) => `
You are Vext God Mode – an AI that helps developers build Fortune 500 SaaS companies from any video.

Your task: Given the transcript of a video (tutorial, teardown, strategy talk, interview, or research paper), produce a JSON object with the following fields. 

DO NOT output step‑by‑step summaries. DO NOT just list what the video said. Instead, INFER and GENERATE actionable, technical, business‑grade insights.

Transcript: """${transcript}"""

Output this exact JSON structure:
{
  "core_opportunity": {
    "problem_statement": "string – what pain point does the video suggest?",
    "target_market": "string – estimated market size (TAM/SAM/SOM) if possible, else 'unknown'",
    "existing_solutions": ["string array – competitors or alternatives mentioned"],
    "gap_in_market": "string – what's missing that a new SaaS could solve?"
  },
  "technical_blueprint": {
    "architecture_diagram_ascii": "string (optional – ascii art of components)",
    "data_model": {
      "tables_or_collections": ["string – e.g., 'users', 'projects', 'extractions'"],
      "key_relationships": "string – e.g., 'one user has many projects'"
    },
    "recommended_stack": ["PostgreSQL", "Redis", "FastAPI", "Next.js", "Tailwind"],
    "external_apis": ["Stripe", "OpenAI", "Supabase", "Resend"],
    "prompts_to_generate": [
      {
        "system_prompt_text": "string – a complete system prompt for an AI agent that solves the core problem",
        "user_prompt_template": "string – template with placeholders like {input}"
      }
    ],
    "starter_code_snippet": "string – a minimal working script (Python/JS) that implements the core logic"
  },
  "business_model": {
    "revenue_streams": ["subscription", "usage‑based", "enterprise", "marketplace fee"],
    "pricing_models": ["freemium", "$29/month", "$0.01 per API call"],
    "customer_acquisition_channels": ["SEO", "content marketing", "product‑led growth", "referrals"],
    "unit_economics": {
      "cac_estimate": 50,
      "ltv_estimate": 600,
      "payback_period": "3 months"
    }
  },
  "moat_analysis": {
    "network_effects": true,
    "data_network_effects": true,
    "switching_costs": "string – e.g., 'high due to custom embeddings'",
    "ip_or_patents": "string – any patentable method?",
    "brand_advantage": "string – first‑mover or trust?"
  },
  "execution_roadmap": {
    "month_1_mvp": ["Build landing page", "Implement core extraction", "Launch to 100 beta users"],
    "month_2_traction": ["Integrate payment", "Onboard first 10 paying customers", "Collect feedback"],
    "month_3_scale": ["Hire first engineer", "Launch API", "Reach $5k MRR"]
  },
  "generated_files": {
    "prompts": [{"filename": "system_prompt.txt", "content": "string"}],
    "configs": [{"filename": "config.yaml", "content": "string"}],
    "scripts": [{"filename": "deploy.sh", "content": "string"}],
    "readme": "string – markdown getting started guide"
  }
}

If the video lacks explicit data for a field, use reasonable defaults based on the topic. Be creative but grounded. Your goal is to give the viewer a BLUEPRINT to build a company, not just understand the video.

CRITICAL INSTRUCTIONS FOR JSON VALIDITY:
1. Return ONLY valid JSON. Absolutely no markdown wrappers like \`\`\`json outside the content.
2. Escape all internal quotes (\") and newlines (\\n) properly inside strings.
3. For multi-line strings like \`system_prompt_text\` or \`starter_code_snippet\`, you MUST use \\n instead of literal line breaks.
`;

const generationPrompts: Record<string, (transcript: string) => string> = {
  'saas/blueprint': godModePrompt,
  'setup/tutorial': godModePrompt,
  'strategy/framework': godModePrompt,
  'tool demo': godModePrompt,
  'finance/setup': godModePrompt,
  'product teardown': godModePrompt,
  'interview/talk': godModePrompt,
  'research/paper': godModePrompt,
  'debate/discussion': godModePrompt
};

export class IntelligenceService {
  private providers: Provider[];

  constructor() {
    this.providers = [
      new GroqProvider(process.env.GROQ_API_KEY),
      new NVIDIAProvider(process.env.NVIDIA_API_KEY),
      new OpenRouterProvider(process.env.OPENROUTER_API_KEY)
    ].filter(provider => {
      try {
        const key = process.env[
          provider.name === 'groq' ? 'GROQ_API_KEY' :
          provider.name === 'nvidia' ? 'NVIDIA_API_KEY' :
          'OPENROUTER_API_KEY'
        ];
        return !!key;
      } catch {
        return false;
      }
    });

    if (this.providers.length === 0) {
      throw new Error('No LLM providers configured');
    }
  }

  private cleanJson(text: string): string {
    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(json)?\n/, '').replace(/\n```$/, '').trim();
    }
    
    try {
      return jsonrepair(cleaned);
    } catch (e) {
      console.warn("jsonrepair failed, returning original cleaned text", e);
      return cleaned;
    }
  }

  private async smartCallWithFailover(prompt: string): Promise<string> {
    if (!this.providers || this.providers.length === 0) {
      throw new Error('No providers available');
    }

    let lastError: Error | null = null;

    for (const provider of this.providers) {
      const t0 = Date.now();
      try {
        if (provider.name === 'groq') await groqSmoother.wait();
        else if (provider.name === 'nvidia') await nvidiaSmoother.wait();
        else await openRouterSmoother.wait();

        const result = await withRetry(async () => {
          console.log(`Calling ${provider.name}...`);
          return await provider.call(prompt);
        }, { maxRetries: 2 });

        await prisma.providerHealthLog.create({
          data: {
            provider: provider.name,
            status: 'ok',
            latencyMs: Date.now() - t0,
          }
        });

        return result;
      } catch (error: any) {
        lastError = error;
        await prisma.providerHealthLog.create({
          data: {
            provider: provider.name,
            status: 'error',
            latencyMs: Date.now() - t0,
            message: error.message || String(error),
          }
        });
        checkProviderOutage(provider.name).catch(() => {});
        console.error(`${provider.name} permanently failed after retries: ${error.message}`);
      }
    }
    throw lastError || new Error('All LLM providers exhausted.');
  }

  async classifyTranscript(transcript: string): Promise<VideoClassificationType> {
    const prompt = classificationPrompt(transcript);
    const result = await this.smartCallWithFailover(prompt);
    const classification = result.trim().toLowerCase();
    
    const validClassifications = [
      'saas/blueprint',
      'setup/tutorial',
      'strategy/framework', 
      'tool demo',
      'finance/setup',
      'product teardown',
      'interview/talk',
      'research/paper',
      'debate/discussion'
    ];

    if (classification.includes('saas') || classification.includes('blueprint')) {
      return 'saas/blueprint';
    }

    for (const valid of validClassifications) {
      if (classification === valid || classification.includes(valid.replace('/', ''))) {
        return valid as VideoClassificationType;
      }
    }

    return 'saas/blueprint'; // Default to blueprint for God Mode
  }

  async generateOutput(transcript: string, classification: string): Promise<CardOutputType> {
    const prompt = (generationPrompts[classification] || godModePrompt)(transcript);
    const result = await this.smartCallWithFailover(prompt);
    
    try {
      const parsed = JSON.parse(this.cleanJson(result));
      if (parsed.core_opportunity || classification === 'saas/blueprint') {
        return SaaSBlueprintSchema.parse(parsed);
      }

      // Legacy fallback (should ideally not hit this since all prompts are now godModePrompt)
      switch (classification) {
        case 'setup/tutorial': return SetupTutorialSchema.parse(parsed);
        case 'strategy/framework': return StrategyFrameworkSchema.parse(parsed);
        case 'tool demo': return ToolDemoSchema.parse(parsed);
        case 'finance/setup': return FinanceSetupSchema.parse(parsed);
        case 'product teardown': return ProductTeardownSchema.parse(parsed);
        case 'interview/talk': return InterviewTalkSchema.parse(parsed);
        case 'research/paper': return ResearchPaperSchema.parse(parsed);
        case 'debate/discussion': return DebateDiscussionSchema.parse(parsed);
        default: return SaaSBlueprintSchema.parse(parsed);
      }
    } catch (error) {
      console.error('Failed to parse output:', error);
      throw new Error(`Failed to generate blueprint: ${error}`);
    }
  }

  async processTranscript(transcript: string): Promise<CardType> {
    const classification = await this.classifyTranscript(transcript);
    const output = await this.generateOutput(transcript, classification);
    return { classification, output };
  }
}

export const intelligenceService = new IntelligenceService();