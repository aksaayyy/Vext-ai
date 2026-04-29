/**
 * Monitoring and alerting utility.
 */
import { prisma } from '@/lib/db/client';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function sendAlert(message: string, level: 'info' | 'warn' | 'error' = 'info') {
  console.log(`[ALERT] [${level.toUpperCase()}] ${message}`);

  if (!DISCORD_WEBHOOK_URL) return;

  const color = level === 'error' ? 0xff0000 : level === 'warn' ? 0xffaa00 : 0x00ff88;

  try {
    await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `Vext Alert: ${level.toUpperCase()}`,
          description: message,
          color,
          timestamp: new Date().toISOString(),
        }]
      })
    });
  } catch (err) {
    console.error('Failed to send Discord alert:', err);
  }
}

/**
 * Checks for provider failure patterns and sends alerts.
 */
export async function checkProviderOutage(provider: string) {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const failures = await prisma.providerHealthLog.count({
    where: {
      provider,
      status: 'error',
      createdAt: { gte: fiveMinutesAgo }
    }
  });

  // If we have at least 3 failures in 5 minutes, alert
  if (failures >= 3) {
    await sendAlert(
      `Provider **${provider}** is consistently failing! ${failures} errors in the last 5 minutes.`,
      'error'
    );
  }
}
