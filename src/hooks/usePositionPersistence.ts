import { useState, useEffect } from 'react';

export interface UsePositionPersistenceProps {
  localStoragePrefix: string;
}

export interface SavedPosition {
  index: number;
  time: number;
}

export const usePositionPersistence = ({ localStoragePrefix }: UsePositionPersistenceProps) => {
  const [hasSavedPosition, setHasSavedPosition] = useState<boolean>(false);

  // Load saved position on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem(`${localStoragePrefix}_lastPosition`);
    if (savedPosition) {
      setHasSavedPosition(true);
    }
  }, [localStoragePrefix]);

  const savePosition = (index: number, time: number) => {
    if (index >= 0) {
      localStorage.setItem(`${localStoragePrefix}_lastPosition`, JSON.stringify({
        index,
        time
      }));
      setHasSavedPosition(true);
    }
  };

  const getSavedPosition = (): SavedPosition | null => {
    const savedPosition = localStorage.getItem(`${localStoragePrefix}_lastPosition`);
    if (savedPosition) {
      try {
        return JSON.parse(savedPosition);
      } catch {
        return null;
      }
    }
    return null;
  };

  const clearSavedPosition = () => {
    localStorage.removeItem(`${localStoragePrefix}_lastPosition`);
    setHasSavedPosition(false);
  };

  const saveFontSize = (fontSize: number) => {
    localStorage.setItem(`${localStoragePrefix}_fontSize`, fontSize.toString());
  };

  const getSavedFontSize = (): number | null => {
    const savedFontSize = localStorage.getItem(`${localStoragePrefix}_fontSize`);
    return savedFontSize ? parseInt(savedFontSize) : null;
  };

  const savePlaybackSpeed = (speed: number) => {
    localStorage.setItem(`${localStoragePrefix}_playbackSpeed`, speed.toString());
  };

  const getSavedPlaybackSpeed = (): number | null => {
    const savedSpeed = localStorage.getItem(`${localStoragePrefix}_playbackSpeed`);
    return savedSpeed ? parseFloat(savedSpeed) : null;
  };

  return {
    hasSavedPosition,
    savePosition,
    getSavedPosition,
    clearSavedPosition,
    saveFontSize,
    getSavedFontSize,
    savePlaybackSpeed,
    getSavedPlaybackSpeed
  };
};