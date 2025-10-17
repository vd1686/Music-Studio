import React, { useContext, useMemo } from 'react';
import { MusicContext } from '../context/MusicContext.ts';
import PageHeader from '../components/PageHeader.tsx';
import { Song } from '../types.ts';

const StatCard: React.FC<{ title: string; value: string | number; }> = ({ title, value }) => (
    <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary p-6 rounded-xl shadow-lg">
        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-2">{title}</p>
        <p className="text-3xl font-bold text-accent">{value}</p>
    </div>
);

const Statistics: React.FC = () => {
    const musicContext = useContext(MusicContext);
    
    const stats = useMemo(() => {
        if (!musicContext) return null;
        const { library, playCount, listeningTime, allSongs } = musicContext;
        
        const totalPlays = Object.values(playCount).reduce((sum: number, count) => sum + Number(count), 0);
        
        const topArtist = Object.entries(
            // Fix: Explicitly type accumulator 'acc' to ensure correct type inference within reduce.
            allSongs.reduce((acc: Record<string, number>, song) => {
                const count = playCount[song.id] || 0;
                acc[song.artist] = (acc[song.artist] || 0) + count;
                return acc;
            }, {} as Record<string, number>)
        // Fix: Cast values to Number to prevent type errors during subtraction.
        ).sort(([, a], [, b]) => Number(b) - Number(a))[0];

        const mostPlayedSongs = Object.entries(playCount)
            // Fix: Cast values to Number to prevent type errors during subtraction.
            .sort(([, a], [, b]) => Number(b) - Number(a))
            .slice(0, 5)
            .map(([songId]) => allSongs.find(s => s.id === songId))
            .filter(Boolean);

        return {
            totalSongs: allSongs.length,
            totalArtists: new Set(allSongs.map(s => s.artist)).size,
            totalAlbums: new Set(allSongs.map(s => s.album)).size,
            // Fix: Explicitly type accumulator 'sum' to ensure correct type inference.
            totalDuration: (allSongs.reduce((sum: number, s) => sum + s.duration, 0) / 3600).toFixed(1),
            totalPlays,
            // Fix: Cast listeningTime to Number to prevent type errors.
            listeningTimeHours: (Number(listeningTime) / 3600).toFixed(1),
            topArtistName: topArtist ? topArtist[0] : 'N/A',
            topArtistPlays: topArtist ? topArtist[1] : 0,
            mostPlayedSongs
        };
    }, [musicContext]);

    if (!musicContext || !stats) return <div>Loading...</div>;

    const { playSong } = musicContext;

    return (
        <div>
            <PageHeader title="Statistics" subtitle="A look into your listening habits." />
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Total Plays" value={stats.totalPlays} />
                <StatCard title="Listening Time (Hours)" value={stats.listeningTimeHours} />
                <StatCard title="Total Songs" value={stats.totalSongs} />
                <StatCard title="Unique Artists" value={stats.totalArtists} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary p-6 rounded-xl">
                    <h3 className="text-xl font-bold mb-4">Top Artist</h3>
                    <p className="text-4xl font-extrabold text-accent">{stats.topArtistName}</p>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary">{stats.topArtistPlays} plays</p>
                </div>
                <div className="bg-light-bg-secondary dark:bg-dark-bg-secondary p-6 rounded-xl">
                     <h3 className="text-xl font-bold mb-4">Most Played Songs</h3>
                     <div className="space-y-2">
                         {(stats.mostPlayedSongs as Song[]).map(song => (
                             <div key={song.id} onClick={() => playSong(song)} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary cursor-pointer">
                                 <img src={song.artworkUrl} alt={song.title} className="w-10 h-10 rounded-md" />
                                 <div>
                                     <p className="font-semibold">{song.title}</p>
                                     <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{song.artist}</p>
                                 </div>
                                 <p className="ml-auto font-bold text-accent">{musicContext.playCount[song.id]} plays</p>
                             </div>
                         ))}
                     </div>
                </div>
            </div>
        </div>
    );
};

export default Statistics;