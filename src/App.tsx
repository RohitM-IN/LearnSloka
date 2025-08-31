import { IoMdArrowRoundBack } from "react-icons/io";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import { Player } from "./components/Player";
import { useState, useEffect, useCallback } from "react";
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useTheme } from './contexts/ThemeContext';

interface Song {
  id: number;
  title: string;
  slug: string;
  artist: string;
  tags: string[];
  audioSrc: string;
  srtUrl: string;
}

function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  // Inline Components for better organization
  const SongIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-accent group-hover:text-primary-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
    </svg>
  );

  const PlayIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
    </svg>
  );

  const SongItem = ({ song }: { song: Song }) => (
    <article
      onClick={() => handleSongSelect(song)}
      className="p-4 border border-divider rounded-lg cursor-pointer hover:bg-hover transition-all duration-200 flex items-center group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleSongSelect(song)}
    >
      <div className="bg-surface rounded-full w-12 h-12 flex items-center justify-center mr-4 transition-colors">
        <SongIcon />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-lg truncate text-primary-text">{song.title}</h3>
        <p className="text-subtext text-sm truncate">{song.artist}</p>
      </div>
      <div className="text-accent group-hover:text-primary-text transition-colors flex-shrink-0 ml-2">
        <PlayIcon />
      </div>
    </article>
  );

  // Get song slug from URL
  const getSongSlugFromUrl = () => {
    const path = window.location.pathname;
    const parts = path.split('/');
    return parts[parts.length - 1];
  };

  // Update URL when song changes
  const updateUrl = useCallback((song: Song | null) => {
    if (song) {
      window.history.pushState({}, '', `/song/${song.slug}`);
    } else {
      window.history.pushState({}, '', '/');
    }
  }, []);

  useEffect(() => {
    fetch('/songs.json')
      .then(response => response.json())
      .then(data => {
        setSongs(data);

        // Check if we're viewing a specific song
        const slug = getSongSlugFromUrl();
        if (slug && slug !== '') {
          const song = data.find((s: Song) => s.slug === slug);
          if (song) {
            setCurrentSong(song);
          }
        }

        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading songs:', error);
        setLoading(false);
      });
  }, []);

  const handleSongSelect = (song: Song) => {
    setCurrentSong(song);
    updateUrl(song);
  };

  const handleBackToList = useCallback(() => {
    setCurrentSong(null);
    updateUrl(null);
  }, [updateUrl]);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const slug = getSongSlugFromUrl();
      if (slug && slug !== '') {
        const song = songs.find((s: Song) => s.slug === slug);
        if (song) {
          setCurrentSong(song);
        } else {
          setCurrentSong(null);
        }
      } else {
        setCurrentSong(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [songs]);

  // Capacitor back button listener
  useEffect(() => {
    let backButtonListener: PluginListenerHandle | null = null;

    const setupListener = async () => {
      backButtonListener = await CapacitorApp.addListener('backButton', () => {
        if (currentSong) {
          handleBackToList();
        } else {
          CapacitorApp.exitApp();
        }
      });
    };

    setupListener();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [currentSong, handleBackToList]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background text-primary-text">
        <div className="text-xl">Loading songs...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-primary-text overflow-hidden">
      {/* Header */}
      <header className="bg-background py-2 px-4 shadow-lg border-b border-divider">
        <div className="container mx-auto flex justify-between items-center">
          {currentSong ? (
            // Player header
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackToList}
                  className="text-primary-text hover:text-accent hover:cursor-pointer"
                >
                  <IoMdArrowRoundBack className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <span className="text-lg md:text-2xl font-bold text-accent">{currentSong.title}</span>
              </div>
              <div className="flex items-center space-x-2 md:space-x-3">
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-subtext hover:text-accent transition-colors"
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <MdLightMode className="w-5 h-5" /> : <MdDarkMode className="w-5 h-5" />}
                </button>
                <div className="text-xs md:text-sm text-subtext bg-surface px-3 py-1 rounded-full">
                  <span className="font-semibold">Rohit Sopan Mahajan</span>
                </div>
              </div>
            </>
          ) : (
            // Song list header
            <>
              <div></div> {/* Spacer */}
              <h1 className="text-lg md:text-2xl font-bold text-accent">श्लोकपाठम्</h1>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-subtext hover:text-accent transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <MdLightMode className="w-4 h-4 md:w-5 md:h-5" /> : <MdDarkMode className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      {currentSong ? (
        // Player view
        <main className="flex-1 flex flex-col overflow-hidden" role="main">
          <article className="flex-1 flex flex-col overflow-hidden">
            <header className="sr-only">
              <h1>{currentSong.title}</h1>
              <p>Sanskrit stotra with audio synchronization</p>
            </header>
            <Player
              audioSrc={currentSong.audioSrc}
              srtUrl={currentSong.srtUrl}
              localStoragePrefix={`${currentSong.title.replace(/\s+/g, '_')}_player`}
              songTitle={currentSong.title}
            />
          </article>
        </main>
      ) : (
        // Song list view
        <main className="flex-1 overflow-y-auto p-4 pb-20">
          <div className="container mx-auto max-w-2xl">
            <h2 className="text-xl mb-6 font-bold text-accent">श्लोकसूची</h2>
            
            {songs.length === 0 ? (
              <div className="text-subtext text-center py-12 flex flex-col items-center">
                <div className="mb-4">
                  <SongIcon />
                </div>
                <p>No songs available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {songs.map((song) => (
                  <SongItem key={song.id} song={song} />
                ))}
              </div>
            )}
          </div>
        </main>
      )}

      {/* Footer - Song list only */}
      {!currentSong && (
        <footer className="fixed bottom-0 left-0 right-0 py-3 px-4 text-center border-t border-divider">
          <p className="text-xs text-subtext">
            <span className="text-[10px]">Created By</span>{" "}
            <span className="font-semibold text-xs">Rohit Sopan Mahajan</span>
          </p>
        </footer>
      )}
    </div>
  );
}

export default App;
