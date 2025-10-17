import { useState, useEffect, Dispatch, SetStateAction } from 'react';

// Fix: Changed return type from React.Dispatch<React.SetStateAction<T>> to Dispatch<SetStateAction<T>> and imported the necessary types.
export function useLocalStorage<T>(key: string, initialValue: T, userId?: string | null): [T, Dispatch<SetStateAction<T>>] {
  const getStorageKey = (k: string, uId: string | null | undefined) => uId ? `${k}_${uId}` : k;

  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const storageKey = getStorageKey(key, userId);
      const item = window.localStorage.getItem(storageKey);
      // FIX: Cast the parsed JSON to type T to ensure type safety. JSON.parse returns `any`.
      return item ? JSON.parse(item) as T : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      const storageKey = getStorageKey(key, userId);
      window.localStorage.setItem(storageKey, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
     try {
      const storageKey = getStorageKey(key, userId);
      const item = window.localStorage.getItem(storageKey);
      // FIX: Cast the parsed JSON to type T to ensure type safety. JSON.parse returns `any`.
      setStoredValue(item ? JSON.parse(item) as T : initialValue);
    } catch (error) {
      console.error(error);
      setStoredValue(initialValue);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, userId]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
        const storageKey = getStorageKey(key, userId);
        if (e.key === storageKey && e.newValue) {
            setStoredValue(JSON.parse(e.newValue));
        }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => {
        window.removeEventListener('storage', handleStorageChange);
    };
  }, [key, userId]);

  return [storedValue, setValue];
}