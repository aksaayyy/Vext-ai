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

  const audioPath = path.join(outputDir, `${videoId}_audio.m4a`);

  const renditionUrls = media.videoUrls.length > 0 ? media.videoUrls : [media.videoUrl];

  let lastError: Error | null = null;
  for (const renditionUrl of renditionUrls) {
    const videoPath = path.join(outputDir, `${videoId}_video.mp4`);
    try {
      console.log(`[Instagram Scraper] Downloading video rendition for ${videoId}...`);
      const response = await withRetry(() => fetchWithTimeout(renditionUrl), {
        maxRetries: 1,
        baseDelay: 3000,
      });

      if (!response.ok) {
        throw new Error(`Failed to download video: HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(videoPath, Buffer.from(arrayBuffer));

      console.log(`[Instagram Scraper] Converting video to audio (${videoPath})...`);
      await convertVideoToM4a(videoPath, audioPath);

      if (fs.existsSync(audioPath)) {
        const size = fs.statSync(audioPath).size;
        if (size > 0) {
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
        }
      }
      throw new Error('Converted audio file is empty');
    } catch (error: any) {
      lastError = error;
      console.log(`[Instagram Scraper] Rendition failed: ${error.message}. Trying next rendition...`);
    } finally {
      cleanupFile(videoPath);
    }
  }

  if (lastError instanceof InstagramScraperError) {
    throw lastError;
  }
  throw new Error(`Instagram download failed: ${lastError?.message || 'All renditions failed'}`);
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