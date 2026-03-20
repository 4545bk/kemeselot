import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { fileStorage } from './fileStorage';
import { ThemeMode } from '../theme/ThemeContext';
import { LanguageCode } from '../i18n/translations';
import { DistractionEvent, pruneOldEvents } from '../services/insightsService';
import { setPrayerSchedule } from '../services/appBlockerService';

export type PrayerMode = 'silent' | 'voice';

export interface BlockedApp {
    packageName: string;
    appName: string;
    isBlocked: boolean;
}

export interface PrayerSlot {
    id: string;
    label: string;
    time: string; // 'HH:mm' or 'anytime'
    enabled: boolean;
}

// Record<dateString, completedSlotIds[]>
export type PrayerHistory = Record<string, string[]>;

export interface AppState {
    // Prayer settings
    prayerMode: PrayerMode;
    timerDuration: number;
    dailyQuota: number;

    // Blocked apps
    blockedApps: BlockedApp[];

    // Overlay state
    isOverlayActive: boolean;
    currentPsalmIndex: number;
    permissionsGranted: boolean;
    psalmsCompletedToday: number;

    // Wallpaper configuration
    wallpaperEnabled: boolean;
    wallpaperFrequency: number;
    appOpens: number;

    // Wallpaper cache
    lastWallpaperIndex: number;
    lastWallpaperChangedAt: number;

    // Onboarding
    onboardingDone: boolean;

    // Streak stats
    streakCount: number;
    lastPrayerDate: string;

    // Smart Blocking Rules
    isFocusModeEnabled: boolean;
    focusHours: { start: string; end: string }; // 'HH:mm' format
    blockingMode: 'strict' | 'flexible';

    // ======= NEW: Prayer Commitment =======
    prayerSlots: PrayerSlot[];
    activePrayerPreset: 'morning-evening' | 'dawn-dusk-night' | 'custom';
    prayerHistory: PrayerHistory;

    // ======= NEW: Theme =======
    themeMode: ThemeMode;

    // ======= NEW: Language =======
    language: LanguageCode;

    // ======= NEW: AI Prayer Mode =======
    aiPrayerEnabled: boolean;

    // ======= NEW: Behavior Insights =======
    distractionEvents: DistractionEvent[];

    // ======= NEW: Payment & Premium =======
    isPremium: boolean;
    paymentStatus: 'none' | 'pending' | 'approved' | 'rejected';

    // ======= NEW: Auth =======
    authToken: string | null;
    authUser: { _id: string; name: string; phone?: string; email?: string; isPremium: boolean; profilePic?: string } | null;

    // Actions
    setPrayerMode: (mode: PrayerMode) => void;
    setTimerDuration: (duration: number) => void;
    setDailyQuota: (quota: number) => void;
    setBlockedApps: (apps: BlockedApp[]) => void;
    toggleBlockedApp: (packageName: string) => void;
    setOverlayActive: (active: boolean) => void;
    setCurrentPsalmIndex: (index: number) => void;
    setPermissionsGranted: (granted: boolean) => void;
    markPsalmAsRead: () => void;
    resetDailyProgress: () => void;
    setWallpaperEnabled: (enabled: boolean) => void;
    setWallpaperFrequency: (freq: number) => void;
    incrementAppOpens: () => void;
    resetAppOpens: () => void;
    setLastWallpaper: (index: number) => void;
    setOnboardingDone: (done: boolean) => void;
    recordPrayerStreak: () => void;
    checkAndResetStreak: () => void;
    
    // Smart Blocking Actions
    setFocusModeEnabled: (enabled: boolean) => void;
    setFocusHours: (start: string, end: string) => void;
    setBlockingMode: (mode: 'strict' | 'flexible') => void;

    // ======= NEW Actions =======
    setPrayerSlots: (slots: PrayerSlot[]) => void;
    setActivePrayerPreset: (preset: 'morning-evening' | 'dawn-dusk-night' | 'custom') => void;
    recordPrayerSlotCompleted: (slotId: string) => void;
    clearPrayerHistory: () => void;
    setThemeMode: (mode: ThemeMode) => void;
    setLanguage: (lang: LanguageCode) => void;
    setAiPrayerEnabled: (enabled: boolean) => void;
    recordDistraction: (packageName: string) => void;
    setIsPremium: (isPremium: boolean) => void;
    setPaymentStatus: (status: 'none' | 'pending' | 'approved' | 'rejected') => void;
    setAuth: (token: string, user: { _id: string; name: string; phone?: string; email?: string; isPremium: boolean; profilePic?: string }) => void;
    logout: () => void;
}

const DEFAULT_MORNING_EVENING: PrayerSlot[] = [
    { id: 'morning', label: 'Morning Prayer', time: '06:00', enabled: true },
    { id: 'evening', label: 'Evening Prayer', time: '21:00', enabled: true },
];

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            prayerMode: 'silent',
            timerDuration: 300,
            dailyQuota: 5,

            blockedApps: [],

            isOverlayActive: false,
            currentPsalmIndex: 0,
            permissionsGranted: true,
            psalmsCompletedToday: 0,
            wallpaperEnabled: true,
            wallpaperFrequency: 1,
            appOpens: 0,

            lastWallpaperIndex: -1,
            lastWallpaperChangedAt: 0,

            onboardingDone: false,
            streakCount: 0,
            lastPrayerDate: '',

            isFocusModeEnabled: false,
            focusHours: { start: '09:00', end: '17:00' },
            blockingMode: 'strict',

            // ======= NEW defaults =======
            prayerSlots: DEFAULT_MORNING_EVENING,
            activePrayerPreset: 'morning-evening',
            prayerHistory: {},
            themeMode: 'dark',
            language: 'am',
            aiPrayerEnabled: false,

            // ======= NEW Premium Default =======
            isPremium: false,
            paymentStatus: 'none',

            // ======= Auth Defaults =======
            authToken: null,
            authUser: null,

            // Actions
            setPrayerMode: (mode) => set({ prayerMode: mode }),
            setTimerDuration: (duration) => set({ timerDuration: duration }),
            setDailyQuota: (quota) => set({ dailyQuota: quota }),
            setBlockedApps: (apps) => set({ blockedApps: apps }),
            toggleBlockedApp: (packageName) =>
                set((state) => ({
                    blockedApps: state.blockedApps.map((app) =>
                        app.packageName === packageName
                            ? { ...app, isBlocked: !app.isBlocked }
                            : app,
                    ),
                })),
            setOverlayActive: (active) => set({ isOverlayActive: active }),
            setCurrentPsalmIndex: (index) => set({ currentPsalmIndex: index }),
            setPermissionsGranted: (granted) => set({ permissionsGranted: granted }),
            markPsalmAsRead: () => set((state) => ({ psalmsCompletedToday: state.psalmsCompletedToday + 1 })),
            resetDailyProgress: () => set({ psalmsCompletedToday: 0 }),
            setWallpaperEnabled: (enabled) => set({ wallpaperEnabled: enabled }),
            setWallpaperFrequency: (freq) => set({ wallpaperFrequency: freq }),
            incrementAppOpens: () => set((state) => ({ appOpens: state.appOpens + 1 })),
            resetAppOpens: () => set({ appOpens: 0 }),
            setLastWallpaper: (index) => set({ lastWallpaperIndex: index, lastWallpaperChangedAt: Date.now() }),
            setOnboardingDone: (done) => set({ onboardingDone: done }),
            
            // Smart Blocking Actions
            setFocusModeEnabled: (enabled) => set({ isFocusModeEnabled: enabled }),
            setFocusHours: (start, end) => set({ focusHours: { start, end } }),
            setBlockingMode: (mode) => set({ blockingMode: mode }),
            recordPrayerStreak: () => set((state) => {
                const today = new Date().toDateString();
                if (state.lastPrayerDate === today) return state; // Already prayed today
                
                const yesterdayDate = new Date();
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                
                if (state.lastPrayerDate === yesterdayDate.toDateString()) {
                    // Prayed yesterday, increment streak
                    return { streakCount: state.streakCount + 1, lastPrayerDate: today };
                } else {
                    // Missed a day or first time, reset to 1
                    return { streakCount: 1, lastPrayerDate: today };
                }
            }),
            checkAndResetStreak: () => set((state) => {
                if (!state.lastPrayerDate || state.streakCount === 0) return state;

                const today = new Date().toDateString();
                const yesterdayDate = new Date();
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                
                if (state.lastPrayerDate !== today && state.lastPrayerDate !== yesterdayDate.toDateString()) {
                    // Has not prayed today nor yesterday -> streak broken (> 24h)
                    return { streakCount: 0 };
                }
                return state;
            }),

            // ======= NEW Actions =======
            setPrayerSlots: (slots) => set({ prayerSlots: slots }),
            setActivePrayerPreset: (preset) => {
                if (preset === 'morning-evening') {
                    set({
                        activePrayerPreset: preset,
                        prayerSlots: [
                            { id: 'morning', label: 'Morning Prayer', time: '06:00', enabled: true },
                            { id: 'evening', label: 'Evening Prayer', time: '21:00', enabled: true },
                        ],
                    });
                } else if (preset === 'dawn-dusk-night') {
                    set({
                        activePrayerPreset: preset,
                        prayerSlots: [
                            { id: 'dawn', label: 'Dawn Prayer', time: '05:00', enabled: true },
                            { id: 'noon', label: 'Noon Prayer', time: '12:00', enabled: true },
                            { id: 'night', label: 'Night Prayer', time: '21:00', enabled: true },
                        ],
                    });
                } else {
                    set({ activePrayerPreset: 'custom' });
                }
            },
            recordPrayerSlotCompleted: (slotId) => set((state) => {
                const today = new Date().toISOString().split('T')[0];
                const todaySlots = state.prayerHistory[today] || [];
                if (todaySlots.includes(slotId)) return state;
                
                // Keep only last 7 days of history
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                const cutoff = sevenDaysAgo.toISOString().split('T')[0];
                
                const cleaned: PrayerHistory = {};
                for (const [date, slots] of Object.entries(state.prayerHistory)) {
                    if (date >= cutoff) cleaned[date] = slots;
                }
                cleaned[today] = [...todaySlots, slotId];
                
                return { prayerHistory: cleaned };
            }),
            clearPrayerHistory: () => set({ prayerHistory: {} }),
            setThemeMode: (mode) => set({ themeMode: mode }),
            setLanguage: (lang) => set({ language: lang }),
            setAiPrayerEnabled: (enabled) => set({ aiPrayerEnabled: enabled }),

            // ======= Behavior Insights =======
            distractionEvents: [],
            recordDistraction: (packageName) => set((state) => {
                const event: DistractionEvent = { packageName, timestamp: Date.now() };
                const pruned = pruneOldEvents([...state.distractionEvents, event]);
                return { distractionEvents: pruned };
            }),

            // ======= Premium Actions =======
            setIsPremium: (isPremium) => set({ isPremium }),
            setPaymentStatus: (status) => set({ paymentStatus: status }),
            setAuth: (token, user) => set({ authToken: token, authUser: user, isPremium: user.isPremium }),
            logout: () => set({ authToken: null, authUser: null, isPremium: false, paymentStatus: 'none' }),
        }),
        {
            name: 'kemeselot-store',
            storage: createJSONStorage(() => fileStorage),
            partialize: (state) => ({
                prayerMode: state.prayerMode,
                timerDuration: state.timerDuration,
                dailyQuota: state.dailyQuota,
                blockedApps: state.blockedApps,
                permissionsGranted: state.permissionsGranted,
                psalmsCompletedToday: state.psalmsCompletedToday,
                wallpaperEnabled: state.wallpaperEnabled,
                wallpaperFrequency: state.wallpaperFrequency,
                lastWallpaperIndex: state.lastWallpaperIndex,
                lastWallpaperChangedAt: state.lastWallpaperChangedAt,
                onboardingDone: state.onboardingDone,
                streakCount: state.streakCount,
                lastPrayerDate: state.lastPrayerDate,
                isFocusModeEnabled: state.isFocusModeEnabled,
                focusHours: state.focusHours,
                blockingMode: state.blockingMode,
                // NEW
                prayerSlots: state.prayerSlots,
                activePrayerPreset: state.activePrayerPreset,
                prayerHistory: state.prayerHistory,
                themeMode: state.themeMode,
                language: state.language,
                aiPrayerEnabled: state.aiPrayerEnabled,
                distractionEvents: state.distractionEvents,
                // Premium Features
                isPremium: state.isPremium,
                paymentStatus: state.paymentStatus,
                // Auth
                authToken: state.authToken,
                authUser: state.authUser,
            }),
        }
    )
);

// Auto-sync prayer schedule to Native OS whenever it changes
useAppStore.subscribe((state, prevState) => {
    if (state.prayerSlots !== prevState.prayerSlots) {
        const activeTimes = state.prayerSlots
            .filter((s) => s.enabled && s.time !== 'anytime')
            .map((s) => s.time);
            
        setPrayerSchedule(activeTimes).catch(e => console.log('Failed to sync schedule', e));
    }
});
