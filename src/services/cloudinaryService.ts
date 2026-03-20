/**
 * Cloudinary Wallpaper Service
 * Fetches wallpapers from Cloudinary and caches them locally.
 * Cloud: dgvkhkebj, Folder: kemeselot
 */

import * as FileSystem from 'expo-file-system';

const CLOUD_NAME = 'dgvkhkebj';
const FOLDER = 'kemeselot';
const CACHE_DIR = FileSystem.cacheDirectory + 'cloudinary_wallpapers/';
const MANIFEST_FILE = FileSystem.documentDirectory + 'cloudinary_manifest.json';

// Cloudinary list API (unsigned, public resources)
const API_URL = `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${FOLDER}.json`;

interface CloudinaryResource {
    public_id: string;
    format: string;
    version: number;
    width: number;
    height: number;
}

interface CloudinaryManifest {
    lastFetched: number;
    resources: CloudinaryResource[];
}

/**
 * Get the URL for a Cloudinary image, optimized for phone screens.
 * Uses Cloudinary's auto-quality and auto-format transformations.
 */
function getImageUrl(publicId: string, format: string): string {
    return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/q_auto,f_auto,w_1080,h_1920,c_fill/${publicId}.${format}`;
}

/**
 * Ensure the cache directory exists.
 */
async function ensureCacheDir(): Promise<void> {
    try {
        const info = await FileSystem.getInfoAsync(CACHE_DIR);
        if (!info.exists) {
            await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
        }
    } catch {}
}

/**
 * Load the cached manifest (list of known Cloudinary images).
 */
async function loadManifest(): Promise<CloudinaryManifest | null> {
    try {
        const info = await FileSystem.getInfoAsync(MANIFEST_FILE);
        if (!info.exists) return null;
        const json = await FileSystem.readAsStringAsync(MANIFEST_FILE);
        return JSON.parse(json);
    } catch {
        return null;
    }
}

/**
 * Save the manifest to disk.
 */
async function saveManifest(manifest: CloudinaryManifest): Promise<void> {
    try {
        await FileSystem.writeAsStringAsync(MANIFEST_FILE, JSON.stringify(manifest));
    } catch {}
}

/**
 * Fetch the list of wallpapers from Cloudinary.
 * Only fetches if the last fetch was more than 6 hours ago.
 */
export async function syncCloudinaryWallpapers(): Promise<CloudinaryResource[]> {
    try {
        const existing = await loadManifest();
        const sixHours = 6 * 60 * 60 * 1000;

        // Return cached if recent enough
        if (existing && Date.now() - existing.lastFetched < sixHours) {
            return existing.resources;
        }

        console.log('[Cloudinary] Fetching wallpaper list...');
        const response = await fetch(API_URL);

        if (!response.ok) {
            console.warn('[Cloudinary] API returned', response.status);
            return existing?.resources || [];
        }

        const data = await response.json();
        const resources: CloudinaryResource[] = data.resources || [];

        const manifest: CloudinaryManifest = {
            lastFetched: Date.now(),
            resources,
        };
        await saveManifest(manifest);

        console.log(`[Cloudinary] Found ${resources.length} wallpapers`);
        return resources;
    } catch (error) {
        console.warn('[Cloudinary] Sync failed:', error);
        const existing = await loadManifest();
        return existing?.resources || [];
    }
}

/**
 * Get a random Cloudinary wallpaper URI (cached locally).
 * Downloads the image if not already cached.
 * Returns null if no images available or download fails.
 */
export async function getRandomCloudinaryWallpaper(): Promise<string | null> {
    try {
        const resources = await syncCloudinaryWallpapers();
        if (resources.length === 0) return null;

        await ensureCacheDir();

        // Pick a random one
        const idx = Math.floor(Math.random() * resources.length);
        const res = resources[idx];

        // Check if already cached
        const safeName = res.public_id.replace(/\//g, '_');
        const localPath = CACHE_DIR + safeName + '.' + res.format;
        const info = await FileSystem.getInfoAsync(localPath);

        if (info.exists) {
            return localPath;
        }

        // Download and cache
        const url = getImageUrl(res.public_id, res.format);
        console.log(`[Cloudinary] Downloading wallpaper: ${safeName}`);

        const download = await FileSystem.downloadAsync(url, localPath);

        if (download.status === 200) {
            console.log(`[Cloudinary] Cached: ${safeName}`);
            return localPath;
        }

        return null;
    } catch (error) {
        console.warn('[Cloudinary] Failed to get wallpaper:', error);
        return null;
    }
}

/**
 * Get all cached Cloudinary wallpaper file paths.
 */
export async function getCachedCloudinaryWallpapers(): Promise<string[]> {
    try {
        await ensureCacheDir();
        const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
        return files
            .filter(f => f.endsWith('.jpg') || f.endsWith('.png') || f.endsWith('.webp'))
            .map(f => CACHE_DIR + f);
    } catch {
        return [];
    }
}

/**
 * Pre-cache a few Cloudinary wallpapers in the background.
 * Call this on app startup to ensure some are ready.
 */
export async function preCacheCloudinaryWallpapers(count: number = 3): Promise<void> {
    try {
        const resources = await syncCloudinaryWallpapers();
        if (resources.length === 0) return;

        await ensureCacheDir();

        // Shuffle and take first N
        const shuffled = [...resources].sort(() => Math.random() - 0.5);
        const toCache = shuffled.slice(0, Math.min(count, shuffled.length));

        for (const res of toCache) {
            const safeName = res.public_id.replace(/\//g, '_');
            const localPath = CACHE_DIR + safeName + '.' + res.format;
            const info = await FileSystem.getInfoAsync(localPath);

            if (!info.exists) {
                const url = getImageUrl(res.public_id, res.format);
                await FileSystem.downloadAsync(url, localPath).catch(() => {});
            }
        }

        console.log(`[Cloudinary] Pre-cached up to ${toCache.length} wallpapers`);
    } catch {}
}
