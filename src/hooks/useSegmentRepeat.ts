import { useState } from 'react';

export type SegmentRepeatMode = 'default' | 'twice' | 'infinite';

export interface UseSegmentRepeatProps {
  // No props needed for now
}

export const useSegmentRepeat = () => {
  const [segmentRepeat, setSegmentRepeat] = useState<{ [key: number]: SegmentRepeatMode }>({});

  const toggleSegmentRepeat = (index: number) => {
    setSegmentRepeat(prev => {
      const current = prev[index] || 'default';
      let next: SegmentRepeatMode = 'default';

      if (current === 'default') {
        next = 'twice';
      } else if (current === 'twice') {
        next = 'infinite';
      } else {
        next = 'default';
      }

      return {
        ...prev,
        [index]: next
      };
    });
  };

  const getSegmentRepeatMode = (index: number): SegmentRepeatMode => {
    return segmentRepeat[index] || 'default';
  };

  return {
    segmentRepeat,
    toggleSegmentRepeat,
    getSegmentRepeatMode
  };
};