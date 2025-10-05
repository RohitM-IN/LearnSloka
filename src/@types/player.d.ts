/* eslint-disable @typescript-eslint/no-explicit-any */
export interface PlayerProps {
  audioSrc: string;
  srtUrl: string;
  localStoragePrefix: string;
  songTitle: string;
  artist?: string;
  autoPlay?: boolean;
  albumContext?: {
    albumId: number;
    currentTrackNumber: number;
    totalTracks: number;
    onNextSong?: () => void;
    onPreviousSong?: () => void;
  };
}

export interface ContinueModalProps {
  showContinueModal: boolean;
  onContinue: () => void;
  onStartFresh: () => void;
}

export interface MainControlsProps {
  isPlaying: boolean;
  currentIndex: number;
  audioTime: number;
  blocks: any[];
  onRefresh: () => void;
  onPlay: () => void;
  onStop: () => void;
  formatTime: (time: number) => string;
  enableRepeat: boolean;
  repeatCount: number;
  playbackSpeed: number;
  fontSize: number;
  onRepeatToggle: () => void;
  onRepeatCountChange: (count: number) => void;
  onSpeedChange: (speed: number) => void;
  onFontSizeChange: (size: number) => void;
  albumContext?: {
    currentTrackNumber: number;
    totalTracks: number;
    onNextSong?: () => void;
    onPreviousSong?: () => void;
  };
  onSkipNext?: () => void;
  onSkipPrevious?: () => void;
}

export interface DesktopControlsProps {
  enableRepeat: boolean;
  repeatCount: number;
  playbackSpeed: number;
  fontSize: number;
  onRepeatToggle: () => void;
  onRepeatCountChange: (count: number) => void;
  onSpeedChange: (speed: number) => void;
  onFontSizeChange: (size: number) => void;
}

export interface MobileControlsProps {
  showControls: boolean;
  enableRepeat: boolean;
  repeatCount: number;
  playbackSpeed: number;
  fontSize: number;
  isPlaying: boolean;
  onToggleControls: () => void;
  onRepeatToggle: () => void;
  onRepeatCountChange: (count: number) => void;
  onSpeedChange: (speed: number) => void;
  onFontSizeChange: (size: number) => void;
}

export interface SegmentListProps {
  visibleblocks: any[];
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
}