import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { downloadWithHeaders, InstagramScraperError, resolveInstagramMedia } from './instagram-scraper';
import { withRetry } from '../utils/retry';

export interface InstagramDownloadResult {
  audioPath: string;
  info: {
    id: string;
    title: string;
    duration: number;
    uploader: string;
    webpage_url: string;
  };
}

async function fetchWithTimeout(url: string, timeoutMs = 120000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await downloadWithHeaders(url);
  } finally {
    clearTimeout(timer);
  }
}

export async function downloadInstagramVideo(videoUrl: string, outputDir: string): Promise<InstagramDownloadResult> {
  const media = await withRetry(() => resolveInstagramMedia(videoUrl), {
    maxRetries: 2,
    baseDelay: 3000,
  });

  const videoId = media.shortcode;
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const videoPath = path.join(outputDir, `${videoId}_video.mp4`);
  const audioPath = path.join(outputDir, `${videoId}_audio.m4a`);

  try {
    console.log(`[Instagram Scraper] Downloading video for ${videoId}...`);
    const response = await withRetry(() => fetchWithTimeout(media.videoUrl), {
      maxRetries: 2,
      baseDelay: 3000,
    });

    if (!response.ok) {
      throw new Error(`Failed to download video: HTTP ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    fs.writeFileSync(videoPath, Buffer.from(arrayBuffer));

    console.log(`[Instagram Scraper] Converting video to audio (${videoPath})...`);
    await convertVideoToM4a(videoPath, audioPath);

    if (!fs.existsSync(audioPath)) {
      throw new Error('Failed to convert video to audio');
    }

    return {
      audioPath,
      info: {
        id: videoId,
        title: media.title,
        duration: media.duration,
        uploader: media.uploader,
        webpage_url: videoUrl,
      },
    };
  } catch (error: any) {
    if (error instanceof InstagramScraperError) {
      throw error;
    }
    throw new Error(`Instagram download failed: ${error.message}`);
  } finally {
    cleanupFile(videoPath);
  }
}

function convertVideoToM4a(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('aac')
      .audioBitrate('128k')
      .format('mp4')
      .on('error', (err) => {
        reject(new Error(`FFmpeg conversion error: ${err.message}`));
      })
      .on('end', () => resolve())
      .save(outputPath);
  });
}

function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Failed to cleanup file:', filePath, error);
  }
}

export async function getInstagramScraperInfo(videoUrl: string): Promise<InstagramDownloadResult['info']> {
  const media = await withRetry(() => resolveInstagramMedia(videoUrl), {
    maxRetries: 2,
    baseDelay: 3000,
  });
  return {
    id: media.shortcode,
    title: media.title,
    duration: media.duration,
    uploader: media.uploader,
    webpage_url: videoUrl,
  };
}