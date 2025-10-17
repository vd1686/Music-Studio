
import React, { useContext } from 'react';
import { MusicContext } from '../context/MusicContext.ts';
import SongList from '../components/SongList.tsx';
import PageHeader from '../components/PageHeader.tsx';

const History: React.FC = () => {
  const musicContext = useContext(MusicContext);

  if (!musicContext) return <div>Loading...</div>;

  const { history, playSong } = musicContext;

  return (
    <div>
      <PageHeader title="History" subtitle="Your last 50 played tracks." />
      
      {history.length > 0 ? (
        <SongList songs={history} onPlay={playSong} />
      ) : (
        <p className="text-light-text-secondary dark:text-dark-text-secondary">
          Your listening history is empty. Play some music to see it here.
        </p>
      )}
    </div>
  );
};

export default History;