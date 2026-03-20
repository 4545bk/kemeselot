/**
 * Simple file-based storage adapter for Zustand persist.
 * Uses expo-file-system (already installed) instead of AsyncStorage.
 * Stores JSON data in the app's document directory.
 */
import * as FileSystem from 'expo-file-system';

const STORE_DIR = FileSystem.documentDirectory + 'store/';
const getFilePath = (key: string) => STORE_DIR + key + '.json';

// Ensure the store directory exists
let dirReady = false;
async function ensureDir() {
    if (dirReady) return;
    try {
        const info = await FileSystem.getInfoAsync(STORE_DIR);
        if (!info.exists) {
            await FileSystem.makeDirectoryAsync(STORE_DIR, { intermediates: true });
        }
        dirReady = true;
    } catch {}
}

/**
 * Zustand-compatible storage adapter using expo-file-system.
 */
export const fileStorage = {
    getItem: async (key: string): Promise<string | null> => {
        try {
            await ensureDir();
            const path = getFilePath(key);
            const info = await FileSystem.getInfoAsync(path);
            if (!info.exists) return null;
            return await FileSystem.readAsStringAsync(path);
        } catch {
            return null;
        }
    },

    setItem: async (key: string, value: string): Promise<void> => {
        try {
            await ensureDir();
            await FileSystem.writeAsStringAsync(getFilePath(key), value);
        } catch (e) {
            console.error('[FileStorage] Write error:', e);
        }
    },

    removeItem: async (key: string): Promise<void> => {
        try {
            await ensureDir();
            const path = getFilePath(key);
            const info = await FileSystem.getInfoAsync(path);
            if (info.exists) {
                await FileSystem.deleteAsync(path);
            }
        } catch {}
    },
};
