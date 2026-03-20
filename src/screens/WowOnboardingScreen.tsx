import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    StatusBar,
    Alert,
    Linking,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../theme';
import {
    setBlockedApps as nativeSetBlockedApps,
    hasOverlayPermission,
    requestOverlayPermission,
    isAccessibilityServiceEnabled,
    openAccessibilitySettings,
} from '../services/appBlockerService';
import { useAppStore } from '../store/appStore';

// Popular distracting apps with emoji icons
const DISTRACTION_APPS = [
    { packageName: 'com.instagram.android', label: '📸 Instagram', color: '#E1306C' },
    { packageName: 'com.zhiliaoapp.musically', label: '🎵 TikTok', color: '#00F2EA' },
    { packageName: 'com.google.android.youtube', label: '▶️ YouTube', color: '#FF0000' },
    { packageName: 'com.facebook.katana', label: '👤 Facebook', color: '#1877F2' },
    { packageName: 'com.twitter.android', label: '🐦 X / Twitter', color: '#1DA1F2' },
    { packageName: 'com.snapchat.android', label: '👻 Snapchat', color: '#FFFC00' },
    { packageName: 'com.reddit.frontpage', label: '🔴 Reddit', color: '#FF4500' },
    { packageName: 'org.telegram.messenger', label: '✈️ Telegram', color: '#0088CC' },
];

interface Props {
    onComplete: () => void;
}

const WowOnboardingScreen: React.FC<Props> = ({ onComplete }) => {
    const [step, setStep] = useState<'welcome' | 'pick' | 'permissions' | 'try'>(
        'welcome',
    );
    const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
    const { setBlockedApps: setStoreBlockedApps } = useAppStore();

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(40)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, [step]);

    // Pulse animation for the try-it button
    useEffect(() => {
        if (step === 'try') {
            const pulse = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.05,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 800,
                        useNativeDriver: true,
                    }),
                ]),
            );
            pulse.start();
            return () => pulse.stop();
        }
    }, [step]);

    const animateTransition = (nextStep: typeof step) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            setStep(nextStep);
            slideAnim.setValue(40);
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 400,
                    useNativeDriver: true,
                }),
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 400,
                    useNativeDriver: true,
                }),
            ]).start();
        });
    };

    const toggleApp = (pkg: string) => {
        setSelectedApps(prev => {
            const next = new Set(prev);
            if (next.has(pkg)) next.delete(pkg);
            else next.add(pkg);
            return next;
        });
    };

    const handleBlock = async () => {
        if (selectedApps.size === 0) {
            Alert.alert('Pick at least one', 'Select an app to block first! 🙏');
            return;
        }

        // Check permissions first
        const hasOverlay = await hasOverlayPermission();
        const hasAccess = await isAccessibilityServiceEnabled();

        if (!hasOverlay || !hasAccess) {
            animateTransition('permissions');
            return;
        }

        await blockAndProceed();
    };

    const handlePermissions = async () => {
        const hasOverlay = await hasOverlayPermission();
        if (!hasOverlay) {
            await requestOverlayPermission();
            Alert.alert(
                'Enable Overlay',
                'Turn ON "Allow display over other apps" for ከመ-ፀሎት, then come back.',
                [{ text: 'OK' }],
            );
            return;
        }

        const hasAccess = await isAccessibilityServiceEnabled();
        if (!hasAccess) {
            openAccessibilitySettings();
            Alert.alert(
                'Enable Accessibility',
                'Find "Kemeselot Prayer Guard" and turn it ON, then come back.',
                [{ text: 'OK' }],
            );
            return;
        }

        await blockAndProceed();
    };

    const blockAndProceed = async () => {
        // Block the selected apps
        const blockedList = Array.from(selectedApps);
        const storeApps = blockedList.map(pkg => {
            const found = DISTRACTION_APPS.find(a => a.packageName === pkg);
            return {
                packageName: pkg,
                appName: found?.label ?? pkg,
                isBlocked: true,
            };
        });
        setStoreBlockedApps(storeApps);
        await nativeSetBlockedApps(blockedList);

        animateTransition('try');
    };

    const handleDone = () => {
        useAppStore.getState().setOnboardingDone(true);
        onComplete();
    };

    const tryOpenApp = () => {
        const firstApp = Array.from(selectedApps)[0];
        if (firstApp) {
            Linking.openURL(`market://details?id=${firstApp}`).catch(() => {
                // If Play Store doesn't open, try launching the app directly
                Linking.openURL(`intent://#Intent;package=${firstApp};end`).catch(() => {});
            });
        }
    };

    // ==================== RENDER ====================

    const renderWelcome = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.crossIcon}>✞</Text>
            <Text style={styles.appTitle}>ከመ-ፀሎት</Text>
            <Text style={styles.subtitle}>Prayer Guard</Text>

            <View style={styles.divider} />

            <Text style={styles.headline}>
                What if every distraction{'\n'}became a prayer?
            </Text>
            <Text style={styles.body}>
                Instead of mindlessly scrolling, you'll pray.{'\n'}
                Let's set it up in 30 seconds.
            </Text>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => animateTransition('pick')}
                activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>Let's Go →</Text>
            </TouchableOpacity>
        </View>
    );

    const renderPick = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.pickEmoji}>🚫</Text>
            <Text style={styles.headline}>
                Block your first{'\n'}distraction
            </Text>
            <Text style={styles.body}>
                Pick the app that wastes most of your time.
                We'll lock it behind prayer.
            </Text>

            <View style={styles.appGrid}>
                {DISTRACTION_APPS.map(app => {
                    const selected = selectedApps.has(app.packageName);
                    return (
                        <TouchableOpacity
                            key={app.packageName}
                            style={[
                                styles.appChip,
                                selected && { borderColor: app.color, backgroundColor: `${app.color}20` },
                            ]}
                            onPress={() => toggleApp(app.packageName)}
                            activeOpacity={0.7}>
                            <Text style={[
                                styles.appChipText,
                                selected && { color: '#fff' },
                            ]}>
                                {selected ? '✓ ' : ''}{app.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <TouchableOpacity
                style={[
                    styles.primaryButton,
                    selectedApps.size === 0 && styles.disabledButton,
                ]}
                onPress={handleBlock}
                activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>
                    🔒 Block {selectedApps.size > 0 ? `${selectedApps.size} App${selectedApps.size > 1 ? 's' : ''}` : '...'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderPermissions = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.pickEmoji}>🔐</Text>
            <Text style={styles.headline}>
                Almost there!
            </Text>
            <Text style={styles.body}>
                ከመ-ፀሎት needs two permissions to block apps:{'\n\n'}
                1️⃣ <Text style={styles.bold}>Draw over apps</Text> — to show the prayer screen{'\n'}
                2️⃣ <Text style={styles.bold}>Accessibility</Text> — to detect when blocked apps open
            </Text>

            <TouchableOpacity
                style={styles.primaryButton}
                onPress={handlePermissions}
                activeOpacity={0.85}>
                <Text style={styles.primaryButtonText}>Grant Permissions</Text>
            </TouchableOpacity>

            <Text style={styles.hint}>
                You'll be redirected to Android Settings
            </Text>
        </View>
    );

    const renderTry = () => {
        const firstApp = Array.from(selectedApps)[0];
        const appInfo = DISTRACTION_APPS.find(a => a.packageName === firstApp);

        return (
            <View style={styles.stepContainer}>
                <Text style={styles.pickEmoji}>🎉</Text>
                <Text style={styles.headline}>
                    Done! It's active.
                </Text>
                <Text style={styles.body}>
                    {selectedApps.size} app{selectedApps.size > 1 ? 's are' : ' is'} now locked behind prayer.
                    {'\n\n'}Try opening <Text style={styles.bold}>{appInfo?.label ?? 'the blocked app'}</Text> — you'll see the prayer lock!
                </Text>

                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: '#8B0000' }]}
                        onPress={tryOpenApp}
                        activeOpacity={0.85}>
                        <Text style={styles.primaryButtonText}>
                            Open {appInfo?.label ?? 'Blocked App'} →
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleDone}
                    activeOpacity={0.8}>
                    <Text style={styles.secondaryButtonText}>Start Using ከመ-ፀሎት ✞</Text>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" backgroundColor="#0A0A14" translucent />
            <Animated.View
                style={[
                    styles.content,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    },
                ]}>
                {step === 'welcome' && renderWelcome()}
                {step === 'pick' && renderPick()}
                {step === 'permissions' && renderPermissions()}
                {step === 'try' && renderTry()}

                {/* Step dots */}
                <View style={styles.dots}>
                    {['welcome', 'pick', 'permissions', 'try'].map((s, i) => (
                        <View
                            key={s}
                            style={[
                                styles.dot,
                                (s === step || ['welcome', 'pick', 'permissions', 'try'].indexOf(step) > i) && styles.dotActive,
                            ]}
                        />
                    ))}
                </View>
            </Animated.View>
        </View>
    );
};

// Helper to check if onboarding is needed
export function isOnboardingDone(): boolean {
    return useAppStore.getState().onboardingDone;
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#0A0A14',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    stepContainer: {
        alignItems: 'center',
    },
    crossIcon: {
        fontSize: 56,
        color: Colors.gold,
        marginBottom: Spacing.sm,
        textShadowColor: 'rgba(212,175,55,0.5)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    appTitle: {
        fontSize: 42,
        fontWeight: '800',
        color: Colors.gold,
        letterSpacing: 2,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: '#8B7355',
        letterSpacing: 4,
        fontWeight: '600',
        marginBottom: Spacing.lg,
    },
    divider: {
        width: 100,
        height: 2,
        backgroundColor: 'rgba(212,175,55,0.3)',
        marginBottom: Spacing.xl,
    },
    headline: {
        fontSize: 26,
        fontWeight: '700',
        color: '#EEEEF2',
        textAlign: 'center',
        lineHeight: 34,
        marginBottom: Spacing.md,
    },
    body: {
        fontSize: FontSize.md,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.md,
    },
    bold: {
        color: '#D0D0D8',
        fontWeight: '700',
    },
    pickEmoji: {
        fontSize: 48,
        marginBottom: Spacing.md,
    },
    appGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: Spacing.sm,
        marginBottom: Spacing.xl,
    },
    appChip: {
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md + 4,
        borderRadius: BorderRadius.round,
        backgroundColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.12)',
    },
    appChipText: {
        fontSize: FontSize.md,
        color: '#B0B0B8',
        fontWeight: '600',
    },
    primaryButton: {
        backgroundColor: Colors.crimson,
        paddingVertical: Spacing.md + 4,
        paddingHorizontal: Spacing.xxl,
        borderRadius: BorderRadius.round,
        alignItems: 'center',
        width: '100%',
        marginBottom: Spacing.md,
        elevation: 6,
        shadowColor: Colors.crimson,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
    },
    disabledButton: {
        backgroundColor: '#333',
        elevation: 0,
        shadowOpacity: 0,
    },
    primaryButtonText: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: '#fff',
    },
    secondaryButton: {
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.xl,
        marginTop: Spacing.sm,
    },
    secondaryButtonText: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.gold,
    },
    hint: {
        fontSize: FontSize.sm,
        color: '#6B7280',
        marginTop: Spacing.sm,
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginTop: Spacing.xxl,
    },
    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.15)',
    },
    dotActive: {
        backgroundColor: Colors.gold,
        width: 24,
    },
});

export default WowOnboardingScreen;
