import { pipeline, env } from '@xenova/transformers';
import { ITranscriptProvider, TranscriptResult, SummaryOptions, SummaryResult, TranscriptSegment } from '../interfaces/ITranscriptProvider';
import fs from 'fs/promises';

// Configure transformers to run locally without downloading huge files every time
env.allowLocalModels = true;

export class WhisperTranscriptProvider implements ITranscriptProvider {
  private transcriber: any = null;
  private jobs: Map<string, TranscriptResult> = new Map();

  constructor() {
    this.loadModel();
  }

  private async loadModel(): Promise<void> {
    try {
      // Load Whisper tiny model for faster processing
      this.transcriber = await pipeline(
        'automatic-speech-recognition',
        'Xenova/whisper-tiny',
        {
          quantized: true, // Use quantized model for faster inference
          progress_callback: (progress: any) => {
            if (progress.status === 'progress') {
              console.log(`Model loading: ${Math.round(progress.progress * 100)}%`);
            }
          },
        }
      );
      console.log('Whisper model loaded successfully');
    } catch (error) {
      console.error('Error loading Whisper model:', error);
      throw new Error('Failed to load Whisper model');
    }
  }

  async generateTranscript(assetId: string, videoUrl: string): Promise<string> {
    const transcriptId = `transcript_${assetId}_${Date.now()}`;

    // Initialize job status
    this.jobs.set(transcriptId, {
      status: 'preparing',
      segments: [],
      fullText: '',
    });

    // In a real implementation, you would:
    // 1. Extract audio from video using FFmpeg
    // 2. Run Whisper on the audio file
    // 3. Parse timestamps

    // For now, let's simulate the process
    this.jobs.set(transcriptId, {
      status: 'processing',
      segments: [],
      fullText: '',
    });

    // Extract audio from video
    const audioPath = await this.extractAudio(videoUrl, assetId);

    // Run Whisper transcription
    try {
      const result = await this.transcribeAudio(audioPath);
      
      const segments = this.parseWhisperResult(result);
      const fullText = segments.map(s => s.text).join(' ');

      this.jobs.set(transcriptId, {
        status: 'ready',
        segments,
        fullText,
        language: result?.language || 'en',
      });
    } catch (error) {
      console.error('Transcription error:', error);
      this.jobs.set(transcriptId, {
        status: 'errored',
        segments: [],
        fullText: '',
      });
    }

    return transcriptId;
  }

  async getTranscriptStatus(transcriptId: string): Promise<TranscriptResult> {
    const job = this.jobs.get(transcriptId);
    
    if (!job) {
      return {
        status: 'errored',
        segments: [],
        fullText: '',
      };
    }

    return job;
  }

  async generateSummary(transcriptId: string, options: SummaryOptions = {}): Promise<SummaryResult> {
    const job = this.jobs.get(transcriptId);
    
    if (!job || job.status !== 'ready') {
      throw new Error('Transcript not ready');
    }

    const { tone = 'professional', maxLength = 200 } = options;

    // Generate summary using the full text
    const summary = await this.generateTextSummary(job.fullText, tone, maxLength);
    
    // Generate tags from segments
    const tags = this.extractTags(job.segments);

    // Extract key points
    const keyPoints = this.extractKeyPoints(job.segments);

    return {
      title: this.generateTitle(job.fullText),
      summary,
      tags,
      keyPoints,
    };
  }

  generateVtt(segments: TranscriptSegment[]): string {
    let vtt = 'WEBVTT\n\n';
    
    segments.forEach((segment, index) => {
      const startTime = this.formatVttTime(segment.startTime);
      const endTime = this.formatVttTime(segment.endTime);
      
      vtt += `${index + 1}\n`;
      vtt += `${startTime} --> ${endTime}\n`;
      vtt += `${segment.text}\n\n`;
    });

    return vtt;
  }

  private async extractAudio(videoUrl: string, assetId: string): Promise<string> {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);

    const audioPath = `/tmp/${assetId}.wav`;
    const command = `ffmpeg -i ${videoUrl} -vn -acodec pcm_s16le -ar 16000 -ac 1 ${audioPath}`;
    
    await execAsync(command);
    return audioPath;
  }

  private async transcribeAudio(audioPath: string): Promise<any> {
    if (!this.transcriber) {
      await this.loadModel();
    }

    const audio = await fs.readFile(audioPath);
    const result = await this.transcriber(audio, {
      chunk_length_s: 30,
      stride_length_s: 5,
      language: 'english',
      task: 'transcribe',
      return_timestamps: true,
    });

    return result;
  }

  private parseWhisperResult(result: any): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];

    if (result.chunks) {
      result.chunks.forEach((chunk: any, index: number) => {
        const startTime = chunk.timestamp?.[0] || 0;
        const endTime = chunk.timestamp?.[1] || 0;

        segments.push({
          time: this.formatTime(startTime),
          text: chunk.text.trim(),
          startTime,
          endTime,
        });
      });
    }

    return segments;
  }

  private async generateTextSummary(text: string, tone: string, maxLength: number): Promise<string> {
    // Simple extractive summary for now
    // In production, you could use:
    // - @xenova/transformers for abstractive summarization
    // - An external API (OpenAI, Anthropic, etc.)
    
    const sentences = text.split('. ');
    const keySentences = sentences.filter((s, i) => i % Math.ceil(sentences.length / 3) === 0);
    let summary = keySentences.join('. ');

    if (summary.length > maxLength) {
      summary = summary.substring(0, maxLength) + '...';
    }

    return summary;
  }

  private extractTags(segments: TranscriptSegment[]): string[] {
    // Extract keywords from transcript
    const text = segments.map(s => s.text.toLowerCase()).join(' ');
    const words = text.split(/\s+/).filter(w => w.length > 4);
    
    // Count word frequency
    const frequency: Record<string, number> = {};
    words.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    // Get top 5 keywords
    const tags = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return tags;
  }

  private extractKeyPoints(segments: TranscriptSegment[]): string[] {
    // Extract key points based on sentence structure
    const keyPoints: string[] = [];
    const importantPhrases = ['important', 'key', 'main', 'critical', 'essential'];

    segments.forEach(segment => {
      const lowerText = segment.text.toLowerCase();
      if (importantPhrases.some(phrase => lowerText.includes(phrase))) {
        keyPoints.push(segment.text);
      }
    });

    return keyPoints.slice(0, 5);
  }

  private generateTitle(text: string): string {
    // Generate a title from the first sentence
    const firstSentence = text.split('.')[0];
    const words = firstSentence.split(' ').slice(0, 8);
    return words.join(' ') + (text.includes('.') ? '' : '...');
  }

  private formatVttTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);

    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(3, '0')}`;
  }

  private formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
}
