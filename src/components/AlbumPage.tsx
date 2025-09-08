import React from 'react';
import type { Album, Song } from '../@types/album';
import { formatArtist } from '../utils/formatArtist';

interface AlbumPageProps {
  album: Album;
  songs: Song[];
  onSongSelect: (song: Song, trackNumber: number) => void;
  onBack: () => void;
  onPlayAlbum: (song: Song, trackNumber: number) => void;
}

export const AlbumPage: React.FC<AlbumPageProps> = ({ 
  album, 
  songs, 
  onSongSelect, 
  onBack: _onBack,
  onPlayAlbum 
}) => {
  // Get ordered songs for this album
  const albumSongs = album.songs
    .map(albumSong => {
      const song = songs.find(s => s.id === albumSong.songId);
      return song ? { ...song, trackNumber: albumSong.trackNumber } : null;
    })
    .filter((song): song is Song & { trackNumber: number } => song !== null)
    .sort((a, b) => a.trackNumber - b.trackNumber);

  const formatDuration = (song: Song) => {
    return song.duration;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Album Header */}
      <div className="bg-gradient-to-b from-surface to-background p-6 md:p-8">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
            {/* Album Cover */}
            <div className="w-48 h-48 md:w-60 md:h-60 flex-shrink-0">
              <img
                src={album.image}
                alt={`${album.title} album cover`}
                className="w-full h-full object-cover rounded-lg shadow-2xl"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (fallback) {
                    fallback.style.display = 'flex';
                  }
                }}
              />
              <div className="w-full h-full items-center justify-center bg-base rounded-lg shadow-2xl" style={{ display: 'none' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 text-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            </div>

            {/* Album Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-subtext mb-2">Album</p>
              <h1 className="text-3xl md:text-5xl font-bold text-primary-text mb-4 leading-tight">
                {album.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-subtext mb-4">
                <span className="font-medium text-primary-text">{formatArtist(album.artist)}</span>
                <span>•</span>
                <span>{albumSongs.length} {albumSongs.length === 1 ? 'song' : 'songs'}</span>
              </div>
              {album.description && (
                <p className="text-subtext text-sm md:text-base mb-4 max-w-2xl">
                  {album.description}
                </p>
              )}
              
              {/* Play Button */}
              <button
                onClick={() => albumSongs.length > 0 && onPlayAlbum(albumSongs[0], 1)}
                className="bg-accent hover:bg-accent/90 text-background font-semibold py-3 px-8 rounded-full transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                disabled={albumSongs.length === 0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Play
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Songs List */}
      <div className="container mx-auto max-w-6xl px-6 md:px-8 pb-8">
        <div className="bg-surface/50 rounded-lg overflow-hidden">
          {/* List Header */}
          <div className="grid grid-cols-12 gap-4 px-4 py-3 text-xs font-medium text-subtext border-b border-divider">
            <div className="col-span-1">#</div>
            <div className="col-span-8 md:col-span-6">Title</div>
            <div className="hidden md:block md:col-span-3">Artist</div>
            <div className="col-span-3 md:col-span-2 text-right">Duration</div>
          </div>

          {/* Songs */}
          <div className="divide-y divide-divider">
            {albumSongs.map((song) => (
              <div
                key={song.id}
                onClick={() => onSongSelect(song, song.trackNumber)}
                className="grid grid-cols-12 gap-4 px-4 py-3 hover:bg-hover cursor-pointer group transition-colors"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && onSongSelect(song, song.trackNumber)}
              >
                {/* Track Number */}
                <div className="col-span-1 flex items-center">
                  <span className="text-subtext text-sm group-hover:hidden">
                    {song.trackNumber}
                  </span>
                  <div className="hidden group-hover:block text-primary-text">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>

                {/* Song Title */}
                <div className="col-span-8 md:col-span-6 flex items-center min-w-0">
                  <div className="min-w-0">
                    <p className="font-medium text-primary-text group-hover:text-accent truncate">
                      {song.title}
                    </p>
                  </div>
                </div>

                {/* Artist (hidden on mobile) */}
                <div className="hidden md:flex md:col-span-3 items-center">
                  <p className="text-subtext text-sm truncate">
                    {formatArtist(song.artist)}
                  </p>
                </div>

                {/* Duration */}
                <div className="col-span-3 md:col-span-2 flex items-center justify-end">
                  <span className="text-subtext text-sm">
                    {formatDuration(song)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {albumSongs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-subtext">No songs found in this album.</p>
          </div>
        )}
      </div>
    </div>
  );
};