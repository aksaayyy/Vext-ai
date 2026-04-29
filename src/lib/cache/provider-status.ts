/**
 * In-memory provider RPM tracker.
 * Module-level singleton — persists within a single serverless function
 * warm instance. For multi-instance accuracy, replace with Vercel KV:
 *   import { kv } from '@vercel/kv'
 */

const WINDOW_MS = 60_000; // 1 minute rolling window

// Map<provider, timestamp[]>
const callLog = new Map<string, number[]>();

// Known free-tier limits per provider (RPM)
export const PROVIDER_LIMITS: Record<string, number> = {
  groq:       30,
  nvidia:     10,
  openrouter: 20,
};

/** Record a call to a provider and return current RPM */
export function recordProviderCall(provider: string): number {
  const now = Date.now();
  const log = callLog.get(provider) ?? [];
  // Prune stale entries
  const fresh = log.filter(t => now - t < WINDOW_MS);
  fresh.push(now);
  callLog.set(provider, fresh);
  return fresh.length;
}

/** Get current RPM for a provider */
export function getProviderRPM(provider: string): number {
  const now = Date.now();
  const log = callLog.get(provider) ?? [];
  return log.filter(t => now - t < WINDOW_MS).length;
}

/** Get all provider stats */
export function getAllProviderStats(): Record<string, { rpm: number; limit: number; pct: number }> {
  const result: Record<string, { rpm: number; limit: number; pct: number }> = {};
  for (const [provider, limit] of Object.entries(PROVIDER_LIMITS)) {
    const rpm = getProviderRPM(provider);
    result[provider] = { rpm, limit, pct: Math.min(100, Math.round((rpm / limit) * 100)) };
  }
  return result;
}

// ── Provider health cache ──────────────────────────────────────────────────────
// Cached health check results (TTL: 60s)
interface HealthEntry {
  status: 'ok' | 'error' | 'unknown';
  latencyMs: number;
  checkedAt: number;
}

const healthCache = new Map<string, HealthEntry>();
const HEALTH_TTL_MS = 60_000;

export function getCachedHealth(provider: string): HealthEntry | null {
  const entry = healthCache.get(provider);
  if (!entry) return null;
  if (Date.now() - entry.checkedAt > HEALTH_TTL_MS) return null;
  return entry;
}

export function setCachedHealth(provider: string, entry: Omit<HealthEntry, 'checkedAt'>) {
  healthCache.set(provider, { ...entry, checkedAt: Date.now() });
}
