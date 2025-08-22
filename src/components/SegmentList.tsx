import React from 'react';
import type { SegmentListProps } from '../@types/player';

export const SegmentList: React.FC<SegmentListProps> = ({
  visibleblocks,
  scrollContainerRef
}) => {
  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto py-2 px-2 scrollbar scrollbar-thumb-gray-600 scrollbar-track-gray-800"
    >
      <div className="container mx-auto">
        {visibleblocks.map((segment, index) => (
          <div key={index} className="mb-2">
            {segment?.label}
          </div>
        ))}
      </div>
    </div>
  );
};