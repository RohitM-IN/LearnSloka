import React from 'react';
import type { DesktopControlsProps } from '../@types/player';

export const DesktopControls: React.FC<DesktopControlsProps> = ({
  enableRepeat,
  repeatCount,
  playbackSpeed,
  fontSize,
  onRepeatToggle,
  onRepeatCountChange,
  onSpeedChange,
  onFontSizeChange
}) => {
  return (
    <div className="flex items-center space-x-6 bg-gray-800 rounded-full px-4 py-2">
      {/* Repeat Controls */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-300">Repeat:</span>
        <button
          onClick={onRepeatToggle}
          className={`px-3 py-1 rounded-full text-sm font-medium ${enableRepeat
            ? 'bg-green-500 text-white'
            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
        >
          {enableRepeat ? 'ON' : 'OFF'}
        </button>
        {enableRepeat && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onRepeatCountChange(Math.max(1, repeatCount - 1))}
              className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full text-white text-xs"
            >
              -
            </button>
            <span className="text-sm text-gray-300 w-6 text-center">{repeatCount}</span>
            <button
              onClick={() => onRepeatCountChange(Math.min(10, repeatCount + 1))}
              className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full text-white text-xs"
            >
              +
            </button>
          </div>
        )}
      </div>

      {/* Speed Controls */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-300">Speed:</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onSpeedChange(Math.max(0.25, Math.round((playbackSpeed - 0.25) * 100) / 100))}
            disabled={playbackSpeed <= 0.25}
            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${playbackSpeed <= 0.25
              ? 'bg-gray-700 text-gray-500'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
          >
            -
          </button>
          <span className="text-sm text-gray-300 w-10 text-center">{playbackSpeed}x</span>
          <button
            onClick={() => onSpeedChange(Math.min(2, Math.round((playbackSpeed + 0.25) * 100) / 100))}
            disabled={playbackSpeed >= 2}
            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${playbackSpeed >= 2
              ? 'bg-gray-700 text-gray-500'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
          >
            +
          </button>
        </div>
      </div>

      {/* Font Size Controls */}
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium text-gray-300">Font:</span>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
            disabled={fontSize <= 14}
            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${fontSize <= 14
              ? 'bg-gray-700 text-gray-500'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
          >
            A-
          </button>
          <span className="text-sm text-gray-300 w-8 text-center">{fontSize}px</span>
          <button
            onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
            disabled={fontSize >= 32}
            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${fontSize >= 32
              ? 'bg-gray-700 text-gray-500'
              : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
          >
            A+
          </button>
        </div>
      </div>
    </div>
  );
};