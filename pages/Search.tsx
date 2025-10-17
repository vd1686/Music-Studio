import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Song } from '../types.ts';
import { searchSongs } from '../services/itunesService.ts';
import SongList from '../components/SongList.tsx';
import PageHeader from '../components/PageHeader.tsx';
import { SearchIcon, MicrophoneIcon } from '../components/Icons.tsx';
import { MusicContext } from '../context/MusicContext.ts';
import { NotificationContext } from '../context/NotificationContext.ts';

const Search: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const musicContext = useContext(MusicContext);
    const notificationContext = useContext(NotificationContext);

    const debouncedSearch = useCallback((term: string) => {
        if (term) {
            setIsLoading(true);
            searchSongs(term).then(songs => {
                setResults(songs);
                setIsLoading(false);
            });
        } else {
            setResults([]);
        }
    }, []);
    
    useEffect(() => {
        const handler = setTimeout(() => {
            debouncedSearch(searchTerm);
        }, 500);

        return () => {
            clearTimeout(handler);
        };
    }, [searchTerm, debouncedSearch]);
    
    const handleVoiceSearch = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            notificationContext?.showNotification("Voice search is not supported in your browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);
        notificationContext?.showNotification("Listening...");

        recognition.start();

        recognition.onresult = (event: any) => {
            const speechResult = event.results[0][0].transcript;
            setSearchTerm(speechResult);
        };

        recognition.onspeechend = () => {
            recognition.stop();
            setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            notificationContext?.showNotification(`Voice search error: ${event.error}`);
            setIsListening(false);
        };
    };

    return (
        <div>
            <PageHeader title="Search" subtitle="Discover new music from millions of songs." />
            
            <div className="relative mb-8">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Search for songs, artists, albums..."}
                    className="w-full p-4 pl-12 pr-16 text-lg bg-light-bg-secondary dark:bg-dark-bg-secondary rounded-lg focus:ring-2 focus:ring-accent focus:outline-none"
                />
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-light-text-secondary dark:text-dark-text-secondary pointer-events-none" />
                <button onClick={handleVoiceSearch} className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full transition-colors hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary ${isListening ? 'text-accent animate-pulse' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>
                    <MicrophoneIcon className="w-6 h-6" />
                </button>
            </div>

            <div>
                {isLoading ? (
                    <div className="text-center p-8">Loading...</div>
                ) : (
                    <SongList songs={results} onPlay={musicContext?.playSong} />
                )}
            </div>
        </div>
    );
};

export default Search;