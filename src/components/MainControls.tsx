import React from 'react';
import { FaPause, FaPlay, FaRedo, FaStop, FaStepForward, FaStepBackward } from "react-icons/fa";
import { VscDebugPause, VscDebugRestart, VscDebugStop, VscPlay } from 'react-icons/vsc';
import type { MainControlsProps } from '../@types/player';


export const MainControls: React.FC<MainControlsProps> = ({
  isPlaying,
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
  onFontSizeChange,
  albumContext,
  onSkipNext,
  onSkipPrevious
}) => {
  // Calculate total duration from blocks
  const totalDuration = blocks.length > 0 ? 
    (blocks[blocks.length - 1] && 'end' in blocks[blocks.length - 1] ? 
     (blocks[blocks.length - 1] as any).end : 0) : 0;

  return (
    <div className="bg-background p-2 select-none">
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex justify-center items-center">
          {/* Current Time */}
          <div className="flex items-center min-w-[50px]">
            {isPlaying && (
              <span className="font-semibold text-xs text-accent">{formatTime(audioTime)}</span>
            )}
          </div>
          
          {/* Control Buttons - Centered */}
          <div className="flex justify-center items-center space-x-2">
            {/* Previous Song Button (Mobile) */}
            {albumContext && onSkipPrevious && albumContext.currentTrackNumber > 1 && (
              <button
                onClick={onSkipPrevious}
                className="p-2 rounded-full transition-colors bg-base hover:bg-accent hover:opacity-80 text-primary-text"
              >
                <FaStepBackward className="text-sm" />
              </button>
            )}
            
            <button
              onClick={onRefresh}
              disabled={isPlaying}
              className={`p-3 rounded-full transition-colors ${isPlaying ? 'bg-base opacity-50' : 'bg-accent hover:opacity-80'}`}
            >
              <VscDebugRestart/>
            </button>
            <button
              onClick={onPlay}
              className="p-3 rounded-full transition-colors bg-accent hover:opacity-80 text-primary-text"
            >
              {isPlaying ? <VscDebugPause/> : <VscPlay className="ml-0.5 text-primary-text" />}
            </button>
            <button
              onClick={onStop}
              disabled={!isPlaying}
              className={`p-3 rounded-full transition-colors ${!isPlaying ? 'bg-base opacity-50 text-primary-text' : 'bg-accent hover:opacity-80 text-primary-text'}`}
            >
              <VscDebugStop/>
            </button>
            
            {/* Next Song Button (Mobile) */}
            {albumContext && onSkipNext && albumContext.currentTrackNumber < albumContext.totalTracks && (
              <button
                onClick={onSkipNext}
                className="p-2 rounded-full transition-colors bg-base hover:bg-accent hover:opacity-80 text-primary-text"
              >
                <FaStepForward className="text-sm" />
              </button>
            )}
          </div>

          {/* Total Duration */}
          <div className="flex items-center justify-end min-w-[50px]">
            {isPlaying && totalDuration > 0 && (
              <span className="text-xs text-subtext">{formatTime(totalDuration)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex justify-between items-center">
        {/* Left spacer */}
        <div className="flex-1"></div>
        
        {/* Central Playback Controls with Time Display */}
        <div className="flex items-center space-x-4">
          {/* Current Time */}
          <div className="flex items-center min-w-[70px] justify-end">
            {isPlaying && (
              <span className="font-semibold text-sm text-subtext">{formatTime(audioTime)}</span>
            )}
          </div>
          
          {/* Control Buttons */}
          <div className="flex items-center space-x-3">
            {/* Previous Song Button (Desktop) */}
            {albumContext && onSkipPrevious && albumContext.currentTrackNumber > 1 && (
              <button
                onClick={onSkipPrevious}
                className="p-1.5 rounded-full transition-colors bg-base hover:bg-accent hover:opacity-80 text-primary-text"
              >
                <FaStepBackward className="text-sm" />
              </button>
            )}
            
            <button
              onClick={onRefresh}
              disabled={isPlaying}
              className={`p-1.5 rounded-full transition-colors ${isPlaying ? 'bg-surface opacity-50 text-primary-text' : 'bg-base hover:bg-accent hover:opacity-80 text-primary-text'}`}
            >
              <FaRedo className="text-sm text-primary-text" />
            </button>
            <button
              onClick={onPlay}
              className={`p-1.5 rounded-full transition-colors bg-base hover:bg-accent hover:opacity-80 text-primary-text`}
            >
              {isPlaying ? <FaPause className="text-sm" /> : <FaPlay className="ml-0.5 text-sm" />}
            </button>
            <button
              onClick={onStop}
              disabled={!isPlaying}
              className={`p-1.5 rounded-full transition-colors ${!isPlaying ? 'bg-surface opacity-50 text-primary-text' : 'bg-base hover:bg-accent hover:opacity-80 text-primary-text'}`}
            >
              <FaStop className="text-sm" />
            </button>
            
            {/* Next Song Button (Desktop) */}
            {albumContext && onSkipNext && albumContext.currentTrackNumber < albumContext.totalTracks && (
              <button
                onClick={onSkipNext}
                className="p-1.5 rounded-full transition-colors bg-base hover:bg-accent hover:opacity-80 text-primary-text"
              >
                <FaStepForward className="text-sm" />
              </button>
            )}
          </div>

          {/* Total Duration */}
          <div className="flex items-center min-w-[70px]">
            {isPlaying && totalDuration > 0 && (
              <span className="text-sm text-subtext">{formatTime(totalDuration)}</span>
            )}
          </div>
        </div>

        {/* Right section with Settings */}
        <div className="flex items-center justify-end flex-1">
          <div className="flex items-center space-x-4 rounded-full px-3 py-1.5 bg-surface">
            {/* Repeat Controls */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-medium text-primary-text">Repeat:</span>
              <button
                onClick={onRepeatToggle}
                className={`px-2 py-0.5 rounded-full text-xs font-medium text-primary-text ${enableRepeat ? 'bg-accent' : 'bg-base hover:opacity-80'}`}
              >
                {enableRepeat ? 'ON' : 'OFF'}
              </button>
              {enableRepeat && (
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => onRepeatCountChange(Math.max(1, repeatCount - 1))}
                    className="w-5 h-5 flex items-center justify-center hover:opacity-80 rounded-full text-xs bg-base text-primary-text"
                  >
                    -
                  </button>
                  <span className="text-xs w-4 text-center text-primary-text">{repeatCount}</span>
                  <button
                    onClick={() => onRepeatCountChange(Math.min(10, repeatCount + 1))}
                    className="w-5 h-5 flex items-center justify-center hover:opacity-80 rounded-full text-xs bg-base text-primary-text"
                  >
                    +
                  </button>
                </div>
              )}
            </div>

            {/* Speed Controls */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-medium text-primary-text">Speed:</span>
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onSpeedChange(Math.max(0.25, Math.round((playbackSpeed - 0.25) * 100) / 100))}
                  disabled={playbackSpeed <= 0.25}
                  className={`w-5 h-5 flex items-center justify-center rounded-full text-xs bg-base text-primary-text ${playbackSpeed <= 0.25 ? 'opacity-50' : 'hover:opacity-80'}`}
                >
                  -
                </button>
                <span className="text-xs w-8 text-center text-primary-text">{playbackSpeed}x</span>
                <button
                  onClick={() => onSpeedChange(Math.min(2, Math.round((playbackSpeed + 0.25) * 100) / 100))}
                  disabled={playbackSpeed >= 2}
                  className={`w-5 h-5 flex items-center justify-center rounded-full text-xs bg-base text-primary-text ${playbackSpeed >= 2 ? 'opacity-50' : 'hover:opacity-80'}`}
                >
                  +
                </button>
              </div>
            </div>

            {/* Font Size Controls */}
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-medium text-primary-text">Font:</span>
              <div className="flex items-center space-x-1.5">
                <button
                  onClick={() => onFontSizeChange(Math.max(14, fontSize - 2))}
                  disabled={fontSize <= 14}
                  className={`w-5 h-5 flex items-center justify-center rounded-full text-xs bg-base text-primary-text ${fontSize <= 14 ? 'opacity-50' : 'hover:opacity-80'}`}
                >
                  A-
                </button>
                <span className="text-xs w-6 text-center text-primary-text">{fontSize}px</span>
                <button
                  onClick={() => onFontSizeChange(Math.min(32, fontSize + 2))}
                  disabled={fontSize >= 32}
                  className={`w-5 h-5 flex items-center justify-center rounded-full text-xs bg-base text-primary-text ${fontSize >= 32 ? 'opacity-50' : 'hover:opacity-80'}`}
                >
                  A+
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};