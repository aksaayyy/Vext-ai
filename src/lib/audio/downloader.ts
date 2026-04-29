import ytdl from 'youtube-dl-exec';
import path from 'path';
import fs from 'fs';

export interface YoutubeVideoInfo {
  id: string;
  title: string;
  duration: number;
  uploader: string;
  webpage_url: string;
}

// Validate Video URL (YouTube or Instagram)
export function validateVideoUrl(url: string): string | null {
  // YouTube URL patterns
  const ytPatterns = [
    /^https?:\/\/(www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  // Instagram URL patterns
  const igPatterns = [
    /^https?:\/\/(www\.)?instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of [...ytPatterns, ...igPatterns]) {
    const match = url.match(pattern);
    if (match) {
      return match[2] || match[1];
    }
  }

  return null;
}

// Download audio from video using yt-dlp
export async function downloadVideoAudio(
  videoUrl: string,
  outputDir: string
): Promise<{ audioPath: string; info: YoutubeVideoInfo }> {
  const videoId = validateVideoUrl(videoUrl);
  if (!videoId) {
    throw new Error('Invalid Video URL. Please provide a valid YouTube or Instagram Reels URL.');
  }

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const audioPath = path.join(outputDir, `${videoId}_audio.mp4`);
  const infoPath = path.join(outputDir, `${videoId}_info.json`);

  // Download audio in best quality (m4a/opus) or fallback to mp4
  // Using yt-dlp to extract audio only
  const result = await ytdl(videoUrl, {
    dumpSingleJson: true,
    noWarnings: true,
    noCheckCertificates: true,
    preferFreeFormats: true,
    youtubeSkipDashManifest: true,
    format: 'bestaudio[ext=m4a]/bestaudio[ext=webm]/bestaudio/best',
  });

  // If dumpSingleJson returns the info, parse it
  let info: YoutubeVideoInfo;
  if (typeof result === 'object' && result.id) {
    info = {
      id: result.id as string,
      title: result.title as string,
      duration: result.duration as number,
      uploader: result.uploader as string,
      webpage_url: result.webpage_url as string,
    };
  } else {
    // Fallback: download info and audio separately
    info = await getVideoInfo(videoUrl);
    await downloadAudioFile(videoUrl, audioPath);
  }

  // If audio file doesn't exist from dumpSingleJson, download it
  if (!fs.existsSync(audioPath)) {
    await downloadAudioFile(videoUrl, audioPath);
  }

  if (!fs.existsSync(audioPath)) {
    throw new Error('Failed to download audio file');
  }

  return { audioPath, info };
}

// Get video info only
async function getVideoInfo(videoUrl: string): Promise<YoutubeVideoInfo> {
  const info = await ytdl(videoUrl, {
    dumpSingleJson: true,
    noWarnings: true,
    noCheckCertificates: true,
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

  // Fallback parsing
  return {
    id: 'unknown',
    title: 'Unknown Video',
    duration: 0,
    uploader: 'Unknown',
    webpage_url: videoUrl,
  };
}

// Download audio file
async function downloadAudioFile(videoUrl: string, outputPath: string): Promise<void> {
  const audioInfo = await ytdl(videoUrl, {
    extractAudio: true,
    audioFormat: 'm4a',
    output: outputPath,
    noWarnings: true,
    noCheckCertificates: true,
    preferFreeFormats: true,
  });

  const m4aPath = `${outputPath}.m4a`;
  if (fs.existsSync(m4aPath)) {
    fs.renameSync(m4aPath, outputPath);
    return;
  }

  if (!fs.existsSync(outputPath)) {
    // Try a simpler download approach
    const downloadResult = await ytdl(videoUrl, {
      format: 'bestaudio',
      output: outputPath,
      noWarnings: true,
    });

    if (!fs.existsSync(outputPath)) {
      throw new Error('Failed to download audio after multiple attempts');
    }
  }
}
