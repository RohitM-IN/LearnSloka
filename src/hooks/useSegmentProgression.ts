import { useEffect, useRef } from 'react';
import { isSubtitleBlock, type SRTBlock, type SRTSubtitle } from '../utils/parser';
import { type SegmentRepeatMode } from './useSegmentRepeat';

declare global {
  var debounceSeekTimeout: number | undefined;
}

export interface UseSegmentProgressionProps {
  isPlaying: boolean;
  currentIndex: number;
  blocks: SRTBlock[];
  currentRepeat: number;
  enableRepeat: boolean;
  repeatCount: number;
  segmentRepeat: { [key: number]: SegmentRepeatMode };
  getCurrentTime: () => number;
  seekTo: (time: number) => void;
  onTimeUpdate: (time: number) => void;
  onIndexChange: (index: number) => void;
  onRepeatChange: (repeat: number) => void;
  onStop: () => void;
  playSegment: (index: number, repeat?: number) => void;
  clearSavedPosition: () => void;
  setIsPlaying: (playing: boolean) => void;
}

export const useSegmentProgression = ({
  isPlaying,
  currentIndex,
  blocks,
  currentRepeat,
  enableRepeat,
  repeatCount,
  segmentRepeat,
  getCurrentTime,
  seekTo,
  onTimeUpdate,
  onIndexChange,
  onRepeatChange,
  onStop,
  playSegment,
  clearSavedPosition,
  setIsPlaying
}: UseSegmentProgressionProps) => {
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && currentIndex < blocks.length) {
      const block = blocks[currentIndex];
      if (!isSubtitleBlock(block)) {
        onIndexChange(currentIndex + 1);
      }

      // Set up interval to check audio time and advance blocks
      intervalRef.current = setInterval(() => {
        const currentTime = getCurrentTime();
        onTimeUpdate(currentTime);
        
        if (currentIndex < 0 || currentIndex >= blocks.length) return;
        
        const { start, end } = (blocks[currentIndex] as SRTSubtitle);
        
        if (currentTime >= end) {
          const segmentRepeatSetting = segmentRepeat[currentIndex] || 'default';
          console.log(`🔄 Segment ${currentIndex} ended at ${currentTime.toFixed(2)}s (Repeat mode: ${segmentRepeatSetting}, Current repeat: ${currentRepeat})`);
          
          // Only call playSegment if currentTime is outside the next segment's start
          if (segmentRepeatSetting === 'infinite') {
            if (currentTime > end + 0.05) {
              console.log(`♾️ Infinite repeat - restarting segment ${currentIndex}`);
              playSegment(currentIndex, 0);
            }
          } else if (segmentRepeatSetting === 'twice') {
            if (currentRepeat < 1 && currentTime > end + 0.05) {
              console.log(`🔁 Twice repeat - playing segment ${currentIndex} again (repeat ${currentRepeat + 1})`);
              playSegment(currentIndex, currentRepeat + 1);
            } else if (currentIndex + 1 < blocks.length && currentTime > end + 0.05) {
              console.log(`➡️ Moving to next segment ${currentIndex + 1} after twice repeat`);
              playSegment(currentIndex + 1, 0);
            } else if (currentTime > end + 0.05) {
              console.log(`🏁 Reached end of playlist after twice repeat`);
              clearSavedPosition();
              onStop();
            }
          } else if (enableRepeat && currentRepeat < repeatCount - 1 && currentTime > end + 0.05) {
            console.log(`🔄 Global repeat - playing segment ${currentIndex} again (repeat ${currentRepeat + 1}/${repeatCount})`);
            playSegment(currentIndex, currentRepeat + 1);
          } else if (currentIndex + 1 < blocks.length && currentTime > end + 0.05) {
            console.log(`➡️ Moving to next segment ${currentIndex + 1}`);
            playSegment(currentIndex + 1, 0);
          } else if (currentTime > end + 0.05) {
            console.log(`🏁 Reached end of playlist`);
            clearSavedPosition();
            onStop();
          }
        } else if (isPlaying && currentTime < start - 0.01) {
          // Debounce: only run this block once per second
          if (!globalThis.debounceSeekTimeout || Date.now() - globalThis.debounceSeekTimeout > 1000) {
            globalThis.debounceSeekTimeout = Date.now();
            console.log(`⚠️ Audio drifted outside segment bounds (${currentTime.toFixed(2)}s < ${start.toFixed(2)}s) - correcting...`);
            setIsPlaying(false);
            seekTo(start);
            setIsPlaying(true);
          }
        }
      }, 50);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    currentIndex,
    isPlaying,
    currentRepeat,
    enableRepeat,
    repeatCount,
    segmentRepeat,
    blocks,
    getCurrentTime,
    seekTo,
    onTimeUpdate,
    onIndexChange,
    onRepeatChange,
    onStop,
    playSegment,
    clearSavedPosition,
    setIsPlaying
  ]);

  return {
    intervalRef
  };
};