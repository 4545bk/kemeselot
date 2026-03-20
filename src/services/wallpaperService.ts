/**
 * Wallpaper Service — Hybrid Local + Cloudinary
 *
 * 75% local bundled Ethiopian spiritual images (offline, instant)
 * 25% Cloudinary remote images (new content, auto-cached)
 * No Unsplash — completely removed.
 */

import { NativeModules } from 'react-native';
import { Asset } from 'expo-asset';
import { useAppStore } from '../store/appStore';
import { getRandomCloudinaryWallpaper } from './cloudinaryService';

// ---------- Local Wallpaper Registry ----------
function getLocalWallpapers() {
    try {
        return [
            require('../../assets/wallpapers/photo_1_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_2_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_3_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_5_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_7_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_9_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_10_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_12_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_15_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_18_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_20_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_22_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_25_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_28_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_30_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_33_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_35_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_38_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_40_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_42_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_45_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_47_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_50_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_52_2026-03-17_14-35-50.jpg'),
            require('../../assets/wallpapers/photo_54_2026-03-17_14-35-50.jpg'),
        ];
    } catch (e) {
        console.error('[Wallpaper] Failed to load local wallpapers:', e);
        return [];
    }
}

let _wallpapers: any[] | null = null;
function getWallpapers(): any[] {
    if (!_wallpapers) _wallpapers = getLocalWallpapers();
    return _wallpapers;
}

// ---------- Psalm Verses ----------
export const WALLPAPER_PSALMS = [
    { geez: 'እግዚአብሔር ረዳዔ ወመድኃኒየ ፤', english: 'The Lord is my helper and my savior.' },
    { geez: 'ፈቃደ እግዚአብሔር ይኩን ፤', english: 'Let the will of God be done.' },
    { geez: 'እግዚአብሔር ጽድቅ ይፈቅድ ፤', english: 'The Lord loves righteousness.' },
    { geez: 'ኃይልየ ወምስጋናየ እግዚአብሔር ፤', english: 'The Lord is my strength and my praise.' },
    { geez: 'ተወከልኩ በእግዚአብሔር ፤', english: 'I trust in the Lord.' },
    { geez: 'ሰማየ ይዜንው ስብሐተ እግዚአብሔር ፤', english: 'The heavens declare the glory of God.' },
    { geez: 'ይቤ ሰነፍ በልቡ አልቦ አምላክ ፤', english: 'The fool says in his heart there is no God.' },
    { geez: 'እግዚአብሔር ይጐብኘኒ ወኢይረኁ ፤', english: 'The Lord is my shepherd, I shall not want.' },
    { geez: 'ኣምላኪየ ኣምላኪየ ለምንት ኃደግከኒ ፤', english: 'My God, my God, why have you forsaken me?' },
    { geez: 'ለእግዚአብሔር ምድር ወሙላኤሃ ፤', english: 'The earth is the Lord\'s and everything in it.' },
    { geez: 'አንሰ በዝኁለ ምሕረትከ ፤', english: 'But I trust in your unfailing love.' },
    { geez: 'አቡጥ ኃጢኣትየ ፤', english: 'Wash away my sin.' },
    { geez: 'ልበ ንጹሐ ፍጥር ሊተ ፤', english: 'Create in me a clean heart, O God.' },
    { geez: 'አምላክ ሊተ ማዕቀፍ ፤', english: 'God is my refuge.' },
    { geez: 'ወይጸውዕ ላዕሌየ ወአነ እሰምዖ ፤', english: 'He will call on me, and I will answer him.' },
    { geez: 'ስብሕዎ ለእግዚአብሔር ፤', english: 'Praise the Lord!' },
    { geez: 'በእንተ ቅዱስ ስምከ ፤', english: 'For the sake of your holy name.' },
    { geez: 'መዝሙር ለዳዊት ፤', english: 'A Psalm of David.' },
    { geez: 'ስብሐት ለአብ ወወልድ ወመንፈስ ቅዱስ ፤', english: 'Glory to the Father, Son, and Holy Spirit.' },
];

// ---------- Types ----------
export interface WallpaperInfo {
    source: any;
    index: number;
    psalmVerse: { geez: string; english: string };
}

// ---------- Wallpaper Fetching (for prayer screen) ----------

export function getRandomWallpaper(): WallpaperInfo {
    const wallpapers = getWallpapers();
    if (wallpapers.length === 0) {
        return { source: null, index: 0, psalmVerse: WALLPAPER_PSALMS[0] };
    }
    const index = Math.floor(Math.random() * wallpapers.length);
    const psalmIndex = Math.floor(Math.random() * WALLPAPER_PSALMS.length);
    return { source: wallpapers[index], index, psalmVerse: WALLPAPER_PSALMS[psalmIndex] };
}

export function getTodayWallpaper(): WallpaperInfo {
    const wallpapers = getWallpapers();
    if (wallpapers.length === 0) {
        return { source: null, index: 0, psalmVerse: WALLPAPER_PSALMS[0] };
    }
    const now = new Date();
    const dayOfYear = Math.floor(
        (now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000,
    );
    const wallpaperIndex = dayOfYear % wallpapers.length;
    const psalmIndex = dayOfYear % WALLPAPER_PSALMS.length;
    return { source: wallpapers[wallpaperIndex], index: wallpaperIndex, psalmVerse: WALLPAPER_PSALMS[psalmIndex] };
}

export function getWallpaperCount(): number {
    return getWallpapers().length;
}

// ---------- Phone Wallpaper Changing (75% local / 25% Cloudinary) ----------

const MIN_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes minimum

function pickNewIndex(count: number, lastIndex: number): number {
    if (count <= 1) return 0;
    let idx: number;
    do {
        idx = Math.floor(Math.random() * count);
    } while (idx === lastIndex);
    return idx;
}

async function applyLocalWallpaper(index: number): Promise<boolean> {
    const { WallpaperModule } = NativeModules;
    if (!WallpaperModule) throw new Error('WallpaperModule not found');

    const wallpapers = getWallpapers();
    if (index < 0 || index >= wallpapers.length) throw new Error('Invalid wallpaper index');

    try {
        // Use expo-asset to extract bundled image to a real file on disk
        const asset = Asset.fromModule(wallpapers[index]);
        await asset.downloadAsync();

        if (!asset.localUri) {
            throw new Error(`Asset ${index} has no localUri after download`);
        }

        await WallpaperModule.setWallpaper(asset.localUri);
        console.log(`[Wallpaper] Applied local #${index} from ${asset.localUri}`);
        return true;
    } catch (error: any) {
        console.error('[Wallpaper] Local failed:', error);
        throw new Error(`Local dev error: ${error?.message || 'Unknown'}`);
    }
}

async function applyWallpaperFromUri(uri: string): Promise<boolean> {
    const { WallpaperModule } = NativeModules;
    if (!WallpaperModule) throw new Error('WallpaperModule not found');

    try {
        await WallpaperModule.setWallpaper(uri);
        console.log('[Wallpaper] Applied Cloudinary wallpaper');
        return true;
    } catch (error: any) {
        console.error('[Wallpaper] Cloudinary failed:', error);
        throw new Error(`Cloudinary uri error: ${error?.message || 'Unknown'}`);
    }
}

/**
 * 75% local, 25% Cloudinary. Falls back to local if Cloudinary fails.
 */
async function applyHybridWallpaper(store: any): Promise<boolean> {
    const wallpapers = getWallpapers();
    if (wallpapers.length === 0) throw new Error('No wallpapers available in registry');

    let cloudinaryError = null;

    // 25% chance → try Cloudinary
    if (Math.random() < 0.25) {
        try {
            const cloudUri = await getRandomCloudinaryWallpaper();
            if (cloudUri) {
                const success = await applyWallpaperFromUri(cloudUri);
                if (success) {
                    store.setLastWallpaper(-99);
                    return true;
                }
            } else {
                cloudinaryError = 'No Cloudinary URI returned';
            }
        } catch (e: any) {
            cloudinaryError = e?.message || 'Unknown Cloudinary error';
        }
        // Cloudinary failed — fall through to local
        console.warn('[Wallpaper] Cloudinary failed, falling back to local. Error:', cloudinaryError);
    }

    // 75% (or Cloudinary fallback) → local
    const newIndex = pickNewIndex(wallpapers.length, store.lastWallpaperIndex);
    
    // This will throw if it fails, which bubbles up to forceChangeWallpaper -> Settings UI
    const success = await applyLocalWallpaper(newIndex);
    if (success) store.setLastWallpaper(newIndex);
    return success;
}

/** Called from App.tsx on foreground — throttled */
export async function changeWallpaperIfNeeded(): Promise<boolean> {
    const store = useAppStore.getState();
    if (!store.wallpaperEnabled) return false;

    const elapsed = Date.now() - store.lastWallpaperChangedAt;
    if (elapsed < MIN_INTERVAL_MS) return false;

    const requiredInterval = store.wallpaperFrequency * MIN_INTERVAL_MS;
    if (elapsed < requiredInterval) return false;

    return await applyHybridWallpaper(store);
}

/** Called after prayer completion — bypasses frequency, still throttled */
export async function changeWallpaperOnPrayer(): Promise<boolean> {
    const store = useAppStore.getState();
    if (!store.wallpaperEnabled) return false;

    if (Date.now() - store.lastWallpaperChangedAt < MIN_INTERVAL_MS) return false;

    return await applyHybridWallpaper(store);
}

/** Called manually from Settings — bypasses ALL throttles */
export async function forceChangeWallpaper(): Promise<boolean> {
    const store = useAppStore.getState();
    return await applyHybridWallpaper(store);
}

export default {
    getRandomWallpaper,
    getTodayWallpaper,
    getWallpaperCount,
    changeWallpaperIfNeeded,
    changeWallpaperOnPrayer,
    forceChangeWallpaper,
    WALLPAPER_PSALMS,
};
