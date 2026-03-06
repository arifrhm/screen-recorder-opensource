'use client';

import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import '@videojs/http-streaming';

export interface VideoJSProps {
  options: {
    autoplay?: boolean;
    controls?: boolean;
    responsive?: boolean;
    fluid?: boolean;
    sources: Array<{
      src: string;
      type: string;
    }>;
    poster?: string;
    playbackRates?: number[];
    preload?: 'auto' | 'metadata' | 'none';
  };
  onReady?: (player: any) => void;
}

export const VideoJSPlayer = forwardRef<any, VideoJSProps>((props, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerRef = useRef<any>(null);

  const { options, onReady } = props;

  useEffect(() => {
    // Make sure Video.js player is only initialized once
    if (!playerRef.current) {
      const videoElement = videoRef.current;

      if (!videoElement) return;

      const player = (playerRef.current = videojs(videoElement, options, () => {
        if (onReady) {
          onReady(player);
        }
      }));

      // Add HLS quality selector
      if (options.sources && options.sources[0]?.type === 'application/x-mpegURL') {
        player.ready(() => {
          // You could add quality selector plugin here
        });
      }
    }

    // Cleanup
    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [options, onReady]);

  // Expose player instance via ref
  useImperativeHandle(ref, () => ({
    player: playerRef.current,
    play: () => playerRef.current?.play(),
    pause: () => playerRef.current?.pause(),
    seek: (time: number) => playerRef.current?.currentTime(time),
    volume: (level: number) => {
      if (playerRef.current) {
        playerRef.current.volume(level);
      }
    },
  }));

  return (
    <div data-vjs-player className="relative w-full">
      <video ref={videoRef} className="video-js vjs-big-play-centered" />
    </div>
  );
});

VideoJSPlayer.displayName = 'VideoJSPlayer';
