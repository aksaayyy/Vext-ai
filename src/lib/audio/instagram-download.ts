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
  if (dashManifest) {
    console.log(`[Instagram Scraper] DASH manifest present (${dashManifest.length} chars)`);
  } else {
    console.log('[Instagram Scraper] No DASH manifest available');
  }
  if (dashManifest && fs.existsSync(audioPath) === false) {
    try {
      const audioUrl = extractAudioStreamUrl(dashManifest);
      if (!audioUrl) {
        console.log('[Instagram Scraper] No audio adaptation set found in DASH manifest');
      }
      if (audioUrl) {
        console.log(`[Instagram Scraper] DASH manifest contains audio stream, downloading directly...`);
        const response = await withRetry(() => fetchWithTimeout(audioUrl), {
          maxRetries: 2,
          baseDelay: 3000,
        });
        if (!response.ok) {
          throw new Error(`Failed to download audio stream: HTTP ${response.status}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(audioPath, Buffer.from(arrayBuffer));
        const size = fs.statSync(audioPath).size;
        if (size > 0) {
          const probe = await probeStreams(audioPath);
          if (probe.audioCount > 0) {
            console.log(`[Instagram Scraper] DASH audio stream downloaded (${size} bytes, ${probe.audioCount} audio stream(s))`);
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
          console.log('[Instagram Scraper] DASH audio download produced non-audio content, discarding');
        }
        cleanupFile(audioPath);
        throw new Error('DASH audio stream download produced empty or invalid output');
      }
    } catch (error: any) {
      console.log(`[Instagram Scraper] DASH audio stream extraction failed: ${error.message}`);
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

function extractAudioStreamUrl(manifest: string): string | null {
  try {
    const adaptationSets = manifest.split(/<AdaptationSet/g).slice(1);
    for (const set of adaptationSets) {
      const isAudio =
        /contentType=["']audio["']/.test(set) ||
        (/mimeType=["']audio\/mp4["']/.test(set) && !/codecs=["'][^"']*avc1/.test(set)) ||
        (/codecs=["']mp4a/.test(set) && !/codecs=["'][^"']*(avc1|hvc1)/.test(set));
      if (!isAudio) {
        continue;
      }
      const baseUrl = set.match(/<BaseURL>([^<]+)<\/BaseURL>/);
      if (baseUrl && baseUrl[1]) {
        return decodeURIComponent(baseUrl[1].trim());
      }
      const representation = set.match(/<Representation[^>]*>([\s\S]*?)<\/Representation>/);
      const repBaseUrl = representation?.[1]?.match(/<BaseURL>([^<]+)<\/BaseURL>/);
      if (repBaseUrl && repBaseUrl[1]) {
        return decodeURIComponent(repBaseUrl[1].trim());
      }
    }
    return null;
  } catch {
    return null;
  }
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