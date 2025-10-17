
import React, { useContext, useEffect, useRef } from 'react';
import { MusicContext } from '../context/MusicContext.ts';
import PageHeader from '../components/PageHeader.tsx';
import { Song } from '../types.ts';

declare const Sortable: any;

const Queue: React.FC = () => {
    const musicContext = useContext(MusicContext);
    const listRef = useRef<HTMLDivElement>(null);
    const sortableRef = useRef<any>(null);

    useEffect(() => {
        if (listRef.current && musicContext) {
            sortableRef.current = new Sortable(listRef.current, {
                animation: 150,
                onEnd: (evt: any) => {
                    const newQueue = [...musicContext.queue];
                    const [removed] = newQueue.splice(evt.oldIndex, 1);
                    newQueue.splice(evt.newIndex, 0, removed);
                    musicContext.reorderQueue(newQueue);
                },
            });
        }
        return () => {
            sortableRef.current?.destroy();
        };
    }, [musicContext]);
    
    if (!musicContext) return <div>Loading...</div>;
    const { queue, currentSong, removeFromQueue, clearQueue, playSong } = musicContext;

    const formatDuration = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div>
            <PageHeader title="Queue" subtitle="What's playing next." />
            
            <button onClick={clearQueue} className="mb-4 px-4 py-2 bg-accent/20 text-accent rounded-lg">Clear Queue</button>
            
            <div ref={listRef} className="space-y-2">
                {queue.map((song) => (
                    <div
                        key={song.id}
                        className={`grid grid-cols-[auto_1fr_auto] gap-4 p-2 rounded-lg cursor-grab ${song.id === currentSong?.id ? 'bg-accent/20' : 'bg-light-bg-secondary/50 dark:bg-dark-bg-secondary/50'}`}
                    >
                        <img src={song.artworkUrl} alt={song.title} className="w-12 h-12 rounded-md" />
                        <div onClick={() => playSong(song, queue)}>
                            <p className="font-semibold">{song.title}</p>
                            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{song.artist}</p>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{formatDuration(song.duration)}</span>
                            <button onClick={() => removeFromQueue(song.id)} className="p-1 text-light-text-secondary dark:text-dark-text-secondary">&times;</button>
                        </div>
                    </div>
                ))}
            </div>
             {queue.length === 0 && <p className="text-light-text-secondary dark:text-dark-text-secondary mt-4">Your queue is empty.</p>}
        </div>
    );
};

export default Queue;