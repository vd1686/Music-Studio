import React, { useContext, useState } from 'react';
import { Song, Playlist } from '../types.ts';
import { MusicContext } from '../context/MusicContext.ts';
import { PlaylistIcon, PlayIcon } from './Icons.tsx';

interface SongListProps {
  songs: Song[];
  onPlay?: (song: Song, songList: Song[]) => void;
  showTrackNumber?: boolean;
}

const SongList: React.FC<SongListProps> = ({ songs, onPlay, showTrackNumber = true }) => {
    const musicContext = useContext(MusicContext);
    const [playlistMenu, setPlaylistMenu] = useState<{ song: Song; x: number; y: number } | null>(null);

    if (!musicContext) return null;

    const { playlists, addSongToPlaylist, playSong } = musicContext;

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handlePlay = (song: Song) => {
        if (onPlay) {
            onPlay(song, songs);
        } else {
            playSong(song, songs);
        }
    };

    const handlePlaylistMenu = (e: React.MouseEvent, song: Song) => {
        e.stopPropagation();
        setPlaylistMenu({ song, x: e.clientX, y: e.clientY });
    };

    const handleAddToPlaylist = (playlistId: string) => {
        if (playlistMenu) {
            addSongToPlaylist(playlistId, playlistMenu.song);
            setPlaylistMenu(null);
        }
    };

    return (
        <div className="space-y-2 text-light-text-primary dark:text-dark-text-primary">
            {songs.map((song, index) => (
                <div
                    key={song.id}
                    className="group grid grid-cols-[auto_1fr_auto] md:grid-cols-[auto_4fr_2fr_2fr_auto] items-center gap-4 p-2 rounded-lg hover:bg-light-bg-tertiary/80 dark:hover:bg-dark-bg-tertiary/80"
                >
                    <div className="flex items-center space-x-4">
                        {showTrackNumber && <span className="w-6 text-center text-light-text-secondary dark:text-dark-text-secondary">{index + 1}</span>}
                        <div className="relative w-12 h-12 flex-shrink-0">
                            <img src={song.artworkUrl} alt={song.title} className="w-12 h-12 rounded-md object-cover" />
                            <button
                                onClick={() => handlePlay(song)}
                                className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <PlayIcon className="w-6 h-6 text-white" />
                            </button>
                        </div>
                    </div>

                    <div>
                        <p className="font-semibold truncate">{song.title}</p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">{song.artist}</p>
                    </div>

                    <p className="hidden md:block text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">{song.album}</p>
                    <p className="hidden md:block text-sm text-light-text-secondary dark:text-dark-text-secondary">{formatDuration(song.duration)}</p>

                    <div className="flex items-center space-x-2">
                         <button
                            onClick={(e) => handlePlaylistMenu(e, song)}
                            className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-white/10"
                        >
                            <PlaylistIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            ))}
            {playlistMenu && (
                <div 
                    className="fixed z-50 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-lg shadow-lg p-2"
                    style={{ top: playlistMenu.y, left: playlistMenu.x }}
                    onMouseLeave={() => setPlaylistMenu(null)}
                >
                    <p className="text-xs font-bold px-2 py-1">Add to playlist</p>
                    {playlists.filter(p => !p.id.startsWith('default-')).length > 0 ? playlists.filter(p => !p.id.startsWith('default-')).map((p: Playlist) => (
                        <button key={p.id} onClick={() => handleAddToPlaylist(p.id)} className="block w-full text-left px-2 py-1 text-sm rounded hover:bg-accent/20">
                            {p.name}
                        </button>
                    )) : <p className="px-2 py-1 text-sm text-light-text-secondary dark:text-dark-text-secondary">No playlists yet.</p>}
                </div>
            )}
        </div>
    );
};

export default SongList;