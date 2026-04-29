import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { processVideoUrl } from '@/lib/audio/transcription';
import { intelligenceService } from '@/lib/intelligence/service';
import { v4 as uuidv4 } from 'uuid';

/** Generate a random 8-char alphanumeric shareId (e.g. "aB3dF9xQ") */
function generateShareId(length = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let id = '';
  for (let i = 0; i < length; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { videoUrl, jobId: existingJobId } = await request.json();

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    // 1. Get or Create Job
    let job;
    if (existingJobId) {
      job = await prisma.processingJob.findUnique({ where: { id: existingJobId } });
      console.log(`[API] Found existing job ${existingJobId}. User: ${job?.userId}`);
    }

    if (!job) {
      job = await prisma.processingJob.create({
        data: {
          videoUrl,
          status: 'queued',
        },
      });
    }

    // 2. Start Processing in Background
    // We don't await this so the API returns immediately
    (async () => {
      try {
        await prisma.processingJob.update({
          where: { id: job.id },
          data: { status: 'processing', startedAt: new Date() },
        });

        // Step A: Download & Transcribe
        console.log(`[Job ${job.id}] Starting transcription...`);
        const result = await processVideoUrl(videoUrl);

        // Step B: Logic Extraction
        console.log(`[Job ${job.id}] Starting logic extraction...`);
        const { classification, output } = await intelligenceService.processTranscript(result.text);

        // Step C: Create Card
        const cardId = generateShareId(14);
        const shareId = generateShareId(8);
        
        console.log(`[Job ${job.id}] Creating card with shareId: ${shareId} for user: ${job.userId}`);
        
        await prisma.card.create({
          data: {
            jobId: job.id,
            userId: job.userId,
            classification,
            output: output as any,
            cardId,
            shareId,
            title: result.videoInfo.title ?? 'Untitled Extraction',
          }
        });

        // Step D: Mark Job Completed
        await prisma.processingJob.update({
          where: { id: job.id },
          data: {
            status: 'completed',
            transcription: result.text,
            title: result.videoInfo.title,
            durationSeconds: result.videoInfo.duration,
            videoId: result.videoInfo.id,
            completedAt: new Date(),
          },
        });

        console.log(`[Job ${job.id}] Pipeline completed successfully.`);
      } catch (error: any) {
        console.error(`[Job ${job.id}] Pipeline failed:`, error);
        await prisma.processingJob.update({
          where: { id: job.id },
          data: {
            status: 'failed',
            errorMessage: error.message || 'Internal processing error',
          },
        });
      }
    })();

    return NextResponse.json({
      jobId: job.id,
      status: 'processing',
    });

  } catch (error: any) {
    console.error('Error in process endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}