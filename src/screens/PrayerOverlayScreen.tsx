import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Dimensions,
    StatusBar,
    Image,
    BackHandler,
} from 'react-native';
import * as Speech from 'expo-speech';

import { State } from '../services/audioService';
import { Spacing, FontSize, BorderRadius, getShadows } from '../theme';
import { getTodayPsalms, getRandomTodayPsalm } from '../services/mezmureService';
import { unlockDevice } from '../services/overlayService';
import {
    playTodayChant,
    pauseChant,
    resumeChant,
    getPlaybackState,
    getTodayChant,
} from '../services/audioService';
import { getTodayWallpaper, changeWallpaperOnPrayer } from '../services/wallpaperService';
import { useAppStore } from '../store/appStore';
import { recordPrayerCompleted, dismissOverlay } from '../services/appBlockerService';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useThemeColors } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';

const { height } = Dimensions.get('window');

const PrayerOverlayScreen: React.FC = () => {
    const { colors } = useThemeColors();
    const { t } = useTranslation();
    const Shadows = getShadows(colors);
    const { 
        timerDuration, 
        prayerMode, 
        recordPrayerStreak,
        isFocusModeEnabled,
        focusHours,
        blockingMode,
        aiPrayerEnabled,
    } = useAppStore();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // If AI Prayer Mode is enabled, redirect immediately
    useEffect(() => {
        if (aiPrayerEnabled) {
            navigation.replace('AIPrayer');
        }
    }, [aiPrayerEnabled, navigation]);

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

    // Customizable mezmure settings (in-session)
    const [mezmureCount, setMezmureCount] = useState(5);
    const [mezmureInterval, setMezmureInterval] = useState(8);
    const [showConfig, setShowConfig] = useState(false);

    const allTodayPsalms = getTodayPsalms().psalms;
    const todayPsalms = allTodayPsalms.slice(0, Math.min(mezmureCount, allTodayPsalms.length));
    const currentPsalm = todayPsalms[psalmIndex] ?? getRandomTodayPsalm();
    const wallpaper = getTodayWallpaper();

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const progressAnim = useRef(new Animated.Value(1)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const speechActiveRef = useRef(false);

    // ---------- Smart Blocking Rules ----------
    const isCurrentlyFocusTime = useCallback(() => {
        if (!isFocusModeEnabled) return true;
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        
        const parseMins = (time: string) => {
            const [h, m] = time.split(':').map(Number);
            return (h || 0) * 60 + (m || 0);
        };
        
        const startMins = parseMins(focusHours.start);
        const endMins = parseMins(focusHours.end);
        
        if (startMins <= endMins) {
            return currentMins >= startMins && currentMins <= endMins;
        } else {
            return currentMins >= startMins || currentMins <= endMins;
        }
    }, [isFocusModeEnabled, focusHours]);

    useEffect(() => {
        if (!isCurrentlyFocusTime()) {
            dismissOverlay().catch(() => {});
            unlockDevice();
            BackHandler.exitApp();
        }
    }, [isCurrentlyFocusTime]);

    // ---------- Entry animation ----------
    useEffect(() => {
        if (isCurrentlyFocusTime()) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 600,
                useNativeDriver: true,
            }).start();
        }
    }, [fadeAnim, isCurrentlyFocusTime]);

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
                    recordPrayerCompleted().catch(() => { });
                    recordPrayerStreak();
                    changeWallpaperOnPrayer().catch(() => { });
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

    // ---------- Auto-scroll psalms ----------
    useEffect(() => {
        if (completed) return;
        const scrollInterval = setInterval(() => {
            setPsalmIndex(prev => (prev + 1) % todayPsalms.length);
        }, mezmureInterval * 1000);
        return () => clearInterval(scrollInterval);
    }, [completed, todayPsalms.length, mezmureInterval]);

    // ---------- Text-to-Speech ----------
    const startVoice = async () => {
        setIsListening(true);
        setSpeechDetected(true);
        setVoiceError(null);
        
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ]),
        ).start();

        const textToRead = currentPsalm.verses[1] || currentPsalm.verses[0];
        
        try {
            Speech.speak(textToRead, {
                language: 'en',
                pitch: 0.9,
                rate: 0.85,
                onDone: () => {
                    setIsListening(false);
                    setSpeechDetected(false);
                    pulseAnim.stopAnimation();
                    speechActiveRef.current = false;
                },
                onStart: () => {
                    speechActiveRef.current = true;
                },
                onError: (e: unknown) => {
                    setVoiceError('Failed to play audio');
                    setIsListening(false);
                    setSpeechDetected(false);
                    pulseAnim.stopAnimation();
                    speechActiveRef.current = false;
                }
            });
        } catch (err) {
            console.error('Speech error', err);
        }
    };

    const stopVoice = async () => {
        Speech.stop();
        setIsListening(false);
        speechActiveRef.current = false;
        setSpeechDetected(false);
        pulseAnim.stopAnimation();
    };

    useEffect(() => {
        return () => {
            Speech.stop();
        };
    }, []);

    useEffect(() => {
        if (prayerMode === 'voice') startVoice();
        return () => {
            Speech.stop();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [prayerMode, psalmIndex]);

    // ---------- Helpers ----------
    const formatTime = (s: number) =>
        `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const handleUnlock = () => {
        if (!completed) return;
        if (prayerMode === 'voice') stopVoice();
        pauseChant().catch(() => { });
        dismissOverlay().catch(() => { });
        unlockDevice();
        navigation.replace('PrayerResult');
    };

    const handleQuickSkip = () => {
        if (prayerMode === 'voice') stopVoice();
        pauseChant().catch(() => { });
        dismissOverlay().catch(() => { });
        unlockDevice();
        BackHandler.exitApp();
    };

    const progressWidth = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
    });

    // ---------- Render ----------
    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            {wallpaper.source ? (
                <Image
                    style={styles.wallpaper}
                    source={wallpaper.source}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.wallpaper, { backgroundColor: '#0a0a14' }]} />
            )}
            <View style={styles.darkOverlay} />

            <View style={styles.psalmOverlay}>
                <Text style={styles.psalmOverlayGeez}>{wallpaper.psalmVerse.geez}</Text>
                <Text style={styles.psalmOverlayEnglish}>{wallpaper.psalmVerse.english}</Text>
            </View>

            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>

                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.activeModeBadge}>
                        <Text style={styles.activeModeText}>
                            {blockingMode === 'strict' ? t('strict_focus') : t('flexible_focus')}
                        </Text>
                    </View>
                    <Text style={styles.crossSymbol}>✞</Text>
                    <Text style={styles.headerTitle}>{t('app_name_amharic')}</Text>
                    <Text style={styles.headerSubtitle}>
                        {prayerMode === 'voice' ? t('pray_aloud') : t('pray_silently')}
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

                {/* Mezmure Config Strip */}
                <TouchableOpacity
                    style={styles.configToggle}
                    onPress={() => setShowConfig(prev => !prev)}
                    activeOpacity={0.7}>
                    <Text style={styles.configToggleText}>
                        ⚙️ {mezmureCount} {t('mezmures_label')} · {mezmureInterval}s {t('interval_label')} {showConfig ? '▲' : '▼'}
                    </Text>
                </TouchableOpacity>

                {showConfig && (
                    <View style={styles.configPanel}>
                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>{t('mezmures_label')}</Text>
                            <View style={styles.configControls}>
                                <TouchableOpacity
                                    style={styles.configBtn}
                                    onPress={() => setMezmureCount(prev => Math.max(1, prev - 1))}>
                                    <Text style={styles.configBtnText}>−</Text>
                                </TouchableOpacity>
                                <Text style={styles.configValue}>{mezmureCount}</Text>
                                <TouchableOpacity
                                    style={styles.configBtn}
                                    onPress={() => setMezmureCount(prev => Math.min(allTodayPsalms.length, prev + 1))}>
                                    <Text style={styles.configBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                        <View style={styles.configRow}>
                            <Text style={styles.configLabel}>{t('interval_label')}</Text>
                            <View style={styles.configControls}>
                                {[5, 8, 15, 30].map(sec => (
                                    <TouchableOpacity
                                        key={sec}
                                        style={[styles.intervalChip, mezmureInterval === sec && styles.intervalChipActive]}
                                        onPress={() => setMezmureInterval(sec)}>
                                        <Text style={[styles.intervalChipText, mezmureInterval === sec && styles.intervalChipTextActive]}>
                                            {sec}s
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>
                )}

                {/* Psalm Card */}
                <View style={[styles.psalmCard, Shadows.glow]}>
                    <Text style={styles.psalmLabel}>
                        {currentPsalm.chapter} ({psalmIndex + 1}/{todayPsalms.length})
                    </Text>
                    <Text style={styles.psalmGeez}>{currentPsalm.verses[0]}</Text>
                    {currentPsalm.verses[1] && (
                        <Text style={styles.psalmEnglish}>{currentPsalm.verses[1]}</Text>
                    )}
                    <View style={styles.psalmIndicator}>
                        {todayPsalms.map((_, i) => (
                            <View
                                key={i}
                                style={[
                                    styles.dot,
                                    i === psalmIndex && styles.dotActive,
                                ]}
                            />
                        ))}
                    </View>
                </View>

                {/* Timer */}
                <View style={styles.timerSection}>
                    <Text style={styles.timerModeLabel}>
                        {prayerMode === 'voice'
                            ? isListening
                                ? speechDetected ? '🟢 Reading Psalm — Timer Running' : '🟡 Preparing audio…'
                                : '🔴 Audio Paused'
                            : t('silent_prayer')}
                    </Text>

                    <Animated.View
                        style={[
                            styles.timerCircle,
                            speechDetected && { transform: [{ scale: pulseAnim }], borderColor: colors.success },
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
                                {isListening ? t('pause_audio') : t('play_audio')}
                            </Text>
                        </TouchableOpacity>
                    )}

                    {blockingMode === 'flexible' && !completed && (
                        <TouchableOpacity
                            style={[styles.voiceButton, { marginTop: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.1)' }]}
                            onPress={handleQuickSkip}
                            activeOpacity={0.8}>
                            <Text style={styles.voiceButtonText}>
                                {t('skip_quick_access')}
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
                        {completed ? t('prayer_complete_unlock') : t('complete_prayer_unlock')}
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
    psalmOverlay: {
        position: 'absolute',
        bottom: 120,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
        zIndex: 0,
    },
    psalmOverlayGeez: {
        fontSize: FontSize.lg,
        color: 'rgba(212,175,55,0.35)',
        textAlign: 'center',
        fontWeight: '700',
        lineHeight: 28,
    },
    psalmOverlayEnglish: {
        fontSize: FontSize.sm,
        color: 'rgba(255,255,255,0.18)',
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 4,
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
    crossSymbol: { fontSize: 36, color: '#D4AF37', marginBottom: Spacing.xs },
    headerTitle: {
        fontSize: FontSize.h3,
        fontWeight: '700',
        color: '#D4AF37',
        letterSpacing: 2,
    },
    headerSubtitle: {
        fontSize: FontSize.xs,
        color: '#B0B0B0',
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
        borderColor: '#B8961E',
        gap: Spacing.sm,
    },
    audioIcon: { fontSize: 16 },
    audioTitle: {
        flex: 1,
        fontSize: FontSize.sm,
        color: '#E8E8E8',
        fontWeight: '500',
    },
    audioButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#8B0000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    audioButtonText: { fontSize: 18, color: '#FFFFFF' },
    configToggle: {
        width: '100%',
        paddingVertical: 6,
        paddingHorizontal: Spacing.md,
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    configToggleText: {
        color: '#B0B0B0',
        fontSize: FontSize.xs,
        fontWeight: '600',
    },
    configPanel: {
        width: '100%',
        backgroundColor: 'rgba(22,33,62,0.9)',
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: '#B8961E',
        gap: Spacing.sm,
    },
    configRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    configLabel: {
        color: '#B0B0B0',
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
    configControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    configBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#D4AF37',
        alignItems: 'center',
        justifyContent: 'center',
    },
    configBtnText: {
        color: '#000',
        fontSize: FontSize.lg,
        fontWeight: '700',
    },
    configValue: {
        color: '#D4AF37',
        fontSize: FontSize.lg,
        fontWeight: '700',
        minWidth: 30,
        textAlign: 'center',
    },
    intervalChip: {
        paddingVertical: 4,
        paddingHorizontal: Spacing.sm,
        borderRadius: BorderRadius.round,
        borderWidth: 1,
        borderColor: '#6B7280',
    },
    intervalChipActive: {
        backgroundColor: '#D4AF37',
        borderColor: '#D4AF37',
    },
    intervalChipText: {
        color: '#B0B0B0',
        fontSize: FontSize.xs,
        fontWeight: '600',
    },
    intervalChipTextActive: {
        color: '#000',
    },
    psalmCard: {
        width: '100%',
        backgroundColor: 'rgba(22,33,62,0.88)',
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: '#B8961E',
        alignItems: 'center',
    },
    psalmLabel: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        color: '#D4AF37',
        letterSpacing: 1,
        marginBottom: Spacing.sm,
    },
    psalmGeez: {
        fontSize: FontSize.lg,
        color: '#E8E8E8',
        textAlign: 'center',
        lineHeight: 28,
        marginBottom: Spacing.sm,
    },
    psalmEnglish: {
        fontSize: FontSize.md,
        color: '#B0B0B0',
        textAlign: 'center',
        fontStyle: 'italic',
        lineHeight: 22,
    },
    psalmIndicator: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
        marginTop: Spacing.md,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    dotActive: {
        backgroundColor: '#D4AF37',
        width: 20,
        borderRadius: 4,
    },
    timerSection: { width: '100%', alignItems: 'center' },
    timerModeLabel: {
        fontSize: FontSize.sm,
        color: '#B0B0B0',
        marginBottom: Spacing.md,
        textAlign: 'center',
    },
    timerCircle: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: 'rgba(22,33,62,0.9)',
        borderWidth: 3,
        borderColor: '#D4AF37',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    timerText: { fontSize: FontSize.xxl, fontWeight: '700', color: '#D4AF37' },
    timerComplete: { color: '#10B981', fontSize: FontSize.h3 },
    progressTrack: {
        width: '100%',
        height: 6,
        backgroundColor: '#1F2B47',
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    progressFill: { height: '100%', backgroundColor: '#D4AF37', borderRadius: 3 },
    voiceButton: {
        marginTop: Spacing.sm,
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.round,
        borderWidth: 1.5,
        borderColor: '#B0B0B0',
    },
    voiceButtonActive: {
        borderColor: '#10B981',
        backgroundColor: 'rgba(16,185,129,0.12)',
    },
    voiceButtonText: { fontSize: FontSize.sm, color: '#E8E8E8', fontWeight: '600' },
    voiceError: { fontSize: FontSize.xs, color: '#EF4444', marginTop: Spacing.xs, textAlign: 'center' },
    unlockButton: {
        width: '100%',
        backgroundColor: '#10B981',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    unlockButtonDisabled: { backgroundColor: 'rgba(107,114,128,0.5)' },
    unlockButtonText: { fontSize: FontSize.md, fontWeight: '700', color: '#FFFFFF', letterSpacing: 0.5 },
    activeModeBadge: {
        backgroundColor: 'rgba(212, 175, 55, 0.2)',
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.round,
        borderWidth: 1,
        borderColor: '#D4AF37',
    },
    activeModeText: {
        color: '#D4AF37',
        fontSize: FontSize.sm,
        fontWeight: 'bold',
    },
});

export default PrayerOverlayScreen;
