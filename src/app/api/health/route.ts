import { NextRequest } from 'next/server';
import { getAllProviderStats } from '@/lib/cache/provider-status';
import { GroqProvider, NVIDIAProvider, OpenRouterProvider } from '@/lib/providers/router';
import { setCachedHealth, getCachedHealth } from '@/lib/cache/provider-status';

export const dynamic = 'force-dynamic';

async function checkProviderHealth(name: string, provider: { checkHealth: () => Promise<{ status: string }> }) {
  // Return cached if fresh
  const cached = getCachedHealth(name);
  if (cached) return { name, ...cached };

  const t0 = Date.now();
  try {
    const result = await provider.checkHealth();
    const entry = {
      status: result.status === 'ok' ? 'ok' as const : 'error' as const,
      latencyMs: Date.now() - t0,
    };
    setCachedHealth(name, entry);
    return { name, ...entry, checkedAt: Date.now() };
  } catch {
    const entry = { status: 'error' as const, latencyMs: Date.now() - t0 };
    setCachedHealth(name, entry);
    return { name, ...entry, checkedAt: Date.now() };
  }
}

export async function GET(_req: NextRequest) {
  const groq = new GroqProvider(process.env.GROQ_API_KEY);
  const nvidia = new NVIDIAProvider(process.env.NVIDIA_API_KEY);
  const openrouter = new OpenRouterProvider(process.env.OPENROUTER_API_KEY);

  const [groqHealth, nvidiaHealth, openrouterHealth] = await Promise.all([
    checkProviderHealth('groq', groq),
    checkProviderHealth('nvidia', nvidia),
    checkProviderHealth('openrouter', openrouter),
  ]);

  const rpmStats = getAllProviderStats();

  return Response.json({
    providers: {
      groq:       { ...groqHealth,       rpm: rpmStats.groq },
      nvidia:     { ...nvidiaHealth,     rpm: rpmStats.nvidia },
      openrouter: { ...openrouterHealth, rpm: rpmStats.openrouter },
    },
    timestamp: new Date().toISOString(),
  });
}
