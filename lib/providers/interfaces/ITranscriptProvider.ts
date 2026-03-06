export interface TranscriptSegment {
  time: string;
  text: string;
  startTime: number;
  endTime: number;
}

export interface TranscriptResult {
  status: 'preparing' | 'processing' | 'ready' | 'errored';
  segments: TranscriptSegment[];
  fullText: string;
  language?: string;
}

export interface SummaryOptions {
  tone?: 'professional' | 'playful' | 'neutral';
  maxLength?: number;
}

export interface SummaryResult {
  title: string;
  summary: string;
  tags: string[];
  keyPoints?: string[];
}

export interface ITranscriptProvider {
  generateTranscript(assetId: string, videoUrl: string): Promise<string>;
  getTranscriptStatus(transcriptId: string): Promise<TranscriptResult>;
  generateSummary(transcriptId: string, options?: SummaryOptions): Promise<SummaryResult>;
  generateVtt(segments: TranscriptSegment[]): string;
}
