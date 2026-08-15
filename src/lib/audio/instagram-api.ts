import { tmpdir } from 'os';
import path from 'path';
import fs from 'fs';
import { withRetry } from '../utils/retry';

interface InstagramApiResult {
  success: boolean;
  downloadUrl?: string;
  filename?: string;
  title?: string;
  error?: string;
}

interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  webpage_url: string;
}

interface DownloadResult {
  audioPath: string;
  info: VideoInfo;
}

interface ApiEndpoint {
  name: string;
  url: string;
  parser: (data: any, originalUrl: string) => InstagramApiResult;
}

const CACHE_FILE = path.join(tmpdir(), 'vext-instagram-api-cache.json');

interface ApiCache {
  workingApis: string[];
  lastChecked: number;
}

function loadCache(): ApiCache {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
      if (Date.now() - data.lastChecked < 24 * 60 * 60 * 1000) {
        return data;
      }
    }
  } catch {}
  return { workingApis: [], lastChecked: 0 };
}

function saveCache(cache: ApiCache): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  } catch {}
}

const API_ENDPOINTS: ApiEndpoint[] = [
  {
    name: 'downloadgram',
    url: 'https://api.downloadgram.org/',
    parser: (data: any, originalUrl: string) => {
      if (data?.status === 'ok' && data?.media?.length > 0) {
        const media = data.media[0];
        return {
          success: true,
          downloadUrl: media.url,
          filename: media.filename || 'instagram_reel.mp4',
          title: media.title || 'Instagram Reel',
        };
      }
      return { success: false, error: data?.message || 'Invalid response' };
    },
  },
  {
    name: 'igram',
    url: 'https://igram.io/api/',
    parser: (data: any, originalUrl: string) => {
      if (data?.data?.video_url) {
        return {
          success: true,
          downloadUrl: data.data.video_url,
          filename: data.data.filename || 'instagram_reel.mp4',
          title: data.data.title || 'Instagram Reel',
        };
      }
      return { success: false, error: data?.message || 'Invalid response' };
    },
  },
  {
    name: 'tikwm',
    url: 'https://www.tikwm.com/api/',
    parser: (data: any, originalUrl: string) => {
      if (data?.code === 0 && data?.data?.play) {
        return {
          success: true,
          downloadUrl: data.data.play,
          filename: data.data.title || 'instagram_reel.mp4',
          title: data.data.title || 'Instagram Reel',
        };
      }
      return { success: false, error: data?.msg || 'Invalid response' };
    },
  },
];

async function fetchFromApi(endpoint: ApiEndpoint, videoUrl: string): Promise<InstagramApiResult> {
  try {
    return await withRetry(async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        body: JSON.stringify({ url: videoUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return endpoint.parser(data, videoUrl);
    }, { maxRetries: 2, baseDelay: 3000 });
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, error: 'Timeout' };
    }
    return { success: false, error: error.message };
  }
}

export async function downloadWithFreeApi(videoUrl: string, outputDir: string): Promise<DownloadResult> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid Video URL');
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const audioPath = path.join(outputDir, `${videoId}_audio.m4a`);
  const tempPath = path.join(outputDir, `${videoId}_audio.tmp`);

  const cache = loadCache();
  const workingApis = cache.workingApis.length > 0
    ? [...cache.workingApis, ...API_ENDPOINTS.map(e => e.name).filter(n => !cache.workingApis.includes(n))]
    : API_ENDPOINTS.map(e => e.name);

  let lastError = '';
  let successResult: { downloadUrl: string; filename: string; title: string } | null = null;

  for (const apiName of workingApis) {
    const endpoint = API_ENDPOINTS.find(e => e.name === apiName);
    if (!endpoint) continue;

    console.log(`[Instagram API] Trying ${endpoint.name}...`);
    const result = await fetchFromApi(endpoint, videoUrl);

    if (result.success && result.downloadUrl) {
      console.log(`[Instagram API] ${endpoint.name} succeeded`);
      successResult = {
        downloadUrl: result.downloadUrl,
        filename: result.filename || 'video.mp4',
        title: result.title,
      };

      if (!cache.workingApis.includes(endpoint.name)) {
        cache.workingApis.unshift(endpoint.name);
        if (cache.workingApis.length > 5) cache.workingApis.pop();
        cache.lastChecked = Date.now();
        saveCache(cache);
      }
      break;
    } else {
      lastError = `${endpoint.name}: ${result.error}`;
      console.log(`[Instagram API] ${endpoint.name} failed: ${result.error}`);
    }
  }

  if (!successResult) {
    throw new Error(`All Instagram APIs failed. Last error: ${lastError}`);
  }

  const buffer = await withRetry(async () => {
    const downloadResponse = await fetch(successResult!.downloadUrl);
    if (!downloadResponse.ok) {
      throw new Error(`Failed to download video: ${downloadResponse.status}`);
    }
    return downloadResponse.arrayBuffer();
  }, { maxRetries: 2, baseDelay: 3000 });

  fs.writeFileSync(tempPath, Buffer.from(buffer));

  if (fs.existsSync(tempPath)) {
    fs.renameSync(tempPath, audioPath);
  }

  if (!fs.existsSync(audioPath)) {
    throw new Error('Failed to save audio file');
  }

  const info: VideoInfo = {
    id: videoId,
    title: successResult.title || 'Instagram Reel',
    duration: 0,
    uploader: 'Instagram',
    webpage_url: videoUrl,
  };

  return { audioPath, info };
}

export async function getInstagramInfo(videoUrl: string): Promise<VideoInfo> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid Video URL');
  }

  const cache = loadCache();
  const workingApis = cache.workingApis.length > 0
    ? [...cache.workingApis, ...API_ENDPOINTS.map(e => e.name).filter(n => !cache.workingApis.includes(n))]
    : API_ENDPOINTS.map(e => e.name);

  for (const apiName of workingApis) {
    const endpoint = API_ENDPOINTS.find(e => e.name === apiName);
    if (!endpoint) continue;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(endpoint.url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: videoUrl }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const parsed = endpoint.parser(data, videoUrl);
        if (parsed.success) {
          return {
            id: videoId,
            title: parsed.title || 'Instagram Reel',
            duration: 0,
            uploader: 'Instagram',
            webpage_url: videoUrl,
          };
        }
      }
    } catch {}
  }

  return {
    id: videoId,
    title: 'Instagram Reel',
    duration: 0,
    uploader: 'Instagram',
    webpage_url: videoUrl,
  };
}

function extractVideoId(url: string): string | null {
  const igPatterns = [
    /^https?:\/\/(www\.)?instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/,
    /^https?:\/\/(www\.)?instagram\.com\/stories\/[^/]+\/([0-9]+)/,
  ];

  for (const pattern of igPatterns) {
    const match = url.match(pattern);
    if (match) {
      return match[2] || match[1];
    }
  }

  return null;
}