/** Saved text on the phone (expo-sqlite's key-value store, included in Expo Go). The web uses kv.web.ts. */
import Storage from 'expo-sqlite/kv-store';

export const getItem = (key: string) => Storage.getItemSync(key);
export const setItem = (key: string, value: string) => Storage.setItemSync(key, value);
