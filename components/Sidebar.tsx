import React, { useContext } from 'react';
import { Page, Theme } from '../types.ts';
import { HomeIcon, SearchIcon, LibraryIcon, PlaylistIcon, HistoryIcon, SunIcon, MoonIcon, MixerIcon, LogoutIcon } from './Icons.tsx';
import { MusicContext } from '../context/MusicContext.ts';
import { ThemeContext } from '../context/ThemeContext.ts';
import { useAuth } from '../hooks/useAuth.ts';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage }) => {
  const musicContext = useContext(MusicContext);
  const themeContext = useContext(ThemeContext);
  const { logout } = useAuth();

  const navItems = [
    { page: Page.Home, icon: <HomeIcon />, label: 'Home' },
    { page: Page.Search, icon: <SearchIcon />, label: 'Search' },
    { page: Page.Library, icon: <LibraryIcon />, label: 'Library' },
    { page: Page.Playlists, icon: <PlaylistIcon />, label: 'Playlists', count: musicContext?.playlists.filter(p => !p.id.startsWith('default-')).length },
    { page: Page.History, icon: <HistoryIcon />, label: 'History' },
    { page: Page.CreatorStudio, icon: <MixerIcon />, label: 'Creator Studio' },
  ];

  return (
    <aside className="w-16 md:w-64 flex-shrink-0 bg-light-bg-secondary/30 dark:bg-dark-bg-secondary/30 backdrop-blur-lg border-r border-light-bg-tertiary/50 dark:border-dark-bg-tertiary/50 flex flex-col transition-all duration-300">
      <div className="h-20 flex items-center justify-center md:justify-start md:px-6">
        <span className="text-2xl font-bold bg-gradient-to-r from-accent to-pink-400 bg-clip-text text-transparent">🎵</span>
        <span className="hidden md:inline ml-2 text-xl font-bold bg-gradient-to-r from-accent to-pink-400 bg-clip-text text-transparent">Music Studio</span>
      </div>
      <nav className="flex-1 px-2 md:px-4 space-y-2">
        {navItems.map(item => (
          <button
            key={item.page}
            onClick={() => setCurrentPage(item.page)}
            className={`w-full flex items-center p-3 rounded-lg transition-colors duration-200 ${
              currentPage === item.page
                ? 'bg-accent/20 text-accent'
                : 'hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary'
            }`}
          >
            {item.icon}
            <span className="hidden md:inline ml-4 font-semibold">{item.label}</span>
            {item.count !== undefined && item.count > 0 && (
              <span className="hidden md:inline ml-auto bg-accent text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">{item.count}</span>
            )}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-light-bg-tertiary/50 dark:border-dark-bg-tertiary/50">
        <button
          onClick={themeContext?.toggleTheme}
          className="w-full flex items-center p-3 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors duration-200"
        >
          {themeContext?.theme === Theme.Light ? <MoonIcon /> : <SunIcon />}
          <span className="hidden md:inline ml-4 font-semibold">
            {themeContext?.theme === Theme.Light ? 'Dark Mode' : 'Light Mode'}
          </span>
        </button>
         <button
          onClick={logout}
          className="w-full flex items-center p-3 rounded-lg hover:bg-light-bg-tertiary dark:hover:bg-dark-bg-tertiary transition-colors duration-200 mt-2"
        >
          <LogoutIcon />
          <span className="hidden md:inline ml-4 font-semibold">
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;