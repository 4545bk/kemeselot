import { create } from 'zustand';

export type PrayerMode = 'silent' | 'voice';

export interface BlockedApp {
    packageName: string;
    appName: string;
    isBlocked: boolean;
}

export interface AppState {
    // Prayer settings
    prayerMode: PrayerMode;
    timerDuration: number; // in seconds
    dailyQuota: number; // number of psalms per session

    // Blocked apps
    blockedApps: BlockedApp[];

    // Overlay state
    isOverlayActive: boolean;
    currentPsalmIndex: number;
    permissionsGranted: boolean;
    psalmsCompletedToday: number;

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
}

export const useAppStore = create<AppState>((set) => ({
    // Default settings
    prayerMode: 'silent',
    timerDuration: 300, // 5 minutes
    dailyQuota: 5,

    blockedApps: [],

    isOverlayActive: false,
    currentPsalmIndex: 0,
    permissionsGranted: false,
    psalmsCompletedToday: 0,

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
}));
