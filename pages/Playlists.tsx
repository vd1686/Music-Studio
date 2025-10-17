import React, { useContext, useState, useMemo } from 'react';
import { MusicContext } from '../context/MusicContext.ts';
import PageHeader from '../components/PageHeader.tsx';
import { Playlist } from '../types.ts';
import SongList from '../components/SongList.tsx';
import { PlusIcon, PlaylistIcon, PlayIcon } from '../components/Icons.tsx';

const Playlists: React.FC = () => {
    const musicContext = useContext(MusicContext);
    const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newPlaylistName, setNewPlaylistName] = useState('');
    const [newPlaylistDesc, setNewPlaylistDesc] = useState('');

    if (!musicContext) return <div>Loading...</div>;

    const { playlists, createPlaylist, deletePlaylist, getSongsFromPlaylist } = musicContext;

    const userPlaylists = playlists.filter(p => !p.id.startsWith('default-'));

    const handleCreatePlaylist = () => {
        if (newPlaylistName.trim()) {
            createPlaylist(newPlaylistName, newPlaylistDesc);
            setNewPlaylistName('');
            setNewPlaylistDesc('');
            setIsCreating(false);
        }
    };
    
    const songsInPlaylist = useMemo(() => {
        return selectedPlaylist ? getSongsFromPlaylist(selectedPlaylist.id) : [];
    }, [selectedPlaylist, getSongsFromPlaylist]);

    if (selectedPlaylist) {
        return (
            <div>
                <button onClick={() => setSelectedPlaylist(null)} className="mb-4 text-accent hover:underline">
                    &larr; Back to all playlists
                </button>
                <PageHeader title={selectedPlaylist.name} subtitle={selectedPlaylist.description || `${songsInPlaylist.length} songs`} />
                <SongList songs={songsInPlaylist} />
                 {songsInPlaylist.length === 0 && <p className="text-light-text-secondary dark:text-dark-text-secondary mt-4">This playlist is empty. Add songs from Search or your Library.</p>}
            </div>
        );
    }

    return (
        <div>
            <PageHeader title="Playlists" subtitle="Your curated collections of music." />
            
            <div className="mb-8">
                {isCreating ? (
                    <div className="p-4 rounded-lg bg-light-bg-secondary dark:bg-dark-bg-secondary space-y-4">
                        <input type="text" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} placeholder="Playlist Name" className="w-full p-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded"/>
                        <input type="text" value={newPlaylistDesc} onChange={(e) => setNewPlaylistDesc(e.target.value)} placeholder="Description (optional)" className="w-full p-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded"/>
                        <div className="flex space-x-2">
                            <button onClick={handleCreatePlaylist} className="px-4 py-2 bg-accent text-white rounded">Create</button>
                            <button onClick={() => setIsCreating(false)} className="px-4 py-2 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <button onClick={() => setIsCreating(true)} className="flex items-center px-4 py-2 bg-accent text-white rounded-lg hover:bg-opacity-80 transition">
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Create Playlist
                    </button>
                )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
                {userPlaylists.map(playlist => (
                    <div key={playlist.id} onClick={() => setSelectedPlaylist(playlist)} className="cursor-pointer group">
                        <div className="aspect-square bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-lg flex items-center justify-center relative overflow-hidden">
                           <PlaylistIcon className="w-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <PlayIcon className="w-16 h-16 text-white"/>
                            </div>
                        </div>
                        <p className="font-semibold mt-2 truncate">{playlist.name}</p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{playlist.songIds.length} songs</p>
                    </div>
                ))}
            </div>
            {userPlaylists.length === 0 && !isCreating && (
                <p className="text-light-text-secondary dark:text-dark-text-secondary mt-8 text-center">
                    You haven't created any playlists yet. Click "Create Playlist" to get started!
                </p>
            )}
        </div>
    );
};

export default Playlists;