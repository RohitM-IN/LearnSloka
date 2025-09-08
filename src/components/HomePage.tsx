import React from 'react';
import type { Album, Song } from '../@types/album';
import { AlbumTile } from './AlbumTile';
import { formatArtist } from '../utils/formatArtist';

interface HomePageProps {
  albums: Album[];
  songs: Song[];
  onAlbumSelect: (album: Album) => void;
  onSongSelect: (song: Song) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ 
  albums, 
  songs, 
  onAlbumSelect, 
  onSongSelect 
}) => {
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
      onClick={() => onSongSelect(song)}
      className="p-4 border border-divider rounded-lg cursor-pointer hover:bg-hover transition-all duration-200 flex items-center group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onSongSelect(song)}
    >
      <div className="bg-surface rounded-full w-12 h-12 flex items-center justify-center mr-4 transition-colors">
        <SongIcon />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-lg truncate text-primary-text">{song.title}</h3>
        <p className="text-subtext text-sm truncate">{formatArtist(song.artist)}</p>
      </div>
      <div className="text-accent group-hover:text-primary-text transition-colors flex-shrink-0 ml-2">
        <PlayIcon />
      </div>
    </article>
  );

  return (
    <div className="flex-1 overflow-y-auto p-4 pb-20">
      <div className="container mx-auto max-w-6xl">
        {/* Albums Section */}
        {albums.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-accent mb-6">Albums</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
              {albums.map((album) => (
                <AlbumTile
                  key={album.id}
                  album={album}
                  onClick={onAlbumSelect}
                />
              ))}
            </div>
          </section>
        )}

        {/* Songs Section */}
        <section>
          <h2 className="text-xl mb-6 font-bold text-accent">श्लोकसूची</h2>
          
          {songs.length === 0 ? (
            <div className="text-subtext text-center py-12 flex flex-col items-center">
              <div className="mb-4">
                <SongIcon />
              </div>
              <p>No songs available</p>
            </div>
          ) : (
            <div className="space-y-3 max-w-2xl">
              {songs.map((song) => (
                <SongItem key={song.id} song={song} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};