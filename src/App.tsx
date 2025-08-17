import { IoMdArrowRoundBack } from "react-icons/io";
import { Player } from "./components/Player";
import { useState, useEffect, useCallback } from "react";
import { App as CapacitorApp } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';

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
      <div className="flex justify-center items-center h-screen bg-spotify-black text-white">
        <div className="text-xl">Loading songs...</div>
      </div>
    );
  }

  if (currentSong) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        <div className="bg-spotify-gray py-2 px-4 shadow-lg">
          <div className="container mx-auto">
            {/* Mobile Header */}
            <div className="md:hidden">
              <div className="flex justify-center items-center">
                <span className="text-lg font-bold text-green-500">श्लोकपाठम्</span>
              </div>
            </div>
            <div className="md:hidden">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between items-center relative">
                  <div className="flex items-center">
                    <button
                      onClick={handleBackToList}
                      className="hover:text-green-400 mr-2"
                    >
                      <IoMdArrowRoundBack />
                    </button>
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-green-500">{currentSong?.title}</span>
                      </div>

                  </div>
                  <div className="text-xs text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                    <span className="font-semibold">Rohit Sopan Mahajan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Desktop Header */}
            <div className="hidden md:flex justify-between items-center">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackToList}
                  className="hover:cursor-pointer"
                >
                  <IoMdArrowRoundBack className="hover:text-green-400" />
                </button>
                <span className="text-2xl font-bold text-green-500">{currentSong?.title}</span>

              </div>
              <span className="text-lg font-bold text-green-500">श्लोकपाठम्</span>
              <div className="text-sm text-gray-400 bg-gray-800 px-3 py-1 rounded-full">
                <span className="font-semibold">Rohit Sopan Mahajan</span>
              </div>
            </div>
          </div>
        </div>
        <Player
          audioSrc={currentSong.audioSrc}
          srtUrl={currentSong.srtUrl}
          localStoragePrefix={`${currentSong.title.replace(/\s+/g, '_')}_player`}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-spotify-black text-white">
      {/* Header */}
      <div className="bg-spotify-gray py-2 px-4 shadow-lg">
        <div className="container mx-auto">
          {/* Mobile Header */}
          <div className="md:hidden">
            <div className="flex justify-center">
              <span className="text-lg font-bold text-green-500">श्लोकपाठम्</span>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden md:flex justify-center items-center">
            <div></div> {/* Empty div for spacing */}
            <h1 className="text-2xl font-bold text-green-500">श्लोकपाठम्</h1>
          </div>
        </div>
      </div>

      {/* Song List */}
      <div className="flex-1 overflow-y-auto p-4 pb-12">
        <div className="container mx-auto">
          <h2 className="text-xl mb-4 font-bold text-green-500">श्लोकसूची</h2>
          {songs.length === 0 ? (
            <div className="text-gray-400 text-center py-8">No songs available</div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {songs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => handleSongSelect(song)}
                  className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition-all duration-200 flex items-center"
                >
                  <div className="bg-gray-600 rounded-full w-12 h-12 flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-lg">{song.title}</div>
                    <div className="text-gray-400 text-sm">{song.artist}</div>
                  </div>
                  <div className="text-gray-500">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-spotify-gray py-2 px-4 text-center">
        <p className="text-xs text-gray-400">
          <span className="text-[10px]">Created By</span>{" "}
          <span className="font-semibold text-xs">Rohit Sopan Mahajan</span>
        </p>
      </div>
    </div>
  );
}

export default App;
