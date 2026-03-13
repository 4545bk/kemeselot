/**
 * Audio Service — Stub (Track Player removed for clean build)
 *
 * All functions are no-ops. Will be re-implemented once
 * the base app is building successfully.
 */

// Stub State enum to match track-player API
export enum State {
    None = 'none',
    Playing = 'playing',
    Paused = 'paused',
    Stopped = 'stopped',
}

// Daily chant data (kept for UI display)
export interface Track {
    id: string;
    url: string;
    title: string;
    artist: string;
    album: string;
    artwork: string;
    duration: number;
}

const DAILY_CHANTS: Record<number, Track> = {
    0: {
        id: 'sunday',
        url: '',
        title: 'እሑድ — ፍካሬ ምስጢር',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: '',
        duration: 1800,
    },
    1: {
        id: 'monday',
        url: '',
        title: 'ሰኞ — ፍካሬ ጸጋ',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: '',
        duration: 1800,
    },
    2: {
        id: 'tuesday',
        url: '',
        title: 'ማክሰኞ — ፍካሬ ገዳም',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: '',
        duration: 1800,
    },
    3: {
        id: 'wednesday',
        url: '',
        title: 'ረቡዕ — ፍካሬ መድኃኒት',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: '',
        duration: 1800,
    },
    4: {
        id: 'thursday',
        url: '',
        title: 'ሐሙስ — ፍካሬ አባት',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: '',
        duration: 1800,
    },
    5: {
        id: 'friday',
        url: '',
        title: 'ዓርብ — ፍካሬ ስቅለት',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: '',
        duration: 1800,
    },
    6: {
        id: 'saturday',
        url: '',
        title: 'ቅዳሜ — ፍካሬ ማርያም',
        artist: 'Ethiopian Orthodox Tewahedo Church',
        album: 'Daily Mezmur',
        artwork: '',
        duration: 1800,
    },
};

let isSetup = false;

export async function setupAudioPlayer(): Promise<void> {
    isSetup = true;
    console.log('[AudioService] Stub: audio player setup skipped');
}

export function getTodayChant(): Track {
    const dayOfWeek = new Date().getDay();
    return DAILY_CHANTS[dayOfWeek];
}

export async function playTodayChant(): Promise<void> {
    console.log('[AudioService] Stub: playback skipped');
}

export async function pauseChant(): Promise<void> {}
export async function resumeChant(): Promise<void> {}
export async function stopChant(): Promise<void> {}

export async function getPlaybackState(): Promise<State> {
    return State.None;
}

export async function togglePlayback(): Promise<void> {}

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
