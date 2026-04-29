import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { intelligenceService } from '@/lib/intelligence/service';
import { z } from 'zod';
import { auth } from '@/auth';
import { cookies } from 'next/headers';

/** Generate a random 8-char alphanumeric shareId (e.g. "aB3dF9xQ") */
function generateShareId(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

// Request schema validation
const ExtractRequestSchema = z.object({
  jobId: z.string().optional(),
  transcription: z.string().optional(),
  title: z.string().optional(),
  videoType: z.enum([
    'setup/tutorial',
    'strategy/framework',
    'tool demo',
    'finance/setup',
    'product teardown',
    'interview/talk',
    'research/paper',
    'debate/discussion'
  ]).optional()
}).refine((data) => data.jobId || data.transcription, {
  message: 'Either jobId or transcription must be provided'
});

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validationResult = ExtractRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validationResult.error.format() },
        { status: 400 }
      );
    }

    const { jobId, transcription, videoType, title: providedTitle } = validationResult.data;

    // Get transcript from jobId or use provided transcription
    let transcript: string;
    let jobTitle: string | undefined;

    if (jobId) {
      const job = await prisma.processingJob.findUnique({
        where: { id: jobId },
        select: { transcription: true, title: true }
      });

      if (!job) {
        return NextResponse.json({ error: 'Job not found' }, { status: 404 });
      }
      if (!job.transcription) {
        return NextResponse.json({ error: 'Job transcription not available' }, { status: 400 });
      }

      transcript = job.transcription;
      jobTitle = job.title ?? undefined;
    } else if (transcription) {
      transcript = transcription;
    } else {
      return NextResponse.json(
        { error: 'Either jobId or transcription must be provided' },
        { status: 400 }
      );
    }

    // Resolve the final title (caller > job > undefined)
    const title = providedTitle ?? jobTitle;

    // Classify and generate output
    let classification: string;
    let output: unknown;

    try {
      if (videoType) {
        classification = videoType;
        output = await intelligenceService.generateOutput(transcript, classification);
      } else {
        const result = await intelligenceService.processTranscript(transcript);
        classification = result.classification;
        output = result.output;
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (
        err.message?.includes('All providers failed') ||
        err.message?.includes('All LLM providers exhausted')
      ) {
        return NextResponse.json({ error: 'All LLM providers exhausted' }, { status: 503 });
      }
      throw error;
    }

    // Resolve userId or anonSessionId
    const session = await auth();
    const userId = session?.user ? (session.user as any).id as string : null;

    // Ensure anon session cookie exists for backfill support
    const cookieStore = await cookies();
    let anonSessionId = cookieStore.get('vext_anon')?.value ?? null;

    // Generate unique IDs
    const cardId = generateShareId(14);
    const shareId = generateShareId(8);

    // Save to database
    const card = await prisma.card.create({
      data: {
        jobId: jobId ?? null,
        userId,
        anonSessionId: userId ? null : anonSessionId,
        classification,
        output: output as object,
        cardId,
        shareId,
        title: title ?? null,
      }
    });

    // Set anon cookie in response if no user session
    const response = NextResponse.json({
      cardId: card.id,
      shareId: card.shareId,
      shareUrl: `https://vext.so/card/${card.shareId}`,
      classification: card.classification,
      output: card.output,
      title: card.title,
    });

    if (!userId && !anonSessionId) {
      const newAnonId = generateShareId(24);
      response.cookies.set('vext_anon', newAnonId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 90, // 90 days
        path: '/',
      });
      // Backfill the card with the new anonSessionId
      await prisma.card.update({
        where: { id: card.id },
        data: { anonSessionId: newAnonId },
      });
    }

    return response;

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error in extract endpoint:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}