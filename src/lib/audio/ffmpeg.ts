import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

// Check if ffmpeg is available
export async function checkFfmpeg(): Promise<boolean> {
  try {
    await execAsync('ffmpeg -version');
    return true;
  } catch (error) {
    return false;
  }
}



// Convert audio to 16k mono WAV for Whisper
export async function convertToWav16k(inputPath: string, outputPath: string): Promise<{ duration: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .audioChannels(1)
      .audioFrequency(16000)
      .audioCodec('pcm_s16le')
      .format('wav')
      .on('error', (err) => {
        reject(new Error(`FFmpeg conversion error: ${err.message}`));
      })
      .on('end', () => {
        // Get duration from ffmpeg
        ffmpeg.ffprobe(inputPath, (err, metadata) => {
          if (err) {
            resolve({ duration: 0 });
          } else {
            resolve({ duration: Math.round(metadata.format.duration || 0) });
          }
        });
      })
      .save(outputPath);
  });
}

// Get audio duration
export async function getAudioDuration(filePath: string): Promise<number> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        resolve(0);
      } else {
        resolve(Math.round(metadata.format.duration || 0));
      }
    });
  });
}

// Ensure output directory exists
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Cleanup file
export function cleanupFile(filePath: string): void {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (e) {
    console.error('Failed to cleanup file:', filePath, e);
  }
}
