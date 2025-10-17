import React from 'react';

const LoadingScreen: React.FC = () => {
    return (
        <div className="flex flex-col items-center justify-center h-screen w-screen bg-light-bg-primary dark:bg-dark-bg-primary text-light-text-primary dark:text-dark-text-primary">
            <div className="absolute inset-0 -z-10 h-full w-full bg-light-bg-primary dark:bg-dark-bg-primary bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
            <div className="absolute top-0 left-0 -z-10 h-full w-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 dark:from-pink-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 blur-3xl animate-gradient"></div>
            
            <div className="text-center">
                <div className="inline-block p-4 bg-accent/20 rounded-full animate-pulseGlow mb-4">
                    <span className="text-8xl">
                        🎵
                    </span>
                </div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-accent to-pink-400 bg-clip-text text-transparent">
                    Music Studio
                </h1>
                <p className="mt-4 text-lg text-light-text-secondary dark:text-dark-text-secondary animate-pulse">
                    Setting up your personal music universe...
                </p>
            </div>
        </div>
    );
};

export default LoadingScreen;
