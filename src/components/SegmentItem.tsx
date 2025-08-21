import React from 'react';
import { type SRTBlock, type SRTSubtitle } from '../utils/parser';

interface SegmentItemProps {
  segment: SRTBlock;
  index: number;
  currentIndex: number;
  currentRepeat: number;
  enableRepeat: boolean;
  repeatCount: number;
  segmentRepeat: { [key: number]: 'default' | 'twice' | 'infinite' };
  fontSize: number;
  isPlaying: boolean;
  localStoragePrefix: string;
  audioTime: number;
  segmentRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
  playbackSpeed: number;
  onClick: (index: number) => void;
  toggleSegmentRepeat: (index: number) => void;
  formatTime: (time: number) => string;
}

const SegmentItem: React.FC<SegmentItemProps> = React.memo(({
  segment,
  index,
  currentIndex,
  currentRepeat,
  enableRepeat,
  repeatCount,
  segmentRepeat,
  fontSize,
  isPlaying,
  localStoragePrefix,
  audioTime,
  segmentRefs,
  playbackSpeed,
  onClick,
  toggleSegmentRepeat,
  formatTime
}) => {
  const isActive = index === currentIndex;
  const isCompleted = index < currentIndex;

  console.log(segment)

  let savedIndex = -1;
  const savedPosition = localStorage.getItem(`${localStoragePrefix}_lastPosition`);
  if (savedPosition && !isPlaying) {
    try {
      savedIndex = JSON.parse(savedPosition).index;
    } catch { /* empty */ }
  }
  const isSavedPosition = index === savedIndex && !isPlaying;

  return (
    <div
      ref={(el) => { segmentRefs.current[index] = el; }}
      className={`segment-item rounded-lg px-2 py-3 mb-1 transition-all duration-200 cursor-pointer ${
        isActive
          ? 'bg-green-900 border-l-4 border-green-500'
          : isCompleted
            ? 'bg-gray-800'
            : isSavedPosition
              ? 'bg-gray-800 border-l-4 border-blue-500'
              : 'bg-gray-900 hover:bg-gray-800'
      }`}
      onClick={() => onClick(index)}
    >
      <div className="flex flex-col">
        <div className="flex-1">
          <p
            className={`${isActive
              ? 'text-green-400 font-semibold'
              : isCompleted
                ? 'text-gray-400'
                : isSavedPosition
                  ? 'text-blue-400 font-semibold'
                  : 'text-gray-300'
            } whitespace-pre-wrap break-words`}
            style={{
              fontSize: `${fontSize}px`,
              lineHeight: '1.6',
              fontFamily: 'Noto Sans Devanagari, Arial, sans-serif',
            }}
          >
            {(segment as SRTSubtitle).text}
          </p>
        </div>

        <div className="flex justify-between items-end mt-2">
          {isActive && isPlaying && (
            <div className="flex-1 mr-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">
                  {formatTime(audioTime - (segment as SRTSubtitle).start)} / {formatTime((segment as SRTSubtitle).end - (segment as SRTSubtitle).start)}
                </span>
                {enableRepeat && (
                  <span className="text-xs text-gray-400">
                    Repeat: {currentRepeat + 1}/{repeatCount}
                  </span>
                )}
                {segmentRepeat[index] === 'twice' && <span className="text-xs text-green-500">2x</span>}
                {segmentRepeat[index] === 'infinite' && <span className="text-xs text-green-500">∞</span>}
              </div>
              <div className="mt-1 w-full bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{ width: '100%', transition: `${(segment as SRTSubtitle).seconds / playbackSpeed}s linear` }}
                />
              </div>
            </div>
          )}

          {(!isActive || !isPlaying) && <div className="flex-1"></div>}

          <button
            onClick={(e) => { e.stopPropagation(); toggleSegmentRepeat(index); }}
            className={`p-1 rounded-full ${segmentRepeat[index] === 'twice' || segmentRepeat[index] === 'infinite'
              ? 'text-green-500 bg-green-900'
              : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            {/* Repeat Icon SVG */}
          </button>
        </div>
      </div>
    </div>
  );
},(prev, next) => {
  // Only re-render if relevant props change
  return prev.segment.text === next.segment.text
    && prev.isPlaying === next.isPlaying
    && prev.currentIndex === next.currentIndex
    && prev.segmentRepeat[prev.index] === next.segmentRepeat[next.index];
});


export default SegmentItem