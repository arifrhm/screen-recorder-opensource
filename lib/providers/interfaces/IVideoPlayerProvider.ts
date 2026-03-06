export interface PlayerConfig {
  autoplay?: boolean;
  muted?: boolean;
  controls?: boolean;
  fluid?: boolean;
  responsive?: boolean;
  playbackRates?: number[];
  preload?: 'auto' | 'metadata' | 'none';
}

export interface SourceConfig {
  src: string;
  type: string;
  label?: string;
  selected?: boolean;
}

export interface VideoPlayerProps {
  assetId: string;
  playbackId: string;
  poster?: string;
  config?: PlayerConfig;
  sources?: SourceConfig[];
}

export interface IVideoPlayerProvider {
  createPlayer(props: VideoPlayerProps): Promise<{
    component: React.ComponentType<any>;
    playerInstance?: any;
  }>;
  getSignedPlaybackUrl(assetId: string, expiresIn?: number): Promise<string>;
  generateGifPreview(videoUrl: string, duration?: number): Promise<string>;
}
