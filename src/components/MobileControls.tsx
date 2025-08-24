import React from 'react';
import { FaChevronDown, FaCog } from "react-icons/fa";
import type { MobileControlsProps } from '../@types/player';

export const MobileControls: React.FC<MobileControlsProps> = ({
  showControls,
  enableRepeat,
  repeatCount,
  playbackSpeed,
  fontSize,
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
            className="fixed right-4 bottom-4 z-50 bg-accent hover:bg-active text-white p-3 rounded-full shadow-lg transition-colors"
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
            background: 'rgba(0,0,0,0.5)',
            pointerEvents: showControls ? 'auto' : 'none'
          }}
          onClick={(e) => {
            // Close modal when clicking backdrop
            if (e.target === e.currentTarget) {
              onToggleControls();
            }
          }}
        />

        {/* Bottom Sheet Modal with animation */}
        <div
          className={`absolute left-0 right-0 bottom-0 transition-transform duration-300 ease-out pointer-events-auto ${
            showControls ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="bg-background p-3 rounded-t-xl border-t border-divider shadow-lg">
            <div className="flex items-center justify-between p-4 border-b border-divider">
              <h3 className="text-lg font-medium text-white">Controls</h3>
              <button
                onClick={onToggleControls}
                className="text-subtext hover:text-white transition-colors p-1"
                aria-label="Close controls"
              >
                <FaChevronDown className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                {/* Repeat Controls */}
                <div className="bg-surface p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-white">Repeat</span>
                    <button
                      onClick={onRepeatToggle}
                      className={`px-3 py-1 rounded-full text-xs font-medium min-w-[40px] ${enableRepeat
                        ? 'bg-accent text-white'
                        : 'bg-accent text-white opacity-60'
                        }`}
                    >
                      {enableRepeat ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {/* Fixed height container to prevent modal jumping */}
                  <div className="h-8 flex items-center justify-between">
                    {enableRepeat ? (
                      <>
                        <button
                          onClick={() => onRepeatCountChange(Math.max(1, repeatCount - 1))}
                          className="w-7 h-7 flex items-center justify-center bg-accent hover:bg-active rounded-full text-white"
                        >
                          -
                        </button>
                        <span className="text-sm text-white">{repeatCount}</span>
                        <button
                          onClick={() => onRepeatCountChange(Math.min(10, repeatCount + 1))}
                          className="w-7 h-7 flex items-center justify-center bg-accent hover:bg-active rounded-full text-white"
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <div className="w-full"></div>
                    )}
                  </div>
                </div>

                {/* Speed and Font Size Controls - Side by Side */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Speed Controls */}
                  <div className="bg-surface p-3 rounded-lg">
                    <div className="text-sm font-medium mb-2 text-white">Speed</div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onSpeedChange(Math.max(0.25, Math.round((playbackSpeed - 0.25) * 100) / 100))}
                        disabled={playbackSpeed <= 0.25}
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${playbackSpeed <= 0.25
                          ? 'bg-accent text-white opacity-30'
                          : 'bg-accent hover:bg-active text-white'
                          }`}
                      >
                        -
                      </button>
                      <span className="text-sm text-white">{playbackSpeed}x</span>
                      <button
                        onClick={() => onSpeedChange(Math.min(2, Math.round((playbackSpeed + 0.25) * 100) / 100))}
                        disabled={playbackSpeed >= 2}
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${playbackSpeed >= 2
                          ? 'bg-accent text-white opacity-30'
                          : 'bg-accent hover:bg-active text-white'
                          }`}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Font Size Controls */}
                  <div className="bg-surface p-3 rounded-lg">
                    <div className="text-sm font-medium mb-2 text-white">Font Size</div>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
                        disabled={fontSize <= 14}
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${fontSize <= 14
                          ? 'bg-accent text-white opacity-30'
                          : 'bg-accent hover:bg-active text-white'
                          }`}
                      >
                        A-
                      </button>
                      <span className="text-sm text-white">{fontSize}px</span>
                      <button
                        onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
                        disabled={fontSize >= 32}
                        className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${fontSize >= 32
                          ? 'bg-accent text-white opacity-30'
                          : 'bg-accent hover:bg-active text-white'
                          }`}
                      >
                        A+
                      </button>
                    </div>
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