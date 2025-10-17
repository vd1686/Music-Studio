import React, { useContext, useRef } from 'react';
import { MusicContext } from '../context/MusicContext.ts';
import { PlayIcon, PauseIcon, SkipNextIcon, SkipPreviousIcon, VolumeUpIcon, VolumeOffIcon } from './Icons.tsx';

interface PlayerProps {
    onOpen: () => void;
}

const Player: React.FC<PlayerProps> = ({ onOpen }) => {
    const musicContext = useContext(MusicContext);
    const progressRef = useRef<HTMLDivElement>(null);

    const formatTime = (seconds: number) => {
        if (isNaN(seconds)) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation(); // Prevent opening the Now Playing view
        if (progressRef.current && musicContext?.duration) {
            const rect = progressRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            musicContext.seek(percentage * musicContext.duration);
        }
    };

    const handleControlClick = (e: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
        e.stopPropagation(); // Prevent opening the Now Playing view
        action();
    };
    
    const handleVolumeClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    }

    if (!musicContext) return null;

    const {
        isPlaying, currentSong, currentTime, duration, volume, isMuted,
        togglePlay, playNext, playPrev, setVolume, toggleMute
    } = musicContext;

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <footer 
            onClick={onOpen}
            className="h-24 bg-light-bg-secondary/50 dark:bg-dark-bg-secondary/50 backdrop-blur-lg border-t border-light-bg-tertiary/50 dark:border-dark-bg-tertiary/50 flex-shrink-0 grid grid-cols-3 items-center px-4 md:px-6 cursor-pointer"
        >
            {/* Song Info */}
            <div className="flex items-center space-x-4 w-full min-w-0">
                {currentSong ? (
                    <>
                        <img src={currentSong.artworkUrl} alt={currentSong.title} className="w-14 h-14 rounded-md object-cover flex-shrink-0" />
                        <div className="min-w-0">
                            <p className="font-bold truncate text-light-text-primary dark:text-dark-text-primary">{currentSong.title}</p>
                            <p className="text-sm truncate text-light-text-secondary dark:text-dark-text-secondary">{currentSong.artist}</p>
                        </div>
                    </>
                ) : (
                    <div className="text-sm text-light-text-secondary dark:text-dark-text-secondary">No song playing</div>
                )}
            </div>
            
            {/* Player Controls */}
            <div className="flex flex-col items-center justify-center">
                <div className="flex items-center space-x-2 md:space-x-4">
                    <button onClick={(e) => handleControlClick(e, playPrev)} className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary"><SkipPreviousIcon className="w-7 h-7 md:w-8 md:h-8" /></button>
                    <button onClick={(e) => handleControlClick(e, togglePlay)} className="p-3 bg-accent text-white rounded-full shadow-lg hover:scale-105 transition-transform">
                        {isPlaying ? <PauseIcon className="w-8 h-8" /> : <PlayIcon className="w-8 h-8" />}
                    </button>
                    <button onClick={(e) => handleControlClick(e, playNext)} className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary"><SkipNextIcon className="w-7 h-7 md:w-8 md:h-8" /></button>
                </div>
                <div className="w-full max-w-xl flex items-center space-x-2 mt-2">
                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{formatTime(currentTime)}</span>
                    <div ref={progressRef} onClick={handleProgressClick} className="w-full h-1.5 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-full cursor-pointer group">
                        <div style={{ width: `${progressPercentage}%` }} className="h-full bg-accent rounded-full relative">
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white dark:bg-dark-text-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>
                    </div>
                    <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Volume & Extras */}
            <div className="flex items-center justify-end" onClick={handleVolumeClick}>
                <div className="flex items-center space-x-2 w-24 md:w-32">
                    <button onClick={(e) => handleControlClick(e, toggleMute)} className="text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary">
                        {isMuted || volume === 0 ? <VolumeOffIcon /> : <VolumeUpIcon />}
                    </button>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={isMuted ? 0 : volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="w-full h-1 accent-accent"
                    />
                </div>
            </div>
        </footer>
    );
};

export default Player;