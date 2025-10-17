import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth.ts';

const AuthPage: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const { login, signup } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');

        const action = isLogin ? login : signup;
        const result = await action(email, password);
        
        if (!result.success) {
            setError(result.message);
        } else {
            setMessage(result.message);
            // The app will automatically redirect via the context update
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-light-bg-primary dark:bg-dark-bg-primary">
             <div className="absolute inset-0 -z-10 h-full w-full bg-light-bg-primary dark:bg-dark-bg-primary bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
             <div className="absolute top-0 left-0 -z-10 h-full w-full bg-gradient-to-br from-pink-500/20 via-purple-500/20 to-indigo-500/20 dark:from-pink-500/10 dark:via-purple-500/10 dark:to-indigo-500/10 blur-3xl animate-gradient"></div>
            <div className="w-full max-w-md p-8 space-y-8 bg-light-bg-secondary/50 dark:bg-dark-bg-secondary/50 backdrop-blur-lg rounded-2xl shadow-2xl">
                <div className="text-center">
                    <div className="inline-block p-4 bg-accent/20 rounded-full animate-pulseGlow mb-4">
                        <span className="text-6xl">
                            🎵
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-accent to-pink-400 bg-clip-text text-transparent">
                        Music Studio
                    </h1>
                    <p className="mt-2 text-light-text-secondary dark:text-dark-text-secondary">Your personal music universe.</p>
                </div>
                
                <div className="flex border-b border-light-bg-tertiary dark:border-dark-bg-tertiary">
                    <button onClick={() => {setIsLogin(true); setError('');}} className={`w-1/2 py-4 text-center font-semibold transition-colors ${isLogin ? 'text-accent border-b-2 border-accent' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>
                        Login
                    </button>
                    <button onClick={() => {setIsLogin(false); setError('');}} className={`w-1/2 py-4 text-center font-semibold transition-colors ${!isLogin ? 'text-accent border-b-2 border-accent' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>
                        Sign Up
                    </button>
                </div>
                
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="relative">
                         <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-lg focus:ring-2 focus:ring-accent focus:outline-none peer"
                            placeholder=" "
                        />
                        <label htmlFor="email" className="absolute text-light-text-secondary dark:text-dark-text-secondary duration-300 transform -translate-y-4 scale-75 top-3 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                            Email address
                        </label>
                    </div>

                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete={isLogin ? "current-password" : "new-password"}
                            required
                             value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-light-bg-tertiary dark:bg-dark-bg-tertiary rounded-lg focus:ring-2 focus:ring-accent focus:outline-none peer"
                            placeholder=" "
                        />
                         <label htmlFor="password" className="absolute text-light-text-secondary dark:text-dark-text-secondary duration-300 transform -translate-y-4 scale-75 top-3 z-10 origin-[0] left-4 peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4">
                            Password
                        </label>
                    </div>
                    
                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    {message && <p className="text-sm text-green-500 text-center">{message}</p>}
                    
                    <div>
                        <button
                            type="submit"
                            className="w-full px-4 py-3 font-semibold text-white bg-accent rounded-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition"
                        >
                            {isLogin ? 'Login' : 'Create Account'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AuthPage;