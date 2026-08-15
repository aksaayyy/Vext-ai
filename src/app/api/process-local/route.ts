import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { processVideoUrl } from '@/lib/audio/transcription';
import { createIntelligenceService } from '@/lib/intelligence/service';

export const dynamic = 'force-dynamic';

async function updateJobProgress(jobId: string, progress: number, stage: string) {
  await prisma.processingJob.update({
    where: { id: jobId },
    data: { 
      // Store progress in errorMessage field temporarily (or add a progress field to schema)
      errorMessage: JSON.stringify({ progress, stage, updatedAt: new Date().toISOString() })
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const { jobId } = await request.json();

    if (!jobId) {
      return NextResponse.json({ error: 'jobId is required' }, { status: 400 });
    }

    const job = await prisma.processingJob.findUnique({
      where: { id: jobId },
      select: { id: true, videoUrl: true, userId: true, status: true }
    });

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (job.status !== 'queued') {
      return NextResponse.json({ error: 'Job already processing or completed' }, { status: 400 });
    }

    // Update to processing
    await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: 'processing', startedAt: new Date() },
    });

    try {
      // Get user keys and Instagram cookies if available
      let userApiKeys = {};
      let instagramCookies: string | undefined;
      if (job.userId) {
        const user = await prisma.user.findUnique({
          where: { id: job.userId },
          select: { groqApiKey: true, nvidiaApiKey: true, openrouterApiKey: true, instagramCookies: true }
        });
        if (user) {
          userApiKeys = {
            groqApiKey: user.groqApiKey,
            nvidiaApiKey: user.nvidiaApiKey,
            openrouterApiKey: user.openrouterApiKey,
          };
          instagramCookies = user.instagramCookies || undefined;
        }
      }

      // Step A: Download & Transcribe
      console.log(`[Local Process] Starting transcription for job ${jobId}...`);
      await updateJobProgress(jobId, 10, 'downloading');

      const result = await processVideoUrl(job.videoUrl, instagramCookies);
      
      await updateJobProgress(jobId, 50, 'transcribing');

      const service = createIntelligenceService(userApiKeys);

      // Step B: Logic Extraction
      console.log(`[Local Process] Starting logic extraction for job ${jobId}...`);
      await updateJobProgress(jobId, 70, 'extracting');

      const { classification, output } = await service.processTranscript(result.text);

      // Step C: Create Card
      const cardId = Math.random().toString(36).substring(2, 16);
      const shareId = Math.random().toString(36).substring(2, 10);
      
      console.log(`[Local Process] Creating card with shareId: ${shareId}`);
      await updateJobProgress(jobId, 90, 'creating_card');

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
        where: { id: jobId },
        data: {
          status: 'completed',
          transcription: result.text,
          title: result.videoInfo.title,
          durationSeconds: result.videoInfo.duration,
          videoId: result.videoInfo.id,
          completedAt: new Date(),
          errorMessage: null, // Clear progress
        },
      });

      console.log(`[Local Process] Job ${jobId} completed successfully.`);

      return NextResponse.json({
        jobId,
        status: 'completed',
        shareId,
      });

    } catch (processError: any) {
      const errorMsg = processError.message || String(processError);
      const errorStack = processError.stack || '';
      console.error(`[Local Process] Job ${jobId} failed:`, errorMsg, errorStack);

      await prisma.processingJob.update({
        where: { id: jobId },
        data: {
          status: 'failed',
          errorMessage: errorMsg.slice(0, 500),
        },
      });

      return NextResponse.json({
        jobId,
        status: 'failed',
        error: errorMsg,
        stack: errorStack.slice(0, 500)
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('[Local Process] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
