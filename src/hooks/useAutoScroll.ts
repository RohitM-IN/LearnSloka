import { useRef, useEffect } from 'react';

export interface UseAutoScrollProps {
  currentIndex: number;
  isPlaying: boolean;
  showControls: boolean;
}

export const useAutoScroll = ({ currentIndex, isPlaying, showControls }: UseAutoScrollProps) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Auto-scroll to current segment
  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && segmentRefs.current[currentIndex]) {
      const currentElement = segmentRefs.current[currentIndex];
      const container = scrollContainerRef.current;

      if (currentElement && container) {
        const elementRect = currentElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Calculate available viewport height, considering modal if open
        const modalHeight = showControls ? 350 : 0; // Modal height including padding
        const availableBottom = containerRect.bottom - modalHeight;
        const buffer = 20; // Extra space above modal

        // Check if element would be hidden by modal or not fully visible
        const isHiddenByModal = elementRect.bottom > (availableBottom - buffer);
        const isAboveViewport = elementRect.top < containerRect.top;

        if (isAboveViewport || isHiddenByModal) {
          if (showControls) {
            // When modal is open, scroll so element is in upper part of visible area
            const targetY = containerRect.top + 50; // Position near top of visible area
            const elementRect = currentElement.getBoundingClientRect();
            const currentY = elementRect.top;
            const offset = currentY - targetY;

            container.scrollBy({
              top: offset,
              behavior: 'smooth'
            });
          } else {
            // Normal center scrolling when modal is closed
            currentElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      }
    }
  }, [currentIndex, isPlaying, showControls]);

  const setSegmentRef = (index: number) => (el: HTMLDivElement | null) => {
    segmentRefs.current[index] = el;
  };

  return {
    scrollContainerRef,
    segmentRefs,
    setSegmentRef
  };
};