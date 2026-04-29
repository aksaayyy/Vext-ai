/**
 * API key utilities — generation, hashing, verification.
 * Keys are never stored in plaintext; only SHA-256 hashes go to DB.
 */
import crypto from 'crypto';
import { prisma } from '@/lib/db/client';

export const FREE_TIER_LIMIT = 50;

/** Generate a new raw key (64-char hex) and return both raw + hash + prefix */
export function generateApiKey() {
  const raw = crypto.randomBytes(32).toString('hex'); // 64 chars
  const hash = hashKey(raw);
  const prefix = raw.slice(0, 8);
  return { raw, hash, prefix };
}

/** SHA-256 hash a raw key */
export function hashKey(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

/** Standardised API error response */
export function apiError(
  error: string,
  status: number,
  extra: Record<string, unknown> = {}
) {
  return Response.json({ error, ...extra }, { status });
}

/** Verify Bearer token → returns ApiKey record or null */
export async function verifyApiKey(authHeader: string | null) {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const raw = authHeader.slice(7).trim();
  if (!raw) return null;

  const hash = hashKey(raw);

  const apiKey = await prisma.apiKey.findUnique({
    where: { keyHash: hash },
    select: {
      id: true,
      userId: true,
      plan: true,
      totalExtractions: true,
      isActive: true,
    },
  });

  if (!apiKey || !apiKey.isActive) return null;

  // Stamp lastUsedAt asynchronously (don't block)
  prisma.apiKey.update({
    where: { id: apiKey.id },
    data: { lastUsedAt: new Date() },
  }).catch(() => {});

  return apiKey;
}

/** Check if key is within free tier limits */
export function isWithinLimit(apiKey: { totalExtractions: number; plan: string }): boolean {
  if (apiKey.plan !== 'free') return true;
  return apiKey.totalExtractions < FREE_TIER_LIMIT;
}
