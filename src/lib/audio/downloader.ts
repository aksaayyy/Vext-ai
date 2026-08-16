import youtubeDl from 'youtube-dl-exec';
import path from 'path';
import fs from 'fs';
import { tmpdir } from 'os';
import { downloadWithFreeApi, getInstagramInfo } from './instagram-api';
import { withRetry } from '../utils/retry';
import { createCookieFile } from './cookies';

// Use custom yt-dlp path if set (for Railway/Linux deployments)
const ytdl = process.env.YTDLP_PATH ? youtubeDl.create(process.env.YTDLP_PATH) : youtubeDl;

const DOWNLOAD_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes
const INFO_TIMEOUT_MS = 30 * 1000; // 30 seconds

export interface YoutubeVideoInfo {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  webpage_url: string;
}

export interface DownloadOptions {
  instagramCookies?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(errorMsg)), ms)),
  ]);
}

// Validate Video URL (YouTube or Instagram)
export function validateVideoUrl(url: string): string | null {
  const ytPatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  const igPatterns = [
    /^https?:\/\/(www\.)?instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/,
    /^https?:\/\/(www\.)?instagram\.com\/stories\/[^/]+\/([0-9]+)/,
  ];

  for (const pattern of [...ytPatterns, ...igPatterns]) {
    const match = url.match(pattern);
    if (match) {
      return match[2] || match[1];
    }
  }

  return null;
}

function isBlockedError(error: any): boolean {
  const message = error?.message?.toLowerCase() || '';
  return (
    message.includes('403') ||
    message.includes('forbidden') ||
    message.includes('blocked') ||
    message.includes('empty media response') ||
    message.includes('instagram') ||
    message.includes('unable to download') ||
    message.includes('http error 403') ||
    message.includes('rate-limit') ||
    message.includes('login required')
  );
}

function isInstagramUrl(url: string): boolean {
  return url.includes('instagram.com');
}

// Download audio from video using yt-dlp with free API fallback for Instagram
export async function downloadVideoAudio(
  videoUrl: string,
  outputDir: string,
  options: DownloadOptions = {}
): Promise<{ audioPath: string; info: YoutubeVideoInfo }> {
  const videoId = validateVideoUrl(videoUrl);
  if (!videoId) {
    throw new Error('Invalid Video URL. Please provide a valid YouTube or Instagram Reels URL.');
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const audioPath = path.join(outputDir, `${videoId}_audio.m4a`);
  const tempBase = path.join(outputDir, `${videoId}_audio.tmp`);

  // Get video info first with retry and timeout
  const info = await withRetry(
    () => withTimeout(getVideoInfo(videoUrl, options), INFO_TIMEOUT_MS, 'Video info timeout'),
    { maxRetries: 2, baseDelay: 2000 }
  );

  // For Instagram: self-hosted scraper is the primary path (no cookies/login needed)
  if (isInstagramUrl(videoUrl)) {
    try {
      console.log(`[Downloader] Trying Instagram scraper for ${videoUrl}...`);
      const result = await downloadWithFreeApi(videoUrl, outputDir);
      console.log(`[Downloader] Instagram scraper succeeded`);
      return { audioPath: result.audioPath, info: result.info };
    } catch (scraperError: any) {
      console.log(`[Downloader] Instagram scraper failed: ${scraperError.message}. Falling back to yt-dlp...`);
    }
  }

  // Try yt-dlp with retry and timeout (secondary path)
  try {
    console.log(`[Downloader] Trying yt-dlp for ${videoUrl}...`);
    await withRetry(
      () => withTimeout(downloadAudioFile(videoUrl, tempBase, options), DOWNLOAD_TIMEOUT_MS, 'Download timeout'),
      { maxRetries: 3, baseDelay: 2000 }
    );

    const tempM4aPath = tempBase + '.m4a';
    if (fs.existsSync(tempM4aPath)) {
      fs.renameSync(tempM4aPath, audioPath);
    } else if (fs.existsSync(tempBase)) {
      fs.renameSync(tempBase, audioPath);
    }

    if (!fs.existsSync(audioPath)) {
      throw new Error('Failed to download audio file');
    }

    console.log(`[Downloader] yt-dlp succeeded`);
    return { audioPath, info };
  } catch (error: any) {
    const detail = error?.stderr || error?.message || JSON.stringify(error);
    console.error(`[Downloader] yt-dlp failed: ${detail}`);
    throw new Error(`yt-dlp failed: ${String(detail).slice(0, 500)}`);
  }
}

async function getVideoInfo(videoUrl: string, options: DownloadOptions = {}): Promise<YoutubeVideoInfo> {
  if (isInstagramUrl(videoUrl)) {
    try {
      return await getInstagramInfo(videoUrl);
    } catch {
      // Fall through to yt-dlp
    }
  }

  let cookieFilePath: string | undefined;
  let cleanupCookieFile: (() => void) | undefined;

  try {
    if (options.instagramCookies && isInstagramUrl(videoUrl)) {
      const cookieFile = createCookieFile(options.instagramCookies);
      cookieFilePath = cookieFile.filePath;
      cleanupCookieFile = cookieFile.cleanup;
    }

    const info = await ytdl(videoUrl, {
      dumpSingleJson: true,
      noWarnings: true,
      noCheckCertificates: true,
      geoBypass: true,
      ...(cookieFilePath ? { cookies: cookieFilePath } : {}),
    });

    if (typeof info === 'object' && info.id) {
      return {
        id: info.id as string,
        title: info.title as string,
        duration: info.duration as number || 0,
        uploader: info.uploader as string,
        webpage_url: info.webpage_url as string,
      };
    }
  } catch (error: any) {
    if (isInstagramUrl(videoUrl) && isBlockedError(error)) {
      try {
        return await getInstagramInfo(videoUrl);
      } catch {}
    }
    throw error;
  } finally {
    if (cleanupCookieFile) {
      cleanupCookieFile();
    }
  }

  return {
    id: 'unknown',
    title: 'Unknown Video',
    duration: 0,
    uploader: 'Unknown',
    webpage_url: videoUrl,
  };
}

async function downloadAudioFile(videoUrl: string, outputPath: string, options: DownloadOptions = {}): Promise<void> {
  const isInstagram = videoUrl.includes('instagram.com');

  let cookieFilePath: string | undefined;
  let cleanupCookieFile: (() => void) | undefined;

  if (isInstagram && options.instagramCookies) {
    const cookieFile = createCookieFile(options.instagramCookies);
    cookieFilePath = cookieFile.filePath;
    cleanupCookieFile = cookieFile.cleanup;
    console.log(`[Downloader] Using cookie file for Instagram: ${cookieFilePath}`);
  }

  try {
    const ytdlOptions: any = {
      format: 'bestaudio[ext=m4a]/bestaudio',
      output: outputPath,
      noWarnings: true,
      noCheckCertificates: true,
      noPlaylist: true,
      geoBypass: true,
      addHeader: isInstagram
        ? ['referer:https://www.instagram.com/', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36']
        : ['referer:youtube.com', 'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'],
    };

    if (cookieFilePath) {
      ytdlOptions.cookies = cookieFilePath;
    }

    await ytdl(videoUrl, ytdlOptions);
  } finally {
    if (cleanupCookieFile) {
      cleanupCookieFile();
    }
  }
}