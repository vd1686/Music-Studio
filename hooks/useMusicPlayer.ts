import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Song, Playlist } from '../types.ts';
import { useLocalStorage } from './useLocalStorage.ts';
import { searchSongs } from '../services/itunesService.ts';

// This is to make jsmediatags available in the scope
declare const jsmediatags: any;

export const useMusicPlayer = (showNotification: (message: string) => void, audioRef: React.RefObject<HTMLAudioElement>, userId: string | null) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useLocalStorage('volume', 0.75, userId);
    const [isMuted, setIsMuted] = useLocalStorage('isMuted', false, userId);
    const [playbackQueue, setPlaybackQueue] = useState<Song[]>([]);

    const [library, setLibrary] = useLocalStorage<Song[]>('library', [], userId);
    const [allSongs, setAllSongs] = useLocalStorage<Song[]>('allSongs', [], userId);
    const [history, setHistory] = useLocalStorage<Song[]>('history', [], userId);
    const [playlists, setPlaylists] = useLocalStorage<Playlist[]>('playlists', [], userId);
    
    const [favorites, setFavorites] = useLocalStorage<string[]>('favorites', [], userId);
    const [playCount, setPlayCount] = useLocalStorage<{ [key: string]: number }>('playCount', {}, userId);
    const [listeningTime, setListeningTime] = useLocalStorage<number>('listeningTime', 0, userId);

    const [isInitialSetupDone, setIsInitialSetupDone] = useLocalStorage('isInitialSetupDone', false, userId);
    const isInitializing = useMemo(() => !isInitialSetupDone && !!userId, [isInitialSetupDone, userId]);

    useEffect(() => {
        const setupInitialPlaylists = async () => {
            if (!userId) return; // Don't run if user is not logged in
            showNotification("Setting up your music library...");
            
            const defaultPlaylistsData = [
                { name: 'Pop Hits', description: 'Chart-topping pop anthems.', searchTerms: ['blinding lights the weeknd', 'levitating dua lipa', 'good 4 u olivia rodrigo', 'save your tears the weeknd', 'peaches justin bieber'] },
                { name: 'Chill Vibes', description: 'Relax and unwind.', searchTerms: ['golden harry styles', 'deja vu olivia rodrigo', 'willow taylor swift', 'better khalid', 'sunday best surfaces'] },
                { name: 'Workout Fuel', description: 'High-energy tracks to get you moving.', searchTerms: ['bad guy billie eilish', 'industry baby lil nas x', 'stronger kanye west', 'lose yourself eminem', 'eye of the tiger survivor'] },
                { name: '80s Throwback', description: 'The greatest hits from the 1980s.', searchTerms: ['take on me a-ha', 'billie jean michael jackson', 'like a virgin madonna', 'livin on a prayer bon jovi', 'sweet child o mine guns n roses'] }
            ];
    
            const newPlaylists: Playlist[] = [];
            const newAllSongs: Song[] = [];

            for (const playlistData of defaultPlaylistsData) {
                const playlistSongs: Song[] = [];
                for (const term of playlistData.searchTerms) {
                    // Fetch songs sequentially to avoid rate-limiting the proxy
                    const searchResult = await searchSongs(term);
                    if (searchResult.length > 0) {
                        const song = searchResult[0];
                        playlistSongs.push(song);
                        if (!newAllSongs.some(s => s.id === song.id)) {
                            newAllSongs.push(song);
                        }
                    }
                    // Add a small delay between requests
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
                                
                const newPlaylist: Playlist = {
                    id: `default-${playlistData.name.replace(/\s+/g, '-').toLowerCase()}`,
                    name: playlistData.name,
                    description: playlistData.description,
                    songIds: playlistSongs.map(s => s.id)
                };
                newPlaylists.push(newPlaylist);    
            }
            
            // Batch update states at the end to improve performance and avoid race conditions
            setAllSongs(prev => {
                const existingIds = new Set(prev.map(s => s.id));
                const uniqueNewSongs = newAllSongs.filter(s => !existingIds.has(s.id));
                return [...prev, ...uniqueNewSongs];
            });

            setPlaylists(prev => {
                const existingIds = new Set(prev.map(p => p.id));
                const uniqueNewPlaylists = newPlaylists.filter(p => !existingIds.has(p.id));
                return [...prev, ...uniqueNewPlaylists];
            });
    
            setIsInitialSetupDone(true);
            showNotification(`Welcome, ${userId}!`);
        };
    
        if (isInitializing) {
            setupInitialPlaylists();
        }
    }, [isInitializing, setIsInitialSetupDone, setAllSongs, setPlaylists, showNotification, userId]);

    const updateHistory = useCallback((song: Song) => {
        setHistory(prev => [song, ...prev.filter(s => s.id !== song.id)].slice(0, 50));
    }, [setHistory]);

    const playSong = useCallback((song: Song, songList?: Song[]) => {
        if (audioRef.current) {
            setCurrentSong(song);
            audioRef.current.src = song.audioUrl;
            audioRef.current.play().then(() => {
                setIsPlaying(true);
                setPlayCount(prev => ({ ...prev, [song.id]: (prev[song.id] || 0) + 1 }));
            }).catch(e => console.error("Error playing audio:", e));
            updateHistory(song);
            if (songList) {
                const songIndex = songList.findIndex(s => s.id === song.id);
                const nextSongs = songList.slice(songIndex);
                setPlaybackQueue(nextSongs);
            } else {
                setPlaybackQueue(q => q.find(s => s.id === song.id) ? q : [song, ...q]);
            }
        }
    }, [updateHistory, audioRef, setPlayCount]);

    const playNext = useCallback(() => {
        if (!currentSong) return;
        const currentIndex = playbackQueue.findIndex(s => s.id === currentSong.id);
        const nextIndex = (currentIndex + 1) % playbackQueue.length;
        
        if (playbackQueue[nextIndex] && playbackQueue.length > 1) {
            playSong(playbackQueue[nextIndex]);
        } else if (playbackQueue.length <= 1) {
            setIsPlaying(false);
            if(audioRef.current) audioRef.current.currentTime = 0;
        }
    }, [currentSong, playbackQueue, playSong, audioRef]);
    
    useEffect(() => {
        const audio = audioRef.current;
        const handleTimeUpdate = () => setCurrentTime(audio?.currentTime || 0);
        const handleLoadedMetadata = () => setDuration(audio?.duration || 0);
        const handleEnded = () => playNext();

        audio?.addEventListener('timeupdate', handleTimeUpdate);
        audio?.addEventListener('loadedmetadata', handleLoadedMetadata);
        audio?.addEventListener('ended', handleEnded);

        return () => {
            audio?.removeEventListener('timeupdate', handleTimeUpdate);
            audio?.removeEventListener('loadedmetadata', handleLoadedMetadata);
            audio?.removeEventListener('ended', handleEnded);
        };
    }, [playNext, audioRef]);

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;
        if (isPlaying) {
            interval = setInterval(() => {
                setListeningTime(t => t + 1);
            }, 1000);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [isPlaying, setListeningTime]);

    const togglePlay = () => {
        if (!currentSong && playbackQueue.length > 0) {
            playSong(playbackQueue[0]);
            return;
        }
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
                setIsPlaying(false);
            } else {
                audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error(e));
            }
        }
    };

    const playPrev = () => {
        if (!currentSong) return;
        const currentIndex = playbackQueue.findIndex(s => s.id === currentSong.id);
        if (audioRef.current && audioRef.current.currentTime > 3) {
            audioRef.current.currentTime = 0;
            return;
        }
        let prevIndex = (currentIndex - 1 + playbackQueue.length) % playbackQueue.length;
        if (playbackQueue[prevIndex]) {
            playSong(playbackQueue[prevIndex]);
        }
    };

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };
    
    useEffect(() => {
        if(audioRef.current) {
            audioRef.current.volume = isMuted ? 0 : volume;
        }
    }, [volume, isMuted, audioRef])

    const handleSetVolume = (newVolume: number) => {
        setVolume(newVolume);
        if (newVolume > 0 && isMuted) setIsMuted(false);
    };

    const toggleMute = () => setIsMuted(m => !m);
    
    const reorderQueue = (newQueue: Song[]) => {
        setPlaybackQueue(newQueue);
    };

    const removeFromQueue = (songId: string) => {
        setPlaybackQueue(q => q.filter(s => s.id !== songId));
    };

    const clearQueue = () => {
        setPlaybackQueue(q => q.filter(s => s.id === currentSong?.id));
    };

    const createPlaylist = (name: string, description: string) => {
        const newPlaylist: Playlist = {
            id: `playlist-${Date.now()}`,
            name,
            description,
            songIds: []
        };
        setPlaylists(p => [...p, newPlaylist]);
        showNotification(`Playlist "${name}" created`);
    };
    
    const deletePlaylist = (playlistId: string) => setPlaylists(p => p.filter(pl => pl.id !== playlistId));
    
    const addSongToPlaylist = (playlistId: string, song: Song) => {
        // Ensure the song is in the master list
        setAllSongs(prev => {
            if (prev.some(s => s.id === song.id)) return prev;
            return [...prev, song];
        });

        setPlaylists(p => p.map(pl => {
            if (pl.id === playlistId && !pl.songIds.includes(song.id)) {
                showNotification(`Song added to ${pl.name}`);
                return { ...pl, songIds: [...pl.songIds, song.id] };
            }
            if (pl.id === playlistId && pl.songIds.includes(song.id)) {
                 showNotification(`Song already in ${pl.name}`);
            }
            return pl;
        }));
    };
    
    const removeSongFromPlaylist = (playlistId: string, songId: string) => {
        setPlaylists(p => p.map(pl => {
            if (pl.id === playlistId) {
                return { ...pl, songIds: pl.songIds.filter(id => id !== songId) };
            }
            return pl;
        }));
    };
    
    const getSongsFromPlaylist = useCallback((playlistId: string) => {
        const playlist = playlists.find(p => p.id === playlistId);
        if (!playlist) return [];
        return playlist.songIds.map(songId => allSongs.find(song => song.id === songId)).filter((s): s is Song => !!s);
    }, [playlists, allSongs]);

    const playPlaylist = (playlistId: string) => {
        const songs = getSongsFromPlaylist(playlistId);
        if (songs.length > 0) {
            playSong(songs[0], songs);
            const playlist = playlists.find(p => p.id === playlistId);
            showNotification(`Now playing: ${playlist?.name}`);
        }
    };

    const handleLocalFiles = (files: FileList) => {
        Array.from(files).forEach(file => {
            if (file.type === "audio/mpeg") {
                const url = URL.createObjectURL(file);
                jsmediatags.read(file, {
                    onSuccess: (tag: any) => {
                        const { title, artist, album, picture } = tag.tags;
                        let artworkUrl = 'https://picsum.photos/100';
                        if (picture) {
                            const { data, format } = picture;
                            let base64String = "";
                            for (let i = 0; i < data.length; i++) {
                                base64String += String.fromCharCode(data[i]);
                            }
                            artworkUrl = `data:${format};base64,${window.btoa(base64String)}`;
                        }
                        
                        const audioForDuration = new Audio(url);
                        audioForDuration.onloadedmetadata = () => {
                            const newSong: Song = {
                                id: `local-${Date.now()}-${Math.random()}`,
                                title: title || file.name.replace('.mp3', ''),
                                artist: artist || 'Unknown Artist',
                                album: album || 'Unknown Album',
                                artworkUrl,
                                audioUrl: url,
                                duration: audioForDuration.duration,
                                isLocal: true,
                            };
                            
                            // Add to both local library and master song list
                            if(!library.some(s => s.title === newSong.title && s.artist === newSong.artist)){
                                setLibrary(lib => [...lib, newSong]);
                                setAllSongs(all => [...all, newSong]);
                            }
                        };
                    },
                    onError: (error: any) => {
                        console.error('Error reading ID3 tags:', error);
                    }
                });
            }
        });
        showNotification(`${files.length} file(s) added to library`);
    };
    
    // Voice Commands and Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if((e.target as HTMLElement).tagName === 'INPUT') return;
            switch(e.code) {
                case 'Space': e.preventDefault(); togglePlay(); break;
                case 'ArrowRight': playNext(); break;
                case 'ArrowLeft': playPrev(); break;
                case 'ArrowUp': handleSetVolume(Math.min(volume + 0.05, 1)); break;
                case 'ArrowDown': handleSetVolume(Math.max(volume - 0.05, 0)); break;
                case 'KeyM': toggleMute(); break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        // Voice recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.lang = 'en-US';
            
            const handleVoiceCommand = (e: KeyboardEvent) => {
                if (e.ctrlKey && e.key === 'v') {
                    showNotification("Listening...");
                    recognition.start();
                }
            };
            
            recognition.onresult = (event: any) => {
                const command = event.results[0][0].transcript.toLowerCase();
                showNotification(`Heard: ${command}`);
                if (command.includes('play')) togglePlay();
                else if (command.includes('pause')) togglePlay();
                else if (command.includes('next')) playNext();
                else if (command.includes('previous')) playPrev();
            };
            
            recognition.onerror = (event: any) => {
                console.error('Speech recognition error', event.error);
                showNotification(`Voice command error: ${event.error}`);
            };

            window.addEventListener('keydown', handleVoiceCommand);
            return () => {
                window.removeEventListener('keydown', handleKeyDown);
                window.removeEventListener('keydown', handleVoiceCommand);
            }
        }

        return () => window.removeEventListener('keydown', handleKeyDown);

    }, [togglePlay, playNext, playPrev, volume, toggleMute, handleSetVolume]);


    return {
        isPlaying, currentSong, currentTime, duration, volume, isMuted,
        library, allSongs, history, playlists,
        favorites, playCount, listeningTime, queue: playbackQueue,
        isInitializing,
        playSong, togglePlay, playNext, playPrev, seek, setVolume: handleSetVolume, toggleMute,
        createPlaylist, deletePlaylist, addSongToPlaylist, removeSongFromPlaylist, getSongsFromPlaylist, playPlaylist,
        handleLocalFiles,
        reorderQueue, removeFromQueue, clearQueue,
    };
};
