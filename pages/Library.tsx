import React, { useContext, useMemo, useState, useCallback } from 'react';
import { MusicContext } from '../context/MusicContext.ts';
import SongList from '../components/SongList.tsx';
import PageHeader from '../components/PageHeader.tsx';
import { CreatorIcon } from '../components/Icons.tsx';

const Library: React.FC = () => {
  const musicContext = useContext(MusicContext);
  const [isDragging, setIsDragging] = useState(false);

  if (!musicContext) return <div>Loading...</div>;

  const { library, playSong, handleLocalFiles } = musicContext;

  const sortedLibrary = useMemo(() => {
    return [...library].sort((a, b) => a.title.localeCompare(b.title));
  }, [library]);
  
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleLocalFiles(e.target.files);
        }
    };
    
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);
    
    const handleDragIn = useCallback((e: React.DragEvent) => {
        handleDrag(e);
        setIsDragging(true);
    }, [handleDrag]);
    
    const handleDragOut = useCallback((e: React.DragEvent) => {
        handleDrag(e);
        setIsDragging(false);
    }, [handleDrag]);
    
    const handleDrop = useCallback((e: React.DragEvent) => {
        handleDrag(e);
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleLocalFiles(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    }, [handleDrag, handleLocalFiles]);


  return (
    <div>
      <PageHeader title="My Library" subtitle={`You have ${sortedLibrary.length} locally uploaded songs.`} />
      
      <div
          onDragEnter={handleDragIn}
          onDragLeave={handleDragOut}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`mb-8 border-4 border-dashed rounded-2xl p-8 text-center transition-colors ${isDragging ? 'border-accent bg-accent/10' : 'border-light-bg-tertiary dark:border-dark-bg-tertiary'}`}
      >
          <CreatorIcon className="w-12 h-12 mx-auto text-light-text-secondary dark:text-dark-text-secondary mb-4" />
          <h2 className="text-xl font-bold mb-2">Drag & Drop MP3 files here</h2>
          <p className="text-light-text-secondary dark:text-dark-text-secondary mb-4">or</p>
          <label htmlFor="file-upload" className="cursor-pointer px-6 py-3 bg-accent text-white rounded-lg font-semibold inline-block">
              Choose Files
          </label>
          <input
              id="file-upload"
              type="file"
              accept=".mp3,audio/mpeg"
              multiple
              onChange={onFileChange}
              className="hidden"
          />
      </div>


      {sortedLibrary.length > 0 ? (
        <SongList songs={sortedLibrary} onPlay={playSong} />
      ) : (
        <p className="text-light-text-secondary dark:text-dark-text-secondary mt-8 text-center">
          Your local library is empty. Upload some MP3 files to get started.
        </p>
      )}
    </div>
  );
};

export default Library;