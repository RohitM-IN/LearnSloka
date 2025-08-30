/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo, useEffect } from "react";
import { isSubtitleBlock, type SRTBlock, type SRTSubtitle } from "../utils/parser";
import type { PlayerProps } from "../@types/player";
import { MainControls } from "./MainControls";
import { MobileControls } from "./MobileControls";
import { ContinueModal } from "./ContinueModel";
import { SegmentList } from "./SegmentList";
import {
  useAudioControl,
  usePositionPersistence,
  useSRTLoader,
  useSegmentRepeat,
  useAutoScroll,
  useSegmentProgression
} from "../hooks";


export const Player: React.FC<PlayerProps> = ({
  audioSrc,
  srtUrl,
  localStoragePrefix
}) => {
  // Load SRT file
  const { blocks } = useSRTLoader({ srtUrl });

  // Core player state
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState<number>(0);
  const [currentRepeat, setCurrentRepeat] = useState<number>(0);
  
  // Settings state
  const [fontSize, setFontSize] = useState<number>(18);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const [enableRepeat, setEnableRepeat] = useState<boolean>(false);
  
  // UI state
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showContinueModal, setShowContinueModal] = useState<boolean>(false);
  const [hasShownFirstTimePrompt, setHasShownFirstTimePrompt] = useState<boolean>(false);
  const [animationStartTime, setAnimationStartTime] = useState<number | null>(null);
  const [pausedProgress, setPausedProgress] = useState<number>(0);

  // Custom hooks
  const positionPersistence = usePositionPersistence({ localStoragePrefix });
  const { segmentRepeat, toggleSegmentRepeat } = useSegmentRepeat();
  const { scrollContainerRef, setSegmentRef } = useAutoScroll({ currentIndex, isPlaying, showControls });
  
  // Audio control hook
  const audioControl = useAudioControl({
    isPlaying,
    playbackSpeed,
    onStop: handleStop
  });

  // Load saved settings on mount
  useEffect(() => {
    const savedPosition = positionPersistence.getSavedPosition();
    if (savedPosition) {
      setCurrentIndex(savedPosition.index);
      setAudioTime(savedPosition.time);
    }

    const savedFontSize = positionPersistence.getSavedFontSize();
    if (savedFontSize) {
      setFontSize(savedFontSize);
    }

    const savedSpeed = positionPersistence.getSavedPlaybackSpeed();
    if (savedSpeed) {
      setPlaybackSpeed(savedSpeed);
    }
  }, [localStoragePrefix]);

  // Centralized segment playback logic
  const playSegment = (index: number, repeat?: number) => {
    const block = blocks[index] as SRTSubtitle;
    if (!block || !audioControl.audioRef.current) return;
    
    console.log(`🎯 Playing segment ${index}: "${block.text.slice(0, 50)}${block.text.length > 50 ? '...' : ''}" (${block.start.toFixed(2)}s - ${block.end.toFixed(2)}s, Repeat: ${repeat ?? 0})`);
    
    // Only seek if not already at the correct time
    const currentSeek = audioControl.getCurrentTime();
    if (Math.abs(currentSeek - block.start) > 0.05) {
      audioControl.seekTo(block.start);
    }
    audioControl.setPlaybackRate(playbackSpeed);
    
    // Only play if not already playing
    if (!isPlaying) {
      audioControl.play();
    }

    setCurrentIndex(index);
    setAudioTime(block.start);
    setIsPlaying(true);
    setCurrentRepeat(repeat ?? 0);
    setAnimationStartTime(Date.now());
    setPausedProgress(0);
    positionPersistence.savePosition(index, block.start);
  };

  // Segment progression hook
  useSegmentProgression({
    isPlaying,
    currentIndex,
    blocks,
    currentRepeat,
    enableRepeat,
    repeatCount,
    segmentRepeat,
    getCurrentTime: audioControl.getCurrentTime,
    seekTo: audioControl.seekTo,
    onTimeUpdate: (time) => {
      setAudioTime(time);
      positionPersistence.savePosition(currentIndex, time);
    },
    onIndexChange: setCurrentIndex,
    onRepeatChange: setCurrentRepeat,
    onStop: handleStop,
    playSegment,
    clearSavedPosition: positionPersistence.clearSavedPosition,
    setIsPlaying
  });

  // Event handlers
  function handleStop() {
    setIsPlaying(false);
    setCurrentIndex(-1);
    setAudioTime(0);
    setCurrentRepeat(0);
    setAnimationStartTime(null);
    setPausedProgress(0);
  }

  const handleFontSizeChange = (newSize: number) => {
    setFontSize(newSize);
    positionPersistence.saveFontSize(newSize);
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    positionPersistence.savePlaybackSpeed(newSpeed);
    audioControl.setPlaybackRate(newSpeed);
  };

  const handlePlay = (startIndex: number = 0) => {
    // Check if this is the first time playing and there's a saved position
    if (startIndex === 0 && positionPersistence.hasSavedPosition && !isPlaying && !hasShownFirstTimePrompt) {
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
      positionPersistence.clearSavedPosition();
    }
  };

  const handlePause = () => {
    setIsPlaying(false);
    // Save current progress when pausing
    const currentProgress = getCurrentSegmentProgress();
    setPausedProgress(currentProgress);
  };

  const handleResume = () => {
    setIsPlaying(true);
    setAnimationStartTime(Date.now());
  };

  const handleContinue = () => {
    setShowContinueModal(false);
    const savedPosition = positionPersistence.getSavedPosition();
    if (savedPosition) {
      setCurrentIndex(savedPosition.index);
      setIsPlaying(true);
      setCurrentRepeat(0);
    }
  };

  const handleStartFresh = () => {
    setShowContinueModal(false);
    positionPersistence.clearSavedPosition();
    setCurrentIndex(0);
    setIsPlaying(true);
    setCurrentRepeat(0);
  };

  const handleSegmentClick = (index: number) => {
    setShowControls(false);
    // Only call playSegment if currentTime is outside the segment time
    const block = blocks[index] as SRTSubtitle;
    const currentSeek = audioControl.getCurrentTime();
    
    console.log(`👆 Segment ${index} clicked (Current: ${currentIndex}, Playing: ${isPlaying}, Time: ${currentSeek.toFixed(2)}s)`);
    
    // Handle clicking on the same segment that's currently active
    if (index === currentIndex) {
      if (isPlaying) {
        // If playing, pause it
        console.log(`⏸️ Pausing current segment ${index}`);
        setIsPlaying(false);
      } else {
        // If paused, resume playback
        console.log(`▶️ Resuming segment ${index}`);
        setIsPlaying(true);
        setAnimationStartTime(Date.now());
      }
      return;
    }
    
    // For different segments, check if we need to seek
    if (currentSeek < block.start - 0.05 || currentSeek > block.end + 0.05) {
      console.log(`🎯 Seeking to segment ${index} (outside current time range)`);
      playSegment(index);
    } else {
      console.log(`✅ Already within segment ${index} time range - just switching focus`);
    }
  };

  const handlePlayButton = () => {
    console.log(`🎮 Play button clicked (Playing: ${isPlaying}, HasSaved: ${positionPersistence.hasSavedPosition}, FirstTime: ${!hasShownFirstTimePrompt})`);
    
    // Try to continue from saved position first
    if (!isPlaying) {
      handleResume();
    }
    if (positionPersistence.hasSavedPosition && !isPlaying) {
      const savedPosition = positionPersistence.getSavedPosition();
      if (savedPosition) {
        console.log(`📍 Resuming from saved position: segment ${savedPosition.index} at ${savedPosition.time.toFixed(2)}s`);
        handlePlay(savedPosition.index);
        return;
      }
    }

    // If no saved position or already shown prompt, start from first
    if (positionPersistence.hasSavedPosition && !isPlaying && !hasShownFirstTimePrompt) {
      console.log(`❓ Showing continue modal for saved position`);
      setShowContinueModal(true);
      setHasShownFirstTimePrompt(true);
    }
    else if (!positionPersistence.hasSavedPosition && !isPlaying) {
      console.log(`🆕 Starting fresh playback from beginning`);
      handlePlay(0);
      setHasShownFirstTimePrompt(true);
    } else {
      console.log(`⏸️ Pausing current playback`);
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
        const savedPosition = positionPersistence.getSavedPosition();
        if (savedPosition) {
          savedIndex = savedPosition.index;
        }
      }
      const isSavedPosition = index === savedIndex && !isPlaying;

      return {
        ...segment,
        label: (
          <div
            ref={setSegmentRef(index)}
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
        {...audioControl.audioProps}
        src={audioSrc}
        onLoadedData={() => {
          audioControl.setPlaybackRate(playbackSpeed);
          audioControl.setVolume(1.0);
        }}
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
