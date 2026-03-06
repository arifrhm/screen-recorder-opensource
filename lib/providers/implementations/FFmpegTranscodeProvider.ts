import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { ITranscodeProvider, TranscodeOptions, TranscodeResult, TranscodeProgress } from '../interfaces/ITranscodeProvider';

const execAsync = promisify(exec);

export class FFmpegTranscodeProvider implements ITranscodeProvider {
  private jobs: Map<string, any> = new Map();
  private outputDir: string;

  constructor(outputDir: string = './output') {
    this.outputDir = outputDir;
    this.ensureOutputDir();
  }

  private async ensureOutputDir(): Promise<void> {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
      await fs.mkdir(path.join(this.outputDir, 'hls'), { recursive: true });
      await fs.mkdir(path.join(this.outputDir, 'thumbnails'), { recursive: true });
    } catch (error) {
      console.error('Error creating output directory:', error);
    }
  }

  async startTranscode(assetId: string, options: TranscodeOptions): Promise<string> {
    const transcodeId = `transcode_${assetId}_${Date.now()}`;
    const outputPath = path.join(this.outputDir, 'hls', transcodeId);
    
    await fs.mkdir(outputPath, { recursive: true });

    const command = await this.buildFFmpegCommand(
      options.inputUrl,
      outputPath,
      options.quality || 'medium',
      options.watermark
    );

    const childProcess = exec(command);

    this.jobs.set(transcodeId, {
      process: childProcess,
      status: 'processing',
      progress: { stage: 'transcoding', percentage: 0 },
    });

    childProcess.stdout?.on('data', (data: string) => {
      this.parseProgress(data, transcodeId);
    });

    childProcess.on('close', (code: number) => {
      const job = this.jobs.get(transcodeId);
      if (code === 0) {
        job.status = 'ready';
      } else {
        job.status = 'errored';
      }
    });

    return transcodeId;
  }

  async getTranscodeStatus(transcodeId: string): Promise<TranscodeResult> {
    const job = this.jobs.get(transcodeId);
    
    if (!job) {
      return { status: 'errored', playlistUrl: '', segments: [] };
    }

    const outputPath = path.join(this.outputDir, 'hls', transcodeId);
    const playlistPath = path.join(outputPath, 'playlist.m3u8');
    
    let segments: string[] = [];
    try {
      const files = await fs.readdir(outputPath);
      segments = files.filter(f => f.endsWith('.ts'));
    } catch (error) {
      // Directory might not exist yet
    }

    return {
      status: job.status,
      playlistUrl: `/output/hls/${transcodeId}/playlist.m3u8`,
      segments,
      progress: job.progress,
    };
  }

  async cancelTranscode(transcodeId: string): Promise<void> {
    const job = this.jobs.get(transcodeId);
    if (job && job.process) {
      job.process.kill();
      job.status = 'cancelled';
    }
  }

  async generateThumbnail(videoUrl: string, timestamp: number = 5): Promise<string> {
    const thumbnailId = `thumb_${Date.now()}`;
    const outputPath = path.join(this.outputDir, 'thumbnails', `${thumbnailId}.jpg`);

    const command = `ffmpeg -i ${videoUrl} -ss ${timestamp} -vframes 1 -vf "scale=640:360" ${outputPath}`;

    await execAsync(command);

    return `/output/thumbnails/${thumbnailId}.jpg`;
  }

  private async buildFFmpegCommand(
    inputUrl: string,
    outputPath: string,
    quality: string,
    watermark?: TranscodeOptions['watermark']
  ): Promise<string> {
    const qualitySettings = {
      low: ['-b:v', '800k', '-maxrate', '1000k', '-bufsize', '2000k'],
      medium: ['-b:v', '1500k', '-maxrate', '2000k', '-bufsize', '4000k'],
      high: ['-b:v', '3000k', '-maxrate', '4000k', '-bufsize', '8000k'],
      ultra: ['-b:v', '5000k', '-maxrate', '6000k', '-bufsize', '12000k'],
    };

    const selectedQuality = qualitySettings[quality] || qualitySettings.medium;

    let command = `ffmpeg -i ${inputUrl} ${selectedQuality.join(' ')} -c:a aac -b:a 128k -hls_time 10 -hls_playlist_type vod -hls_segment_filename ${outputPath}/segment_%03d.ts ${outputPath}/playlist.m3u8`;

    if (watermark) {
      const watermarkFilter = this.buildWatermarkFilter(watermark);
      command = command.replace('10', `10 -vf "${watermarkFilter}"`);
    }

    return command;
  }

  private buildWatermarkFilter(watermark: TranscodeOptions['watermark']): string {
    if (watermark.imagePath) {
      const positions = {
        'top-left': '10:10',
        'top-right': 'main_w-overlay_w-10:10',
        'bottom-left': '10:main_h-overlay_h-10',
        'bottom-right': 'main_w-overlay_w-10:main_h-overlay_h-10',
        'center': '(main_w-overlay_w)/2:(main_h-overlay_h)/2',
      };
      return `movie=${watermark.imagePath}[wm];[in][wm]overlay=${positions[watermark.position || 'bottom-right']}`;
    } else if (watermark.text) {
      const positions = {
        'top-left': 'x=10:y=10',
        'top-right': 'x=w-tw-10:y=10',
        'bottom-left': 'x=10:y=h-th-10',
        'bottom-right': 'x=w-tw-10:y=h-th-10',
        'center': 'x=(w-tw)/2:y=(h-th)/2',
      };
      return `drawtext=text='${watermark.text}':fontcolor=white:fontsize=24:${positions[watermark.position || 'bottom-right']}`;
    }
    return '';
  }

  private parseProgress(data: string, transcodeId: string): void {
    const job = this.jobs.get(transcodeId);
    if (!job) return;

    // Parse time from ffmpeg output
    const timeMatch = data.match(/time=(\d{2}):(\d{2}):(\d{2}\.\d{2})/);
    if (timeMatch) {
      const [, hours, minutes, seconds] = timeMatch;
      const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseFloat(seconds);
      // Estimate 90 seconds total for progress calculation
      const percentage = Math.min((totalSeconds / 90) * 100, 99);
      job.progress = {
        stage: 'transcoding',
        percentage,
        speed: 1.0, // Would need to calculate from frame data
      };
    }
  }
}
