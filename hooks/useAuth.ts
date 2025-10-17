import React, { useContext, useState } from 'react';
import { useLocalStorage } from './useLocalStorage.ts';
import { User } from '../types.ts';
// Fix: Import context from the central context file to remove duplicate definitions.
import { AuthContext, AuthContextType } from '../context/AuthContext.ts';

interface StoredUser {
    email: string;
    // In a real app, this would be a securely hashed password
    passwordHash: string; 
}

// A simple hashing function for demonstration. 
// WARNING: Do not use this in production. Use a library like bcrypt.
const simpleHash = (s: string) => {
    let hash = 0;
    for (let i = 0; i < s.length; i++) {
        const char = s.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return String(hash);
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [users, setUsers] = useLocalStorage<StoredUser[]>('music_studio_users', []);
    const [currentUser, setCurrentUser] = useLocalStorage<User | null>('music_studio_currentUser', null);

    const signup = async (email: string, pass: string): Promise<{success: boolean, message: string}> => {
        if (users.find(u => u.email === email)) {
            return { success: false, message: "User with this email already exists." };
        }
        if (pass.length < 6) {
             return { success: false, message: "Password must be at least 6 characters." };
        }

        const passwordHash = simpleHash(pass);
        const newUser: StoredUser = { email, passwordHash };
        setUsers(currentUsers => [...currentUsers, newUser]);
        setCurrentUser({ email });
        return { success: true, message: "Signup successful!" };
    };

    const login = async (email: string, pass: string): Promise<{success: boolean, message: string}> => {
        const user = users.find(u => u.email === email);
        if (!user) {
            return { success: false, message: "User not found." };
        }
        const passwordHash = simpleHash(pass);
        if (user.passwordHash !== passwordHash) {
            return { success: false, message: "Incorrect password." };
        }
        setCurrentUser({ email });
        return { success: true, message: "Login successful!" };
    };

    const logout = () => {
        setCurrentUser(null);
    };

    // FIX: Replaced JSX with React.createElement because this is a .ts file, not a .tsx file.
    // This resolves parsing errors.
    const value = { currentUser, login, signup, logout };
    return React.createElement(AuthContext.Provider, { value }, children);
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};