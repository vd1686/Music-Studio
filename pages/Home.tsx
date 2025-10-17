import React, { useContext } from 'react';
import { MusicContext } from '../context/MusicContext.ts';
import SongList from '../components/SongList.tsx';
import PageHeader from '../components/PageHeader.tsx';
import { Page, Song, Playlist } from '../types.ts';
import { PlayIcon } from '../components/Icons.tsx';

interface HomeProps {
    setCurrentPage: (page: Page) => void;
}

const getPlaylistStyle = (playlistName: string) => {
    switch (playlistName) {
        case 'Pop Hits':
            return {
                gradient: 'from-fuchsia-500 via-red-500 to-orange-400',
                icon: '🎤'
            };
        case 'Chill Vibes':
            return {
                gradient: 'from-emerald-400 via-cyan-400 to-blue-500',
                icon: '🧘'
            };
        case 'Workout Fuel':
            return {
                gradient: 'from-rose-500 via-red-500 to-orange-500',
                icon: '💪'
            };
        case '80s Throwback':
            return {
                gradient: 'from-purple-500 via-pink-500 to-red-500',
                icon: '📼'
            };
        default:
            return {
                gradient: 'from-slate-600 to-slate-800',
                icon: '🎵'
            };
    }
};

const PlaylistCard: React.FC<{ playlist: Playlist, onPlay: (id: string) => void }> = ({ playlist, onPlay }) => {
    const { gradient, icon } = getPlaylistStyle(playlist.name);

    return (
        <div className="group cursor-pointer" onClick={() => onPlay(playlist.id)}>
            <div className={`relative aspect-square w-full rounded-lg mb-2 overflow-hidden bg-gradient-to-br ${gradient} shadow-lg transition-shadow hover:shadow-xl`}>
                <div className="p-4 h-full flex flex-col justify-between">
                    <h3 className="text-white text-2xl lg:text-3xl font-bold tracking-tight shadow-black/50 [text-shadow:0_2px_4px_var(--tw-shadow-color)] break-words">{playlist.name}</h3>
                    <div className="text-5xl lg:text-6xl self-end transform transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6">
                        {icon}
                    </div>
                </div>
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <PlayIcon className="w-16 h-16 text-white" />
                </div>
            </div>
            <div>
                <p className="font-bold truncate">{playlist.name}</p>
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">{playlist.description}</p>
            </div>
        </div>
    );
};


const Home: React.FC<HomeProps> = ({ setCurrentPage }) => {
  const musicContext = useContext(MusicContext);

  if (!musicContext) return <div>Loading...</div>;

  const { history, playCount, allSongs, playSong, playlists, playPlaylist } = musicContext;

  const mostPlayedSongs = Object.entries(playCount)
    .sort(([, a], [, b]) => Number(b) - Number(a))
    .slice(0, 5)
    .map(([songId]) => allSongs.find(s => s.id === songId))
    .filter((s): s is Song => !!s);

  const featuredPlaylists = playlists.filter(p => p.id.startsWith('default-'));
    
  return (
    <div>
      <PageHeader title="Welcome to Music Studio" subtitle="Your personal music universe." />
      
      {featuredPlaylists.length > 0 && (
        <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Featured Playlists</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {featuredPlaylists.map(p => <PlaylistCard key={p.id} playlist={p} onPlay={playPlaylist} />)}
            </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Recently Played</h2>
        {history.length > 0 ? (
          <SongList songs={history.slice(0, 10)} onPlay={playSong} showTrackNumber={false}/>
        ) : (
          <p className="text-light-text-secondary dark:text-dark-text-secondary">
            You haven't played any songs yet. Go to the <button onClick={() => setCurrentPage(Page.Search)} className="text-accent hover:underline">Search</button> page to find some music!
          </p>
        )}
      </div>

       {mostPlayedSongs.length > 0 && (
         <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4">Most Played</h2>
            <SongList songs={mostPlayedSongs} onPlay={playSong} showTrackNumber={false}/>
        </div>
       )}
    </div>
  );
};

export default Home;