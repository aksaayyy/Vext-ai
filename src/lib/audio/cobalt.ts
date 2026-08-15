import { tmpdir } from 'os';
import path from 'path';
import fs from 'fs';
import { create } from 'youtube-dl-exec';

const YTDLP_PATH = process.env.YTDLP_PATH || 'C:\\Users\\Administrator\\AppData\\Local\\Programs\\Python\\Python314\\Scripts\\yt-dlp.exe';
const ytdl = create(YTDLP_PATH);

const COBALT_API_URL = process.env.COBALT_API_URL || 'https://cobalt.tools/api';

export interface VideoInfo {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  webpage_url: string;
}

export interface DownloadResult {
  audioPath: string;
  info: VideoInfo;
}

interface CobaltResponse {
  status: 'tunnel' | 'redirect' | 'local-processing' | 'picker' | 'error';
  url?: string;
  filename?: string;
  service?: string;
  tunnel?: string[];
  output?: {
    type: string;
    filename: string;
    metadata?: {
      title?: string;
      artist?: string;
    };
  };
  audio?: {
    format: string;
    bitrate: string;
  };
  error?: {
    code: string;
  };
}

export interface CobaltVideoInfo {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  webpage_url: string;
}

export async function getCobaltInfo(videoUrl: string): Promise<CobaltVideoInfo> {
  const response = await fetch(COBALT_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: videoUrl,
      downloadMode: 'audio',
      audioFormat: 'm4a',
      audioBitrate: '128',
    }),
  });

  if (!response.ok) {
    throw new Error(`Cobalt API error: ${response.status}`);
  }

  const data: CobaltResponse = await response.json();

  if (data.status === 'error') {
    throw new Error(`Cobalt error: ${data.error?.code || 'Unknown error'}`);
  }

  if (data.status === 'picker') {
    throw new Error('Multiple media items found - picker not supported');
  }

  return {
    id: extractVideoId(videoUrl) || 'unknown',
    title: data.output?.metadata?.title || 'Unknown Title',
    duration: 0,
    uploader: data.output?.metadata?.artist || 'Unknown',
    webpage_url: videoUrl,
  };
}

export async function downloadWithCobalt(videoUrl: string, outputDir: string): Promise<DownloadResult> {
  const videoId = extractVideoId(videoUrl);
  if (!videoId) {
    throw new Error('Invalid Video URL');
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const audioPath = path.join(outputDir, `${videoId}_audio.m4a`);
  const tempPath = path.join(outputDir, `${videoId}_audio.tmp`);

  const info = await getCobaltInfo(videoUrl);

  const response = await fetch(COBALT_API_URL, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: videoUrl,
      downloadMode: 'audio',
      audioFormat: 'm4a',
      audioBitrate: '320',
    }),
  });

  if (!response.ok) {
    throw new Error(`Cobalt API error: ${response.status}`);
  }

  const data: CobaltResponse = await response.json();

  if (data.status === 'error') {
    throw new Error(`Cobalt error: ${data.error?.code || 'Unknown error'}`);
  }

  let downloadUrl: string | undefined;

  if (data.status === 'tunnel' && data.tunnel && data.tunnel.length > 0) {
    downloadUrl = data.tunnel[0];
  } else if (data.status === 'redirect' && data.url) {
    downloadUrl = data.url;
  } else if (data.status === 'local-processing') {
    throw new Error('Local processing not supported with cobalt');
  }

  if (!downloadUrl) {
    throw new Error('No download URL received from cobalt');
  }

  const audioResponse = await fetch(downloadUrl);
  if (!audioResponse.ok) {
    throw new Error(`Failed to download audio: ${audioResponse.status}`);
  }

  const buffer = await audioResponse.arrayBuffer();
  fs.writeFileSync(tempPath, Buffer.from(buffer));

  if (fs.existsSync(tempPath)) {
    fs.renameSync(tempPath, audioPath);
  }

  if (!fs.existsSync(audioPath)) {
    throw new Error('Failed to save audio file');
  }

  return { audioPath, info };
}

function extractVideoId(url: string): string | null {
  const ytPatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  const igPatterns = [
    /^https?:\/\/(www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/,
  ];

  for (const pattern of [...ytPatterns, ...igPatterns]) {
    const match = url.match(pattern);
    if (match) {
      return match[2] || match[1];
    }
  }

  return null;
}
