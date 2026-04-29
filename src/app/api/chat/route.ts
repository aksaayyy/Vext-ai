import { GroqProvider, NVIDIAProvider, OpenRouterProvider, smartCall } from '@/lib/providers/router';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { prompt } = await request.json();

    const providers = [
      new GroqProvider(process.env.GROQ_API_KEY),
      new NVIDIAProvider(process.env.NVIDIA_API_KEY),
      new OpenRouterProvider(process.env.OPENROUTER_API_KEY),
    ].filter((p) => {
      // Filter out providers without API keys
      try {
        const key = process.env[
          p.name === 'groq' ? 'GROQ_API_KEY' :
          p.name === 'nvidia' ? 'NVIDIA_API_KEY' :
          'OPENROUTER_API_KEY'
        ];
        return !!key;
      } catch {
        return false;
      }
    });

    if (providers.length === 0) {
      return Response.json(
        { error: 'No API keys configured for any provider' },
        { status: 400 }
      );
    }

    const result = await smartCall(prompt, providers);

    return Response.json({ result, provider: providers[0].name });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
