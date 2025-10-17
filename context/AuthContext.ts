import { createContext } from 'react';
import { User } from '../types.ts';

export interface AuthContextType {
  currentUser: User | null;
  // Fix: Updated login and signup return types to match implementation.
  login: (email: string, pass: string) => Promise<{success: boolean, message: string}>;
  signup: (email: string, pass: string) => Promise<{success: boolean, message: string}>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);