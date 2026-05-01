import { prisma } from '../../src/lib/db/client';
import { processVideoUrl } from '../../src/lib/audio/transcription';
import { intelligenceService } from '../../src/lib/intelligence/service';


export default async (req: Request) => {
  const { videoUrl, jobId } = await req.json();

  if (!jobId || !videoUrl) {
    console.error('[Background] Missing jobId or videoUrl');
    return;
  }

  try {
    console.log(`[Background Job ${jobId}] Starting pipeline...`);
    
    const job = await prisma.processingJob.update({
      where: { id: jobId },
      data: { status: 'processing', startedAt: new Date() },
    });

    // Step A: Download & Transcribe
    console.log(`[Background Job ${jobId}] Starting transcription...`);
    const result = await processVideoUrl(videoUrl);

    // Step B: Logic Extraction
    console.log(`[Background Job ${jobId}] Starting logic extraction...`);
    const { classification, output } = await intelligenceService.processTranscript(result.text);

    // Step C: Create Card
    const cardId = Math.random().toString(36).substring(2, 16);
    const shareId = Math.random().toString(36).substring(2, 10);
    
    console.log(`[Background Job ${jobId}] Creating card with shareId: ${shareId}`);
    
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

    console.log(`[Background Job ${jobId}] Pipeline completed successfully.`);
  } catch (error: any) {
    console.error(`[Background Job ${jobId}] Pipeline failed:`, error);
    await prisma.processingJob.update({
      where: { id: jobId },
      data: {
        status: 'failed',
        errorMessage: error.message || 'Internal processing error',
      },
    });
  }
};

export const config = {
  name: "process-background",
};
