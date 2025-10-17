export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  artworkUrl: string;
  audioUrl: string;
  duration: number; // in seconds
  isLocal?: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  songIds: string[];
}

export enum Theme {
  Light = 'light',
  Dark = 'dark'
}

export enum Page {
  Home = 'Home',
  Search = 'Search',
  Library = 'Library',
  Playlists = 'Playlists',
  History = 'History',
  CreatorStudio = 'CreatorStudio',
}

export interface MashupEffects {
  volume: number;
  speed: number;
  fadeIn: boolean;
  fadeOut: boolean;
  reverb: boolean;
  slowedReverb: boolean;
  pan: number; // -1 to 1
  pitch: number; // in cents
  lowPassFreq: number | null;
  highPassFreq: number | null;
}

export interface MashupTrack {
  id: string; // unique id for the instance in the mashup
  song: Song;
  effects: MashupEffects;
}

export interface User {
  email: string;
}