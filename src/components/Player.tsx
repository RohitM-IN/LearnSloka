/* eslint-disable react-hooks/exhaustive-deps */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { FaChevronDown, FaChevronUp, FaPause, FaPlay, FaRedo, FaStop } from "react-icons/fa";
import { isSubtitleBlock, parseSRT, type SRTBlock, type SRTDocument, type SRTSubtitle, type SRTTitle } from "../utils/parser";
import SegmentItem from "./SegmentItem";


interface PlayerProps {
  audioSrc: string;
  srtUrl: string;
  localStoragePrefix: string;
}

export const Player: React.FC<PlayerProps> = ({
  audioSrc,
  srtUrl,
  localStoragePrefix
}) => {
  const [blocks, setBlocks] = useState<SRTBlock[]>([]);
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

  // Load SRT from URL
  useEffect(() => {
    fetch(srtUrl)
      .then((res) => res.text())
      .then((srt) => {
        const doc: SRTDocument = parseSRT(srt);
        setBlocks(doc.blocks);
      });
  }, [srtUrl]);


  // Load saved position on component mount
  useEffect(() => {
    const savedPosition = localStorage.getItem(`${localStoragePrefix}_lastPosition`);
    if (savedPosition) {
      const { index, time } = JSON.parse(savedPosition);
      setCurrentIndex(index);
      setAudioTime(time);
      setHasSavedPosition(true);
    }

    // Load saved font size
    const savedFontSize = localStorage.getItem(`${localStoragePrefix}_fontSize`);
    if (savedFontSize) {
      setFontSize(parseInt(savedFontSize));
    }

    // Load saved playback speed
    const savedSpeed = localStorage.getItem(`${localStoragePrefix}_playbackSpeed`);
    if (savedSpeed) {
      setPlaybackSpeed(parseFloat(savedSpeed));
    }
  }, [localStoragePrefix]);

  const savePosition = () => {
    if (currentIndex >= 0) {
      localStorage.setItem(`${localStoragePrefix}_lastPosition`, JSON.stringify({
        index: currentIndex,
        time: audioTime
      }));
      setHasSavedPosition(true);
    }
  };

  const clearSavedPosition = () => {
    localStorage.removeItem(`${localStoragePrefix}_lastPosition`);
    setHasSavedPosition(false);
  };

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    localStorage.setItem(`${localStoragePrefix}_fontSize`, newSize.toString());
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    localStorage.setItem(`${localStoragePrefix}_playbackSpeed`, newSpeed.toString());
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
    const savedPosition = localStorage.getItem(`${localStoragePrefix}_lastPosition`);
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

  const toggleSegmentRepeat = useCallback((index: number) => {
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
  },[]);


  const handleSegmentClick = useCallback((index: number) => {
    // Hide controls when clicking on a segment
    setShowControls(false);
    // If clicking on the same segment that's currently playing, pause it
    if (index === currentIndex) {
      if (isPlaying)
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
  },[]);

  const handlePlayButton = () => {
    // Try to continue from saved position first
    if (!isPlaying) {
      handleResume();
    }
    if (hasSavedPosition && !isPlaying) {
      const savedPosition = localStorage.getItem(`${localStoragePrefix}_lastPosition`);
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
    }
    else if (!hasSavedPosition && !isPlaying) {
      handlePlay(0);
      setHasShownFirstTimePrompt(true);
    } else {
      handlePause();
    }
  };

  const handleRefreshButton = () => {
    handlePlay(0);
  };

  // const getCurrentSegmentProgress = () => {
  //   if (currentIndex >= 0 && currentIndex < blocks.length && audioTime > 0) {
  //     const block = blocks[currentIndex];

  //     // Type guard: only process blocks that have start & end
  //     if (block.type === 'line') {
  //       return (block.end - block.start) / playbackSpeed;
  //       // const segmentDuration = block.end - block.start;
  //       // const elapsedTime = Math.max(0, audioTime - block.start);
  //       // const progress = (elapsedTime / segmentDuration) * 100;
  //       // return Math.max(0, Math.min(100, progress));
  //     }
  //   }

  //   return 0;
  // };

  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  },[]);

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
    if (!isPlaying || currentIndex < 0 || currentIndex >= blocks.length) return;

    const block = blocks[currentIndex];

    // Skip non-subtitle blocks automatically
    if (!isSubtitleBlock(block)) {
      setCurrentIndex(currentIndex + 1);
      return;
    }

    const { start, end } = block as SRTSubtitle;
    const duration = (end - start) / playbackSpeed;

    // Start audio at segment start
    if (audioRef.current) {
      audioRef.current.currentTime = start;
      audioRef.current.playbackRate = playbackSpeed;
      audioRef.current.play();
    }

    // Start timestamp for animation (used if you want JS-based progress)
    // const segmentStartTime = performance.now();

    // Schedule segment end handling
    const timeoutId = setTimeout(() => {
      const segmentRepeatSetting = segmentRepeat[currentIndex] || 'default';

      if (segmentRepeatSetting === 'infinite') {
        // Reset to start of this segment
        if (audioRef.current) audioRef.current.currentTime = start;
      } else if (segmentRepeatSetting === 'twice') {
        if (currentRepeat < 1) {
          setCurrentRepeat(prev => prev + 1);
          if (audioRef.current) audioRef.current.currentTime = start;
        } else {
          // Move to next segment
          if (currentIndex + 1 < blocks.length) {
            setCurrentIndex(currentIndex + 1);
            setCurrentRepeat(0);
          } else {
            clearSavedPosition();
            handleStop();
          }
        }
      } else if (enableRepeat && currentRepeat < repeatCount - 1) {
        setCurrentRepeat(prev => prev + 1);
        if (audioRef.current) audioRef.current.currentTime = start;
      } else if (currentIndex + 1 < blocks.length) {
        // Move to next segment
        setCurrentIndex(currentIndex + 1);
        setCurrentRepeat(0);
      } else {
        clearSavedPosition();
        handleStop();
      }
    }, duration * 1000);

    // Save current position at the start of segment
    savePosition();

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentIndex, isPlaying, currentRepeat, enableRepeat, repeatCount, playbackSpeed, segmentRepeat, blocks]);

  console.log(blocks)


  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-spotify-black text-spotify-text">

      {/* Main Controls - Always Visible */}
      <div className="bg-spotify-gray py-1 px-2">
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
                      ({currentIndex + 1}/{blocks.length})
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
      <div className="bg-spotify-gray py-1 px-2 md:hidden">
        <div className="container mx-auto text-center justify-center flex">
          <button
            onClick={() => setShowControls(!showControls)}
            className="text-spotify-subtext text-sm hover:text-white transition-colors flex items-center"
          >
            {showControls ? (
              <>
                <FaChevronUp className="mr-1" /> Hide Controls
              </>
            ) : (
              <>
                <FaChevronDown className="mr-1" /> Show Controls
              </>
            )}
          </button>
        </div>
      </div>
      {/* Controls */}
      {showControls && (
        <div className="bg-spotify-gray p-2 md:hidden">
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
      {/* blocks List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto py-2 px-2 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        <div className="container mx-auto">
          {blocks.map((block, index) => {
            if (!isSubtitleBlock(block) && block.type === 'title') {
              return (
                <div key={index} className="segment-item rounded-lg py-1 mb-1 text-center">
                  <p className="text-gray-400">{(block as SRTTitle).text}</p>
                </div>
              );
            }

            if (isSubtitleBlock(block)) {
              return (
                <SegmentItem
                  key={index}
                  segment={block}
                  index={index}
                  currentIndex={currentIndex}
                  currentRepeat={currentRepeat}
                  enableRepeat={enableRepeat}
                  repeatCount={repeatCount}
                  segmentRepeat={segmentRepeat}
                  fontSize={fontSize}
                  isPlaying={isPlaying}
                  localStoragePrefix={localStoragePrefix}
                  audioTime={audioTime}
                  segmentRefs={segmentRefs}
                  playbackSpeed={playbackSpeed}
                  onClick={handleSegmentClick}
                  toggleSegmentRepeat={toggleSegmentRepeat}
                  formatTime={formatTime}
                />
              );
            }

            return null;
          })}
        </div>

      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioSrc}
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