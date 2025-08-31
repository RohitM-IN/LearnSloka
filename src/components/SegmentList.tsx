import React from 'react';
import type { SegmentListProps } from '../@types/player';

export const SegmentList: React.FC<SegmentListProps> = ({
  visibleblocks,
  scrollContainerRef
}) => {
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto p-1 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-300 dark:scrollbar-track-gray-800"
    >
      <div className="max-w-4xl mx-auto">
        <article className="sanskrit-content" role="main" aria-label="Sanskrit text content">
          {visibleblocks.map((segment, index) => {
            if (!segment) return null;
            
            // Check if this is a title segment
            const isTitle = segment.type === 'song-title';
            
            if (isTitle) {
              return (
                <header key={index} className="mb-4 text-center">
                  <h1 className="sanskrit-title text-accent">
                    {segment.label}
                  </h1>
                </header>
              );
            }
            
            // Regular verse content
            return (
              <div key={index} className="sanskrit-verse">
                {segment?.label}
              </div>
            );
          })}
        </article>
      </div>
    </div>
  );
};