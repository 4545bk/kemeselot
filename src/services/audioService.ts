/**
 * Audio Service — Daily Ethiopian Orthodox Chant Streaming
 *
 * Streams the daily Fikare (chant) based on the current day of week.
 * Source: ethiopianorthodox.org audio files.
 *
 * Uses react-native-track-player for audio playback.
 */

import TrackPlayer, {
    Event,
    State,
    Track,
    Capability,
    AppKilledPlaybackBehavior,
} from 'react-native-track-player';

// ---------- Daily Chant URLs ----------
// Each day maps to its specific Ethiopian Orthodox chant/Fikare
// Hosted on ethiopianorthodox.org (fallback to publicly available sources)

const DAILY_CHANTS: Record<number, Track> = {
    0: {
        // Sunday — Fikare Bealat (Festival)
        id: 'sunday',
        url: 'https://www.ethiopianorthodox.org/amharic/holydays/audio/sunday.mp3',
        title: 'እሑድ — ፍካሬ ምስጢር',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: 'https://www.ethiopianorthodox.org/images/cross.jpg',
        duration: 1800,
    },
    1: {
        // Monday — Fikare Tsega (Grace)
        id: 'monday',
        url: 'https://www.ethiopianorthodox.org/amharic/holydays/audio/monday.mp3',
        title: 'ሰኞ — ፍካሬ ጸጋ',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: 'https://www.ethiopianorthodox.org/images/cross.jpg',
        duration: 1800,
    },
    2: {
        // Tuesday — Fikare Gedam
        id: 'tuesday',
        url: 'https://www.ethiopianorthodox.org/amharic/holydays/audio/tuesday.mp3',
        title: 'ማክሰኞ — ፍካሬ ገዳም',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: 'https://www.ethiopianorthodox.org/images/cross.jpg',
        duration: 1800,
    },
    3: {
        // Wednesday — Fikare Medhanit
        id: 'wednesday',
        url: 'https://www.ethiopianorthodox.org/amharic/holydays/audio/wednesday.mp3',
        title: 'ረቡዕ — ፍካሬ መድኃኒት',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: 'https://www.ethiopianorthodox.org/images/cross.jpg',
        duration: 1800,
    },
    4: {
        // Thursday — Fikare Abat
        id: 'thursday',
        url: 'https://www.ethiopianorthodox.org/amharic/holydays/audio/thursday.mp3',
        title: 'ሐሙስ — ፍካሬ አባት',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: 'https://www.ethiopianorthodox.org/images/cross.jpg',
        duration: 1800,
    },
    5: {
        // Friday — Fikare Seqel (Cross)
        id: 'friday',
        url: 'https://www.ethiopianorthodox.org/amharic/holydays/audio/friday.mp3',
        title: 'ዓርብ — ፍካሬ ስቅለት',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: 'https://www.ethiopianorthodox.org/images/cross.jpg',
        duration: 1800,
    },
    6: {
        // Saturday — Fikare Mariam (Blessed Virgin)
        id: 'saturday',
        url: 'https://www.ethiopianorthodox.org/amharic/holydays/audio/saturday.mp3',
        title: 'ቅዳሜ — ፍካሬ ማርያም',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: 'https://www.ethiopianorthodox.org/images/cross.jpg',
        duration: 1800,
    },
};

let isSetup = false;

// ---------- Setup ----------

export async function setupAudioPlayer(): Promise<void> {
    if (isSetup) return;

    await TrackPlayer.setupPlayer({
        maxCacheSize: 1024 * 5, // 5MB cache
    });

    await TrackPlayer.updateOptions({
        capabilities: [
            Capability.Play,
            Capability.Pause,
            Capability.Stop,
        ],
        compactCapabilities: [Capability.Play, Capability.Pause],
        android: {
            appKilledPlaybackBehavior: AppKilledPlaybackBehavior.StopPlaybackAndRemoveNotification,
        },
    });

    isSetup = true;
}

// ---------- Daily Chant ----------

/**
 * Get today's chant track based on the current day.
 */
export function getTodayChant(): Track {
    const dayOfWeek = new Date().getDay();
    return DAILY_CHANTS[dayOfWeek];
}

/**
 * Load and play today's Ethiopian Orthodox chant.
 */
export async function playTodayChant(): Promise<void> {
    await setupAudioPlayer();

    const track = getTodayChant();

    await TrackPlayer.reset();
    await TrackPlayer.add([track]);
    await TrackPlayer.play();
}

/**
 * Pause the current chant.
 */
export async function pauseChant(): Promise<void> {
    await TrackPlayer.pause();
}

/**
 * Resume playing.
 */
export async function resumeChant(): Promise<void> {
    await TrackPlayer.play();
}

/**
 * Stop and reset the player.
 */
export async function stopChant(): Promise<void> {
    await TrackPlayer.stop();
    await TrackPlayer.reset();
}

/**
 * Get current playback state.
 */
export async function getPlaybackState(): Promise<State> {
    const { state } = await TrackPlayer.getPlaybackState();
    return state;
}

/**
 * Toggle play/pause.
 */
export async function togglePlayback(): Promise<void> {
    const state = await getPlaybackState();
    if (state === State.Playing) {
        await pauseChant();
    } else {
        await resumeChant();
    }
}

export { DAILY_CHANTS };
export default {
    setupAudioPlayer,
    getTodayChant,
    playTodayChant,
    pauseChant,
    resumeChant,
    stopChant,
    getPlaybackState,
    togglePlayback,
};
