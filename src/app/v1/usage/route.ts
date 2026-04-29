import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { verifyApiKey, apiError, FREE_TIER_LIMIT } from '@/lib/auth/api-key';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const apiKeyRecord = await verifyApiKey(req.headers.get('authorization'));
  if (!apiKeyRecord) return apiError('unauthorized', 401);

  // Also fetch user's bonus credits
  const user = await prisma.user.findUnique({
    where: { id: apiKeyRecord.userId },
    select: { bonusCredits: true, email: true },
  });

  const limit = apiKeyRecord.plan === 'free'
    ? FREE_TIER_LIMIT + (user?.bonusCredits ?? 0)
    : Infinity;

  const remaining = Math.max(0, limit - apiKeyRecord.totalExtractions);

  return Response.json({
    plan:             apiKeyRecord.plan,
    totalExtractions: apiKeyRecord.totalExtractions,
    limit:            limit === Infinity ? null : limit,
    remaining:        limit === Infinity ? null : remaining,
    bonusCredits:     user?.bonusCredits ?? 0,
    resetAt:          null, // rolling window — no hard reset date on free tier
  });
}
