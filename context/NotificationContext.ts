
import { createContext } from 'react';

export interface NotificationContextType {
  showNotification: (message: string) => void;
}

export const NotificationContext = createContext<NotificationContextType | null>(null);
