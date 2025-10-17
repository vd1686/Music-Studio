import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Page, Theme } from './types.ts';
import Sidebar from './components/Sidebar.tsx';
import Player from './components/Player.tsx';
import Home from './pages/Home.tsx';
import Search from './pages/Search.tsx';
import Library from './pages/Library.tsx';
import Playlists from './pages/Playlists.tsx';
import History from './pages/History.tsx';
import CreatorStudio from './pages/CreatorStudio.tsx';
import { useMusicPlayer } from './hooks/useMusicPlayer.ts';
import { MusicContext, MusicContextType } from './context/MusicContext.ts';
import { NotificationContext, NotificationContextType } from './context/NotificationContext.ts';
import { ThemeContext, ThemeContextType } from './context/ThemeContext.ts';
import { AuthProvider, useAuth } from './hooks/useAuth.ts';
import Toast from './components/Toast.tsx';
import NowPlayingView from './components/NowPlayingView.tsx';
import AuthPage from './pages/AuthPage.tsx';
import LoadingScreen from './components/LoadingScreen.tsx';

const MusicAppLayout = () => {
    const [currentPage, setCurrentPage] = useState<Page>(Page.Home);
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('theme') as Theme) || Theme.Dark;
    });
    const [notification, setNotification] = useState<string | null>(null);
    const [isNowPlayingOpen, setIsNowPlayingOpen] = useState(false);
    const audioRef = useRef<HTMLAudioElement>(null);

    const { currentUser } = useAuth();

    const showNotification = (message: string) => {
        setNotification(message);
        setTimeout(() => setNotification(null), 3000);
    };
    
    const musicPlayer = useMusicPlayer(showNotification, audioRef, currentUser?.email || null);

    useEffect(() => {
        if (theme === Theme.Dark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const toggleTheme = useCallback(() => {
        setTheme(prevTheme => prevTheme === Theme.Light ? Theme.Dark : Theme.Light);
    }, []);

    const musicContextValue: MusicContextType = useMemo(() => musicPlayer, [musicPlayer]);
    const themeContextValue: ThemeContextType = useMemo(() => ({ theme, toggleTheme }), [theme, toggleTheme]);
    const notificationContextValue: NotificationContextType = useMemo(() => ({ showNotification }), []);

    if (musicPlayer.isInitializing) {
        return <LoadingScreen />;
    }

    const renderPage = () => {
        switch (currentPage) {
            case Page.Home: return <Home setCurrentPage={setCurrentPage} />;
            case Page.Search: return <Search />;
            case Page.Library: return <Library />;
            case Page.Playlists: return <Playlists />;
            case Page.History: return <History />;
            case Page.CreatorStudio: return <CreatorStudio />;
            default: return <Home setCurrentPage={setCurrentPage} />;
        }
    };
    
    return (
        <ThemeContext.Provider value={themeContextValue}>
            <NotificationContext.Provider value={notificationContextValue}>
                <MusicContext.Provider value={musicContextValue}>
                    <div className={`flex h-screen overflow-hidden font-sans text-light-text-primary dark:text-dark-text-primary bg-light-bg-secondary dark:bg-dark-bg-secondary transition-colors duration-300`}>
                        <audio ref={audioRef} />
                        <div className="absolute inset-0 -z-10 h-full w-full bg-light-bg-primary dark:bg-dark-bg-primary bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
                        <div className="absolute top-0 left-0 -z-10 h-1/3 w-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 dark:from-pink-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 blur-3xl animate-gradient"></div>

                        <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
                        
                        <main className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                                {renderPage()}
                            </div>
                            <Player onOpen={() => setIsNowPlayingOpen(true)} />
                        </main>
                        
                        {notification && <Toast message={notification} />}
                        <NowPlayingView isOpen={isNowPlayingOpen} onClose={() => setIsNowPlayingOpen(false)} />
                    </div>
                </MusicContext.Provider>
            </NotificationContext.Provider>
        </ThemeContext.Provider>
    );
};

const AppContent = () => {
    const { currentUser } = useAuth();

    useEffect(() => {
        if (!currentUser) {
            // User is on the AuthPage, force dark mode
            document.documentElement.classList.add('dark');
        }
        // When the user logs in, MusicAppLayout will take over and set the theme
        // based on user's preference stored in localStorage.
    }, [currentUser]);

    if (!currentUser) {
        return <AuthPage />;
    }
    return <MusicAppLayout />;
}

const App = () => {
    return (
        // FIX: Pass children as an explicit prop to AuthProvider. This resolves a TypeScript
        // type inference issue that occurs when a component from a .ts file is used in a .tsx file.
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    )
}

export default App;