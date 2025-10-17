import React from 'react';
import { Song } from '../types.ts';
import { CloseIcon } from './Icons.tsx';

interface LyricsModalProps {
  song: Song;
  lyrics: string | null;
  isLoading: boolean;
  onClose: () => void;
}

const LyricsModal: React.FC<LyricsModalProps> = ({ song, lyrics, isLoading, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 flex items-center justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-light-bg-secondary dark:bg-dark-bg-secondary w-11/12 md:w-1/2 lg:w-1/3 h-3/4 rounded-2xl shadow-2xl flex flex-col p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
                <img src={song.artworkUrl} alt={song.title} className="w-16 h-16 rounded-md object-cover" />
                <div>
                    <h2 className="text-2xl font-bold">{song.title}</h2>
                    <p className="text-light-text-secondary dark:text-dark-text-secondary">{song.artist}</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary">
                <CloseIcon />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
            </div>
          ) : (
            <p className="text-lg whitespace-pre-wrap leading-relaxed">
              {lyrics || "No lyrics available."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LyricsModal;