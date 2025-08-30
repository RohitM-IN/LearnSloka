import { useRef, useEffect } from 'react';

export interface UseAudioControlProps {
  isPlaying: boolean;
  playbackSpeed: number;
  onStop: () => void;
}

export const useAudioControl = ({ isPlaying, playbackSpeed, onStop }: UseAudioControlProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Effect to control audio playback based on isPlaying state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch((error) => {
          console.error('Error playing audio:', error);
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // Update playback speed when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  const getCurrentTime = () => audioRef.current?.currentTime ?? 0;
  
  const seekTo = (time: number) => {
    if (audioRef.current) {
      const previousTime = audioRef.current.currentTime;
      audioRef.current.currentTime = time;
      console.log(`🎯 Audio seeked from ${previousTime.toFixed(2)}s to ${time.toFixed(2)}s (Δ${(time - previousTime).toFixed(2)}s)`);
    }
  };

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  };

  const setPlaybackRate = (rate: number) => {
    if (audioRef.current) {
      const previousRate = audioRef.current.playbackRate;
      audioRef.current.playbackRate = rate;
      if(previousRate !== rate) {
        console.log(`⚡ Playback rate changed from ${previousRate.toFixed(2)}x to ${rate.toFixed(2)}x`);
      }
    }
  };

  const play = async () => {
    if (audioRef.current) {
      try {
        const currentTime = audioRef.current.currentTime;
        await audioRef.current.play();
        console.log(`▶️ Audio playback started at ${currentTime.toFixed(2)}s (Rate: ${audioRef.current.playbackRate.toFixed(2)}x)`);
      } catch (error) {
        console.error('❌ Error playing audio:', error);
      }
    }
  };

  const pause = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      audioRef.current.pause();
      console.log(`⏸️ Audio playback paused at ${currentTime.toFixed(2)}s`);
    }
  };

  const audioProps = {
    ref: audioRef,
    preload: "auto" as const,
    onEnded: onStop,
    onPlay: () => {
      const currentTime = audioRef.current?.currentTime ?? 0;
      const rate = audioRef.current?.playbackRate ?? 1;
      console.log(`🎵 Audio element play event fired at ${currentTime.toFixed(2)}s (Rate: ${rate.toFixed(2)}x)`);
    },
    onPause: () => {
      const currentTime = audioRef.current?.currentTime ?? 0;
      console.log(`⏹️ Audio element pause event fired at ${currentTime.toFixed(2)}s`);
    },
    onSeeked: () => {
      const currentTime = audioRef.current?.currentTime ?? 0;
      console.log(`🎯 Audio element seeked event fired - now at ${currentTime.toFixed(2)}s`);
    },
    onLoadedData: () => {
      const duration = audioRef.current?.duration ?? 0;
      console.log(`📁 Audio loaded successfully - Duration: ${duration.toFixed(2)}s`);
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.volume = 1.0;
      }
    },
    onError: (e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
      const error = (e.target as HTMLAudioElement).error;
      console.error(`❌ Audio error occurred:`, {
        code: error?.code,
        message: error?.message,
        currentTime: audioRef.current?.currentTime
      });
    },
    onTimeUpdate: () => {
      // Only log every 5 seconds to avoid spam
      const currentTime = audioRef.current?.currentTime ?? 0;
      if (Math.floor(currentTime) % 5 === 0 && Math.floor(currentTime * 10) % 10 === 0) {
        console.log(`⏰ Audio time update: ${currentTime.toFixed(2)}s`);
      }
    }
  };

  return {
    audioRef,
    audioProps,
    getCurrentTime,
    seekTo,
    setVolume,
    setPlaybackRate,
    play,
    pause
  };
};