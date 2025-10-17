import { createContext } from 'react';
import { Song, Playlist } from '../types.ts';

export interface MusicContextType {
    isPlaying: boolean;
    currentSong: Song | null;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    history: Song[];
    library: Song[];
    allSongs: Song[];
    playlists: Playlist[];
    playCount: { [key: string]: number };
    favorites: string[];
    queue: Song[];
    listeningTime: number;
    isInitializing: boolean;

    playSong: (song: Song, songList?: Song[]) => void;
    togglePlay: () => void;
    playNext: () => void;
    playPrev: () => void;
    seek: (time: number) => void;
    setVolume: (volume: number) => void;
    toggleMute: () => void;
    
    createPlaylist: (name: string, description: string) => void;
    deletePlaylist: (playlistId: string) => void;
    addSongToPlaylist: (playlistId: string, song: Song) => void;
    removeSongFromPlaylist: (playlistId: string, songId: string) => void;
    getSongsFromPlaylist: (playlistId: string) => Song[];
    playPlaylist: (playlistId: string) => void;
    
    handleLocalFiles: (files: FileList) => void;

    reorderQueue: (newQueue: Song[]) => void;
    removeFromQueue: (songId: string) => void;
    clearQueue: () => void;
}

export const MusicContext = createContext<MusicContextType | null>(null);
