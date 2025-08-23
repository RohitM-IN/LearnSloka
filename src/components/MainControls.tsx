import React from 'react';
import { FaPause, FaPlay, FaRedo, FaStop } from "react-icons/fa";
import { VscDebugPause, VscDebugRestart, VscDebugStop, VscPlay } from 'react-icons/vsc';
import type { MainControlsProps } from '../@types/player';


export const MainControls: React.FC<MainControlsProps> = ({
  isPlaying,
  currentIndex,
  audioTime,
  blocks,
  onRefresh,
  onPlay,
  onStop,
  formatTime,
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
    <div className="bg-background p-4 border-b border-divider select-none">
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex justify-center items-center space-x-2">
          <div>
            <button
              onClick={onRefresh}
              disabled={isPlaying}
              className={`p-2 rounded-full transition-colors text-white ${isPlaying ? 'bg-base opacity-50' : 'bg-accent hover:bg-accent/80'}`}
            >
              <VscDebugRestart  className="" />
            </button>
          </div>
          <div>
            <button
              onClick={onPlay}
              className={`p-2 rounded-full transition-colors text-white bg-accent hover:bg-accent/80`}
            >
              {isPlaying ? <VscDebugPause  className="" /> : <VscPlay  className=" ml-0.5" />}
            </button>
          </div>
          <div>
            <button
              onClick={onStop}
              disabled={!isPlaying}
              className={`p-2 rounded-full transition-colors text-white ${!isPlaying ? 'bg-base opacity-50' : 'bg-accent hover:bg-accent/80'}`}
            >
              <VscDebugStop  className="" />
            </button>
          </div>

          {isPlaying ? (
            <div className="bg-surface px-2 py-1 rounded-full flex items-center w-32 justify-center">
              <span className="text-accent font-semibold text-sm">{formatTime(audioTime)}</span>
              {currentIndex >= 0 && (
                <span className="text-subtext text-xs ml-1">
                  ({currentIndex + 1}/{blocks.length})
                </span>
              )}
            </div>
          ) : (
            <div className="w-32 h-8"></div>
          )}
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div>
            <button
              onClick={onRefresh}
              disabled={isPlaying}
              className={`p-2 rounded-full transition-colors text-white ${isPlaying ? 'bg-surface opacity-50' : 'bg-accent hover:bg-accent/80'}`}
            >
              <FaRedo className="" />
            </button>
          </div>
          <div>
            <button
              onClick={onPlay}
              className={`p-2 rounded-full transition-colors text-white ${(isPlaying && currentIndex >= 0) ? 'bg-surface opacity-50' : 'bg-accent hover:bg-accent/80'}`}
            >
              {isPlaying ? <FaPause className="" /> : <FaPlay className="ml-0.5" />}
            </button>
          </div>
          <div>
            <button
              onClick={onStop}
              disabled={!isPlaying}
              className={`p-2 rounded-full transition-colors text-white ${!isPlaying ? 'bg-surface opacity-50' : 'bg-accent hover:bg-accent/80'}`}
            >
              <FaStop className="" />
            </button>
          </div>

          {/* Duration Block for Desktop */}
          {isPlaying ? (
            <div className="bg-surface px-3 py-1.5 rounded-full flex items-center ml-4">
              <span className="text-accent font-semibold text-sm">{formatTime(audioTime)}</span>
              {currentIndex >= 0 && (
                <span className="text-subtext text-xs ml-2">
                  ({currentIndex + 1}/{blocks.length})
                </span>
              )}
            </div>
          ) : (
            <div className="ml-4"></div>
          )}
        </div>
        
        {/* All Desktop Controls in one line */}
        <div className="flex items-center space-x-4 bg-surface rounded-full px-3 py-1.5">
          {/* Repeat Controls */}
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-medium text-white">Repeat:</span>
            <button
              onClick={onRepeatToggle}
              className={`px-2 py-0.5 rounded-full text-xs font-medium text-white ${enableRepeat ? 'bg-accent' : 'bg-base hover:bg-hover'}`}
            >
              {enableRepeat ? 'ON' : 'OFF'}
            </button>
            {enableRepeat && (
              <div className="flex items-center space-x-0.5">
                <button
                  onClick={() => onRepeatCountChange(Math.max(1, repeatCount - 1))}
                  className="w-5 h-5 flex items-center justify-center bg-base hover:bg-hover rounded-full text-white text-xs"
                >
                  -
                </button>
                <span className="text-xs text-white w-4 text-center">{repeatCount}</span>
                <button
                  onClick={() => onRepeatCountChange(Math.min(10, repeatCount + 1))}
                  className="w-5 h-5 flex items-center justify-center bg-base hover:bg-hover rounded-full text-white text-xs"
                >
                  +
                </button>
              </div>
            )}
          </div>

          {/* Speed Controls */}
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-white">Speed:</span>
            <div className="flex items-center space-x-0.5">
              <button
                onClick={() => onSpeedChange(Math.max(0.25, Math.round((playbackSpeed - 0.25) * 100) / 100))}
                disabled={playbackSpeed <= 0.25}
                className={`w-5 h-5 flex items-center justify-center rounded-full text-xs text-white bg-base ${playbackSpeed <= 0.25 ? 'opacity-50' : 'hover:bg-hover'}`}
              >
                -
              </button>
              <span className="text-xs text-white w-8 text-center">{playbackSpeed}x</span>
              <button
                onClick={() => onSpeedChange(Math.min(2, Math.round((playbackSpeed + 0.25) * 100) / 100))}
                disabled={playbackSpeed >= 2}
                className={`w-5 h-5 flex items-center justify-center rounded-full text-xs text-white bg-base ${playbackSpeed >= 2 ? 'opacity-50' : 'hover:bg-hover'}`}
              >
                +
              </button>
            </div>
          </div>

          {/* Font Size Controls */}
          <div className="flex items-center space-x-1">
            <span className="text-xs font-medium text-white">Font:</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
                disabled={fontSize <= 14}
                className={`w-5 h-5 flex items-center justify-center rounded-full text-xs text-white bg-base ${fontSize <= 14 ? 'opacity-50' : 'hover:bg-hover'}`}
              >
                A-
              </button>
              <span className="text-xs text-white w-6 text-center">{fontSize}px</span>
              <button
                onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
                disabled={fontSize >= 32}
                className={`w-5 h-5 flex items-center justify-center rounded-full text-xs text-white bg-base ${fontSize >= 32 ? 'opacity-50' : 'hover:bg-hover'}`}
              >
                A+
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};