import React from 'react';
import { FaPause, FaPlay, FaRedo, FaStop } from "react-icons/fa";
import type { MainControlsProps } from '../@types/player';


export const MainControls: React.FC<MainControlsProps> = ({
  isPlaying,
  currentIndex,
  audioTime,
  blocks,
  onRefresh,
  onPlay,
  onStop,
  formatTime
}) => {
  return (
    <>
      {/* Mobile Layout */}
      <div className="md:hidden">
        <div className="flex justify-center items-center space-x-2">
          <div>
            <button
              onClick={onRefresh}
              disabled={isPlaying}
              className={`p-2 rounded-full ${isPlaying ? 'bg-gray-700 text-gray-500' : 'bg-green-500 hover:bg-green-600 text-white'} transition-colors`}
            >
              <FaRedo className="text-base" />
            </button>
          </div>
          <div>
            <button
              onClick={onPlay}
              className={`p-2 rounded-full ${isPlaying && currentIndex >= 0 ? 'bg-gray-700 text-gray-500' : 'bg-green-500 hover:bg-green-600 text-white'} transition-colors`}
            >
              {isPlaying ? <FaPause className="text-base" /> : <FaPlay className="text-base ml-0.5" />}
            </button>
          </div>
          <div>
            <button
              onClick={onStop}
              disabled={!isPlaying}
              className={`p-2 rounded-full ${!isPlaying ? 'bg-gray-700 text-gray-500' : 'bg-gray-600 hover:bg-gray-700 text-white'} transition-colors`}
            >
              <FaStop className="text-base" />
            </button>
          </div>

          {isPlaying ? (
            <div className="bg-gray-800 px-2 py-1 rounded-full flex items-center w-32 justify-center">
              <span className="text-green-500 font-semibold text-sm">{formatTime(audioTime)}</span>
              {currentIndex >= 0 && (
                <span className="text-gray-400 text-xs ml-1">
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
              className={`p-2 rounded-full ${isPlaying ? 'bg-gray-700 text-gray-500' : 'bg-green-500 hover:bg-green-600 text-white'} transition-colors`}
            >
              <FaRedo className="text-base" />
            </button>
          </div>
          <div>
            <button
              onClick={onPlay}
              className={`p-2 rounded-full ${isPlaying && currentIndex >= 0 ? 'bg-gray-700 text-gray-500' : 'bg-green-500 hover:bg-green-600 text-white'} transition-colors`}
            >
              {isPlaying ? <FaPause className="text-base" /> : <FaPlay className="text-base ml-0.5" />}
            </button>
          </div>
          <div>
            <button
              onClick={onStop}
              disabled={!isPlaying}
              className={`p-2 rounded-full ${!isPlaying ? 'bg-gray-700 text-gray-500' : 'bg-gray-600 hover:bg-gray-700 text-white'} transition-colors`}
            >
              <FaStop className="text-base" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};