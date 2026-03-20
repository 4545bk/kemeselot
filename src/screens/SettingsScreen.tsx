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
    TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Spacing, FontSize, BorderRadius, getShadows } from '../theme';
import { useAppStore, PrayerMode, BlockedApp } from '../store/appStore';
import { useThemeColors } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';
import { LANGUAGE_NAMES, LanguageCode } from '../i18n/translations';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import {
    setBlockedApps as nativeSetBlockedApps,
    getBlockedApps,
    getInstalledApps,
    isAccessibilityServiceEnabled,
    openAccessibilitySettings,
    hasOverlayPermission,
    requestOverlayPermission,
    isServiceRunning,
    setDailyPrayerGoal,
    getDailyPrayerGoal,
} from '../services/appBlockerService';

const TIMER_OPTIONS = [
    { label: '2 min', value: 120 },
    { label: '5 min', value: 300 },
    { label: '10 min', value: 600 },
    { label: '15 min', value: 900 },
    { label: '20 min', value: 1200 },
];

const PRAYER_GOAL_OPTIONS = [
    { label: '1× / day', value: 1 },
    { label: '2× / day', value: 2 },
    { label: '3× / day', value: 3 },
];

const QUOTA_OPTIONS = [1, 3, 5, 10, 15, 20];

const POPULAR_APPS = [
    { packageName: 'com.instagram.android', appName: '📸 Instagram' },
    { packageName: 'com.facebook.katana', appName: '👤 Facebook' },
    { packageName: 'com.zhiliaoapp.musically', appName: '🎵 TikTok' },
    { packageName: 'com.twitter.android', appName: '🐦 Twitter / X' },
    { packageName: 'com.snapchat.android', appName: '👻 Snapchat' },
    { packageName: 'com.google.android.youtube', appName: '▶️ YouTube' },
    { packageName: 'com.whatsapp', appName: '💬 WhatsApp' },
    { packageName: 'org.telegram.messenger', appName: '✈️ Telegram' },
    { packageName: 'com.reddit.frontpage', appName: '🔴 Reddit' },
    { packageName: 'com.netflix.mediaclient', appName: '🎬 Netflix' },
];

interface DeviceApp {
    packageName: string;
    appName: string;
    isBlocked: boolean;
}

const LANGUAGE_OPTIONS: { code: LanguageCode; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'am', label: 'አማርኛ' },
    { code: 'or', label: 'Afaan Oromoo' },
    { code: 'ti', label: 'ትግርኛ' },
];

const SettingsScreen: React.FC = () => {
    const navigation = useNavigation<any>();
    const { colors, mode, setThemeMode, isDark } = useThemeColors();
    const { t, language, setLanguage } = useTranslation();
    const Shadows = getShadows(colors);

    const {
        prayerMode,
        timerDuration,
        dailyQuota,
        blockedApps,
        wallpaperEnabled,
        wallpaperFrequency,
        setPrayerMode,
        setTimerDuration,
        setDailyQuota,
        setBlockedApps: setStoreBlockedApps,
        setWallpaperEnabled,
        setWallpaperFrequency,
        isFocusModeEnabled,
        focusHours,
        blockingMode,
        setFocusModeEnabled,
        setFocusHours,
        setBlockingMode,
        aiPrayerEnabled,
        setAiPrayerEnabled,
        isPremium,
        authUser,
        logout,
    } = useAppStore();

    const [serviceActive, setServiceActive] = useState(false);
    const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
    const [overlayGranted, setOverlayGranted] = useState(false);
    const [deviceApps, setDeviceApps] = useState<DeviceApp[]>([]);
    const [popularApps, setPopularApps] = useState<DeviceApp[]>([]);
    const [blockAll, setBlockAll] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [loadingApps, setLoadingApps] = useState(true);
    const [prayerGoal, setPrayerGoal] = useState(1);

    useEffect(() => {
        const loadApps = async () => {
            setLoadingApps(true);
            const installed = await getInstalledApps();
            const blockedSet = new Set(
                blockedApps.filter(a => a.isBlocked).map(a => a.packageName)
            );

            const popularPackages = new Set(POPULAR_APPS.map(a => a.packageName));
            const pApps: DeviceApp[] = POPULAR_APPS.map(app => ({
                ...app,
                isBlocked: blockedSet.has(app.packageName),
            }));
            setPopularApps(pApps);

            const otherApps: DeviceApp[] = installed
                .filter(app => !popularPackages.has(app.packageName))
                .map(app => ({
                    ...app,
                    isBlocked: blockedSet.has(app.packageName),
                }))
                .sort((a, b) => a.appName.localeCompare(b.appName));

            setDeviceApps(otherApps);
            const allApps = [...pApps, ...otherApps];
            setBlockAll(allApps.length > 0 && allApps.every(a => a.isBlocked));
            setLoadingApps(false);
        };

        loadApps();
        isServiceRunning().then(setServiceActive);
        isAccessibilityServiceEnabled().then(setAccessibilityEnabled);
        hasOverlayPermission().then(setOverlayGranted);
        getDailyPrayerGoal().then(setPrayerGoal);
    }, []);

    const syncAllApps = async (pApps: DeviceApp[], dApps: DeviceApp[]) => {
        const allApps = [...pApps, ...dApps];
        const blocked = allApps.filter(a => a.isBlocked);
        const storeApps: BlockedApp[] = allApps.map(a => ({
            packageName: a.packageName,
            appName: a.appName,
            isBlocked: a.isBlocked,
        }));
        setStoreBlockedApps(storeApps);
        await nativeSetBlockedApps(blocked.map(a => a.packageName));
    };

    const toggleApp = async (packageName: string) => {
        const inPopular = popularApps.find(a => a.packageName === packageName);
        if (inPopular) {
            const updatedPop = popularApps.map(app =>
                app.packageName === packageName ? { ...app, isBlocked: !app.isBlocked } : app
            );
            setPopularApps(updatedPop);
            const all = [...updatedPop, ...deviceApps];
            setBlockAll(all.every(a => a.isBlocked));
            await syncAllApps(updatedPop, deviceApps);
            return;
        }
        const updatedDev = deviceApps.map(app =>
            app.packageName === packageName ? { ...app, isBlocked: !app.isBlocked } : app
        );
        setDeviceApps(updatedDev);
        const all = [...popularApps, ...updatedDev];
        setBlockAll(all.every(a => a.isBlocked));
        await syncAllApps(popularApps, updatedDev);
    };

    const toggleBlockAll = async (value: boolean) => {
        setBlockAll(value);
        const updatedPop = popularApps.map(app => ({ ...app, isBlocked: value }));
        const updatedDev = deviceApps.map(app => ({ ...app, isBlocked: value }));
        setPopularApps(updatedPop);
        setDeviceApps(updatedDev);
        await syncAllApps(updatedPop, updatedDev);
    };

    const enablePrayerGuard = async () => {
        const hasOverlay = await hasOverlayPermission();
        if (!hasOverlay) {
            Alert.alert(
                t('permission_needed'),
                t('permission_overlay_msg'),
                [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('open_settings'), onPress: () => requestOverlayPermission() },
                ]
            );
            return;
        }

        const hasAccess = await isAccessibilityServiceEnabled();
        if (!hasAccess) {
            Alert.alert(
                t('accessibility_service'),
                t('accessibility_msg'),
                [
                    { text: t('cancel'), style: 'cancel' },
                    { text: t('open_settings'), onPress: () => openAccessibilitySettings() },
                ]
            );
            return;
        }

        await syncAllApps(popularApps, deviceApps);
        setServiceActive(true);
    };

    const s = getStyles(colors);

    return (
        <View style={s.container}>
            <StatusBar
                barStyle={isDark ? 'light-content' : 'dark-content'}
                backgroundColor={colors.backgroundDark}
            />
            <ScrollView
                contentContainerStyle={s.scrollContent}
                showsVerticalScrollIndicator={false}>

                {/* ========= APPEARANCE ========= */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('appearance')}</Text>
                    <Text style={s.sectionSubtitle}>{t('appearance_desc')}</Text>
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.rowLabel}>{isDark ? t('dark_mode') : t('light_mode')}</Text>
                        </View>
                        <Switch
                            value={isDark}
                            onValueChange={(val) => setThemeMode(val ? 'dark' : 'light')}
                            trackColor={{ false: colors.surfaceLight, true: colors.crimsonLight }}
                            thumbColor={isDark ? colors.gold : colors.textMuted}
                        />
                    </View>
                </View>

                <View style={s.divider} />

                {/* ========= LANGUAGE ========= */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('language')}</Text>
                    <Text style={s.sectionSubtitle}>{t('language_desc')}</Text>
                    <View style={s.chipRow}>
                        {LANGUAGE_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.code}
                                style={[s.chip, language === opt.code && s.chipActive]}
                                onPress={() => setLanguage(opt.code)}
                                activeOpacity={0.7}>
                                <Text style={[s.chipText, language === opt.code && s.chipTextActive]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={s.divider} />

                {/* ========= AI PRAYER MODE ========= */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('ai_prayer_mode')}</Text>
                    <Text style={s.sectionSubtitle}>{t('ai_prayer_desc')}</Text>
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.rowLabel}>{t('enable_ai_prayer')}</Text>
                            <Text style={s.rowSubLabel}>{t('ai_prayer_info')}</Text>
                        </View>
                        <Switch
                            value={aiPrayerEnabled}
                            onValueChange={setAiPrayerEnabled}
                            trackColor={{ false: colors.surfaceLight, true: colors.crimsonLight }}
                            thumbColor={aiPrayerEnabled ? colors.gold : colors.textMuted}
                        />
                    </View>
                </View>

                <View style={s.divider} />

                {/* ========= PRAYER COMMITMENT ========= */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('daily_prayer_commitment')}</Text>
                    <Text style={s.sectionSubtitle}>
                        Schedule detailed times to lock your apps
                    </Text>
                    <TouchableOpacity
                        style={[s.startButton, { marginTop: Spacing.md, backgroundColor: colors.gold }]}
                        activeOpacity={0.8}
                        onPress={() => navigation.navigate('PrayerCommitment')}>
                        <Text style={[s.startButtonText, { color: colors.backgroundDark }]}>
                            {t('manage_prayer_plan')}
                        </Text>
                    </TouchableOpacity>
                </View>

                <View style={s.divider} />

                {/* ========= PRAYER GUARD ========= */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('prayer_guard')}</Text>
                    <Text style={s.sectionSubtitle}>{t('prayer_guard_desc')}</Text>

                    <View style={[s.row, { flexDirection: 'column', alignItems: 'stretch', gap: Spacing.sm }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={s.rowLabel}>{t('overlay_permission')}</Text>
                            <Text style={overlayGranted ? s.badgeSuccess : s.badgePending}>
                                {overlayGranted ? t('granted') : t('required')}
                            </Text>
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={s.rowLabel}>{t('accessibility_service')}</Text>
                            <Text style={accessibilityEnabled ? s.badgeSuccess : s.badgePending}>
                                {accessibilityEnabled ? t('granted') : t('required')}
                            </Text>
                        </View>
                    </View>

                    {(!overlayGranted || !accessibilityEnabled) && (
                        <TouchableOpacity
                            style={[s.startButton, { marginTop: Spacing.md }]}
                            onPress={enablePrayerGuard}
                            activeOpacity={0.8}>
                            <Text style={s.startButtonText}>{t('enable_prayer_guard')}</Text>
                        </TouchableOpacity>
                    )}

                    {overlayGranted && accessibilityEnabled && (
                        <View style={{ marginTop: Spacing.sm, alignItems: 'center' }}>
                            <Text style={[s.rowSubLabel, { color: colors.success }]}>
                                {t('prayer_guard_active')}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={s.divider} />

                {/* ========= SMART BLOCKING ========= */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('smart_blocking')}</Text>
                    <Text style={s.sectionSubtitle}>{t('smart_blocking_desc')}</Text>

                    <View style={[s.row, { marginBottom: Spacing.sm }]}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.rowLabel}>{t('enable_focus_hours')}</Text>
                            <Text style={s.rowSubLabel}>{t('focus_hours_desc')}</Text>
                        </View>
                        <Switch
                            value={isFocusModeEnabled}
                            onValueChange={setFocusModeEnabled}
                            trackColor={{ false: colors.surfaceLight, true: colors.crimsonLight }}
                            thumbColor={isFocusModeEnabled ? colors.gold : colors.textMuted}
                        />
                    </View>

                    {isFocusModeEnabled && (
                        <View style={[s.row, { marginBottom: Spacing.sm, flexDirection: 'column', alignItems: 'stretch' }]}>
                            <Text style={[s.rowLabel, { marginBottom: Spacing.xs }]}>{t('focus_hours_format')}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm }}>
                                <TextInput
                                    style={s.timeInput}
                                    value={focusHours.start}
                                    onChangeText={(text) => setFocusHours(text, focusHours.end)}
                                    placeholder="09:00"
                                    placeholderTextColor={colors.textMuted}
                                    maxLength={5}
                                />
                                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>TO</Text>
                                <TextInput
                                    style={s.timeInput}
                                    value={focusHours.end}
                                    onChangeText={(text) => setFocusHours(focusHours.start, text)}
                                    placeholder="17:00"
                                    placeholderTextColor={colors.textMuted}
                                    maxLength={5}
                                />
                            </View>
                            <Text style={s.rowSubLabel}>{t('outside_hours_bypass')}</Text>
                        </View>
                    )}

                    <View style={s.modeRow}>
                        <TouchableOpacity
                            style={[
                                s.modeButton,
                                blockingMode === 'strict' && s.modeButtonActive,
                            ]}
                            onPress={() => setBlockingMode('strict')}
                            activeOpacity={0.8}>
                            <Text style={s.modeIcon}>🛡️</Text>
                            <Text style={[s.modeLabel, blockingMode === 'strict' && s.modeLabelActive]}>
                                {t('strict_mode')}
                            </Text>
                            <Text style={s.modeDesc}>{t('strict_mode_desc')}</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[
                                s.modeButton,
                                blockingMode === 'flexible' && s.modeButtonActive,
                            ]}
                            onPress={() => setBlockingMode('flexible')}
                            activeOpacity={0.8}>
                            <Text style={s.modeIcon}>🕊️</Text>
                            <Text style={[s.modeLabel, blockingMode === 'flexible' && s.modeLabelActive]}>
                                {t('flexible_mode')}
                            </Text>
                            <Text style={s.modeDesc}>{t('flexible_mode_desc')}</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <View style={s.divider} />

                {/* ========= PRAYER MODE ========= */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('prayer_mode')}</Text>
                    <Text style={s.sectionSubtitle}>{t('how_want_pray')}</Text>
                    <View style={s.modeRow}>
                        {(['silent', 'voice'] as PrayerMode[]).map(m => (
                            <TouchableOpacity
                                key={m}
                                style={[
                                    s.modeButton,
                                    prayerMode === m && s.modeButtonActive,
                                ]}
                                onPress={() => setPrayerMode(m)}
                                activeOpacity={0.8}>
                                <Text style={s.modeIcon}>
                                    {m === 'silent' ? '🤫' : '🎤'}
                                </Text>
                                <Text
                                    style={[
                                        s.modeLabel,
                                        prayerMode === m && s.modeLabelActive,
                                    ]}>
                                    {m === 'silent' ? t('silent') : t('voice')}
                                </Text>
                                <Text style={s.modeDesc}>
                                    {m === 'silent' ? t('timer_counts') : t('timer_runs_speaking')}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={s.divider} />

                {/* ========= PRAYER DURATION ========= */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('prayer_duration')}</Text>
                    <Text style={s.sectionSubtitle}>{t('how_long_pray')}</Text>
                    <View style={s.chipRow}>
                        {TIMER_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    s.chip,
                                    timerDuration === opt.value && s.chipActive,
                                ]}
                                onPress={() => setTimerDuration(opt.value)}
                                activeOpacity={0.8}>
                                <Text
                                    style={[
                                        s.chipText,
                                        timerDuration === opt.value && s.chipTextActive,
                                    ]}>
                                    {opt.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={s.divider} />

                {/* ========= DAILY PSALM QUOTA ========= */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('daily_psalm_quota')}</Text>
                    <Text style={s.sectionSubtitle}>{t('psalms_per_session')}</Text>
                    <View style={s.chipRow}>
                        {QUOTA_OPTIONS.map(q => (
                            <TouchableOpacity
                                key={q}
                                style={[s.chip, dailyQuota === q && s.chipActive]}
                                onPress={() => setDailyQuota(q)}
                                activeOpacity={0.8}>
                                <Text
                                    style={[
                                        s.chipText,
                                        dailyQuota === q && s.chipTextActive,
                                    ]}>
                                    {q}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>

                <View style={s.divider} />

                {/* ========= WALLPAPER ========= */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('wallpaper_sync')}</Text>
                    <Text style={s.sectionSubtitle}>{t('wallpaper_desc')}</Text>
                    <View style={s.row}>
                        <View style={{ flex: 1 }}>
                            <Text style={s.rowLabel}>{t('enable_wallpapers')}</Text>
                        </View>
                        <Switch
                            value={wallpaperEnabled}
                            onValueChange={async (value) => {
                                setWallpaperEnabled(value);
                                if (value) {
                                    try {
                                        const { forceChangeWallpaper } = require('../services/wallpaperService');
                                        const success = await forceChangeWallpaper();
                                        if (success) {
                                            Alert.alert(t('wallpaper_set'), t('wallpaper_updated'));
                                        }
                                    } catch (e) {
                                        console.warn('[Settings] Failed to set wallpaper:', e);
                                    }
                                }
                            }}
                            trackColor={{ false: colors.surfaceLight, true: colors.crimsonLight }}
                            thumbColor={wallpaperEnabled ? colors.gold : colors.textMuted}
                        />
                    </View>

                    {wallpaperEnabled && (
                        <View style={{ marginTop: Spacing.md }}>
                            <Text style={s.rowSubLabel}>{t('change_wallpaper_every')}</Text>
                            <View style={s.chipRow}>
                                {[1, 2, 3, 5, 10].map(freq => (
                                    <TouchableOpacity
                                        key={freq}
                                        style={[
                                            s.chip,
                                            wallpaperFrequency === freq && s.chipActive,
                                        ]}
                                        onPress={() => setWallpaperFrequency(freq)}
                                        activeOpacity={0.8}>
                                        <Text
                                            style={[
                                                s.chipText,
                                                wallpaperFrequency === freq && s.chipTextActive,
                                            ]}>
                                            {freq === 1 ? t('unlock_label') : `${freq} ${t('unlocks_label')}`}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                style={[s.startButton, { marginTop: Spacing.md, backgroundColor: colors.gold }]}
                                activeOpacity={0.8}
                                onPress={async () => {
                                    try {
                                        const { forceChangeWallpaper } = require('../services/wallpaperService');
                                        const success = await forceChangeWallpaper();
                                        if (success) {
                                            Alert.alert(t('wallpaper_set'), t('wallpaper_changed'));
                                        } else {
                                            Alert.alert('⚠', t('wallpaper_fail'));
                                        }
                                    } catch (e: any) {
                                        Alert.alert('Error', e?.message || 'Failed to set wallpaper');
                                    }
                                }}>
                                <Text style={[s.startButtonText, { color: colors.backgroundDark }]}>{t('set_wallpaper_now')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={s.divider} />

                {/* ========= BLOCKED APPS ========= */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('blocked_apps')}</Text>
                    <Text style={s.sectionSubtitle}>{t('blocked_apps_desc')}</Text>

                    <View style={s.appRow}>
                        <View style={s.appInfo}>
                            <Text style={[s.appName, { fontWeight: '700' }]}>{t('block_all_apps')}</Text>
                            <Text style={s.appPackage}>{t('block_all_desc')}</Text>
                        </View>
                        <Switch
                            value={blockAll}
                            onValueChange={toggleBlockAll}
                            trackColor={{
                                false: colors.surfaceLight,
                                true: colors.crimsonLight,
                            }}
                            thumbColor={blockAll ? colors.crimson : colors.textMuted}
                        />
                    </View>

                    <Text style={[s.sectionSubtitle, { marginTop: Spacing.md, fontWeight: '600', color: colors.gold }]}>
                        {t('popular_apps')}
                    </Text>
                    {popularApps.map(app => (
                        <View key={app.packageName} style={s.appRow}>
                            <View style={s.appInfo}>
                                <Text style={s.appName}>{app.appName}</Text>
                            </View>
                            <Switch
                                value={app.isBlocked}
                                onValueChange={() => toggleApp(app.packageName)}
                                trackColor={{
                                    false: colors.surfaceLight,
                                    true: colors.crimsonLight,
                                }}
                                thumbColor={app.isBlocked ? colors.crimson : colors.textMuted}
                            />
                        </View>
                    ))}

                    <Text style={[s.sectionSubtitle, { marginTop: Spacing.lg, fontWeight: '600', color: colors.textSecondary }]}>
                        {t('all_device_apps')}
                    </Text>

                    <View style={s.searchBar}>
                        <Text style={s.searchIcon}>🔍</Text>
                        <TextInput
                            style={s.searchInput}
                            placeholder={t('search_apps')}
                            placeholderTextColor={colors.textMuted}
                            value={searchText}
                            onChangeText={setSearchText}
                        />
                    </View>

                    {loadingApps ? (
                        <Text style={[s.sectionSubtitle, { textAlign: 'center', marginTop: Spacing.md }]}>
                            {t('loading_apps')}
                        </Text>
                    ) : (
                        deviceApps
                            .filter(app =>
                                app.appName.toLowerCase().includes(searchText.toLowerCase()) ||
                                app.packageName.toLowerCase().includes(searchText.toLowerCase())
                            )
                            .map(app => (
                                <View key={app.packageName} style={s.appRow}>
                                    <View style={s.appInfo}>
                                        <Text style={s.appName}>{app.appName}</Text>
                                        <Text style={s.appPackage}>{app.packageName}</Text>
                                    </View>
                                    <Switch
                                        value={app.isBlocked}
                                        onValueChange={() => toggleApp(app.packageName)}
                                        trackColor={{
                                            false: colors.surfaceLight,
                                            true: colors.crimsonLight,
                                        }}
                                        thumbColor={app.isBlocked ? colors.crimson : colors.textMuted}
                                    />
                                </View>
                            ))
                    )}
                </View>

                <View style={s.divider} />

                {/* ========= PREMIUM ========= */}
                <View style={[s.section, { backgroundColor: colors.surface, padding: Spacing.lg, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.gold }]}>
                    <Text style={s.sectionTitle}>{t('premium_title')}</Text>
                    
                    <TouchableOpacity 
                        style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm }}
                        onPress={() => navigation.navigate('Premium')}
                    >
                        <View style={{ flex: 1 }}>
                            <Text style={s.rowLabel}>
                                {isPremium ? '✨ Premium Active' : t('premium_title')}
                            </Text>
                            <Text style={s.rowSubLabel}>
                                {isPremium ? 'Thank you for your support!' : 'Unlock all features and support us.'}
                            </Text>
                        </View>
                        <Text style={{ fontSize: 24, color: colors.gold }}>➔</Text>
                    </TouchableOpacity>
                </View>

                <View style={s.divider} />

                {/* ========= ACCOUNT ========= */}
                {authUser && (
                    <View style={[s.section, { backgroundColor: colors.surface, padding: Spacing.lg, borderRadius: BorderRadius.lg }]}>
                        <Text style={s.sectionTitle}>Account</Text>
                        <Text style={[s.rowSubLabel, { marginBottom: Spacing.md }]}>
                            Signed in as {authUser.name || authUser.phone || authUser.email}
                        </Text>
                        <TouchableOpacity 
                            style={{ backgroundColor: colors.crimson, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center' }}
                            onPress={async () => {
                                try { await GoogleSignin.signOut(); } catch (e) {}
                                logout();
                            }}
                        >
                            <Text style={{ color: colors.backgroundDark, fontWeight: 'bold' }}>Sign Out</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {authUser && <View style={s.divider} />}

                {/* Footer */}
                <Text style={s.footer}>{t('glory_be')}</Text>
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.backgroundDark,
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
            color: colors.gold,
            marginBottom: Spacing.xs,
        },
        sectionSubtitle: {
            fontSize: FontSize.sm,
            color: colors.textSecondary,
            marginBottom: Spacing.md,
        },
        divider: {
            height: 1,
            backgroundColor: colors.surfaceLight,
            marginVertical: Spacing.md,
        },
        row: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: colors.surface,
            padding: Spacing.md,
            borderRadius: BorderRadius.lg,
            borderWidth: 1,
            borderColor: colors.surfaceLight,
        },
        rowLabel: {
            fontSize: FontSize.md,
            fontWeight: '600',
            color: colors.textPrimary,
        },
        rowSubLabel: {
            fontSize: FontSize.xs,
            color: colors.textMuted,
            marginTop: 2,
        },
        modeRow: {
            flexDirection: 'row',
            gap: Spacing.md,
        },
        modeButton: {
            flex: 1,
            backgroundColor: colors.surface,
            borderRadius: BorderRadius.lg,
            padding: Spacing.md,
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.surfaceLight,
        },
        modeButtonActive: {
            borderColor: colors.gold,
            backgroundColor: colors.surfaceLight,
        },
        modeIcon: {
            fontSize: 28,
            marginBottom: Spacing.xs,
        },
        modeLabel: {
            fontSize: FontSize.md,
            fontWeight: '700',
            color: colors.textSecondary,
            marginBottom: Spacing.xs,
        },
        modeLabelActive: {
            color: colors.gold,
        },
        modeDesc: {
            fontSize: FontSize.xs,
            color: colors.textMuted,
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
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.surfaceLight,
        },
        chipActive: {
            backgroundColor: colors.crimson,
            borderColor: colors.crimson,
        },
        chipText: {
            fontSize: FontSize.sm,
            color: colors.textSecondary,
            fontWeight: '600',
        },
        chipTextActive: {
            color: '#FFFFFF',
        },
        searchBar: {
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.surface,
            borderRadius: BorderRadius.md,
            paddingHorizontal: Spacing.sm,
            paddingVertical: Spacing.xs,
            marginVertical: Spacing.sm,
            borderWidth: 1,
            borderColor: colors.surfaceLight,
        },
        searchIcon: {
            fontSize: FontSize.md,
            marginRight: Spacing.xs,
        },
        searchInput: {
            flex: 1,
            fontSize: FontSize.md,
            color: colors.textPrimary,
            paddingVertical: Spacing.xs,
        },
        timeInput: {
            backgroundColor: colors.backgroundDark,
            color: colors.gold,
            fontSize: FontSize.lg,
            fontWeight: '700',
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.sm,
            borderRadius: BorderRadius.md,
            borderWidth: 1,
            borderColor: colors.goldDark,
            textAlign: 'center',
            width: 100,
        },
        appRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.sm,
            borderBottomWidth: 1,
            borderBottomColor: colors.surfaceLight,
        },
        appInfo: {
            flex: 1,
            marginRight: Spacing.sm,
        },
        appName: {
            fontSize: FontSize.md,
            fontWeight: '500',
            color: colors.textPrimary,
        },
        appPackage: {
            fontSize: FontSize.xs,
            color: colors.textMuted,
            marginTop: 2,
        },
        footer: {
            fontSize: FontSize.sm,
            color: colors.textMuted,
            textAlign: 'center',
            marginTop: Spacing.lg,
            fontStyle: 'italic',
        },
        badgeSuccess: {
            fontSize: FontSize.xs,
            fontWeight: '700',
            color: colors.success,
            backgroundColor: 'rgba(16,185,129,0.1)',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: BorderRadius.sm,
            overflow: 'hidden',
        },
        badgePending: {
            fontSize: FontSize.xs,
            fontWeight: '700',
            color: colors.crimson,
            backgroundColor: 'rgba(139,0,0,0.1)',
            paddingHorizontal: 8,
            paddingVertical: 3,
            borderRadius: BorderRadius.sm,
            overflow: 'hidden',
        },
        startButton: {
            backgroundColor: colors.crimson,
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            alignItems: 'center',
        },
        startButtonText: {
            fontSize: FontSize.lg,
            fontWeight: '700',
            color: colors.goldLight,
            letterSpacing: 1,
        },
    });

export default SettingsScreen;
