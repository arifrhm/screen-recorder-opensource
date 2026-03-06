'use client';

import { VideoJSPlayer } from './VideoJSPlayer';
import { useEffect, useState } from 'react';

interface VideoPlayerWrapperProps {
  playbackId: string;
  assetId: string;
  poster?: string;
  autoplay?: boolean;
  onEnded?: () => void;
  onTimeUpdate?: (currentTime: number) => void;
}

export function VideoPlayerWrapper({
  playbackId,
  assetId,
  poster,
  autoplay = false,
  onEnded,
  onTimeUpdate,
}: VideoPlayerWrapperProps) {
  const [playerReady, setPlayerReady] = useState(false);
  const playerRef = useRef<any>(null);

  const videoOptions = {
    autoplay,
    controls: true,
    responsive: true,
    fluid: true,
    preload: 'metadata' as const,
    playbackRates: [0.5, 1, 1.25, 1.5, 2],
    poster,
    sources: [
      {
        src: `/api/video/playback/${playbackId}`,
        type: 'application/x-mpegURL',
      },
    ],
  };

  const handlePlayerReady = (player: any) => {
    playerRef.current = player;
    setPlayerReady(true);

    player.on('ended', () => {
      if (onEnded) onEnded();
    });

    player.on('timeupdate', () => {
      if (onTimeUpdate) onTimeUpdate(player.currentTime());
    });

    // Add custom keyboard shortcuts
    player.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'k' || e.code === 'Space') {
        e.preventDefault();
        if (player.paused()) {
          player.play();
        } else {
          player.pause();
        }
      }
      if (e.key === 'ArrowLeft') {
        player.currentTime(player.currentTime() - 5);
      }
      if (e.key === 'ArrowRight') {
        player.currentTime(player.currentTime() + 5);
      }
      if (e.key === 'f') {
        if (player.isFullscreen()) {
          player.exitFullscreen();
        } else {
          player.requestFullscreen();
        }
      }
    });
  };

  return (
    <div className="w-full bg-black rounded-lg overflow-hidden shadow-lg">
      <VideoJSPlayer options={videoOptions} onReady={handlePlayerReady} />
    </div>
  );
}
