export interface Album {
  id: number;
  title: string;
  slug: string;
  artist: string | string[];
  description: string;
  image: string;
  tags: string[];
  songs: AlbumSong[];
}

export interface AlbumSong {
  songId: number;
  trackNumber: number;
}

export interface Song {
  id: number;
  title: string;
  slug: string;
  artist: string | string[];
  tags: string[];
  audioSrc: string;
  srtUrl: string;
  duration: string;
}