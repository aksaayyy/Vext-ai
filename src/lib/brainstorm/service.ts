import { GroqProvider, NVIDIAProvider, OpenRouterProvider, type Provider } from '../providers/router';
import { withRetry } from '../utils/retry';
import { groqSmoother, nvidiaSmoother, openRouterSmoother } from '../utils/rate-limit';
import { buildBrainstormPrompt } from './prompts';
import type { BrainstormResult, BrainstormInput } from './types';

export class BrainstormService {
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
  }

  private async smartCallWithFailover(prompt: string): Promise<string> {
    if (!this.providers || this.providers.length === 0) {
      throw new Error('No LLM providers configured');
    }

    let lastError: Error | null = null;

    for (const provider of this.providers) {
      try {
        if (provider.name === 'groq') await groqSmoother.wait();
        else if (provider.name === 'nvidia') await nvidiaSmoother.wait();
        else await openRouterSmoother.wait();

        const result = await withRetry(async () => {
          return await provider.call(prompt);
        }, { maxRetries: 2 });

        return result;
      } catch (error: any) {
        lastError = error;
        console.error(`${provider.name} permanently failed: ${error.message}`);
      }
    }
    throw lastError || new Error('All LLM providers exhausted.');
  }

  async brainstorm(input: BrainstormInput): Promise<BrainstormResult> {
    const prompt = buildBrainstormPrompt(input);
    const result = await this.smartCallWithFailover(prompt);

    const cleaned = result.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

    try {
      const parsed = JSON.parse(cleaned);
      
      const relatedProjects = (parsed.related_projects || []).map((p: any) => ({
        title: p.title || 'Untitled Project',
        description: p.description || '',
        difficulty: ['easy', 'medium', 'hard'].includes(p.difficulty) ? p.difficulty : 'medium',
        skills_gained: Array.isArray(p.skills_gained) ? p.skills_gained : [],
      }));

      const extensionIdeas = (parsed.extension_ideas || []).map((e: any) => ({
        title: e.title || 'Untitled Extension',
        description: e.description || '',
        implementation_hint: e.implementation_hint || '',
      }));

      return {
        related_projects: relatedProjects.slice(0, 10),
        extension_ideas: extensionIdeas.slice(0, 5),
      };
    } catch (error) {
      console.error('Failed to parse brainstorm result:', error);
      throw new Error('Failed to generate brainstorm results');
    }
  }
}

export const brainstormService = new BrainstormService();
