/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState, useMemo } from "react";
import { isSubtitleBlock, parseSRT, type SRTBlock, type SRTDocument, type SRTSubtitle } from "../utils/parser";
import type { PlayerProps } from "../@types/player";
import { MainControls } from "./MainControls";
import { MobileControls } from "./MobileControls";
import { ContinueModal } from "./ContinueModel";
import { SegmentList } from "./SegmentList";


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
  const [animationStartTime, setAnimationStartTime] = useState<number | null>(null);
  const [pausedProgress, setPausedProgress] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const segmentRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Load SRT from URL
  useEffect(() => {
    let isMounted = true;
    fetch(srtUrl)
      .then((res) => res.text())
      .then((srt) => {
        if (isMounted) {
          const doc: SRTDocument = parseSRT(srt);
          console.log(doc.blocks);
          setBlocks(doc.blocks);
        }
      })
      .catch((error) => {
        if (isMounted) {
          console.error('Error loading SRT:', error);
        }
      });
    
    return () => {
      isMounted = false;
    };
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
    setAnimationStartTime(Date.now());
    setPausedProgress(0);

    // Clear saved data if starting from first line
    if (startIndex === 0) {
      clearSavedPosition();
    }

    savePosition();
  };

  const handlePause = () => {
    setIsPlaying(false);
    // Save current progress when pausing
    const currentProgress = getCurrentSegmentProgress();
    setPausedProgress(currentProgress);
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handleResume = () => {
    setIsPlaying(true);
    setAnimationStartTime(Date.now());
    
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleStop = () => {
    setIsPlaying(false);
    setCurrentIndex(-1);
    setAudioTime(0);
    setCurrentRepeat(0);
    setAnimationStartTime(null);
    setPausedProgress(0);
    
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
  };

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

  const getCurrentSegmentProgress = () => {
    if (currentIndex >= 0 && currentIndex < blocks.length && audioTime > 0) {
      const block = blocks[currentIndex];

      // Type guard: only process blocks that have start & end
      if ("start" in block && "end" in block) {
        const segmentDuration = block.end - block.start;
        const elapsedTime = Math.max(0, audioTime - block.start);
        const progress = Math.min(100, Math.max(0, (elapsedTime / segmentDuration) * 100));
        return progress;
      }
    }

    return 0;
  };

  const getSmoothProgress = () => {
    if (!isPlaying || currentIndex < 0 || currentIndex >= blocks.length) {
      return getCurrentSegmentProgress();
    }

    const block = blocks[currentIndex];
    if (!("start" in block && "end" in block)) {
      return 0;
    }

    const segmentDuration = block.end - block.start;
    const elapsedTime = Math.max(0, audioTime - block.start);
    
    // Use a smoother calculation that reduces jitter
    const progress = Math.min(100, Math.max(0, (elapsedTime / segmentDuration) * 100));
    
    // Round to reduce micro-movements and create smoother animation
    return Math.round(progress * 4) / 4; // Round to nearest 0.25%
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
        
        // Calculate available viewport height, considering modal if open
        const modalHeight = showControls ? 350 : 0; // Modal height including padding
        const availableBottom = containerRect.bottom - modalHeight;
        const buffer = 20; // Extra space above modal

        // Check if element would be hidden by modal or not fully visible
        const isHiddenByModal = elementRect.bottom > (availableBottom - buffer);
        const isAboveViewport = elementRect.top < containerRect.top;

        if (isAboveViewport || isHiddenByModal) {
          if (showControls) {
            // When modal is open, scroll so element is in upper part of visible area
            const targetY = containerRect.top + 50; // Position near top of visible area
            const elementRect = currentElement.getBoundingClientRect();
            const currentY = elementRect.top;
            const offset = currentY - targetY;
            
            container.scrollBy({
              top: offset,
              behavior: 'smooth'
            });
          } else {
            // Normal center scrolling when modal is closed
            currentElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        }
      }
    }
  }, [currentIndex, isPlaying, showControls]);

  useEffect(() => {
    if (isPlaying && currentIndex >= 0 && currentIndex < blocks.length) {

      const block = blocks[currentIndex];
      if (!isSubtitleBlock(block)) {
        setCurrentIndex(currentIndex + 1);
      }

      const { start, end } = blocks[currentIndex] as SRTSubtitle;

      // Only set the start time when changing blocks or starting playback
      if (audioRef.current && currentRepeat === 0 && (!audioRef.current.currentTime || audioRef.current.currentTime < start || audioRef.current.currentTime > end)) {
        audioRef.current.currentTime = start;
        audioRef.current.playbackRate = playbackSpeed;
        audioRef.current.play();
        setAnimationStartTime(Date.now());
        setPausedProgress(0);
      }

      // Set up interval to check audio time and advance blocks
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
                setAnimationStartTime(Date.now());
                setPausedProgress(0);
              }
            } else if (segmentRepeatSetting === 'twice') {
              // Repeat twice - one additional time
              if (currentRepeat < 1) {
                setCurrentRepeat(currentRepeat + 1);
                if (audioRef.current) {
                  audioRef.current.currentTime = start;
                  audioRef.current.playbackRate = playbackSpeed;
                  audioRef.current.play();
                  setAnimationStartTime(Date.now());
                  setPausedProgress(0);
                }
              } else {
                // Move to next segment after playing twice
                if (currentIndex + 1 < blocks.length) {
                  setCurrentIndex(currentIndex + 1);
                  setCurrentRepeat(0);
                  setAnimationStartTime(Date.now());
                  setPausedProgress(0);
                } else {
                  // End of all blocks - clear saved data
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
                setAnimationStartTime(Date.now());
                setPausedProgress(0);
              }
            } else if (currentIndex + 1 < blocks.length) {
              // Move to next segment
              setCurrentIndex(currentIndex + 1);
              setCurrentRepeat(0);
              setAnimationStartTime(Date.now());
              setPausedProgress(0);
            } else {
              // End of all blocks - clear saved data
              clearSavedPosition();
              handleStop();
            }
          }
        }
      }, 100); // Increased to 100ms for smoother progress updates and less jitter
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [currentIndex, isPlaying, currentRepeat, enableRepeat, repeatCount, playbackSpeed, segmentRepeat, blocks]);

  const visibleblocks = useMemo(() => {
    return blocks.map((block: SRTBlock, index: number) => {
      if (!isSubtitleBlock(block)) {
          return {
            ...block,
            label: (
              <div className="segment-title my-4 text-center">
                <h2 className="font-bold text-accent" style={{
                  fontSize: `${Math.min(fontSize + 3, 32)}px`,
                  lineHeight: '1.6',
                  fontFamily: 'Noto Sans Devanagari, Arial, sans-serif'
                }}>
                  {block.text}
                </h2>
              </div>
            ),
          };
        }
        const segment = block as SRTSubtitle;
        const isActive = index === currentIndex;
        const isCompleted = index < currentIndex;

        // Check if this segment is the saved position when not playing
        let savedIndex = -1;
        if (!isPlaying) {
          const savedPosition = localStorage.getItem(`${localStoragePrefix}_lastPosition`);
          if (savedPosition) {
            try {
              const { index: savedIdx } = JSON.parse(savedPosition);
              savedIndex = savedIdx;
            } catch {
              // Handle parsing error
            }
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
                ? 'bg-active border-l-4 border-accent'
                : isCompleted
                  ? 'bg-surface'
                  : isSavedPosition
                    ? 'bg-surface border-l-4 border-divider'
                    : 'bg-surface hover:bg-hover'
                }`}
              onClick={() => handleSegmentClick(index)}
            >
              <div className="flex flex-col">
                <div className="flex-1">
                  <p
                    className={`${isActive
                      ? 'text-accent font-semibold'
                      : isCompleted
                        ? 'text-subtext'
                        : isSavedPosition
                          ? 'text-white font-semibold'
                          : 'text-white'
                      } whitespace-pre-wrap break-words`}
                    style={{
                      fontSize: `${fontSize}px`,
                      lineHeight: '1.6',
                      fontFamily: 'Noto Sans Devanagari, Arial, sans-serif'
                    }}
                  >
                    {segment.text}
                  </p>
                </div>

                <div className="flex justify-between items-end mt-2">
                  {/* Progress bar for active segment */}
                  {isActive && (
                    <div className="flex-1 mr-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-subtext">
                          {formatTime(audioTime - segment.start)} / {formatTime(segment.end - segment.start)}
                        </span>
                        {enableRepeat && (
                          <span className="text-xs text-subtext">
                            Repeat: {currentRepeat + 1}/{repeatCount}
                          </span>
                        )}
                        {segmentRepeat[index] === 'twice' && (
                          <span className="text-xs text-accent">
                            2x
                          </span>
                        )}
                        {segmentRepeat[index] === 'infinite' && (
                          <span className="text-xs text-accent">
                            ∞
                          </span>
                        )}
                      </div>
                      <div className="mt-1 w-full bg-base rounded-full h-1.5 relative overflow-hidden">
                        <div
                          className="bg-accent h-1.5 rounded-full transition-all ease-linear"
                          style={{ 
                            width: `${getSmoothProgress()}%`,
                            transitionDuration: isPlaying ? '100ms' : '200ms'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Spacer to maintain consistent width when progress bar is not shown */}
                  {(!isActive) && <div className="flex-1"></div>}

                  {/* Repeat button at bottom right */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSegmentRepeat(index);
                    }}
                    className={`p-1 rounded-full transition-colors ${segmentRepeat[index] === 'twice' || segmentRepeat[index] === 'infinite'
                      ? 'text-accent bg-active'
                      : 'text-subtext hover:text-white'
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
  }, [blocks, currentIndex, fontSize, isPlaying, segmentRepeat, enableRepeat, localStoragePrefix, audioTime, currentRepeat, repeatCount, animationStartTime, pausedProgress]);

  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background text-text">

      {/* Main Controls - Always Visible */}
      <div className="container mx-auto">
        <MainControls
          isPlaying={isPlaying}
          currentIndex={currentIndex}
          audioTime={audioTime}
          blocks={blocks}
          onRefresh={handleRefreshButton}
          onPlay={handlePlayButton}
          onStop={handleStop}
          formatTime={formatTime}
          enableRepeat={enableRepeat}
          repeatCount={repeatCount}
          playbackSpeed={playbackSpeed}
          fontSize={fontSize}
          onRepeatToggle={() => setEnableRepeat(!enableRepeat)}
          onRepeatCountChange={setRepeatCount}
          onSpeedChange={handleSpeedChange}
          onFontSizeChange={handleFontSizeChange}
        />
      </div>

      {/* Mobile Controls */}
      <MobileControls
        showControls={showControls}
        enableRepeat={enableRepeat}
        repeatCount={repeatCount}
        playbackSpeed={playbackSpeed}
        fontSize={fontSize}
        isPlaying={isPlaying}
        onToggleControls={() => setShowControls(!showControls)}
        onRepeatToggle={() => setEnableRepeat(!enableRepeat)}
        onRepeatCountChange={setRepeatCount}
        onSpeedChange={handleSpeedChange}
        onFontSizeChange={handleFontSizeChange}
      />

      {/* Segment List */}
      <SegmentList
        visibleblocks={visibleblocks}
        scrollContainerRef={scrollContainerRef}
      />

      {/* Audio Element */}
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="auto"
        onEnded={handleStop}
        className="hidden"
      />

      {/* Continue Modal */}
      <ContinueModal
        showContinueModal={showContinueModal}
        onContinue={handleContinue}
        onStartFresh={handleStartFresh}
      />
    </div>
  );
};