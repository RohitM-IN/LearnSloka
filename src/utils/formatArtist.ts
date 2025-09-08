/**
 * Formats artist(s) for display
 * @param artist - Single artist string or array of artists
 * @returns Formatted artist string
 */
export const formatArtist = (artist: string | string[]): string => {
  if (typeof artist === 'string') {
    return artist;
  }
  
  if (Array.isArray(artist)) {
    if (artist.length === 0) {
      return 'Unknown Artist';
    }
    if (artist.length === 1) {
      return artist[0];
    }
    if (artist.length === 2) {
      return `${artist[0]} & ${artist[1]}`;
    }
    // For 3 or more artists: "Artist1, Artist2 & Artist3"
    const lastArtist = artist[artist.length - 1];
    const otherArtists = artist.slice(0, -1).join(', ');
    return `${otherArtists} & ${lastArtist}`;
  }
  
  return 'Unknown Artist';
};