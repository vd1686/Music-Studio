import React, { useContext, useRef, useState, useEffect } from 'react';
import { MusicContext } from '../context/MusicContext.ts';
import { ChevronDownIcon, PlayIcon, PauseIcon, SkipNextIcon, SkipPreviousIcon, MoreVertIcon } from './Icons.tsx';

interface NowPlayingViewProps {
  isOpen: boolean;
  onClose: () => void;
}

const NowPlayingView: React.FC<NowPlayingViewProps> = ({ isOpen, onClose }) => {
    const musicContext = useContext(MusicContext);
    const progressRef = useRef<HTMLDivElement>(null);
    const [isClosing, setIsClosing] = useState(false);


    if (!isOpen) return null;
    if (!musicContext) return null;

    const {
        currentSong, isPlaying, currentTime, duration,
        togglePlay, playNext, playPrev, seek
    } = musicContext;

    const handleClose = () => {
        setIsClosing(true);
        setTimeout(() => {
            onClose();
            setIsClosing(false); 
        }, 400); 
    };
    
    if (!currentSong) return null;

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (progressRef.current && duration) {
            const rect = progressRef.current.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const percentage = clickX / rect.width;
            seek(percentage * duration);
        }
    };
    
    const formatTime = (seconds: number) => {
        if (isNaN(seconds) || seconds < 0) return '0:00';
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
    const remainingTime = duration - currentTime;

    return (
        <div className={`fixed inset-0 bg-light-bg-secondary dark:bg-dark-bg-secondary z-50 flex flex-col p-4 md:p-8 ${isClosing ? 'animate-slideOutDown' : 'animate-slideInUp'}`}>
            
            <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
                <button onClick={handleClose} className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10">
                    <ChevronDownIcon className="w-8 h-8" />
                </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center space-y-6 pt-12 text-light-text-primary dark:text-dark-text-primary">
                <div className="w-full max-w-xs sm:max-w-sm relative">
                    <img src={currentSong.artworkUrl} alt={currentSong.title} className="w-full aspect-square rounded-lg shadow-2xl object-cover" />
                </div>
                
                <div className="w-full max-w-xs sm:max-w-sm flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold truncate">{currentSong.title}</h1>
                        <p className="text-lg text-light-text-secondary dark:text-dark-text-secondary truncate">{currentSong.artist}</p>
                    </div>
                    <button className="p-2 rounded-full text-light-text-secondary dark:text-dark-text-secondary hover:bg-black/10 dark:hover:bg-white/10">
                        <MoreVertIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-xs sm:max-w-sm space-y-1">
                    <div ref={progressRef} onClick={handleProgressClick} className="w-full h-2 bg-light-bg-tertiary/70 dark:bg-dark-bg-tertiary rounded-full cursor-pointer group py-2">
                       <div className="relative h-2">
                            <div className="absolute top-0 left-0 h-full w-full bg-light-bg-tertiary/70 dark:bg-dark-bg-tertiary rounded-full"></div>
                            <div style={{ width: `${progressPercentage}%` }} className="absolute top-0 left-0 h-full bg-light-text-primary dark:bg-dark-text-primary rounded-full">
                                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-light-text-primary dark:bg-dark-text-primary rounded-full ring-4 ring-light-bg-secondary dark:ring-dark-bg-secondary"></div>
                            </div>
                       </div>
                    </div>
                     <div className="flex justify-between text-xs font-mono text-light-text-secondary dark:text-dark-text-secondary">
                        <span>{formatTime(currentTime)}</span>
                        <span>-{formatTime(remainingTime)}</span>
                    </div>
                </div>

                {/* Main Controls */}
                <div className="flex items-center space-x-8">
                    <button onClick={playPrev} className="p-2 rounded-full">
                        <SkipPreviousIcon className="w-10 h-10" />
                    </button>
                    <button onClick={togglePlay} className="p-2">
                        {isPlaying ? <PauseIcon className="w-16 h-16" /> : <PlayIcon className="w-16 h-16" />}
                    </button>
                    <button onClick={playNext} className="p-2 rounded-full">
                        <SkipNextIcon className="w-10 h-10" />
                    </button>
                </div>
            </div>

            <div className="flex-shrink-0 h-10 md:h-16"></div> {/* Spacer for bottom safe area */}
        </div>
    );
};

export default NowPlayingView;