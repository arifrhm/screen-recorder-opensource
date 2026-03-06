import { IStorageProvider } from './interfaces/IStorageProvider';
import { ITranscodeProvider } from './interfaces/ITranscodeProvider';
import { ITranscriptProvider } from './interfaces/ITranscriptProvider';
import { IVideoPlayerProvider } from './interfaces/IVideoPlayerProvider';

import { OpenStackSwiftProvider } from './implementations/OpenStackSwiftProvider';
import { FFmpegTranscodeProvider } from './implementations/FFmpegTranscodeProvider';
import { WhisperTranscriptProvider } from './implementations/WhisperTranscriptProvider';
import { VideoJSProvider } from './implementations/VideoJSProvider';

export type ProviderType = 'mux' | 'self-hosted';

export interface VideoServiceConfig {
  storageProvider: IStorageProvider;
  transcodeProvider: ITranscodeProvider;
  transcriptProvider: ITranscriptProvider;
  playerProvider: IVideoPlayerProvider;
}

export class VideoServiceProvider {
  private static instance: VideoServiceProvider;
  private config: VideoServiceConfig;

  private constructor(config: VideoServiceConfig) {
    this.config = config;
  }

  static async initialize(type: ProviderType = 'self-hosted', env?: any): Promise<VideoServiceProvider> {
    let config: VideoServiceConfig;

    if (type === 'mux') {
      // Initialize Mux providers (original implementation)
      config = await this.initializeMuxProviders(env);
    } else {
      // Initialize self-hosted providers
      config = await this.initializeSelfHostedProviders(env);
    }

    return new VideoServiceProvider(config);
  }

  private static async initializeSelfHostedProviders(env: any): Promise<VideoServiceConfig> {
    // OpenStack Swift Storage
    const storageProvider = new OpenStackSwiftProvider({
      authUrl: env?.OPENSTACK_AUTH_URL || process.env.OPENSTACK_AUTH_URL || 'http://localhost:5000/v3',
      username: env?.OPENSTACK_USERNAME || process.env.OPENSTACK_USERNAME || 'admin',
      password: env?.OPENSTACK_PASSWORD || process.env.OPENSTACK_PASSWORD || 'password',
      tenantId: env?.OPENSTACK_TENANT_ID || process.env.OPENSTACK_TENANT_ID || '',
      region: env?.OPENSTACK_REGION || process.env.OPENSTACK_REGION || 'RegionOne',
      container: env?.OPENSTACK_CONTAINER || process.env.OPENSTACK_CONTAINER || 'videos',
    });

    // FFmpeg Transcoding
    const transcodeProvider = new FFmpegTranscodeProvider(
      env?.OUTPUT_DIR || process.env.OUTPUT_DIR || './output'
    );

    // Whisper Transcript
    const transcriptProvider = new WhisperTranscriptProvider();

    // Video.js Player
    const playerProvider = new VideoJSProvider(
      env?.OUTPUT_DIR || process.env.OUTPUT_DIR || './output'
    );

    return {
      storageProvider,
      transcodeProvider,
      transcriptProvider,
      playerProvider,
    };
  }

  private static async initializeMuxProviders(env: any): Promise<VideoServiceConfig> {
    // Import Mux providers if needed
    // For now, we'll keep the original implementation
    throw new Error('Mux providers not yet implemented in DI pattern');
  }

  getStorage(): IStorageProvider {
    return this.config.storageProvider;
  }

  getTranscoder(): ITranscodeProvider {
    return this.config.transcodeProvider;
  }

  getTranscript(): ITranscriptProvider {
    return this.config.transcriptProvider;
  }

  getPlayer(): IVideoPlayerProvider {
    return this.config.playerProvider;
  }

  // Convenience method to get all providers
  getProviders(): VideoServiceConfig {
    return this.config;
  }

  // Reinitialize with new configuration
  static async reinitialize(type: ProviderType = 'self-hosted', env?: any): Promise<VideoServiceProvider> {
    return await VideoServiceProvider.initialize(type, env);
  }
}

// Singleton instance
let serviceProvider: VideoServiceProvider | null = null;

export async function getVideoServiceProvider(type?: ProviderType): Promise<VideoServiceProvider> {
  if (!serviceProvider) {
    serviceProvider = await VideoServiceProvider.initialize(type);
  }
  return serviceProvider;
}

export function resetVideoServiceProvider(): void {
  serviceProvider = null;
}
