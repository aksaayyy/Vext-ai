import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/client';
import { intelligenceService } from '@/lib/intelligence/service';
import { verifyApiKey, apiError, isWithinLimit, FREE_TIER_LIMIT } from '@/lib/auth/api-key';
import { recordProviderCall } from '@/lib/cache/provider-status';
import { processVideoUrl } from '@/lib/audio/transcription';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const BodySchema = z.object({
  videoUrl: z.string().url({ message: 'videoUrl must be a valid URL' }),
  title:    z.string().max(300).optional(),
});

/** Generate random 8-char alphanumeric ID */
function genId(len = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < len; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const apiKeyRecord = await verifyApiKey(req.headers.get('authorization'));
  if (!apiKeyRecord) {
    return apiError('unauthorized', 401, { hint: 'Provide a valid Bearer token' });
  }
  if (!isWithinLimit(apiKeyRecord)) {
    return apiError('rate_limit_exceeded', 429, {
      plan: apiKeyRecord.plan,
      limit: FREE_TIER_LIMIT,
      used: apiKeyRecord.totalExtractions,
      hint: 'You have reached the free tier limit of 50 extractions.',
    });
  }

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: unknown;
  try { body = await req.json(); } catch { return apiError('invalid_json', 400); }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError('validation_error', 422, {
      fields: parsed.error.flatten().fieldErrors,
    });
  }
  const { videoUrl, title: providedTitle } = parsed.data;

  // ── Run extraction ──────────────────────────────────────────────────────────
  let classification: string;
  let output: unknown;
  let usedProvider = 'groq';
  let transcriptText = '';

  try {
    // 1. Get transcription
    const transcriptionResult = await processVideoUrl(videoUrl);
    transcriptText = transcriptionResult.text;

    // 2. Process with LLM
    const result = await intelligenceService.processTranscript(transcriptText);
    classification = result.classification;
    output = result.output;
    
    // 3. Track usage (approximate provider tracking)
    // Note: IntelligenceService doesn't return the provider yet, we could enhance it if needed
    recordProviderCall(usedProvider);
  } catch (err: unknown) {
    const e = err as Error;
    console.error('v1/extract error:', e);
    if (e.message?.includes('All LLM providers exhausted') || e.message?.includes('All providers failed')) {
      return apiError('provider_unavailable', 503, {
        message: 'All AI providers are busy – try again in 30 seconds',
      });
    }
    return apiError('processing_failed', 500, { message: e.message });
  }

  // ── Persist card ────────────────────────────────────────────────────────────
  const [card] = await Promise.all([
    prisma.card.create({
      data: {
        jobId:    null,
        userId:   apiKeyRecord.userId,
        cardId:   genId(14),
        shareId:  genId(8),
        classification,
        output:   output as object,
        title:    providedTitle ?? null,
      },
    }),
    prisma.apiKey.update({
      where: { id: apiKeyRecord.id },
      data:  { totalExtractions: { increment: 1 } },
    }),
  ]);

  return Response.json({
    cardId:    card.shareId, // Aligning with the requirement to return cardId (we'll use shareId as the public identifier)
    shareUrl:  `https://vext.so/card/${card.shareId}`,
    classification,
  }, { status: 201 });
}
