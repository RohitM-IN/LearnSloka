/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import { FaPlay, FaRedo, FaStop, FaPause } from "react-icons/fa";
import segments from "../data/rudra_segments.json";

interface Segment {
  start: number;
  end: number;
  text: string;
}

export const Player: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState<number>(0);
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const [enableRepeat, setEnableRepeat] = useState<boolean>(false);
  const [currentRepeat, setCurrentRepeat] = useState<number>(0);
  const [showContinueModal, setShowContinueModal] = useState<boolean>(false);
  const [hasSavedPosition, setHasSavedPosition] = useState<boolean>(false);
  const [hasShownFirstTimePrompt, setHasShownFirstTimePrompt] = useState<boolean>(false);
  const [fontSize, setFontSize] = useState<number>(18);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [segmentRepeat, setSegmentRepeat] = useState<{ [key: number]: 'default' | 'twice' | 'infinite' }>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load saved position on component mount
  useEffect(() => {
    const savedPosition = localStorage.getItem('rudraPlayer_lastPosition');
    if (savedPosition) {
      const { index, time } = JSON.parse(savedPosition);
      setCurrentIndex(index);
      setAudioTime(time);
      setHasSavedPosition(true);
    }

    // Load saved font size
    const savedFontSize = localStorage.getItem('rudraPlayer_fontSize');
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize));
    }

    // Load saved playback speed
    const savedSpeed = localStorage.getItem('rudraPlayer_playbackSpeed');
    if (savedSpeed) {
      setPlaybackSpeed(parseFloat(savedSpeed));
    }
  }, []);

  const savePosition = () => {
    if (currentIndex >= 0) {
      localStorage.setItem('rudraPlayer_lastPosition', JSON.stringify({
        index: currentIndex,
        time: audioTime
      }));
      setHasSavedPosition(true);
    }
  };

  const clearSavedPosition = () => {
    localStorage.removeItem('rudraPlayer_lastPosition');
    setHasSavedPosition(false);
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    localStorage.setItem('rudraPlayer_fontSize', newSize.toString());
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    localStorage.setItem('rudraPlayer_playbackSpeed', newSpeed.toString());
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  const handlePlay = (startIndex: number = 0) => {
    // Check if this is the first time playing and there's a saved position
    if (startIndex === 0 && hasSavedPosition && !isPlaying && !hasShownFirstTimePrompt) {
      setShowContinueModal(true);
      setHasShownFirstTimePrompt(true);
      return;
    }

    setCurrentIndex(startIndex);
    setIsPlaying(true);
    setCurrentRepeat(0);

    // Clear saved data if starting from first line
    if (startIndex === 0) {
      clearSavedPosition();
    }

    savePosition();
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleResume = () => {
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    setAudioTime(0);
    setCurrentRepeat(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleContinue = () => {
    setShowContinueModal(false);
    const savedPosition = localStorage.getItem('rudraPlayer_lastPosition');
    if (savedPosition) {
      const { index } = JSON.parse(savedPosition);
      setCurrentIndex(index);
      setIsPlaying(true);
      setCurrentRepeat(0);
      savePosition();
    }
  };

  const handleStartFresh = () => {
    setShowContinueModal(false);
    clearSavedPosition();
    setCurrentIndex(0);
    setIsPlaying(true);
    setCurrentRepeat(0);
    savePosition();
  };

  const toggleSegmentRepeat = (index: number) => {
    setSegmentRepeat(prev => {
      const current = prev[index] || 'default';
      let next: 'default' | 'twice' | 'infinite' = 'default';

      if (current === 'default') {
        next = 'twice';
      } else if (current === 'twice') {
        next = 'infinite';
      } else {
        next = 'default';
      }

      return {
        ...prev,
        [index]: next
      };
    });
  };


  const handleSegmentClick = (index: number) => {
    // Hide controls when clicking on a segment
    setShowControls(false);
    // If clicking on the same segment that's currently playing, pause it
    if (index === currentIndex) {
      if(isPlaying)
        handlePause();
      else
        handleResume();
      return;
    }

    // If playing a different segment, stop first then play the new one
    if (isPlaying) {
      handleStop();
      // Use setTimeout to ensure the stop operation completes before starting new segment
      setTimeout(() => {
        handlePlay(index);
      }, 100);
    } else {
      // If not playing, just start the clicked segment
      handlePlay(index);
    }
  };

  const handlePlayButton = () => {
    // Try to continue from saved position first
    if(!isPlaying){
      handleResume();
    }
    if (hasSavedPosition && !isPlaying) {
      const savedPosition = localStorage.getItem('rudraPlayer_lastPosition');
      if (savedPosition) {
        const { index } = JSON.parse(savedPosition);
        handlePlay(index);
        return;
      }
    }

    // If no saved position or already shown prompt, start from first
    if (hasSavedPosition && !isPlaying && !hasShownFirstTimePrompt) {
      setShowContinueModal(true);
      setHasShownFirstTimePrompt(true);
    } else {
      handlePause();
    }
  };

  const handleRefreshButton = () => {
    handlePlay(0);
  };

  const getCurrentSegmentProgress = () => {
    if (currentIndex >= 0 && currentIndex < segments.length && audioTime > 0) {
      const { start, end } = segments[currentIndex];
      const segmentDuration = end - start;
      const elapsedTime = Math.max(0, audioTime - start);
      const progress = (elapsedTime / segmentDuration) * 100;
      return Math.max(0, Math.min(100, progress));
    }
    return 0;
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Auto-scroll to current segment
  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && segmentRefs.current[currentIndex]) {
      const currentElement = segmentRefs.current[currentIndex];
      const container = scrollContainerRef.current;

      if (currentElement && container) {
        const elementRect = currentElement.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();

        // Check if element is not fully visible
        if (elementRect.top < containerRect.top || elementRect.bottom > containerRect.bottom) {
          currentElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }
    }
  }, [currentIndex, isPlaying]);

  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && currentIndex < segments.length) {
      const { start, end } = segments[currentIndex];

      // Only set the start time when changing segments or starting playback
      if (audioRef.current && currentRepeat === 0 && (!audioRef.current.currentTime || audioRef.current.currentTime < start || audioRef.current.currentTime > end)) {
        audioRef.current.currentTime = start;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play();
      }

      // Set up interval to check audio time and advance segments
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const currentTime = audioRef.current.currentTime;
          setAudioTime(currentTime);
          savePosition(); // Save position every 100ms

          // Check if we need to advance to next segment
          if (currentTime >= end) {
            // Check for per-segment repeat settings
            const segmentRepeatSetting = segmentRepeat[currentIndex] || 'default';
            if (segmentRepeatSetting === 'infinite') {
              // Infinite repeat - just reset to start
              if (audioRef.current) {
                audioRef.current.currentTime = start;
                audioRef.current.playbackRate = playbackSpeed;
                audioRef.current.play();
              }
            } else if (segmentRepeatSetting === 'twice') {
              // Repeat twice - one additional time
              if (currentRepeat < 1) {
                setCurrentRepeat(currentRepeat + 1);
                if (audioRef.current) {
                  audioRef.current.currentTime = start;
                  audioRef.current.playbackRate = playbackSpeed;
                  audioRef.current.play();
                }
              } else {
                // Move to next segment after playing twice
                if (currentIndex + 1 < segments.length) {
                  setCurrentIndex(currentIndex + 1);
                  setCurrentRepeat(0);
                } else {
                  // End of all segments - clear saved data
                  clearSavedPosition();
                  handleStop();
                }
              }
            } else if (enableRepeat && currentRepeat < repeatCount - 1) {
              // Global repeat setting
              setCurrentRepeat(currentRepeat + 1);
              if (audioRef.current) {
                audioRef.current.currentTime = start;
                audioRef.current.playbackRate = playbackSpeed;
                audioRef.current.play();
              }
            } else if (currentIndex + 1 < segments.length) {
              // Move to next segment
              setCurrentIndex(currentIndex + 1);
              setCurrentRepeat(0);
            } else {
              // End of all segments - clear saved data
              clearSavedPosition();
              handleStop();
            }
          }
        }
      }, 50); // Reduced to 50ms for smoother progress updates
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentIndex, isPlaying, currentRepeat, enableRepeat, repeatCount, playbackSpeed, segmentRepeat]);

  const visibleSegments = segments.map((segment: Segment, index: number) => {
    const isActive = index === currentIndex;
    const isCompleted = index < currentIndex;

    // Check if this segment is the saved position when not playing
    const savedPosition = localStorage.getItem('rudraPlayer_lastPosition');
    let savedIndex = -1;
    if (savedPosition && !isPlaying) {
      try {
        const { index: savedIdx } = JSON.parse(savedPosition);
        savedIndex = savedIdx;
      } catch {
        // Handle parsing error
      }
    }
    const isSavedPosition = index === savedIndex && !isPlaying;

    return {
      ...segment,
      label: (
        <div
          ref={(el) => {
            segmentRefs.current[index] = el;
          }}
          className={`segment-item rounded-lg px-2 py-3 mb-1 transition-all duration-200 cursor-pointer ${isActive
              ? 'bg-green-900 border-l-4 border-green-500'
              : isCompleted
                ? 'bg-gray-800'
                : isSavedPosition
                  ? 'bg-gray-800 border-l-4 border-blue-500'
                  : 'bg-gray-900 hover:bg-gray-800'
            }`}
          onClick={() => handleSegmentClick(index)}
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
                {segment.text}
              </p>
            </div>

            <div className="flex justify-between items-end mt-2">
              {/* Progress bar for active segment */}
              {isActive && isPlaying && (
                <div className="flex-1 mr-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                      {formatTime(audioTime - segment.start)} / {formatTime(segment.end - segment.start)}
                    </span>
                    {enableRepeat && (
                      <span className="text-xs text-gray-400">
                        Repeat: {currentRepeat + 1}/{repeatCount}
                      </span>
                    )}
                    {segmentRepeat[index] === 'twice' && (
                      <span className="text-xs text-green-500">
                        2x
                      </span>
                    )}
                    {segmentRepeat[index] === 'infinite' && (
                      <span className="text-xs text-green-500">
                        ∞
                      </span>
                    )}
                  </div>
                  <div className="mt-1 w-full bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${getCurrentSegmentProgress()}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Spacer to maintain consistent width when progress bar is not shown */}
              {(!isActive || !isPlaying) && <div className="flex-1"></div>}

              {/* Repeat button at bottom right */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleSegmentRepeat(index);
                }}
                className={`p-1 rounded-full ${segmentRepeat[index] === 'twice' || segmentRepeat[index] === 'infinite'
                    ? 'text-green-500 bg-green-900'
                    : 'text-gray-500 hover:text-gray-300'
                  }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      ),
    };
  });


  return (
    <div className="flex flex-col h-screen bg-spotify-black text-spotify-text">
      {/* Header */}
      <div className="bg-spotify-gray p-4 shadow-lg">
        <div className="container mx-auto">
          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex justify-between items-center">
              <h1 className="text-lg font-bold text-green-500 flex-1 text-center px-2">रुद्रपाठ प्रशिक्षणम्</h1>
              <div className="text-xs text-gray-400">
                <p className="text-[10px]">Created By</p>
                <p className="font-semibold text-xs">Rohit Sopan Mahajan</p>
              </div>


              <div className="items-center space-x-2 hidden md:flex">
                {isPlaying && (
                  <div className="bg-gray-800 px-2 py-1 rounded-full flex items-center">
                    <span className="text-green-500 font-semibold text-sm">{formatTime(audioTime)}</span>
                    {currentIndex >= 0 && (
                      <span className="text-gray-400 text-xs ml-1">
                        ({currentIndex + 1}/{segments.length})
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-500 mr-6">रुद्रपाठ प्रशिक्षणम्</h1>
            </div>

            <div className="flex items-center space-x-4">
              {isPlaying && (
                <div className="bg-gray-800 px-3 py-1 rounded-full flex items-center">
                  <span className="text-green-500 font-semibold">{formatTime(audioTime)}</span>
                  {currentIndex >= 0 && (
                    <span className="text-gray-400 text-sm ml-2">
                      ({currentIndex + 1}/{segments.length})
                    </span>
                  )}
                </div>
              )}

              <div className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                <span className="font-semibold">Rohit Sopan Mahajan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Controls - Always Visible */}
      <div className="bg-spotify-gray p-2">
        <div className="container mx-auto">
          {/* Mobile Layout */}
          <div className="md:hidden">
            <div className="flex justify-center items-center space-x-2">
              <div>
                <button
                  onClick={handleRefreshButton}
                  disabled={isPlaying}
                  className={`p-2 rounded-full ${isPlaying ? 'bg-gray-700 text-gray-500' : 'bg-green-500 hover:bg-green-600 text-white'} transition-colors`}
                >
                  <FaRedo className="text-base" />
                </button>
              </div>
              <div>
                <button
                  onClick={handlePlayButton}
                  //disabled={isPlaying && currentIndex >= 0}
                  className={`p-2 rounded-full ${isPlaying && currentIndex >= 0 ? 'bg-gray-700 text-gray-500' : 'bg-green-500 hover:bg-green-600 text-white'} transition-colors`}
                >
                  {isPlaying ? <FaPause className="text-base" /> : <FaPlay className="text-base ml-0.5" />}
                </button>
              </div>
              <div>
                <button
                  onClick={handleStop}
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
                      ({currentIndex + 1}/{segments.length})
                    </span>
                  )}
                </div>
              ) : (
                <div className="w-32 h-8"></div> // Placeholder to maintain consistent width
              )}
            </div>
          </div>

          {/* Desktop Layout */}
          <div className="hidden md:flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div>
                <button
                  onClick={handleRefreshButton}
                  disabled={isPlaying}
                  className={`p-2 rounded-full ${isPlaying ? 'bg-gray-700 text-gray-500' : 'bg-green-500 hover:bg-green-600 text-white'} transition-colors`}
                >
                  <FaRedo className="text-base" />
                </button>

              </div>
              <div>
                <button
                  onClick={handlePlayButton}
                  //disabled={isPlaying && currentIndex >= 0}
                  className={`p-2 rounded-full ${isPlaying && currentIndex >= 0 ? 'bg-gray-700 text-gray-500' : 'bg-green-500 hover:bg-green-600 text-white'} transition-colors`}
                >
                  {isPlaying ? <FaPause className="text-base" /> : <FaPlay className="text-base ml-0.5" />}
                </button>

              </div>
              <div>
                <button
                  onClick={handleStop}
                  disabled={!isPlaying}
                  className={`p-2 rounded-full ${!isPlaying ? 'bg-gray-700 text-gray-500' : 'bg-gray-600 hover:bg-gray-700 text-white'} transition-colors`}
                >
                  <FaStop className="text-base" />
                </button>
              </div>
            </div>

            {/* Additional Controls for Desktop */}
            <div className="flex items-center space-x-6 bg-gray-800 rounded-full px-4 py-2">
              {/* Repeat Controls */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-300">Repeat:</span>
                <button
                  onClick={() => setEnableRepeat(!enableRepeat)}
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
                      onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))}
                      className="w-6 h-6 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full text-white text-xs"
                    >
                      -
                    </button>
                    <span className="text-sm text-gray-300 w-6 text-center">{repeatCount}</span>
                    <button
                      onClick={() => setRepeatCount(Math.min(10, repeatCount + 1))}
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
                    onClick={() => handleSpeedChange(Math.max(0.25, Math.round((playbackSpeed - 0.25) * 100) / 100))}
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
                    onClick={() => handleSpeedChange(Math.min(2, Math.round((playbackSpeed + 0.25) * 100) / 100))}
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
                    onClick={() => handleFontSizeChange(Math.max(14, fontSize - 2))}
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
                    onClick={() => handleFontSizeChange(Math.min(32, fontSize + 2))}
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
          </div>
        </div>
      </div>

      {/* Controls Toggle Button - Mobile Only */}
      <div className="bg-spotify-gray p-2 md:hidden">
        <div className="container mx-auto text-center">
          <button
            onClick={() => setShowControls(!showControls)}
            className="text-spotify-subtext text-sm hover:text-white transition-colors"
          >
            {showControls ? 'Hide Controls' : 'Show Controls'}
          </button>
        </div>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="bg-spotify-gray p-4 md:hidden">
          <div className="container mx-auto">
            {/* Mobile Controls */}
            <div className="grid grid-cols-2 gap-3">
              {/* Repeat Controls */}
              <div className="bg-gray-800 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Repeat</span>
                  <button
                    onClick={() => setEnableRepeat(!enableRepeat)}
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
                      onClick={() => setRepeatCount(Math.max(1, repeatCount - 1))}
                      className="w-7 h-7 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-full text-white"
                    >
                      -
                    </button>
                    <span className="text-sm">{repeatCount}</span>
                    <button
                      onClick={() => setRepeatCount(Math.min(10, repeatCount + 1))}
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
                    onClick={() => handleSpeedChange(Math.max(0.25, Math.round((playbackSpeed - 0.25) * 100) / 100))}
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
                    onClick={() => handleSpeedChange(Math.min(2, Math.round((playbackSpeed + 0.25) * 100) / 100))}
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
                    onClick={() => handleFontSizeChange(Math.max(14, fontSize - 2))}
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
                    onClick={() => handleFontSizeChange(Math.min(32, fontSize + 2))}
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
      )}

      {/* Segments List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto bg-spotify-light-gray py-4 px-2"
      >
        <div className="container mx-auto">
          {visibleSegments.map((segment, index) => (
            <div key={index} className="mb-2">
              {segment.label}
            </div>
          ))}
        </div>
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src="/rudra.mp3"
        preload="auto"
        onEnded={handleStop}
        className="hidden"
      />

      {/* Continue Modal */}
      {showContinueModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Continue from where you left off?</h3>
            <p className="text-gray-300 mb-6">
              We found your last played position. Would you like to continue from where you left off or start fresh?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleStartFresh}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md font-medium transition-colors"
              >
                Start Fresh
              </button>
              <button
                onClick={handleContinue}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md font-medium transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};