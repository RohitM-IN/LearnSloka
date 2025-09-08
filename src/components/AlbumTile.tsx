import React from 'react';
import type { Album } from '../@types/album';
import { formatArtist } from '../utils/formatArtist';

interface AlbumTileProps {
  album: Album;
  onClick: (album: Album) => void;
}

export const AlbumTile: React.FC<AlbumTileProps> = ({ album, onClick }) => {
  return (
    <div
      onClick={() => onClick(album)}
      className="bg-surface hover:bg-hover rounded-lg p-4 cursor-pointer transition-all duration-200 group"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick(album)}
    >
      {/* Album Cover */}
      <div className="aspect-square mb-4 relative overflow-hidden rounded-lg bg-base">
        <img
          src={album.image}
          alt={`${album.title} album cover`}
          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105 relative z-10"
          onError={(e) => {
            // Fallback for missing images
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
            if (fallback) {
              fallback.style.display = 'flex';
            }
          }}
          onLoad={(e) => {
            // Hide fallback when image loads successfully
            const target = e.target as HTMLImageElement;
            const fallback = target.parentElement?.querySelector('.fallback-icon') as HTMLElement;
            if (fallback) {
              fallback.style.display = 'none';
            }
          }}
        />
        {/* Fallback icon when image fails to load */}
        <div className="fallback-icon absolute inset-0 flex items-center justify-center bg-base" style={{ display: 'none' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-subtext" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        </div>
        
        {/* Play button overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="bg-accent text-background rounded-full p-3 opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Album Info */}
      <div className="space-y-1">
        <h3 className="font-semibold text-primary-text truncate group-hover:text-accent transition-colors">
          {album.title}
        </h3>
        <p className="text-sm text-subtext truncate">
          {formatArtist(album.artist)}
        </p>
        <p className="text-xs text-subtext truncate">
          {album.songs.length} {album.songs.length === 1 ? 'song' : 'songs'}
        </p>
      </div>
    </div>
  );
};