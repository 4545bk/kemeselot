/**
 * Audio Service — Ethiopian Orthodox Mezmur Playback
 *
 * Uses expo-av for audio streaming and expo-speech TTS as fallback
 * when no audio URL is available.
 */

import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';

// Playback State
export enum State {
    None = 'none',
    Playing = 'playing',
    Paused = 'paused',
    Stopped = 'stopped',
    Buffering = 'buffering',
}

let sound: Audio.Sound | null = null;
let currentPlayState: State = State.None;
let isTTSMode = false;

// Track interface
export interface Track {
    id: string;
    url: string;
    title: string;
    artist: string;
    album: string;
    artwork: string;
    duration: number;
}

/**
 * Daily chant tracks.
 * When you upload audio to Cloudinary, fill in the URLs below.
 * Format: https://res.cloudinary.com/dgvkhkebj/video/upload/kemeselot/sunday_chant.mp3
 *
 * Until then, the app uses expo-speech TTS to read psalms aloud.
 */
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
    if (isSetup) return;
    isSetup = true;
    try {
        await Audio.setAudioModeAsync({
            playsInSilentModeIOS: true,
            staysActiveInBackground: true,
            shouldDuckAndroid: true,
        });
        console.log('[AudioService] Audio player setup complete');
    } catch (e) {
        console.error('[AudioService] Failed to set audio mode', e);
    }
}

export function getTodayChant(): Track {
    const dayOfWeek = new Date().getDay();
    return DAILY_CHANTS[dayOfWeek];
}

export function hasAudioUrl(): boolean {
    return getTodayChant().url.length > 0;
}

/**
 * Play today's chant via expo-av if URL is available.
 * Returns false if no URL (caller should use TTS fallback).
 */
export async function playTodayChant(): Promise<boolean> {
    const track = getTodayChant();
    if (!track.url) {
        console.log('[AudioService] No audio URL — use TTS fallback');
        return false;
    }

    try {
        await setupAudioPlayer();

        if (sound) {
            await sound.unloadAsync();
            sound = null;
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: track.url },
            { shouldPlay: true }
        );
        sound = newSound;
        currentPlayState = State.Playing;
        let currentTrackIndex = new Date().getDay();

        sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded) {
                if (status.isPlaying) currentPlayState = State.Playing;
                else if (status.isBuffering) currentPlayState = State.Buffering;
                else if (status.didJustFinish) {
                    currentPlayState = State.Stopped;
                    // Auto-advance to next mezmur
                    currentTrackIndex = (currentTrackIndex + 1) % 7;
                    const nextTrack = DAILY_CHANTS[currentTrackIndex];
                    if (nextTrack && nextTrack.url) {
                        playTrack(nextTrack.url).catch(e => console.error(e));
                    }
                }
                else currentPlayState = State.Paused;
            } else {
                currentPlayState = State.None;
            }
        });

        return true;
    } catch (e) {
        console.error('[AudioService] Failed to play chant:', e);
        return false;
    }
}

/** Helper to play a specific track by URL for auto-advancing */
async function playTrack(url: string): Promise<boolean> {
    try {
        if (sound) {
            await sound.unloadAsync();
            sound = null;
        }
        const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: url },
            { shouldPlay: true }
        );
        sound = newSound;
        currentPlayState = State.Playing;
        
        // Re-attach status listener for continuous playback
        let currentTrackIndex = Object.values(DAILY_CHANTS).findIndex(t => t.url === url) || 0;
        if (currentTrackIndex === -1) currentTrackIndex = 0;

        sound.setOnPlaybackStatusUpdate((status: any) => {
            if (status.isLoaded) {
                if (status.isPlaying) currentPlayState = State.Playing;
                else if (status.isBuffering) currentPlayState = State.Buffering;
                else if (status.didJustFinish) {
                    currentPlayState = State.Stopped;
                    currentTrackIndex = (currentTrackIndex + 1) % 7;
                    const nextTrack = DAILY_CHANTS[currentTrackIndex];
                    if (nextTrack && nextTrack.url) {
                        playTrack(nextTrack.url).catch(e => console.error(e));
                    }
                }
                else currentPlayState = State.Paused;
            }
        });
        return true;
    } catch(e) {
        return false;
    }
}

/**
 * TTS Fallback — Read a psalm text aloud.
 */
export async function speakPsalmText(text: string): Promise<void> {
    isTTSMode = true;
    currentPlayState = State.Playing;
    Speech.speak(text, {
        language: 'am-ET', // Amharic
        rate: 0.85,
        onDone: () => {
            currentPlayState = State.Stopped;
            isTTSMode = false;
        },
        onError: () => {
            currentPlayState = State.None;
            isTTSMode = false;
        },
    });
}

export async function stopTTS(): Promise<void> {
    if (isTTSMode) {
        Speech.stop();
        currentPlayState = State.Stopped;
        isTTSMode = false;
    }
}

export async function pauseChant(): Promise<void> {
    if (isTTSMode) {
        Speech.stop();
        currentPlayState = State.Paused;
    } else if (sound) {
        await sound.pauseAsync();
        currentPlayState = State.Paused;
    }
}

export async function resumeChant(): Promise<void> {
    if (sound && !isTTSMode) {
        await sound.playAsync();
        currentPlayState = State.Playing;
    }
}

export async function stopChant(): Promise<void> {
    if (isTTSMode) {
        Speech.stop();
        isTTSMode = false;
    }
    if (sound) {
        await sound.stopAsync();
    }
    currentPlayState = State.Stopped;
}

export async function getPlaybackState(): Promise<State> {
    if (isTTSMode) return currentPlayState;
    if (!sound) return State.None;
    try {
        const status = await sound.getStatusAsync();
        if (!status.isLoaded) return State.None;
        if (status.isPlaying) return State.Playing;
        if (status.isBuffering) return State.Buffering;
        return State.Paused;
    } catch {
        return State.None;
    }
}

export async function togglePlayback(): Promise<void> {
    if (!sound && !isTTSMode) {
        await playTodayChant();
    } else {
        const state = await getPlaybackState();
        if (state === State.Playing) {
            await pauseChant();
        } else {
            await resumeChant();
        }
    }
}

export { DAILY_CHANTS };
export default {
    setupAudioPlayer,
    getTodayChant,
    hasAudioUrl,
    playTodayChant,
    speakPsalmText,
    stopTTS,
    pauseChant,
    resumeChant,
    stopChant,
    getPlaybackState,
    togglePlayback,
};
