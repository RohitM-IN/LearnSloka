/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useMemo, useEffect } from "react";
import { isSubtitleBlock, type SRTBlock, type SRTSubtitle } from "../utils/parser";
import type { PlayerProps } from "../@types/player";
import { MainControls } from "./MainControls";
import { MobileControls } from "./MobileControls";
import { SegmentList } from "./SegmentList";
import {
  useAudioControl,
  usePositionPersistence,
  useSRTLoader,
  useSegmentRepeat,
  useAutoScroll,
  useSegmentProgression
} from "../hooks";
import { CapacitorMusicControls } from "capacitor-music-controls-plugin";
import type { PluginListenerHandle } from '@capacitor/core';

export const Player: React.FC<PlayerProps> = ({
  audioSrc,
  srtUrl,
  localStoragePrefix,
  songTitle,
  autoPlay: _autoplay = false,
  albumContext,
  artist
}) => {
  // Load SRT file
  const { blocks } = useSRTLoader({ srtUrl });

  // Core player state
  const [currentIndex, setCurrentIndex] = useState<number>(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioTime, setAudioTime] = useState<number>(0);
  const [currentRepeat, setCurrentRepeat] = useState<number>(0);
  const [musicControlsKey, setMusicControlsKey] = useState(0);

  // Settings state
  const [fontSize, setFontSize] = useState<number>(18);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [repeatCount, setRepeatCount] = useState<number>(1);
  const [enableRepeat, setEnableRepeat] = useState<boolean>(false);
  
  // UI state
  const [showControls, setShowControls] = useState<boolean>(false);
  const [animationStartTime, setAnimationStartTime] = useState<number | null>(null);
  const [pausedProgress, setPausedProgress] = useState<number>(0);
  const [autoPlay, setAutoPlay] = useState<boolean>(_autoplay);

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

    // Auto-play functionality
    if (autoPlay && blocks.length > 0) {
      // Small delay to ensure audio is loaded
      const autoPlayTimer = setTimeout(() => {
        // For auto-play, always start from the beginning (first playable segment)
        console.log(`🎵 Auto-playing from beginning (ignoring saved position)`);
        positionPersistence.clearSavedPosition(); // Clear any saved position
        
        // Find the first subtitle block that has proper start/end times (actual chantable content)
        const firstPlayableIndex = blocks.findIndex(block => 
          isSubtitleBlock(block) && 
          "start" in block && 
          "end" in block && 
          typeof block.start === "number" && 
          typeof block.end === "number" &&
          block.start >= 0 && 
          block.end > block.start
        );
        
        if (firstPlayableIndex >= 0) {
          console.log(`🎯 Auto-playing from first playable segment at index ${firstPlayableIndex}`);
          playSegment(firstPlayableIndex); // Use playSegment to seek AND play
        } else {
          console.log(`⚠️ No playable segments found, falling back to index 0`);
          handlePlay(0);
        }
      }, 500);

      return () => clearTimeout(autoPlayTimer);
    }
  }, [localStoragePrefix, autoPlay, blocks.length]);

  // Centralized segment playback logic
  const playSegment = (index: number, repeat?: number) => {
    const block = blocks[index] as SRTSubtitle;
    if (!block || !audioControl.audioRef.current) return;

    console.log(`🎯 Playing segment ${index}: "${block.text.slice(0, 50)}${block.text.length > 50 ? '...' : ''}" (${block.start?.toFixed(2)}s - ${block.end?.toFixed(2)}s, Repeat: ${repeat ?? 0})`);

    // Only seek if not already at the correct time
    const currentSeek = audioControl.getCurrentTime();
    if (Math.abs(currentSeek - block.start) > 0.05) {
      audioControl.seekTo(block.start);
    }
    audioControl.setPlaybackRate(playbackSpeed);
    
    // Always play when calling playSegment
    audioControl.play();

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
    onStop: handleSongEnd, // Use handleSongEnd instead of handleStop
    playSegment,
    clearSavedPosition: positionPersistence.clearSavedPosition,
    setIsPlaying
  });

  // Event handlers
  function handleStop() {
    console.log(`🛑 Stop button clicked - stopping playback and seeking to segment start`);
    
    // If there's a current segment, seek to its start before stopping
    if (currentIndex >= 0 && currentIndex < blocks.length) {
      const currentBlock = blocks[currentIndex] as SRTSubtitle;
      if (currentBlock && "start" in currentBlock) {
        console.log(`🎯 Seeking to start of segment ${currentIndex} (${currentBlock.start.toFixed(2)}s)`);
        audioControl.seekTo(currentBlock.start);
      }
    }
    
    // Complete stop functionality (as before)
    setIsPlaying(false);
    setCurrentIndex(-1);
    setAudioTime(0);
    setCurrentRepeat(0);
    setAnimationStartTime(null);
    setPausedProgress(0);
  }

  function handleSongEnd() {
    console.log(`🎵 Song ended - checking for next song in album`);
    
    // If we're in album context and there's a next song, play it
    if (albumContext && albumContext.onNextSong && albumContext.currentTrackNumber < albumContext.totalTracks) {
      console.log(`➡️ Auto-playing next song in album (${albumContext.currentTrackNumber + 1}/${albumContext.totalTracks})`);
      albumContext.onNextSong();
    } else {
      console.log(`🏁 Album finished or no album context - stopping playback`);
      handleStop();
    }
  }

  function handleSkipToNext() {
    console.log(`⏭️ Skip to next song requested`);
    if (albumContext && albumContext.onNextSong) {
      albumContext.onNextSong();
      setMusicControlsKey((prevKey) => prevKey + 1); // Trigger useEffect by updating state
    }
  }

  function handleSkipToPrevious() {
    console.log(`⏮️ Skip to previous song requested`);
    if (albumContext && albumContext.onPreviousSong) {
      albumContext.onPreviousSong();
      setMusicControlsKey((prevKey) => prevKey + 1); // Trigger useEffect by updating state
    }
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
    // For auto-play or when we want to skip the modal, just start playing
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
    setAutoPlay(false);
    // Save current progress when pausing
    const currentProgress = getCurrentSegmentProgress();
    setPausedProgress(currentProgress);
  };

  const handleSegmentClick = (index: number) => {
    setShowControls(false);
    setAutoPlay(false);
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
    console.log(`🎮 Play button clicked (Playing: ${isPlaying}, HasSaved: ${positionPersistence.hasSavedPosition}, AutoPlay: ${autoPlay})`);
    
    // If currently playing, pause
    if (isPlaying) {
      console.log(`⏸️ Pausing current playback`);
      handlePause();
      return;
    }

    // If not playing, check for saved position and auto-continue
    if (positionPersistence.hasSavedPosition && !autoPlay) {
      const savedPosition = positionPersistence.getSavedPosition();
      if (savedPosition) {
        console.log(`📍 Auto-resuming from saved position: segment ${savedPosition.index} at ${savedPosition.time.toFixed(2)}s`);
        setCurrentIndex(savedPosition.index);
        setIsPlaying(true);
        setCurrentRepeat(0);
        setAnimationStartTime(Date.now());
        setPausedProgress(0);
        return;
      }
    }

    // Default: start from beginning
    console.log(`🆕 Starting fresh playback from beginning`);
    handlePlay(0);
  };

  const handleRefreshButton = () => {
    console.log(`🔄 Refresh button clicked - finding first playable segment`);
    
    // Find the first subtitle block that has proper start/end times (actual chantable content)
    const firstPlayableIndex = blocks.findIndex(block => 
      isSubtitleBlock(block) && 
      "start" in block && 
      "end" in block && 
      typeof block.start === "number" && 
      typeof block.end === "number" &&
      block.start >= 0 && 
      block.end > block.start
    );
    
    if (firstPlayableIndex >= 0) {
      console.log(`🎯 Restarting from first playable segment at index ${firstPlayableIndex}`);
      positionPersistence.clearSavedPosition(); // Clear saved position
      playSegment(firstPlayableIndex); // Use playSegment to seek AND play
    } else {
      console.log(`⚠️ No playable segments found, falling back to index 0`);
      handlePlay(0);
    }
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
    if(isNaN(time) || time < 0) 
      return "";

    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const visibleblocks = useMemo(() => {
    // const songTitleBlock = {
    //   type: 'song-title' as const,
    //   text: songTitle,
    //   label: (
    //     <header className="text-center">
    //       <h1 className="text-2xl font-bold text-accent sanskrit-title" style={{
    //         fontSize: `${Math.min(fontSize + 6, 36)}px`,
    //         lineHeight: '1.6'
    //       }}>
    //         {songTitle}
    //       </h1>
    //     </header>
    //   ),
    // };

    const processedBlocks = blocks.map((block: SRTBlock, index: number) => {
      if(block.type === "title-end") return null;
      if (!isSubtitleBlock(block)) {
        return {
          ...block,
          label: (
            <div className="segment-title my-4 text-center">
              <h2 className="font-bold text-accent" style={{
                fontSize: `${Math.min(fontSize + 3, 32)}px`,
                lineHeight: '1.6'
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
            className={`segment-item rounded-lg px-2 py-3 mb-1 cursor-pointer ${isActive
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
                    ? 'font-semibold text-primary-text dark:text-accent'
                    : isCompleted
                      ? 'text-subtext'
                      : isSavedPosition
                        ? 'text-primary-text font-semibold'
                        : 'text-primary-text'
                    } whitespace-pre-wrap break-words`}
                  style={{
                    fontSize: `${fontSize}px`,
                    lineHeight: '1.6'
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
                          transitionDuration: isPlaying ? '150ms' : '200ms'
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
                  className={`p-1 rounded-full transition-colors duration-700 ${segmentRepeat[index] === 'twice' || segmentRepeat[index] === 'infinite'
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
    
    return [/*songTitleBlock,*/ ...processedBlocks.filter(block => block !== null)];
  }, [blocks, currentIndex, fontSize, isPlaying, segmentRepeat, enableRepeat, localStoragePrefix, audioTime, currentRepeat, repeatCount, animationStartTime, pausedProgress, songTitle]);

  // Music Controls Integration
  useEffect(() => {
    if (!CapacitorMusicControls) {
      console.warn("CapacitorMusicControls plugin is not available.");
      return;
    }

    // Create music controls when the component mounts
    CapacitorMusicControls.create({
      track: songTitle || "Unknown Track",
      artist: artist || "Unknown Artist",
      cover: "",
      notificationIcon: "",
      isPlaying: isPlaying,
      dismissable: false,
      hasPrev: albumContext?.currentTrackNumber !== undefined && albumContext.currentTrackNumber > 1, // Enable previous if not the first track
      hasNext: albumContext?.currentTrackNumber !== undefined && albumContext?.totalTracks !== undefined && albumContext.currentTrackNumber < albumContext.totalTracks, // Enable next if not the last track
      hasClose: true, // Always allow closing the controls
      duration: audioControl.getCurrentTime() || 0,
    })
    .catch((e) => {
      console.log(e);
    });

    // Subscribe to music control events
    let eventListenerHandle: PluginListenerHandle | undefined;
    document.addEventListener("controlsNotification", (action: any) => {
      switch (action.message) {
        case "music-controls-play":
          console.log("▶️ Play button pressed");
          handlePlayButton();
          break;
        case "music-controls-pause":
          console.log("⏸️ Pause button pressed");
          handlePause();
          break;
        case "music-controls-next":
          console.log("⏭️ Next button pressed");
          handleSkipToNext();
          break;
        case "music-controls-previous":
          console.log("⏮️ Previous button pressed");
          handleSkipToPrevious();
          break;
        case "music-controls-destroy":
          console.log("🛑 Controls destroyed");
          handleStop();
          break;
        default:
          console.log(`Unhandled action: ${action.message}`);
      }
    });

    return () => {
      // Destroy music controls and remove event listener when the component unmounts
      CapacitorMusicControls.destroy();
      if (eventListenerHandle) {
        eventListenerHandle.remove();
      }
    };
  }, [isPlaying, songTitle, artist, albumContext, musicControlsKey,window.history]);

  useEffect(() => {
    if (!CapacitorMusicControls) return;

    // Update playback state when isPlaying changes
    CapacitorMusicControls.updateIsPlaying({ isPlaying });
  }, [isPlaying]);

  useEffect(() => {
    if (!CapacitorMusicControls || !audioControl.audioRef.current) return;
    
    // Update duration when audio source or metadata changes
    CapacitorMusicControls.updateElapsed({
      isPlaying,
      elapsed: audioControl.getCurrentTime(),
    });
  }
  , [audioSrc, audioControl.audioRef.current?.duration]);

  useEffect(() => {
    if (!CapacitorMusicControls || !audioControl.audioRef.current || !isPlaying) return;

    const interval = setInterval(() => {
      CapacitorMusicControls.updateElapsed({
        isPlaying,
        elapsed: audioControl.getCurrentTime(),
      });
    }, 1000); // Run every second

    return () => clearInterval(interval);
  }, [audioSrc, audioControl.audioRef.current?.duration, isPlaying]);


  return (
    <div className="flex flex-col flex-1 overflow-hidden bg-background text-primary-text">

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
          albumContext={albumContext}
          onSkipNext={handleSkipToNext}
          onSkipPrevious={handleSkipToPrevious}
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
    </div>
  );
};
