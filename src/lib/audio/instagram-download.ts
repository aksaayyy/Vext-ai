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

interface StreamProbe {
  videoCount: number;
  audioCount: number;
}

function probeStreams(filePath: string): Promise<StreamProbe> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err || !metadata || !metadata.streams) {
        resolve({ videoCount: 0, audioCount: 0 });
        return;
      }
      const videoCount = metadata.streams.filter((s) => s.codec_type === 'video').length;
      const audioCount = metadata.streams.filter((s) => s.codec_type === 'audio').length;
      resolve({ videoCount, audioCount });
    });
  });
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
  console.log(`[Instagram Scraper] ${renditionUrls.length} rendition(s) to try for ${videoId}`);

  const dashManifest = media.dashManifest;
  if (dashManifest && fs.existsSync(audioPath) === false) {
    try {
      const manifestPath = path.join(outputDir, `${videoId}_manifest.mpd`);
      fs.writeFileSync(manifestPath, dashManifest);
      console.log(`[Instagram Scraper] Trying DASH manifest audio extraction for ${videoId}...`);
      await convertManifestToM4a(manifestPath, audioPath);
      const size = fs.statSync(audioPath).size;
      if (size > 0) {
        console.log(`[Instagram Scraper] DASH manifest audio extraction succeeded (${size} bytes)`);
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
      console.log('[Instagram Scraper] DASH manifest audio extraction produced empty output');
    } catch (error: any) {
      console.log(`[Instagram Scraper] DASH manifest audio extraction failed: ${error.message}`);
    } finally {
      cleanupFile(path.join(outputDir, `${videoId}_manifest.mpd`));
    }
  }

  let lastError: Error | null = null;
  for (let i = 0; i < renditionUrls.length; i++) {
    const renditionUrl = renditionUrls[i];
    const videoPath = path.join(outputDir, `${videoId}_video.mp4`);
    try {
      console.log(`[Instagram Scraper] Downloading video rendition ${i + 1}/${renditionUrls.length} for ${videoId}...`);
      const response = await withRetry(() => fetchWithTimeout(renditionUrl), {
        maxRetries: 1,
        baseDelay: 3000,
      });

      if (!response.ok) {
        throw new Error(`Failed to download video: HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      fs.writeFileSync(videoPath, Buffer.from(arrayBuffer));
      console.log(`[Instagram Scraper] Downloaded ${fs.statSync(videoPath).size} bytes, probing streams...`);

      const probe = await probeStreams(videoPath);
      const audioCount = probe.audioCount;
      console.log(`[Instagram Scraper] Video has ${probe.videoCount} video / ${audioCount} audio stream(s)`);
      if (audioCount === 0) {
        throw new Error('Video rendition has no audio stream');
      }

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

function convertManifestToM4a(inputPath: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .noVideo()
      .audioCodec('aac')
      .audioBitrate('128k')
      .format('mp4')
      .on('error', (err) => {
        reject(new Error(`FFmpeg manifest conversion error: ${err.message}`));
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