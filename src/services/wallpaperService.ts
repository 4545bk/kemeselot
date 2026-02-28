/**
 * Wallpaper Service — Cloudinary Ethiopian Spiritual Imagery
 *
 * Fetches random "Ethiopian Spiritual" wallpapers from Cloudinary
 * to use as animated backgrounds on the prayer lock screen.
 *
 * Uses react-native-fast-image for smooth loading & caching.
 */

// ---------- Cloudinary Configuration ----------
// Replace with your own Cloudinary cloud name
const CLOUDINARY_CLOUD_NAME = 'kemeselot';
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload`;

// Curated spiritual wallpaper public IDs from your Cloudinary account.
// These are the asset IDs you'll upload to Cloudinary.
// Format: 'folder/filename' (no extension needed)
const SPIRITUAL_WALLPAPER_IDS = [
    'kemeselot/lalibela_cross',
    'kemeselot/bet_giyorgis',
    'kemeselot/axum_obelisk',
    'kemeselot/timkat_ceremony',
    'kemeselot/debre_damo',
    'kemeselot/meskel_square',
    'kemeselot/ethiopian_icon_mary',
    'kemeselot/abuna_yemata',
    'kemeselot/tana_monastery',
    'kemeselot/eth_orthodox_cross',
];

// Fallback wallpapers using free Unsplash images (no API key needed)
const FALLBACK_WALLPAPERS = [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=80', // Mountains
    'https://images.unsplash.com/photo-1518241353330-0f7941c2d9b5?w=1080&q=80', // Night sky
    'https://images.unsplash.com/photo-1476611338391-6f395a0dd82e?w=1080&q=80', // Sunrise
    'https://images.unsplash.com/photo-1502209524164-acea936639a2?w=1080&q=80', // Candles
    'https://images.unsplash.com/photo-1445307806294-bff7f67ff225?w=1080&q=80', // Ancient church
    'https://images.unsplash.com/photo-1489980557514-251d61e3eeb6?w=1080&q=80', // Cross silhouette
];

// ---------- Types ----------

export interface WallpaperInfo {
    uri: string;
    isCloudinary: boolean;
    index: number;
}

// ---------- Cloudinary URL Builder ----------

/**
 * Build a Cloudinary URL with transformations:
 * - Auto format (WebP on Android for performance)
 * - Quality auto
 * - Overlay effect: dark vignette for text legibility
 */
export function buildCloudinaryUrl(
    publicId: string,
    options: {
        width?: number;
        height?: number;
        quality?: number;
        darkOverlay?: boolean;
    } = {},
): string {
    const { width = 1080, height = 1920, quality = 80, darkOverlay = true } =
        options;

    const transforms = [
        `w_${width}`,
        `h_${height}`,
        'c_fill',
        `q_${quality}`,
        'f_auto',
        darkOverlay ? 'e_brightness:-20' : '',
    ]
        .filter(Boolean)
        .join(',');

    return `${CLOUDINARY_BASE_URL}/${transforms}/${publicId}`;
}

// ---------- Wallpaper Fetching ----------

/**
 * Get a random spiritual wallpaper URL.
 * Tries Cloudinary first, falls back to Unsplash.
 */
export function getRandomWallpaper(): WallpaperInfo {
    const useCloudinary = Math.random() > 0.3; // 70% chance Cloudinary

    if (useCloudinary && CLOUDINARY_WALLPAPER_IDS_VALID) {
        const index = Math.floor(Math.random() * SPIRITUAL_WALLPAPER_IDS.length);
        const publicId = SPIRITUAL_WALLPAPER_IDS[index];
        return {
            uri: buildCloudinaryUrl(publicId),
            isCloudinary: true,
            index,
        };
    }

    // Fallback to Unsplash
    const index = Math.floor(Math.random() * FALLBACK_WALLPAPERS.length);
    return {
        uri: FALLBACK_WALLPAPERS[index],
        isCloudinary: false,
        index,
    };
}

/**
 * Get today's wallpaper (deterministic — same wallpaper all day).
 * Based on Ethiopian day-of-week so it changes daily.
 */
export function getTodayWallpaper(): WallpaperInfo {
    const dayOfWeek = new Date().getDay();
    const fallbackIndex = dayOfWeek % FALLBACK_WALLPAPERS.length;
    return {
        uri: FALLBACK_WALLPAPERS[fallbackIndex],
        isCloudinary: false,
        index: fallbackIndex,
    };
}

/**
 * Get a list of wallpapers to preload (for smooth transitions).
 */
export function getWallpaperPreloadList(): string[] {
    return FALLBACK_WALLPAPERS;
}

// Whether Cloudinary IDs are configured (non-placeholder)
const CLOUDINARY_WALLPAPER_IDS_VALID = false; // Set to true after uploading to Cloudinary

export default {
    buildCloudinaryUrl,
    getRandomWallpaper,
    getTodayWallpaper,
    getWallpaperPreloadList,
    FALLBACK_WALLPAPERS,
    SPIRITUAL_WALLPAPER_IDS,
};
