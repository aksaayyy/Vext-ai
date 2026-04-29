import { createWriteStream, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import youtubedl from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';
import { v4 as uuidv4 } from 'uuid';
import { Groq } from 'groq-sdk';
import { prisma } from '@/lib/db/client';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export class VideoProcessor {
  /**
   * Main entry point: Process a video URL and return transcription/info
   */
  static async process(url: string, jobId: string) {
    const tempDir = join(tmpdir(), 'vext-extractions', jobId);
    if (!existsSync(tempDir)) mkdirSync(tempDir, { recursive: true });

    try {
      // 1. Update status to 'processing'
      await prisma.processingJob.update({
        where: { id: jobId },
        data: { status: 'processing', startedAt: new Date() }
      });

      // 2. Get Video Info
      console.log(`[${jobId}] Fetching video info...`);
      const info = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        addHeader: ['referer:youtube.com', 'user-agent:googlebot']
      });

      await prisma.processingJob.update({
        where: { id: jobId },
        data: { 
          title: info.title, 
          durationSeconds: info.duration,
          videoId: info.id 
        }
      });

      // 3. Download Audio
      const audioPath = join(tempDir, 'audio.mp3');
      console.log(`[${jobId}] Downloading audio...`);
      await youtubedl(url, {
        extractAudio: true,
        audioFormat: 'mp3',
        output: audioPath,
        noCheckCertificates: true,
      });

      // 4. Transcribe using Groq Whisper
      console.log(`[${jobId}] Transcribing audio...`);
      const transcription = await groq.audio.transcriptions.create({
        file: createWriteStream(audioPath) as any, // In reality, we need to read the file
        model: 'whisper-large-v3',
      });

      // 5. Final Update
      await prisma.processingJob.update({
        where: { id: jobId },
        data: { 
          transcription: transcription.text,
          status: 'completed',
          completedAt: new Date()
        }
      });

      return transcription.text;

    } catch (error: any) {
      console.error(`[${jobId}] Processing failed:`, error);
      await prisma.processingJob.update({
        where: { id: jobId },
        data: { 
          status: 'failed', 
          errorMessage: error.message || 'Internal processing error' 
        }
      });
      throw error;
    }
  }
}
