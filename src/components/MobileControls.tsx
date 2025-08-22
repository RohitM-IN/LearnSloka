import React from 'react';
import { FaChevronDown, FaCog } from "react-icons/fa";
import type { MobileControlsProps } from '../@types/player';

export const MobileControls: React.FC<MobileControlsProps> = ({
  showControls,
  enableRepeat,
  repeatCount,
  playbackSpeed,
  fontSize,
  isPlaying,
  onToggleControls,
  onRepeatToggle,
  onRepeatCountChange,
  onSpeedChange,
  onFontSizeChange
}) => {
  return (
    <>
      {/* Floating Action Button - Mobile Only */}
      <div className="md:hidden">
        {!showControls && (
          <button
            onClick={onToggleControls}
            aria-label="Open controls"
            className="fixed right-4 bottom-4 z-50 bg-green-600 hover:bg-green-700 text-white p-3 rounded-full shadow-lg transition-colors"
          >
            <FaCog className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Modal Backdrop and Bottom Sheet - Always present for animation */}
      <div className={`fixed inset-0 z-40 md:hidden ${showControls ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        {/* Backdrop: transparent, allows text to be visible and scrollable */}
        <div
          className={`absolute inset-0 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}
          style={{ 
            background: 'rgba(0,0,0,0.1)',
            pointerEvents: showControls ? 'none' : 'none' // Allow scroll through
          }}
        />
        
        {/* Invisible click area for closing modal */}
        {showControls && (
          <div
            className="absolute inset-0"
            style={{ pointerEvents: 'auto' }}
            onClick={(e) => {
              // Only close if clicking directly on backdrop, not scrolling
              if (e.target === e.currentTarget) {
                onToggleControls();
              }
            }}
          />
        )}

        {/* Bottom Sheet Modal with animation */}
        <div
          className={`absolute left-0 right-0 bottom-0 transition-transform duration-300 ease-out pointer-events-auto ${
            showControls ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="bg-spotify-gray p-3 rounded-t-xl border-t border-gray-700 shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-medium text-white">Controls</h3>
              <button
                onClick={onToggleControls}
                className="text-spotify-subtext hover:text-white transition-colors p-1"
                aria-label="Close controls"
              >
                <FaChevronDown className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Repeat Controls */}
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Repeat</span>
                    <button
                      onClick={onRepeatToggle}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${enableRepeat
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-700 text-gray-300'
                        }`}
                    >
                      {enableRepeat ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {enableRepeat && (
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onRepeatCountChange(Math.max(1, repeatCount - 1))}
                        className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full text-white"
                      >
                        -
                      </button>
                      <span className="text-sm">{repeatCount}</span>
                      <button
                        onClick={() => onRepeatCountChange(Math.min(10, repeatCount + 1))}
                        className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full text-white"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>

                {/* Speed Controls */}
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="text-sm font-medium mb-2">Speed</div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onSpeedChange(Math.max(0.25, Math.round((playbackSpeed - 0.25) * 100) / 100))}
                      disabled={playbackSpeed <= 0.25}
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${playbackSpeed <= 0.25
                        ? 'bg-gray-700 text-gray-500'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    >
                      -
                    </button>
                    <span className="text-sm">{playbackSpeed}x</span>
                    <button
                      onClick={() => onSpeedChange(Math.min(2, Math.round((playbackSpeed + 0.25) * 100) / 100))}
                      disabled={playbackSpeed >= 2}
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${playbackSpeed >= 2
                        ? 'bg-gray-700 text-gray-500'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Font Size Controls */}
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="text-sm font-medium mb-2">Font Size</div>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
                      disabled={fontSize <= 14}
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${fontSize <= 14
                        ? 'bg-gray-700 text-gray-500'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    >
                      A-
                    </button>
                    <span className="text-sm">{fontSize}px</span>
                    <button
                      onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
                      disabled={fontSize >= 32}
                      className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${fontSize >= 32
                        ? 'bg-gray-700 text-gray-500'
                        : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                    >
                      A+
                    </button>
                  </div>
                </div>

                {/* Status Display */}
                <div className="bg-gray-800 p-3 rounded-lg">
                  <div className="text-sm font-medium mb-2">Status</div>
                  <div className="text-center">
                    {isPlaying ? (
                      <span className="text-green-500 text-sm">Playing</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Stopped</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};