/**
 * overlayService.ts
 *
 * Exposes the native Android lock screen logic to React Native JS.
 * Connects to OverlayModule.kt via NativeModules.
 */

import { NativeModules, Platform } from 'react-native';

const { OverlayModule } = NativeModules;

export interface BlockedApp {
    packageName: string;
    appName: string;
    isBlocked: boolean;
}

/**
 * Starts the native background service that tracks app usage.
 */
export const startOverlayService = async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !OverlayModule) return false;
    try {
        return await OverlayModule.startService();
    } catch (error) {
        console.error('Error starting overlay service:', error);
        return false;
    }
};

/**
 * Stops the native background service.
 */
export const stopOverlayService = async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !OverlayModule) return false;
    try {
        return await OverlayModule.stopService();
    } catch (error) {
        console.error('Error stopping overlay service:', error);
        return false;
    }
};

/**
 * Checks if the app has SYSTEM_ALERT_WINDOW (Draw over other apps) permission.
 */
export const hasOverlayPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !OverlayModule) return false;
    try {
        return await OverlayModule.hasOverlayPermission();
    } catch (error) {
        console.error('Error checking overlay permission:', error);
        return false;
    }
};

/**
 * Requests SYSTEM_ALERT_WINDOW permission.
 */
export const requestOverlayPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !OverlayModule) return false;
    try {
        return await OverlayModule.requestOverlayPermission();
    } catch (error) {
        console.error('Error requesting overlay permission:', error);
        return false;
    }
};

/**
 * Checks if the app has PACKAGE_USAGE_STATS permission.
 */
export const hasUsageStatsPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !OverlayModule) return false;
    try {
        return await OverlayModule.hasUsageStatsPermission();
    } catch (error) {
        console.error('Error checking usage stats permission:', error);
        return false;
    }
};

/**
 * Requests PACKAGE_USAGE_STATS permission.
 */
export const requestUsageStatsPermission = async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !OverlayModule) return false;
    try {
        return await OverlayModule.requestUsageStatsPermission();
    } catch (error) {
        console.error('Error requesting usage stats permission:', error);
        return false;
    }
};

/**
 * Sets the list of blocked app package names in the native service.
 */
export const setBlockedApps = async (apps: BlockedApp[]): Promise<boolean> => {
    if (Platform.OS !== 'android' || !OverlayModule) return false;
    const packages = apps.filter(app => app.isBlocked).map(app => app.packageName);
    try {
        return await OverlayModule.setBlockedApps(packages);
    } catch (error) {
        console.error('Error setting blocked apps:', error);
        return false;
    }
};

/**
 * Closes the lock screen overlay (called when prayer is done or silent timer up).
 */
export const unlockDevice = async (): Promise<boolean> => {
    if (Platform.OS !== 'android' || !OverlayModule) return false;
    try {
        return await OverlayModule.unlockDevice();
    } catch (error) {
        console.error('Error closing overlay:', error);
        return false;
    }
};

/**
 * Backwards compatibility alias for app state checking (not used dynamically in native).
 */
export const isServiceRunning = async (): Promise<boolean> => {
    // We assume it's running if startService was called.
    return true;
};
