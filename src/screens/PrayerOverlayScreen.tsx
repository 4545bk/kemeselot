import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    StatusBar,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Voice, {
    SpeechResultsEvent,
    SpeechErrorEvent,
} from '@react-native-voice/voice';
import { State } from 'react-native-track-player';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../theme';
import { getTodayPsalms, getRandomTodayPsalm } from '../services/mezmureService';
import { dismissOverlay } from '../services/overlayService';
import {
    playTodayChant,
    pauseChant,
    resumeChant,
    getPlaybackState,
    getTodayChant,
} from '../services/audioService';
import { getTodayWallpaper } from '../services/wallpaperService';
import { useAppStore } from '../store/appStore';

const { height } = Dimensions.get('window');

const PrayerOverlayScreen: React.FC = () => {
    const { timerDuration, prayerMode } = useAppStore();

    const [timeLeft, setTimeLeft] = useState(timerDuration);
    const [completed, setCompleted] = useState(false);
    const [psalmIndex, setPsalmIndex] = useState(0);

    // Voice mode state
    const [isListening, setIsListening] = useState(false);
    const [speechDetected, setSpeechDetected] = useState(false);
    const [voiceError, setVoiceError] = useState<string | null>(null);

    // Audio state
    const [isPlaying, setIsPlaying] = useState(false);
    const [chantTitle, setChantTitle] = useState('');

    const todayPsalms = getTodayPsalms().psalms;
    const currentPsalm = todayPsalms[psalmIndex] ?? getRandomTodayPsalm();
    const wallpaper = getTodayWallpaper();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const speechActiveRef = useRef(false);

    // ---------- Entry animation ----------
    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    // ---------- Audio setup ----------
    useEffect(() => {
        const track = getTodayChant();
        setChantTitle(track.title as string);

        playTodayChant()
            .then(() => setIsPlaying(true))
            .catch(() => setIsPlaying(false));

        return () => {
            pauseChant().catch(() => { });
        };
    }, []);

    const toggleAudio = async () => {
        const state = await getPlaybackState();
        if (state === State.Playing) {
            await pauseChant();
            setIsPlaying(false);
        } else {
            await resumeChant();
            setIsPlaying(true);
        }
    };

    // ---------- Progress bar ----------
    useEffect(() => {
        Animated.timing(progressAnim, {
            toValue: 0,
            duration: timerDuration * 1000,
            useNativeDriver: false,
        }).start();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ---------- Timer ----------
    const startTimer = useCallback(() => {
        if (timerRef.current) return;
        timerRef.current = setInterval(() => {
            if (prayerMode === 'voice' && !speechActiveRef.current) return;
            setTimeLeft(prev => {
                if (prev <= 1) {
                    if (timerRef.current) clearInterval(timerRef.current);
                    timerRef.current = null;
                    setCompleted(true);
                    if (prayerMode === 'voice') stopVoice();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }, [prayerMode]);

    useEffect(() => {
        startTimer();
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [startTimer]);

    // ---------- Voice ----------
    const startVoice = async () => {
        try {
            await Voice.start('am-ET');
            setIsListening(true);
            setVoiceError(null);
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
                ]),
            ).start();
        } catch {
            try {
                await Voice.start('en-US');
                setIsListening(true);
            } catch {
                setVoiceError('Microphone unavailable');
            }
        }
    };

    const stopVoice = async () => {
        try { await Voice.stop(); await Voice.destroy(); } catch { }
        setIsListening(false);
        speechActiveRef.current = false;
        setSpeechDetected(false);
        pulseAnim.stopAnimation();
    };

    useEffect(() => {
        Voice.onSpeechStart = () => { speechActiveRef.current = true; setSpeechDetected(true); };
        Voice.onSpeechEnd = () => {
            speechActiveRef.current = false;
            setSpeechDetected(false);
            if (isListening && !completed) {
                Voice.start('am-ET').catch(() => Voice.start('en-US').catch(() => { }));
            }
        };
        Voice.onSpeechResults = (_e: SpeechResultsEvent) => { speechActiveRef.current = true; };
        Voice.onSpeechError = (_e: SpeechErrorEvent) => { speechActiveRef.current = false; setSpeechDetected(false); };
        return () => { Voice.destroy().then(Voice.removeAllListeners); };
    }, [isListening, completed]);

    useEffect(() => {
        if (prayerMode === 'voice') startVoice();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prayerMode]);

    // ---------- Helpers ----------
    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const handleUnlock = () => {
        if (!completed) return;
        if (prayerMode === 'voice') stopVoice();
        pauseChant().catch(() => { });
        dismissOverlay();
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    // ---------- Render ----------
    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {/* Wallpaper Background */}
            <FastImage
                style={styles.wallpaper}
                source={{ uri: wallpaper.uri, priority: FastImage.priority.high }}
                resizeMode={FastImage.resizeMode.cover}
            />
            {/* Dark overlay for legibility */}
            <View style={styles.darkOverlay} />

            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.crossSymbol}>✞</Text>
                    <Text style={styles.headerTitle}>ቀመሰሎት</Text>
                    <Text style={styles.headerSubtitle}>
                        {prayerMode === 'voice'
                            ? 'Pray aloud — timer runs while speaking'
                            : 'Pray silently — timer runs continuously'}
                    </Text>
                </View>

                {/* Audio Player Strip */}
                <View style={styles.audioStrip}>
                    <Text style={styles.audioIcon}>🎵</Text>
                    <Text style={styles.audioTitle} numberOfLines={1}>{chantTitle}</Text>
                    <TouchableOpacity onPress={toggleAudio} style={styles.audioButton}>
                        <Text style={styles.audioButtonText}>{isPlaying ? '⏸' : '▶'}</Text>
                    </TouchableOpacity>
                </View>

                {/* Psalm Card */}
                <View style={styles.psalmCard}>
                    <Text style={styles.psalmLabel}>
                        {currentPsalm.chapter}
                    </Text>
                    <Text style={styles.psalmGeez}>{currentPsalm.verses[0]}</Text>
                    <Text style={styles.psalmEnglish}>{currentPsalm.verses[1] || ''}</Text>
                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={() => setPsalmIndex((psalmIndex + 1) % todayPsalms.length)}
                        activeOpacity={0.7}>
                        <Text style={styles.nextButtonText}>Next Psalm →</Text>
                    </TouchableOpacity>
                </View>

                {/* Timer */}
                <View style={styles.timerSection}>
                    <Text style={styles.timerModeLabel}>
                        {prayerMode === 'voice'
                            ? isListening
                                ? speechDetected ? '🟢 Speaking — Timer Running' : '🟡 Listening… Speak to continue'
                                : '🔴 Mic Paused'
                            : '🤫 Silent Prayer'}
                    </Text>

                    <Animated.View
                        style={[
                            styles.timerCircle,
                            speechDetected && { transform: [{ scale: pulseAnim }], borderColor: Colors.success },
                        ]}>
                        <Text style={[styles.timerText, completed && styles.timerComplete]}>
                            {completed ? '✓' : formatTime(timeLeft)}
                        </Text>
                    </Animated.View>

                    <View style={styles.progressTrack}>
                        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
                    </View>

                    {prayerMode === 'voice' && !completed && (
                        <TouchableOpacity
                            style={[styles.voiceButton, isListening && styles.voiceButtonActive]}
                            onPress={isListening ? stopVoice : startVoice}
                            activeOpacity={0.8}>
                            <Text style={styles.voiceButtonText}>
                                {isListening ? '⏸ Pause Mic' : '🎤 Resume Mic'}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {voiceError && <Text style={styles.voiceError}>⚠️ {voiceError}</Text>}
                </View>

                {/* Unlock Button */}
                <TouchableOpacity
                    style={[styles.unlockButton, !completed && styles.unlockButtonDisabled]}
                    onPress={handleUnlock}
                    activeOpacity={completed ? 0.8 : 1}
                    disabled={!completed}>
                    <Text style={styles.unlockButtonText}>
                        {completed ? '🔓 Prayer Complete — Unlock' : '🔒 Complete Prayer to Unlock'}
                    </Text>
                </TouchableOpacity>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    wallpaper: {
        ...StyleSheet.absoluteFillObject,
    },
    darkOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(10, 10, 20, 0.72)',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: Spacing.xxl + 12,
        paddingBottom: Spacing.xl,
        paddingHorizontal: Spacing.lg,
    },
    header: { alignItems: 'center' },
    crossSymbol: { fontSize: 36, color: Colors.gold, marginBottom: Spacing.xs },
    headerTitle: {
        fontSize: FontSize.h3,
        fontWeight: '700',
        color: Colors.gold,
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: FontSize.xs,
        color: Colors.textSecondary,
        marginTop: Spacing.xs,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    audioStrip: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(22,33,62,0.85)',
        borderRadius: BorderRadius.lg,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderWidth: 1,
        borderColor: Colors.goldDark,
        gap: Spacing.sm,
    },
    audioIcon: { fontSize: 16 },
    audioTitle: {
        flex: 1,
        fontSize: FontSize.sm,
        color: Colors.textPrimary,
        fontWeight: '500',
    },
    audioButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Colors.crimson,
        alignItems: 'center',
        justifyContent: 'center',
    },
    audioButtonText: { fontSize: 18, color: Colors.white },
    psalmCard: {
        width: '100%',
        backgroundColor: 'rgba(22,33,62,0.88)',
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.goldDark,
        alignItems: 'center',
        ...Shadows.glow,
    },
    psalmLabel: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        color: Colors.gold,
        letterSpacing: 1,
        marginBottom: Spacing.sm,
    },
    psalmGeez: {
        fontSize: FontSize.lg,
        color: Colors.textPrimary,
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: Spacing.sm,
    },
    psalmEnglish: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 22,
    },
    nextButton: {
        marginTop: Spacing.md,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.round,
        borderWidth: 1,
        borderColor: Colors.goldDark,
    },
    nextButtonText: { fontSize: FontSize.sm, color: Colors.gold },
    timerSection: { width: '100%', alignItems: 'center' },
    timerModeLabel: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    timerCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(22,33,62,0.9)',
        borderWidth: 3,
        borderColor: Colors.gold,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
        ...Shadows.glow,
    },
    timerText: { fontSize: FontSize.xxl, fontWeight: '700', color: Colors.gold },
    timerComplete: { color: Colors.success, fontSize: FontSize.h3 },
    progressTrack: {
        width: '100%',
        height: 6,
        backgroundColor: Colors.surfaceLight,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    progressFill: { height: '100%', backgroundColor: Colors.gold, borderRadius: 3 },
    voiceButton: {
        marginTop: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.round,
        borderWidth: 1.5,
        borderColor: Colors.textSecondary,
    },
    voiceButtonActive: {
        borderColor: Colors.success,
        backgroundColor: 'rgba(16,185,129,0.12)',
    },
    voiceButtonText: { fontSize: FontSize.sm, color: Colors.textPrimary, fontWeight: '600' },
    voiceError: { fontSize: FontSize.xs, color: Colors.error, marginTop: Spacing.xs, textAlign: 'center' },
    unlockButton: {
        width: '100%',
        backgroundColor: Colors.success,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        ...Shadows.lg,
    },
    unlockButtonDisabled: { backgroundColor: 'rgba(107,114,128,0.5)' },
    unlockButtonText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.white, letterSpacing: 0.5 },
});

export default PrayerOverlayScreen;
