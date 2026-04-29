import { prisma } from '@/lib/db/client';

export interface ProviderUptime {
  provider: string;
  uptimePct: number;
  avgLatencyMs: number;
  history: {
    time: string;
    success: boolean;
  }[];
}

export async function getUptimeStats(hours = 24) {
  const since = new Date(Date.now() - hours * 60 * 60 * 1000);

  const logs = await prisma.providerHealthLog.findMany({
    where: { createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
  });

  const providers = Array.from(new Set(logs.map(l => l.provider)));
  
  const stats: Record<string, ProviderUptime> = {};

  providers.forEach(p => {
    const pLogs = logs.filter(l => l.provider === p);
    const successCount = pLogs.filter(l => l.status === 'ok').length;
    const avgLatency = pLogs.length > 0 
      ? Math.round(pLogs.reduce((acc, l) => acc + l.latencyMs, 0) / pLogs.length)
      : 0;

    stats[p] = {
      provider: p,
      uptimePct: pLogs.length > 0 ? Math.round((successCount / pLogs.length) * 100) : 100,
      avgLatencyMs: avgLatency,
      history: pLogs.map(l => ({
        time: l.createdAt.toISOString(),
        success: l.status === 'ok'
      }))
    };
  });

  return stats;
}
