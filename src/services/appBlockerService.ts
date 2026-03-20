/**
 * App Blocker Service — JS Bridge to native AppBlockerModule
 *
 * New prayer-first flow:
 * - User opens blocked app → native overlay appears
 * - Only button: "Start Prayer to Unlock" → opens Kemeselot prayer screen
 * - Prayer timer must finish → recordPrayerCompleted() is called
 * - If daily goal met, blocked apps work freely for rest of day
 */

import { NativeModules, Platform } from 'react-native';

const { AppBlockerModule } = NativeModules;

// ==================== Blocked Apps ====================

export async function setBlockedApps(packages: string[]): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
        return await AppBlockerModule.setBlockedApps(packages);
    } catch (error) {
        console.error('[AppBlocker] Error setting blocked apps:', error);
        return false;
    }
}

export async function getBlockedApps(): Promise<string[]> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return [];
    try {
        return await AppBlockerModule.getBlockedApps();
    } catch (error) {
        return [];
    }
}

/**
 * Get all launchable apps installed on the device.
 * Returns array of { packageName, appName }.
 */
export async function getInstalledApps(): Promise<{ packageName: string; appName: string }[]> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return [];
    try {
        return await AppBlockerModule.getInstalledApps();
    } catch (error) {
        console.error('[AppBlocker] Error getting installed apps:', error);
        return [];
    }
}

// ==================== Daily Prayer Tracking ====================

/**
 * Set how many times per day the user commits to pray (1, 2, or 3).
 */
export async function setDailyPrayerGoal(goal: number): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
        return await AppBlockerModule.setDailyPrayerGoal(goal);
    } catch (error) {
        return false;
    }
}

/**
 * Sync the daily prayer schedule to the native blocker.
 * Expects an array of "HH:mm" strings.
 */
export async function setPrayerSchedule(times: string[]): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
        return await AppBlockerModule.setPrayerSchedule(times);
    } catch (error) {
        console.error('[AppBlocker] Error setting prayer schedule:', error);
        return false;
    }
}

export async function getDailyPrayerGoal(): Promise<number> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return 1;
    try {
        return await AppBlockerModule.getDailyPrayerGoal();
    } catch (error) {
        return 1;
    }
}

export async function getPrayersCompletedToday(): Promise<number> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return 0;
    try {
        return await AppBlockerModule.getPrayersCompletedToday();
    } catch (error) {
        return 0;
    }
}

export async function hasDailyGoalMet(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
        return await AppBlockerModule.hasDailyGoalMet();
    } catch (error) {
        return false;
    }
}

/**
 * Record a completed prayer session. Called ONLY when the prayer timer finishes.
 * Also hides the native overlay.
 */
export async function recordPrayerCompleted(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
        return await AppBlockerModule.recordPrayerCompleted();
    } catch (error) {
        console.error('[AppBlocker] Error recording prayer:', error);
        return false;
    }
}

// ==================== Permissions ====================

export async function hasOverlayPermission(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
        return await AppBlockerModule.hasOverlayPermission();
    } catch (error) {
        return false;
    }
}

export async function requestOverlayPermission(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
        return await AppBlockerModule.requestOverlayPermission();
    } catch (error) {
        return false;
    }
}

export async function isAccessibilityServiceEnabled(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
        return await AppBlockerModule.isAccessibilityServiceEnabled();
    } catch (error) {
        return false;
    }
}

export async function openAccessibilitySettings(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
        return await AppBlockerModule.openAccessibilitySettings();
    } catch (error) {
        return false;
    }
}

export async function isServiceRunning(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
        return await AppBlockerModule.isServiceRunning();
    } catch (error) {
        return false;
    }
}

export async function dismissOverlay(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
        return await AppBlockerModule.dismissOverlay();
    } catch (error) {
        return false;
    }
}

/**
 * Check if the app was launched from the overlay's "Start Prayer" button.
 * Returns true once, then clears the flag on native side.
 */
export async function hasPendingPrayerIntent(): Promise<boolean> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return false;
    try {
        return await AppBlockerModule.hasPendingPrayerIntent();
    } catch (error) {
        return false;
    }
}

/**
 * Get the package name of the last app that triggered the prayer overlay.
 * Returns the package name string, or 'unknown' if not available.
 */
export async function getLastBlockedApp(): Promise<string> {
    if (Platform.OS !== 'android' || !AppBlockerModule) return 'unknown';
    try {
        const pkg = await AppBlockerModule.getLastBlockedApp();
        return pkg || 'unknown';
    } catch (error) {
        return 'unknown';
    }
}
