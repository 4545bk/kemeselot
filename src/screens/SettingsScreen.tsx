import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    StatusBar,
    Alert,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../theme';
import { useAppStore, PrayerMode, BlockedApp } from '../store/appStore';
import { setBlockedApps, startOverlayService, stopOverlayService, isServiceRunning } from '../services/overlayService';

// Common social media & time-wasting apps to block
const SUGGESTED_APPS: BlockedApp[] = [
    { packageName: 'com.instagram.android', appName: 'Instagram', isBlocked: false },
    { packageName: 'com.facebook.katana', appName: 'Facebook', isBlocked: false },
    { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', isBlocked: false },
    { packageName: 'com.twitter.android', appName: 'Twitter / X', isBlocked: false },
    { packageName: 'com.snapchat.android', appName: 'Snapchat', isBlocked: false },
    { packageName: 'com.google.android.youtube', appName: 'YouTube', isBlocked: false },
    { packageName: 'com.whatsapp', appName: 'WhatsApp', isBlocked: false },
    { packageName: 'org.telegram.messenger', appName: 'Telegram', isBlocked: false },
    { packageName: 'com.reddit.frontpage', appName: 'Reddit', isBlocked: false },
    { packageName: 'com.netflix.mediaclient', appName: 'Netflix', isBlocked: false },
];

const TIMER_OPTIONS = [
    { label: '2 min', value: 120 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '15 min', value: 900 },
    { label: '20 min', value: 1200 },
];

const QUOTA_OPTIONS = [1, 3, 5, 10, 15, 20];

const SettingsScreen: React.FC = () => {
    const {
        prayerMode,
        timerDuration,
        dailyQuota,
        blockedApps,
        setPrayerMode,
        setTimerDuration,
        setDailyQuota,
        setBlockedApps: setStoreBlockedApps,
    } = useAppStore();

    const [serviceActive, setServiceActive] = useState(false);
    const [localApps, setLocalApps] = useState<BlockedApp[]>([]);

    useEffect(() => {
        // Merge suggested apps with already-blocked ones from store
        const merged = SUGGESTED_APPS.map(app => {
            const stored = blockedApps.find(b => b.packageName === app.packageName);
            return stored ?? app;
        });
        setLocalApps(merged);

        isServiceRunning().then(setServiceActive);
    }, [blockedApps]);

    // Save blocked apps to native + store when changed
    const toggleApp = async (packageName: string) => {
        const updated = localApps.map(app =>
            app.packageName === packageName
                ? { ...app, isBlocked: !app.isBlocked }
                : app,
        );
        setLocalApps(updated);
        setStoreBlockedApps(updated);

        const blockedPackages = updated
            .filter(a => a.isBlocked)
            .map(a => a.packageName);
        await setBlockedApps(blockedPackages);
    };

    const toggleService = async () => {
        if (serviceActive) {
            await stopOverlayService();
            setServiceActive(false);
        } else {
            await startOverlayService();
            setServiceActive(true);
        }
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundDark} />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}>

                {/* Section: Prayer Guard Toggle */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>☦ Prayer Guard</Text>
                    <View style={styles.row}>
                        <View>
                            <Text style={styles.rowLabel}>
                                {serviceActive ? '🟢 Guard Active' : '🔴 Guard Inactive'}
                            </Text>
                            <Text style={styles.rowSubLabel}>
                                {serviceActive
                                    ? 'Monitoring blocked apps'
                                    : 'Tap to start monitoring'}
                            </Text>
                        </View>
                        <Switch
                            value={serviceActive}
                            onValueChange={toggleService}
                            trackColor={{ false: Colors.surfaceLight, true: Colors.crimsonLight }}
                            thumbColor={serviceActive ? Colors.gold : Colors.textMuted}
                        />
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Section: Prayer Mode */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🙏 Prayer Mode</Text>
                    <Text style={styles.sectionSubtitle}>
                        How do you want to pray when the lock appears?
                    </Text>
                    <View style={styles.modeRow}>
                        {(['silent', 'voice'] as PrayerMode[]).map(mode => (
                            <TouchableOpacity
                                key={mode}
                                style={[
                                    styles.modeButton,
                                    prayerMode === mode && styles.modeButtonActive,
                                ]}
                                onPress={() => setPrayerMode(mode)}
                                activeOpacity={0.8}>
                                <Text style={styles.modeIcon}>
                                    {mode === 'silent' ? '🤫' : '🎤'}
                                </Text>
                                <Text
                                    style={[
                                        styles.modeLabel,
                                        prayerMode === mode && styles.modeLabelActive,
                                    ]}>
                                    {mode === 'silent' ? 'Silent' : 'Voice'}
                                </Text>
                                <Text style={styles.modeDesc}>
                                    {mode === 'silent'
                                        ? 'Timer counts\ncontinuously'
                                        : 'Timer runs while\nspeaking'}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Section: Timer Duration */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>⏱ Prayer Duration</Text>
                    <Text style={styles.sectionSubtitle}>
                        How long must you pray before unlocking?
                    </Text>
                    <View style={styles.chipRow}>
                        {TIMER_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.chip,
                                    timerDuration === opt.value && styles.chipActive,
                                ]}
                                onPress={() => setTimerDuration(opt.value)}
                                activeOpacity={0.8}>
                                <Text
                                    style={[
                                        styles.chipText,
                                        timerDuration === opt.value && styles.chipTextActive,
                                    ]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Section: Daily Quota */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📖 Daily Psalm Quota</Text>
                    <Text style={styles.sectionSubtitle}>
                        Psalms to read per prayer session
                    </Text>
                    <View style={styles.chipRow}>
                        {QUOTA_OPTIONS.map(q => (
                            <TouchableOpacity
                                key={q}
                                style={[styles.chip, dailyQuota === q && styles.chipActive]}
                                onPress={() => setDailyQuota(q)}
                                activeOpacity={0.8}>
                                <Text
                                    style={[
                                        styles.chipText,
                                        dailyQuota === q && styles.chipTextActive,
                                    ]}>
                                    {q}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Section: Blocked Apps */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🚫 Blocked Apps</Text>
                    <Text style={styles.sectionSubtitle}>
                        Opening these apps will trigger the prayer lock
                    </Text>

                    {localApps.map(app => (
                        <View key={app.packageName} style={styles.appRow}>
                            <View style={styles.appInfo}>
                                <Text style={styles.appName}>{app.appName}</Text>
                                <Text style={styles.appPackage}>{app.packageName}</Text>
                            </View>
                            <Switch
                                value={app.isBlocked}
                                onValueChange={() => toggleApp(app.packageName)}
                                trackColor={{
                                    false: Colors.surfaceLight,
                                    true: Colors.crimsonLight,
                                }}
                                thumbColor={app.isBlocked ? Colors.crimson : Colors.textMuted}
                            />
                        </View>
                    ))}
                </View>

                <View style={styles.divider} />

                {/* Footer */}
                <Text style={styles.footer}>
                    ✞ ስብሐት ለእግዚአብሔር · Glory be to God
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDark,
    },
    scrollContent: {
        padding: Spacing.lg,
        paddingBottom: Spacing.xxl,
    },
    section: {
        marginVertical: Spacing.sm,
    },
    sectionTitle: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.gold,
        marginBottom: Spacing.xs,
    },
    sectionSubtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    divider: {
        height: 1,
        backgroundColor: Colors.surfaceLight,
        marginVertical: Spacing.md,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.surface,
        padding: Spacing.md,
        borderRadius: BorderRadius.lg,
        borderWidth: 1,
        borderColor: Colors.surfaceLight,
    },
    rowLabel: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    rowSubLabel: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
    modeRow: {
        flexDirection: 'row',
        gap: Spacing.md,
    },
    modeButton: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.lg,
        padding: Spacing.md,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: Colors.surfaceLight,
    },
    modeButtonActive: {
        borderColor: Colors.gold,
        backgroundColor: Colors.surfaceLight,
        ...Shadows.glow,
    },
    modeIcon: {
        fontSize: 28,
        marginBottom: Spacing.xs,
    },
    modeLabel: {
        fontSize: FontSize.md,
        fontWeight: '700',
        color: Colors.textSecondary,
        marginBottom: Spacing.xs,
    },
    modeLabelActive: {
        color: Colors.gold,
    },
    modeDesc: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        textAlign: 'center',
        lineHeight: 16,
    },
    chipRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm,
    },
    chip: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.round,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.surfaceLight,
    },
    chipActive: {
        backgroundColor: Colors.crimson,
        borderColor: Colors.crimson,
    },
    chipText: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    chipTextActive: {
        color: Colors.white,
    },
    appRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: Colors.surfaceLight,
    },
    appInfo: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    appName: {
        fontSize: FontSize.md,
        fontWeight: '500',
        color: Colors.textPrimary,
    },
    appPackage: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
        marginTop: 2,
    },
    footer: {
        fontSize: FontSize.sm,
        color: Colors.textMuted,
        textAlign: 'center',
        marginTop: Spacing.lg,
        fontStyle: 'italic',
    },
});

export default SettingsScreen;
