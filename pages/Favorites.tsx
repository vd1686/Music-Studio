
import React, { useContext, useMemo } from 'react';
import { MusicContext } from '../context/MusicContext.ts';
import SongList from '../components/SongList.tsx';
import PageHeader from '../components/PageHeader.tsx';

const Favorites: React.FC = () => {
  const musicContext = useContext(MusicContext);

  if (!musicContext) return <div>Loading...</div>;

  const { favorites, library, playSong } = musicContext;

  const favoriteSongs = useMemo(() => {
    return library.filter(song => favorites.includes(song.id));
  }, [library, favorites]);

  return (
    <div>
      <PageHeader title="Favorites" subtitle={`You have ${favoriteSongs.length} favorited songs.`} />
      
      {favoriteSongs.length > 0 ? (
        <SongList songs={favoriteSongs} onPlay={playSong} />
      ) : (
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          You haven't favorited any songs yet. Click the heart icon on a song to add it here.
        </p>
      )}
    </div>
  );
};

export default Favorites;