import React from 'react';
import type { DesktopControlsProps } from '../@types/player';

export const DesktopControls: React.FC<DesktopControlsProps> = ({
  playbackSpeed,
  fontSize,
  onSpeedChange,
  onFontSizeChange
}) => {
  return (
    <div className="flex items-center space-x-6 bg-surface rounded-full px-4 py-2">
      {/* Speed Controls */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-white">Speed:</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onSpeedChange(Math.max(0.25, Math.round((playbackSpeed - 0.25) * 100) / 100))}
            disabled={playbackSpeed <= 0.25}
            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs text-white bg-base ${playbackSpeed <= 0.25 ? 'opacity-50' : 'hover:bg-hover'}`}
          >
            -
          </button>
          <span className="text-sm text-white w-10 text-center">{playbackSpeed}x</span>
          <button
            onClick={() => onSpeedChange(Math.min(2, Math.round((playbackSpeed + 0.25) * 100) / 100))}
            disabled={playbackSpeed >= 2}
            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs text-white bg-base ${playbackSpeed >= 2 ? 'opacity-50' : 'hover:bg-hover'}`}
          >
            +
          </button>
        </div>
      </div>

      {/* Font Size Controls */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-white">Font:</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
            disabled={fontSize <= 14}
            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs text-white bg-base ${fontSize <= 14 ? 'opacity-50' : 'hover:bg-hover'}`}
          >
            A-
          </button>
          <span className="text-sm text-white w-8 text-center">{fontSize}px</span>
          <button
            onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
            disabled={fontSize >= 32}
            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs text-white bg-base ${fontSize >= 32 ? 'opacity-50' : 'hover:bg-hover'}`}
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
};