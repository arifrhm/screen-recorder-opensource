import { IVideoPlayerProvider, VideoPlayerProps, PlayerConfig, SourceConfig } from '../interfaces/IVideoPlayerProvider';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// Video.js React component (we'll create this)
function VideoJSPlayer({ playbackId, poster, config, sources }: VideoPlayerProps) {
  // This will be implemented in the actual component file
  // For now, return a placeholder
  return null;
}

export class VideoJSProvider implements IVideoPlayerProvider {
  private outputDir: string;

  constructor(outputDir: string = './output') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  private async ensureOutputDir(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(path.join(this.outputDir, 'previews'), { recursive: true });
    } catch (error) {
      console.error('Error creating output directory:', error);
    }
  }

  async createPlayer(props: VideoPlayerProps): Promise<{
    component: React.ComponentType<any>;
    playerInstance?: any;
  }> {
    // Return the VideoJS component
    return {
      component: VideoJSPlayer,
    };
  }

  async getSignedPlaybackUrl(assetId: string, expiresIn: number = 3600): Promise<string> {
    // In a real implementation with OpenStack Swift, you would:
    // 1. Generate a temp URL from Swift
    // 2. Return the signed URL
    
    // For now, return a local path
    return `/output/hls/${assetId}/playlist.m3u8`;
  }

  async generateGifPreview(videoUrl: string, duration: number = 3): Promise<string> {
    const previewId = `preview_${Date.now()}`;
    const outputPath = path.join(this.outputDir, 'previews', `${previewId}.gif`);

    // Use FFmpeg to create a GIF preview
    const command = `ffmpeg -i ${videoUrl} -t ${duration} -vf "fps=10,scale=320:-1" ${outputPath}`;

    try {
      await execAsync(command);
      return `/output/previews/${previewId}.gif`;
    } catch (error) {
      console.error('Error generating GIF preview:', error);
      throw new Error('Failed to generate GIF preview');
    }
  }

  // Helper method to generate multiple frames for hover preview
  async generateHoverPreviews(videoUrl: string, frameCount: number = 10): Promise<string[]> {
    const previewId = `hover_${Date.now()}`;
    const outputDir = path.join(this.outputDir, 'previews', previewId);
    await fs.mkdir(outputDir, { recursive: true });

    const frames: string[] = [];

    for (let i = 0; i < frameCount; i++) {
      const timestamp = (i / frameCount) * 3; // First 3 seconds
      const framePath = path.join(outputDir, `frame_${i}.jpg`);
      const command = `ffmpeg -ss ${timestamp} -i ${videoUrl} -vframes 1 -vf "scale=320:-1" ${framePath}`;

      try {
        await execAsync(command);
        frames.push(`/output/previews/${previewId}/frame_${i}.jpg`);
      } catch (error) {
        console.error(`Error generating frame ${i}:`, error);
      }
    }

    return frames;
  }

  // Generate a sprite sheet for efficient hover previews
  async generateSpriteSheet(videoUrl: string, frameCount: number = 10): Promise<string> {
    const previewId = `sprite_${Date.now()}`;
    const outputPath = path.join(this.outputDir, 'previews', `${previewId}.jpg`);

    // Generate sprite sheet using FFmpeg
    const command = `ffmpeg -i ${videoUrl} -vf "fps=1/0.3,scale=320:-1,tile=${frameCount}x1" ${outputPath}`;

    try {
      await execAsync(command);
      return `/output/previews/${previewId}.jpg`;
    } catch (error) {
      console.error('Error generating sprite sheet:', error);
      throw new Error('Failed to generate sprite sheet');
    }
  }
}
