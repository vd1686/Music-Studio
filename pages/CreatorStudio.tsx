import React, { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { Song, MashupTrack, MashupEffects } from '../types.ts';
import { searchSongs } from '../services/itunesService.ts';
import { useLocalStorage } from '../hooks/useLocalStorage.ts';
import PageHeader from '../components/PageHeader.tsx';
import { SearchIcon, PlusIcon, CloseIcon, PlayIcon, PauseIcon, DownloadIcon } from '../components/Icons.tsx';
import { NotificationContext } from '../context/NotificationContext.ts';

declare const Sortable: any;

// Helper function to convert an AudioBuffer to a WAV file (Blob)
function bufferToWave(abuffer: AudioBuffer): Blob {
    const numOfChan = abuffer.numberOfChannels;
    const sampleRate = abuffer.sampleRate;
    const length = abuffer.length * numOfChan * 2 + 44;
    const buffer = new ArrayBuffer(length);
    const view = new DataView(buffer);
    const channels = [];
    let i, sample;
    let offset = 0;
    let pos = 0;

    const setUint16 = (data: number) => {
        view.setUint16(offset, data, true);
        offset += 2;
    };
    const setUint32 = (data: number) => {
        view.setUint32(offset, data, true);
        offset += 4;
    };

    // RIFF header
    setUint32(0x46464952); // "RIFF"
    setUint32(length - 8);
    setUint32(0x45564157); // "WAVE"

    // "fmt " sub-chunk
    setUint32(0x20746d66); // "fmt "
    setUint32(16);
    setUint16(1); // PCM
    setUint16(numOfChan);
    setUint32(sampleRate);
    setUint32(sampleRate * 2 * numOfChan); // byte rate
    setUint16(numOfChan * 2); // block align
    setUint16(16); // bits per sample

    // "data" sub-chunk
    setUint32(0x61746164); // "data"
    setUint32(abuffer.length * numOfChan * 2);

    for (i = 0; i < abuffer.numberOfChannels; i++) {
        channels.push(abuffer.getChannelData(i));
    }

    while (pos < abuffer.length) {
        for (i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][pos]));
            sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
            view.setInt16(offset, sample, true);
            offset += 2;
        }
        pos++;
    }

    return new Blob([view], { type: 'audio/wav' });
}


const CreatorStudio: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [mashupTracks, setMashupTracks] = useLocalStorage<MashupTrack[]>('mashupTracks', []);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    const notificationContext = useContext(NotificationContext);
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceNodesRef = useRef<Map<string, AudioBufferSourceNode>>(new Map());
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mashupListRef = useRef<HTMLDivElement>(null);
    const sortableRef = useRef<any>(null);

    const debouncedSearch = useCallback((term: string) => {
        if (term) {
            setIsLoading(true);
            searchSongs(term).then(songs => {
                setSearchResults(songs);
                setIsLoading(false);
            });
        } else {
            setSearchResults([]);
        }
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => debouncedSearch(searchTerm), 500);
        return () => clearTimeout(handler);
    }, [searchTerm, debouncedSearch]);

    useEffect(() => {
        if (mashupListRef.current) {
            sortableRef.current = new Sortable(mashupListRef.current, {
                animation: 150,
                handle: '.drag-handle',
                onEnd: (evt: any) => {
                    if (evt.oldIndex === undefined || evt.newIndex === undefined) return;
                    setMashupTracks(tracks => {
                        const newTracks = [...tracks];
                        const [removed] = newTracks.splice(evt.oldIndex, 1);
                        newTracks.splice(evt.newIndex, 0, removed);
                        return newTracks;
                    });
                },
            });
        }
        return () => sortableRef.current?.destroy();
    }, [setMashupTracks]);

    const addTrackToMashup = (song: Song) => {
        const newTrack: MashupTrack = {
            id: `mashup-${Date.now()}-${Math.random()}`,
            song,
            effects: {
                volume: 0.75,
                speed: 1.0,
                fadeIn: true,
                fadeOut: true,
                reverb: false,
                slowedReverb: false,
                pan: 0,
                pitch: 0,
                lowPassFreq: null,
                highPassFreq: null,
            },
        };
        setMashupTracks(prev => [...prev, newTrack]);
    };

    const updateTrackEffects = (trackId: string, newEffects: Partial<MashupEffects>) => {
        setMashupTracks(tracks => tracks.map(t => {
            if (t.id === trackId) {
                const updatedEffects = { ...t.effects, ...newEffects };
    
                if ('slowedReverb' in newEffects) {
                    if (newEffects.slowedReverb) {
                        updatedEffects.speed = 0.85;
                        updatedEffects.reverb = true;
                    } else {
                        updatedEffects.speed = 1.0;
                        updatedEffects.reverb = false;
                    }
                } else if (('speed' in newEffects && newEffects.speed !== 0.85) || ('reverb' in newEffects && !newEffects.reverb)) {
                    updatedEffects.slowedReverb = false;
                }
                
                return { ...t, effects: updatedEffects };
            }
            return t;
        }));
    };

    const removeTrackFromMashup = (trackId: string) => {
        setMashupTracks(tracks => tracks.filter(t => t.id !== trackId));
    };

    const stopMashup = useCallback(() => {
        sourceNodesRef.current.forEach(source => {
            try { source.stop(); } catch(e) {}
        });
        sourceNodesRef.current.clear();
        setIsPlaying(false);
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().then(() => {
                audioContextRef.current = null;
                analyserRef.current = null;
            });
        }
    }, []);
    
    const playMashup = useCallback(async () => {
        if (isPlaying) {
            stopMashup();
            return;
        }
        if (mashupTracks.length === 0) {
            notificationContext?.showNotification("Add some songs to the mashup first!");
            return;
        }

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioContext;

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
        }

        analyserRef.current = audioContext.createAnalyser();
        analyserRef.current.fftSize = 256;
        analyserRef.current.connect(audioContext.destination);
        const masterGain = audioContext.createGain();
        masterGain.connect(analyserRef.current);
        
        setIsPlaying(true);
        notificationContext?.showNotification("Playing your mashup!");

        try {
            const audioBuffers = await Promise.all(
                mashupTracks.map(track =>
                    fetch(track.song.audioUrl)
                        .then(response => response.arrayBuffer())
                        .then(buffer => audioContext.decodeAudioData(buffer))
                )
            );
            
            sourceNodesRef.current.clear();
            let scheduleTime = audioContext.currentTime;
            const crossfadeDuration = 1;

            mashupTracks.forEach((track, i) => {
                const buffer = audioBuffers[i];
                const source = audioContext.createBufferSource();
                source.buffer = buffer;
                source.playbackRate.value = track.effects.speed;
                source.detune.value = track.effects.pitch;

                let lastNode: AudioNode = source;

                if (track.effects.lowPassFreq !== null) {
                    const lowPassFilter = audioContext.createBiquadFilter();
                    lowPassFilter.type = 'lowpass';
                    lowPassFilter.frequency.value = track.effects.lowPassFreq;
                    lastNode.connect(lowPassFilter);
                    lastNode = lowPassFilter;
                }
                if (track.effects.highPassFreq !== null) {
                    const highPassFilter = audioContext.createBiquadFilter();
                    highPassFilter.type = 'highpass';
                    highPassFilter.frequency.value = track.effects.highPassFreq;
                    lastNode.connect(highPassFilter);
                    lastNode = highPassFilter;
                }

                const pannerNode = audioContext.createStereoPanner();
                pannerNode.pan.value = track.effects.pan;
                lastNode.connect(pannerNode);
                lastNode = pannerNode;

                const gainNode = audioContext.createGain();

                if (track.effects.reverb) {
                    const dryGain = audioContext.createGain();
                    const wetGain = audioContext.createGain();
                    wetGain.gain.value = 0.3; // Reverb level
                    const delay = audioContext.createDelay(0.5);
                    const feedback = audioContext.createGain();
                    feedback.gain.value = 0.4;

                    lastNode.connect(dryGain);
                    dryGain.connect(gainNode);

                    lastNode.connect(delay);
                    delay.connect(feedback);
                    feedback.connect(delay);
                    delay.connect(wetGain);
                    wetGain.connect(gainNode);
                } else {
                    lastNode.connect(gainNode);
                }
                
                gainNode.connect(masterGain);
                
                const duration = buffer.duration / track.effects.speed;
                const startTime = i === 0 ? scheduleTime : scheduleTime - crossfadeDuration;

                gainNode.gain.setValueAtTime(0, startTime);
                if (track.effects.fadeIn) {
                    gainNode.gain.linearRampToValueAtTime(track.effects.volume, startTime + crossfadeDuration);
                } else {
                    gainNode.gain.setValueAtTime(track.effects.volume, startTime);
                }

                if (track.effects.fadeOut) {
                     gainNode.gain.setValueAtTime(track.effects.volume, startTime + duration - crossfadeDuration);
                     gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
                }
                
                source.start(startTime);
                scheduleTime = startTime + duration;
                sourceNodesRef.current.set(track.id, source);
                
                if (i === mashupTracks.length - 1) {
                    source.onended = stopMashup;
                }
            });
        } catch (error) {
            console.error("Error playing mashup: ", error);
            notificationContext?.showNotification("Error: Could not play mashup.");
            stopMashup();
        }
    }, [isPlaying, stopMashup, mashupTracks, notificationContext]);
    
    const exportMashup = async () => {
        if (mashupTracks.length === 0) {
            notificationContext?.showNotification("Add songs to create a mashup first!");
            return;
        }
        setIsExporting(true);
        notificationContext?.showNotification("Exporting... this may take a moment.");

        try {
            const crossfadeDuration = 1;
            
            const tempCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const audioBuffers = await Promise.all(
                mashupTracks.map(track =>
                    fetch(track.song.audioUrl)
                        .then(res => res.arrayBuffer())
                        .then(buffer => tempCtx.decodeAudioData(buffer))
                )
            );
            tempCtx.close();

            let totalDuration = 0;
            mashupTracks.forEach((track, i) => {
                const duration = audioBuffers[i].duration / track.effects.speed;
                totalDuration = (i === 0 ? 0 : totalDuration - crossfadeDuration) + duration;
            });

            const offlineContext = new OfflineAudioContext(2, Math.ceil(totalDuration * 44100), 44100);
            const masterGain = offlineContext.createGain();
            masterGain.connect(offlineContext.destination);

            let scheduleTime = 0;
            mashupTracks.forEach((track, i) => {
                const buffer = audioBuffers[i];
                const source = offlineContext.createBufferSource();
                source.buffer = buffer;
                source.playbackRate.value = track.effects.speed;
                source.detune.value = track.effects.pitch;

                let lastNode: AudioNode = source;

                if (track.effects.lowPassFreq !== null) {
                    const lowPassFilter = offlineContext.createBiquadFilter();
                    lowPassFilter.type = 'lowpass';
                    lowPassFilter.frequency.value = track.effects.lowPassFreq;
                    lastNode.connect(lowPassFilter);
                    lastNode = lowPassFilter;
                }
                if (track.effects.highPassFreq !== null) {
                    const highPassFilter = offlineContext.createBiquadFilter();
                    highPassFilter.type = 'highpass';
                    highPassFilter.frequency.value = track.effects.highPassFreq;
                    lastNode.connect(highPassFilter);
                    lastNode = highPassFilter;
                }
                
                const pannerNode = offlineContext.createStereoPanner();
                pannerNode.pan.value = track.effects.pan;
                lastNode.connect(pannerNode);
                lastNode = pannerNode;

                const gainNode = offlineContext.createGain();

                if (track.effects.reverb) {
                    const dryGain = offlineContext.createGain();
                    const wetGain = offlineContext.createGain();
                    wetGain.gain.value = 0.3;
                    const delay = offlineContext.createDelay(0.5);
                    const feedback = offlineContext.createGain();
                    feedback.gain.value = 0.4;
                    lastNode.connect(dryGain);
                    dryGain.connect(gainNode);
                    lastNode.connect(delay);
                    delay.connect(feedback);
                    feedback.connect(delay);
                    delay.connect(wetGain);
                    wetGain.connect(gainNode);
                } else {
                    lastNode.connect(gainNode);
                }
                
                gainNode.connect(masterGain);
                
                const duration = buffer.duration / track.effects.speed;
                const startTime = i === 0 ? scheduleTime : scheduleTime - crossfadeDuration;
                
                gainNode.gain.setValueAtTime(0, startTime);
                if(track.effects.fadeIn) {
                    gainNode.gain.linearRampToValueAtTime(track.effects.volume, startTime + crossfadeDuration);
                } else {
                    gainNode.gain.setValueAtTime(track.effects.volume, startTime);
                }

                if(track.effects.fadeOut) {
                     gainNode.gain.setValueAtTime(track.effects.volume, startTime + duration - crossfadeDuration);
                     gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
                }
                
                source.start(startTime);
                scheduleTime = startTime + duration;
            });
            
            const renderedBuffer = await offlineContext.startRendering();
            const wavBlob = bufferToWave(renderedBuffer);
            const url = URL.createObjectURL(wavBlob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'music-studio-mashup.wav';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
            notificationContext?.showNotification("Mashup exported successfully!");

        } catch (error) {
            console.error("Failed to export mashup:", error);
            notificationContext?.showNotification("An error occurred during export.");
        } finally {
            setIsExporting(false);
        }
    };

     useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !analyserRef.current) return;
        
        const analyser = analyserRef.current;
        const canvasCtx = canvas.getContext('2d');
        let animationFrameId: number;

        const renderFrame = () => {
            if (!canvasCtx || !analyser) return;
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);

            const { width, height } = canvas;
            canvasCtx.clearRect(0, 0, width, height);

            const barWidth = (width / bufferLength) * 2.5;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const barHeight = dataArray[i] * (height/255);
                const isDarkMode = document.documentElement.classList.contains('dark');
                const gradient = canvasCtx.createLinearGradient(0, height, 0, height - barHeight);
                gradient.addColorStop(0, isDarkMode ? '#fa2d48' : '#fa2d48');
                gradient.addColorStop(1, isDarkMode ? '#f87171' : '#fb923c');
                
                canvasCtx.fillStyle = gradient;
                canvasCtx.fillRect(x, height - barHeight, barWidth, barHeight);
                x += barWidth + 1;
            }
            animationFrameId = requestAnimationFrame(renderFrame);
        };
        
        if (isPlaying) {
            renderFrame();
        } else {
            if (canvasCtx) canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
        }

        return () => cancelAnimationFrame(animationFrameId);
    }, [isPlaying]);

    return (
        <div className="flex flex-col h-full">
            <PageHeader title="Creator Studio" subtitle="Craft your own unique song mashups." />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1 min-h-0">
                {/* Left Column: Search & Add */}
                <div className="flex flex-col bg-light-bg-secondary dark:bg-dark-bg-secondary p-4 rounded-lg min-h-0">
                    <h2 className="text-xl font-bold mb-4">1. Find Clips</h2>
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search for songs or artists..."
                            className="w-full p-3 pl-10 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-lg focus:ring-2 focus:ring-accent focus:outline-none"
                        />
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-light-text-secondary dark:text-dark-text-secondary" />
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {isLoading ? <p className="text-center p-4">Loading...</p> : searchResults.map(song => (
                            <div key={song.id} className="flex items-center space-x-4 p-2 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary">
                                <img src={song.artworkUrl} alt={song.title} className="w-12 h-12 rounded-md" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{song.title}</p>
                                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary truncate">{song.artist}</p>
                                </div>
                                <button onClick={() => addTrackToMashup(song)} className="p-2 rounded-full bg-accent/20 hover:bg-accent/40 text-accent">
                                    <PlusIcon className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                         {searchResults.length === 0 && !isLoading && searchTerm && <p className="text-center p-4 text-light-text-secondary dark:text-dark-text-secondary">No results found.</p>}
                    </div>
                </div>

                {/* Right Column: Mashup Queue & Controls */}
                <div className="flex flex-col bg-light-bg-secondary dark:bg-dark-bg-secondary p-4 rounded-lg min-h-0">
                    <h2 className="text-xl font-bold mb-4">2. Build Your Mashup</h2>
                    <div ref={mashupListRef} className="flex-1 overflow-y-auto custom-scrollbar space-y-3">
                        {mashupTracks.length > 0 ? mashupTracks.map(track => (
                            <div key={track.id} className="bg-light-bg-tertiary dark:bg-dark-bg-tertiary p-3 rounded-lg">
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="drag-handle cursor-move text-light-text-secondary dark:text-dark-text-secondary">☰</div>
                                    <img src={track.song.artworkUrl} alt={track.song.title} className="w-10 h-10 rounded" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold truncate">{track.song.title}</p>
                                        <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary truncate">{track.song.artist}</p>
                                    </div>
                                    <button onClick={() => removeTrackFromMashup(track.id)}><CloseIcon className="w-5 h-5" /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-3 text-sm pt-2">
                                    {/* Volume */}
                                    <div className="flex items-center space-x-2">
                                        <label className="w-12">Volume</label>
                                        <input type="range" min="0" max="1" step="0.05" value={track.effects.volume} onChange={e => updateTrackEffects(track.id, { volume: parseFloat(e.target.value) })} className="w-full accent-accent" />
                                    </div>
                                    {/* Speed */}
                                    <div className="flex items-center space-x-2">
                                        <label className="w-12">Speed</label>
                                        <input type="range" min="0.8" max="1.2" step="0.05" value={track.effects.speed} disabled={track.effects.slowedReverb} onChange={e => updateTrackEffects(track.id, { speed: parseFloat(e.target.value) })} className="w-full accent-accent disabled:opacity-50" />
                                    </div>
                                    {/* Toggles */}
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id={`fadein-${track.id}`} checked={track.effects.fadeIn} onChange={e => updateTrackEffects(track.id, { fadeIn: e.target.checked })} className="accent-accent" />
                                        <label htmlFor={`fadein-${track.id}`}>Fade In</label>
                                    </div>
                                     <div className="flex items-center space-x-2">
                                        <input type="checkbox" id={`fadeout-${track.id}`} checked={track.effects.fadeOut} onChange={e => updateTrackEffects(track.id, { fadeOut: e.target.checked })} className="accent-accent" />
                                        <label htmlFor={`fadeout-${track.id}`}>Fade Out</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id={`reverb-${track.id}`} checked={track.effects.reverb} disabled={track.effects.slowedReverb} onChange={e => updateTrackEffects(track.id, { reverb: e.target.checked })} className="accent-accent disabled:opacity-50" />
                                        <label htmlFor={`reverb-${track.id}`}>Reverb</label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input type="checkbox" id={`slowedreverb-${track.id}`} checked={track.effects.slowedReverb} onChange={e => updateTrackEffects(track.id, { slowedReverb: e.target.checked })} className="accent-accent" />
                                        <label htmlFor={`slowedreverb-${track.id}`}>Slowed + Reverb</label>
                                    </div>
                                    
                                    <div className="col-span-1 md:col-span-2 border-b border-light-bg-secondary dark:border-dark-bg-secondary my-1"></div>

                                    {/* Pan */}
                                    <div className="flex items-center space-x-2 col-span-1 md:col-span-2">
                                        <label htmlFor={`pan-${track.id}`} className="font-medium w-12">Pan</label>
                                        <input id={`pan-${track.id}`} type="range" min="-1" max="1" step="0.1" value={track.effects.pan} onChange={e => updateTrackEffects(track.id, { pan: parseFloat(e.target.value) })} className="w-full accent-accent" />
                                        <span className="w-10 text-right">{track.effects.pan.toFixed(1)}</span>
                                    </div>

                                    {/* Pitch */}
                                    <div className="flex items-center space-x-2 col-span-1 md:col-span-2">
                                        <label htmlFor={`pitch-${track.id}`} className="font-medium w-12">Pitch</label>
                                        <input id={`pitch-${track.id}`} type="range" min="-1200" max="1200" step="100" value={track.effects.pitch} onChange={e => updateTrackEffects(track.id, { pitch: parseInt(e.target.value) })} className="w-full accent-accent" />
                                        <span className="w-10 text-right">{track.effects.pitch / 100} st</span>
                                    </div>

                                    {/* Low Pass */}
                                    <div className="col-span-1 md:col-span-2 space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <input type="checkbox" id={`lowpass-toggle-${track.id}`} checked={track.effects.lowPassFreq !== null} onChange={e => updateTrackEffects(track.id, { lowPassFreq: e.target.checked ? 5000 : null })} className="accent-accent" />
                                            <label htmlFor={`lowpass-toggle-${track.id}`} className="font-medium">Low-Pass Filter</label>
                                        </div>
                                        {track.effects.lowPassFreq !== null && (
                                            <div className="flex items-center space-x-2 pl-6">
                                                <input type="range" min="200" max="15000" value={track.effects.lowPassFreq} onChange={e => updateTrackEffects(track.id, { lowPassFreq: parseInt(e.target.value) })} className="w-full accent-accent" />
                                                <span className="w-16 text-right">{track.effects.lowPassFreq} Hz</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* High Pass */}
                                    <div className="col-span-1 md:col-span-2 space-y-1">
                                        <div className="flex items-center space-x-2">
                                            <input type="checkbox" id={`highpass-toggle-${track.id}`} checked={track.effects.highPassFreq !== null} onChange={e => updateTrackEffects(track.id, { highPassFreq: e.target.checked ? 200 : null })} className="accent-accent" />
                                            <label htmlFor={`highpass-toggle-${track.id}`} className="font-medium">High-Pass Filter</label>
                                        </div>
                                        {track.effects.highPassFreq !== null && (
                                            <div className="flex items-center space-x-2 pl-6">
                                                <input type="range" min="50" max="8000" value={track.effects.highPassFreq} onChange={e => updateTrackEffects(track.id, { highPassFreq: parseInt(e.target.value) })} className="w-full accent-accent" />
                                                <span className="w-16 text-right">{track.effects.highPassFreq} Hz</span>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </div>
                        )) : <p className="text-center text-light-text-secondary dark:text-dark-text-secondary py-8">Your mashup queue is empty.</p>}
                    </div>
                    <div className="flex-shrink-0 pt-4 mt-auto">
                        <h2 className="text-xl font-bold mb-2">3. Finalize</h2>
                        <div className="flex items-center space-x-4 bg-light-bg-tertiary dark:bg-dark-bg-tertiary p-3 rounded-lg">
                            <button onClick={playMashup} disabled={isExporting} className="p-3 bg-accent text-white rounded-full disabled:bg-gray-500">
                                {isPlaying ? <PauseIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
                            </button>
                             <canvas ref={canvasRef} className="w-full h-12"></canvas>
                             <button onClick={exportMashup} disabled={isPlaying || isExporting} className="p-3 bg-green-500 text-white rounded-full disabled:bg-gray-500 flex items-center">
                                {isExporting ? (
                                    <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                ): (
                                    <DownloadIcon className="w-6 h-6" />
                                )}
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatorStudio;