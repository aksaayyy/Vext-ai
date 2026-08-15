import { Groq } from 'groq-sdk';
import { PrismaClient } from '@/lib/db/generated';
import path from 'path';
import fs from 'fs';
import { prisma } from '../db/client';
import { withRetry } from '../utils/retry';
import { checkProviderOutage } from '../monitoring/alerts';

export interface TranscriptionResult {
  text: string;
  duration: number;
  language: string | null;
  confidence: number | null;
  provider: 'groq' | 'nvidia' | 'openrouter';
}

export interface TranscriptionJob {
  jobId: string;
  videoUrl: string;
  audioPath?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  transcription?: string;
  duration?: number;
  error?: string;
}

// Groq transcription (Whisper)
async function transcribeWithGroq(audioPath: string): Promise<{ text: string; duration: number; language: string | null }> {
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

  const fileStream = fs.createReadStream(audioPath);

  const transcription = await groq.audio.transcriptions.create({
    file: fileStream,
    model: 'whisper-large-v3',
    response_format: 'verbose_json',
    temperature: 0.0,
  }) as any;

  return {
    text: transcription.text,
    duration: transcription.segments?.reduce((max: number, s: any) => Math.max(max, s.end), 0) || 0,
    language: transcription.language || null,
  };
}

// NVIDIA NIM Parakeet transcription
async function transcribeWithNvidia(audioPath: string): Promise<{ text: string; duration: number; language: string | null }> {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error('NVIDIA API key not configured');
  }

  // Read audio file
  const audioBuffer = fs.readFileSync(audioPath);

  // Convert to base64 or use as buffer for multipart upload
  // NVIDIA NIM Parakeet endpoint: https://ai.api.nvidia.com/v1/bm/stt/parakeet-nemo-.../transcribe
  // Actually for Parakeet, the endpoint is typically: https://ai.api.nvidia.com/v1/bm/stt/parakeet-nemo-ctc-.../transcribe

  const response = await fetch('https://ai.api.nvidia.com/v1/bm/stt/parakeet-nemo-ctc-30m-en-de-pl/recognize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
      'Content-Type': 'audio/wav',
    },
    body: audioBuffer,
  });

  if (response.status === 429) {
    const error: any = new Error('Rate limit exceeded');
    error.status = 429;
    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA transcription failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  return {
    text: data.text || data.transcript || '',
    duration: data.duration || 0,
    language: data.language || null,
  };
}

// Alternative NVIDIA approach using multipart FormData
async function transcribeWithNvidiaMultipart(audioPath: string): Promise<{ text: string; duration: number; language: string | null }> {
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error('NVIDIA API key not configured');
  }

  const FormData = await import('form-data');
  const fs = await import('fs');

  const formData = new FormData.default();
  formData.append('audio_file', fs.createReadStream(audioPath));
  formData.append('format', 'json');
  formData.append('language', 'english');
  formData.append('model', 'parakeet-nemo-ctc-30m-en-de-pl');

  const response = await fetch('https://ai.api.nvidia.com/v1/bm/stt/parakeet-nemo-ctc-30m-en-de-pl/recognize', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.NVIDIA_API_KEY}`,
    },
    body: formData as any,
  });

  if (response.status === 429) {
    const error: any = new Error('Rate limit exceeded');
    error.status = 429;
    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NVIDIA transcription failed: ${response.status} ${errorText}`);
  }

  const data = await response.json();

  return {
    text: data.text || data.transcript || '',
    duration: data.duration || 0,
    language: data.language || null,
  };
}

// Main transcription with failover
export async function transcribeAudio(
  audioPath: string,
  duration: number,
  providerOverrides?: string[]
): Promise<TranscriptionResult> {
  const providers = providerOverrides || ['groq', 'nvidia'];
  let lastError: Error | null = null;

  for (const provider of providers) {
    const t0 = Date.now();
    try {
      console.log(`Attempting transcription with ${provider}...`);

      const result = await withRetry(async () => {
        if (provider === 'groq') {
          const res = await transcribeWithGroq(audioPath);
          return {
            ...res,
            provider: 'groq' as const,
            confidence: 0.95,
          };
        } else if (provider === 'nvidia') {
          let res;
          try {
            res = await transcribeWithNvidia(audioPath);
          } catch (error: any) {
            if (error?.message?.includes('multipart')) {
              res = await transcribeWithNvidiaMultipart(audioPath);
            } else {
              throw error;
            }
          }
          return {
            ...res,
            provider: 'nvidia' as const,
            confidence: 0.90,
          };
        }
        throw new Error(`Unknown provider: ${provider}`);
      }, { maxRetries: 2 });

      // Log success
      await prisma.providerHealthLog.create({
        data: {
          provider: `whisper-${provider}`,
          status: 'ok',
          latencyMs: Date.now() - t0,
        }
      });

      return result as TranscriptionResult;

    } catch (error: any) {
      lastError = error;
      
      // Log failure
      await prisma.providerHealthLog.create({
        data: {
          provider: `whisper-${provider}`,
          status: 'error',
          latencyMs: Date.now() - t0,
          message: error.message || String(error),
        }
      });

      // Trigger outage check
      checkProviderOutage(`whisper-${provider}`).catch(() => {});

      console.error(`${provider} transcription permanently failed after retries: ${error.message}`);
    }
  }

  throw lastError || new Error('All transcription providers failed');
}

// Process a video URL end-to-end
export async function processVideoUrl(videoUrl: string, instagramCookies?: string): Promise<TranscriptionResult & { videoInfo: any }> {
  const { downloadVideoAudio } = await import('./downloader');
  const { convertToWav16k, ensureDirectoryExists, cleanupFile } = await import('./ffmpeg');
  const { tmpdir } = await import('os');

  const outputDir = path.join(tmpdir(), 'vext-audio');
  ensureDirectoryExists(outputDir);

  let audioPath: string | null = null;
  let wavPath: string | null = null;
  let videoInfo: any = null;

  try {
    // Step 1: Download audio from Video
    console.log(`Downloading audio from ${videoUrl}...`);
    const downloadResult = await downloadVideoAudio(videoUrl, outputDir, { instagramCookies });
    audioPath = downloadResult.audioPath;
    videoInfo = downloadResult.info;

    // Step 2: Convert to 16k mono WAV for Whisper
    console.log('Converting audio to 16k mono WAV...');
    wavPath = path.join(outputDir, `${videoInfo.id}_converted.wav`);
    const { duration } = await convertToWav16k(audioPath, wavPath);

    // Step 3: Transcribe
    console.log('Transcribing audio...');
    const transcription = await transcribeAudio(wavPath || audioPath, duration || videoInfo.duration);

    return {
      ...transcription,
      videoInfo,
    };
  } finally {
    // Cleanup temp files
    if (audioPath) cleanupFile(audioPath);
    if (wavPath) cleanupFile(wavPath);
  }
}
