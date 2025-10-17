import { Song } from '../types.ts';

export const searchSongs = async (term: string): Promise<Song[]> => {
  if (!term) return [];
  try {
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&media=music&entity=song&limit=50`;
    
    const response = await fetch(itunesUrl);

    if (!response.ok) {
        throw new Error(`Network response was not ok. Status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.results) {
        return data.results.map((item: any): Song => ({
          id: item.trackId.toString(),
          title: item.trackName,
          artist: item.artistName,
          album: item.collectionName,
          artworkUrl: item.artworkUrl100.replace('100x100', '600x600'),
          audioUrl: item.previewUrl,
          duration: item.trackTimeMillis / 1000,
        }));
    }
    
    return [];
  } catch (error) {
    console.error("Failed to fetch songs from iTunes:", error);
    return [];
  }
};