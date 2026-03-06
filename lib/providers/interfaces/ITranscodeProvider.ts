export interface TranscodeOptions {
  inputUrl: string;
  outputFormat?: 'hls' | 'mp4';
  quality?: 'low' | 'medium' | 'high' | 'ultra';
  watermark?: {
    text?: string;
    imagePath?: string;
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  };
}

export interface TranscodeProgress {
  stage: string;
  percentage: number;
  speed?: number;
}

export interface TranscodeResult {
  status: 'preparing' | 'processing' | 'ready' | 'errored';
  playlistUrl: string;
  segments: string[];
  thumbnailUrl?: string;
  progress?: TranscodeProgress;
}

export interface ITranscodeProvider {
  startTranscode(assetId: string, options: TranscodeOptions): Promise<string>;
  getTranscodeStatus(transcodeId: string): Promise<TranscodeResult>;
  cancelTranscode(transcodeId: string): Promise<void>;
  generateThumbnail(videoUrl: string, timestamp?: number): Promise<string>;
}
