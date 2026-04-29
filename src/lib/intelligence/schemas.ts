import { z } from 'zod';

// Classification types
export const VideoClassification = z.enum([
  'saas/blueprint',
  'setup/tutorial',
  'strategy/framework', 
  'tool demo',
  'finance/setup',
  'product teardown',
  'interview/talk',
  'research/paper',
  'debate/discussion'
]);

// Schema definitions for each classification type
export const SetupTutorialSchema = z.object({
  steps: z.array(z.string()),
  configSnippets: z.record(z.string()),
  generatedFiles: z.array(z.string())
});

export const StrategyFrameworkSchema = z.object({
  methodology: z.string(),
  keyPrinciples: z.array(z.string()),
  decisionTree: z.string().optional(),
  frameworks: z.array(z.string())
});

export const ToolDemoSchema = z.object({
  toolName: z.string(),
  features: z.array(z.string()),
  useCases: z.array(z.string()),
  prosCons: z.object({
    pros: z.array(z.string()),
    cons: z.array(z.string())
  })
});

export const FinanceSetupSchema = z.object({
  strategy: z.string(),
  riskParameters: z.record(z.string()),
  backtestResults: z.object({
    sharpeRatio: z.number().optional(),
    maxDrawdown: z.number().optional(),
    winRate: z.number().optional()
  }).optional(),
  configSnippets: z.record(z.string())
});

export const ProductTeardownSchema = z.object({
  productName: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  targetAudience: z.string(),
  alternatives: z.array(z.string()).optional()
});

export const InterviewTalkSchema = z.object({
  speaker: z.string(),
  topic: z.string(),
  keyTakeaways: z.array(z.string()),
  quotes: z.array(z.string()).optional()
});

export const ResearchPaperSchema = z.object({
  title: z.string(),
  hypothesis: z.string(),
  methodology: z.string(),
  results: z.string(),
  codeAvailability: z.boolean(),
  reproducibility: z.string()
});

export const DebateDiscussionSchema = z.object({
  topic: z.string(),
  viewpoints: z.array(z.object({
    position: z.string(),
    arguments: z.array(z.string()),
    evidence: z.array(z.string()).optional()
  })),
  consensus: z.string().optional(),
  unresolvedQuestions: z.array(z.string()).optional()
});

export const SaaSBlueprintSchema = z.object({
  core_opportunity: z.object({
    problem_statement: z.string(),
    target_market: z.string(),
    existing_solutions: z.array(z.string()),
    gap_in_market: z.string()
  }),
  technical_blueprint: z.object({
    architecture_diagram_ascii: z.string().optional(),
    data_model: z.object({
      tables_or_collections: z.array(z.string()),
      key_relationships: z.string()
    }),
    recommended_stack: z.array(z.string()),
    external_apis: z.array(z.string()),
    prompts_to_generate: z.array(z.object({
      system_prompt_text: z.string(),
      user_prompt_template: z.string()
    })),
    starter_code_snippet: z.string()
  }),
  business_model: z.object({
    revenue_streams: z.array(z.string()),
    pricing_models: z.array(z.string()),
    customer_acquisition_channels: z.array(z.string()),
    unit_economics: z.object({
      cac_estimate: z.number(),
      ltv_estimate: z.number(),
      payback_period: z.string()
    })
  }),
  moat_analysis: z.object({
    network_effects: z.boolean(),
    data_network_effects: z.boolean(),
    switching_costs: z.string(),
    ip_or_patents: z.string(),
    brand_advantage: z.string()
  }),
  execution_roadmap: z.object({
    month_1_mvp: z.array(z.string()),
    month_2_traction: z.array(z.string()),
    month_3_scale: z.array(z.string())
  }),
  generated_files: z.object({
    prompts: z.array(z.object({ filename: z.string(), content: z.string() })),
    configs: z.array(z.object({ filename: z.string(), content: z.string() })),
    scripts: z.array(z.object({ filename: z.string(), content: z.string() })),
    readme: z.string()
  })
});

// Union of all possible output schemas
export const CardOutputSchema = z.union([
  SaaSBlueprintSchema,
  SetupTutorialSchema,
  StrategyFrameworkSchema,
  ToolDemoSchema,
  FinanceSetupSchema,
  ProductTeardownSchema,
  InterviewTalkSchema,
  ResearchPaperSchema,
  DebateDiscussionSchema
]);

// Main card schema
export const CardSchema = z.object({
  classification: VideoClassification,
  output: CardOutputSchema
});

// Type definitions
export type VideoClassificationType = z.infer<typeof VideoClassification>;
export type CardOutputType = z.infer<typeof CardOutputSchema>;
export type CardType = z.infer<typeof CardSchema>;