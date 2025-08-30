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
      audioRef.current.currentTime = time;
    }
  };

  const setVolume = (volume: number) => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  };

  const setPlaybackRate = (rate: number) => {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const play = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const audioProps = {
    ref: audioRef,
    preload: "auto" as const,
    onEnded: onStop,
    onPlay: () => console.log("Audio started playing"),
    onPause: () => console.log("Audio paused"),
    onLoadedData: () => {
      if (audioRef.current) {
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.volume = 1.0;
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