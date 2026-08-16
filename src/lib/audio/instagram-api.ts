import { downloadInstagramVideo, getInstagramScraperInfo } from './instagram-download';

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

export async function downloadWithFreeApi(videoUrl: string, outputDir: string): Promise<DownloadResult> {
  return downloadInstagramVideo(videoUrl, outputDir);
}

export async function getInstagramInfo(videoUrl: string): Promise<VideoInfo> {
  return getInstagramScraperInfo(videoUrl);
}