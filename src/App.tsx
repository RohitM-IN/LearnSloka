import { IoMdArrowRoundBack } from "react-icons/io";
import { MdLightMode, MdDarkMode } from "react-icons/md";
import { Player } from "./components/Player";
import { HomePage } from "./components/HomePage";
import { AlbumPage } from "./components/AlbumPage";
import { useState, useEffect, useCallback } from "react";
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useTheme } from './contexts/ThemeContext';
import type { Album, Song } from './@types/album';

type ViewMode = 'home' | 'album' | 'player';

interface ViewState {
  mode: ViewMode;
  currentSong?: Song;
  currentAlbum?: Album;
  autoPlay?: boolean;
  albumPlaylist?: {
    albumId: number;
    currentTrackNumber: number;
    totalTracks: number;
  };
}

function App() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [viewState, setViewState] = useState<ViewState>({ mode: 'home' });
  const [loading, setLoading] = useState(true);
  const { theme, toggleTheme } = useTheme();

  // Navigation helpers
  const navigateToHome = useCallback(() => {
    setViewState({ mode: 'home' });
    window.history.pushState({}, '', '/');
  }, []);

  const navigateToAlbum = useCallback((album: Album) => {
    setViewState({ mode: 'album', currentAlbum: album });
    window.history.pushState({}, '', `/album/${album.slug}`);
  }, []);

  const navigateToPlayer = useCallback((song: Song, autoPlay: boolean = false) => {
    setViewState({ mode: 'player', currentSong: song, autoPlay });
    window.history.pushState({}, '', `/song/${song.slug}`);
  }, []);

  // Auto-play handlers
  const navigateToPlayerNormal = useCallback((song: Song) => {
    navigateToPlayer(song, false);
  }, [navigateToPlayer]);

  // Album-aware navigation
  const navigateToPlayerFromAlbum = useCallback((song: Song, trackNumber: number, autoPlay: boolean = true) => {
    const albumId = viewState.currentAlbum?.id;
    const totalTracks = viewState.currentAlbum?.songs.length || 1;
    
    if (albumId) {
      setViewState({ 
        mode: 'player', 
        currentSong: song, 
        currentAlbum: viewState.currentAlbum,
        autoPlay,
        albumPlaylist: {
          albumId,
          currentTrackNumber: trackNumber,
          totalTracks
        }
      });
    } else {
      // Fallback if no album context
      setViewState({ mode: 'player', currentSong: song, autoPlay });
    }
    window.history.pushState({}, '', `/song/${song.slug}`);
  }, [viewState.currentAlbum]);

  const navigateToPlayerFromAlbumWithAutoPlay = useCallback((song: Song, trackNumber: number) => {
    navigateToPlayerFromAlbum(song, trackNumber, true);
  }, [navigateToPlayerFromAlbum]);

  const navigateToNextSongInAlbum = useCallback(() => {
    if (!viewState.albumPlaylist || !viewState.currentAlbum) return;
    
    const { currentTrackNumber, totalTracks } = viewState.albumPlaylist;
    if (currentTrackNumber >= totalTracks) return; // Already on last track
    
    const nextTrackNumber = currentTrackNumber + 1;
    const nextAlbumSong = viewState.currentAlbum.songs.find(s => s.trackNumber === nextTrackNumber);
    if (!nextAlbumSong) return;
    
    const nextSong = songs.find(s => s.id === nextAlbumSong.songId);
    if (!nextSong) return;
    
    navigateToPlayerFromAlbum(nextSong, nextTrackNumber, true);
  }, [viewState.albumPlaylist, viewState.currentAlbum, songs, navigateToPlayerFromAlbum]);

  const navigateToPreviousSongInAlbum = useCallback(() => {
    if (!viewState.albumPlaylist || !viewState.currentAlbum) return;
    
    const { currentTrackNumber } = viewState.albumPlaylist;
    if (currentTrackNumber <= 1) return; // Already on first track
    
    const prevTrackNumber = currentTrackNumber - 1;
    const prevAlbumSong = viewState.currentAlbum.songs.find(s => s.trackNumber === prevTrackNumber);
    if (!prevAlbumSong) return;
    
    const prevSong = songs.find(s => s.id === prevAlbumSong.songId);
    if (!prevSong) return;
    
    navigateToPlayerFromAlbum(prevSong, prevTrackNumber, true);
  }, [viewState.albumPlaylist, viewState.currentAlbum, songs, navigateToPlayerFromAlbum]);

  // Smart back navigation
  const handleBackNavigation = useCallback(() => {
    if (viewState.mode === 'player') {
      // If player is from album context, go back to album page
      if (viewState.albumPlaylist && viewState.currentAlbum) {
        navigateToAlbum(viewState.currentAlbum);
      } else {
        // Otherwise go to home
        navigateToHome();
      }
    } else if (viewState.mode === 'album') {
      // From album page, always go to home
      navigateToHome();
    } else {
      // From home or any other state, go to home
      navigateToHome();
    }
  }, [viewState.mode, viewState.albumPlaylist, viewState.currentAlbum, navigateToAlbum, navigateToHome]);

  // Get song or album slug from URL
  const getSlugFromUrl = () => {
    const path = window.location.pathname;
    const parts = path.split('/');
    return {
      type: parts[1] || '', // 'song', 'album', or ''
      slug: parts[2] || parts[1] || ''
    };
  };

  // Load data
  useEffect(() => {
    Promise.all([
      fetch('/songs.json').then(response => response.json()),
      fetch('/albums.json').then(response => response.json())
    ])
      .then(([songsData, albumsData]) => {
        setSongs(songsData);
        setAlbums(albumsData);

        // Check if we're viewing a specific page
        const { type, slug } = getSlugFromUrl();
        
        if (type === 'song' && slug) {
          const song = songsData.find((s: Song) => s.slug === slug);
          if (song) {
            setViewState({ mode: 'player', currentSong: song, autoPlay: false });
          }
        } else if (type === 'album' && slug) {
          const album = albumsData.find((a: Album) => a.slug === slug);
          if (album) {
            setViewState({ mode: 'album', currentAlbum: album });
          }
        }

        setLoading(false);
      })
      .catch(error => {
        console.error('Error loading data:', error);
        setLoading(false);
      });
  }, []);

  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const { type, slug } = getSlugFromUrl();
      
      if (type === 'song' && slug) {
        const song = songs.find((s: Song) => s.slug === slug);
        if (song) {
          setViewState({ mode: 'player', currentSong: song, autoPlay: false });
        } else {
          setViewState({ mode: 'home' });
        }
      } else if (type === 'album' && slug) {
        const album = albums.find((a: Album) => a.slug === slug);
        if (album) {
          setViewState({ mode: 'album', currentAlbum: album });
        } else {
          setViewState({ mode: 'home' });
        }
      } else {
        setViewState({ mode: 'home' });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [songs, albums]);

  // Capacitor back button listener
  useEffect(() => {
    let backButtonListener: PluginListenerHandle | null = null;

    const setupListener = async () => {
      backButtonListener = await CapacitorApp.addListener('backButton', () => {
        if (viewState.mode === 'home') {
          CapacitorApp.exitApp();
        } else {
          handleBackNavigation();
        }
      });
    };

    setupListener();

    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
    };
  }, [viewState.mode, navigateToHome]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-background text-primary-text">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-primary-text overflow-hidden">
      {/* Header */}
      <header className="bg-background py-2 px-4 shadow-lg border-b border-divider">
        <div className="container mx-auto flex justify-between items-center">
          {viewState.mode !== 'home' ? (
            // Player/Album header
            <>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackNavigation}
                  className="text-primary-text hover:text-accent hover:cursor-pointer"
                >
                  <IoMdArrowRoundBack className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <span className="text-lg md:text-2xl font-bold text-accent">
                  {viewState.mode === 'player' && viewState.currentSong?.title}
                  {viewState.mode === 'album' && viewState.currentAlbum?.title}
                </span>
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
            // Home header
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
      <main className="flex-1 flex flex-col overflow-hidden" role="main">
        {viewState.mode === 'player' && viewState.currentSong && (
          <article className="flex-1 flex flex-col overflow-hidden">
            <header className="sr-only">
              <h1>{viewState.currentSong.title}</h1>
              <p>Sanskrit stotra with audio synchronization</p>
            </header>
            <Player
              audioSrc={viewState.currentSong.audioSrc}
              srtUrl={viewState.currentSong.srtUrl}
              localStoragePrefix={`${viewState.currentSong.title.replace(/\s+/g, '_')}_player`}
              songTitle={viewState.currentSong.title}
              autoPlay={viewState.autoPlay}
              albumContext={viewState.albumPlaylist ? {
                albumId: viewState.albumPlaylist.albumId,
                currentTrackNumber: viewState.albumPlaylist.currentTrackNumber,
                totalTracks: viewState.albumPlaylist.totalTracks,
                onNextSong: navigateToNextSongInAlbum,
                onPreviousSong: navigateToPreviousSongInAlbum
              } : undefined}
              artist={Array.isArray(viewState.currentSong.artist) ? viewState.currentSong.artist.join(', ') : viewState.currentSong.artist}
            />
          </article>
        )}

        {viewState.mode === 'album' && viewState.currentAlbum && (
          <AlbumPage
            album={viewState.currentAlbum}
            songs={songs}
            onSongSelect={navigateToPlayerFromAlbum}
            onBack={navigateToHome}
            onPlayAlbum={navigateToPlayerFromAlbumWithAutoPlay}
          />
        )}

        {viewState.mode === 'home' && (
          <HomePage
            albums={albums}
            songs={songs}
            onAlbumSelect={navigateToAlbum}
            onSongSelect={navigateToPlayerNormal}
          />
        )}
      </main>

      {/* Footer - Home only */}
      {viewState.mode === 'home' && (
        <footer className="fixed bottom-0 left-0 right-0 py-3 px-4 text-center border-t border-divider bg-background">
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
