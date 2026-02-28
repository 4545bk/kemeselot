/**
 * Overlay Service — TypeScript Bridge
 *
 * Wraps the native Android OverlayModule so TypeScript can call it
 * with full type safety.
 */

import { NativeModules, NativeEventEmitter } from 'react-native';

const { OverlayModule } = NativeModules;
const overlayEmitter = new NativeEventEmitter(OverlayModule);

// ---------- Permission Checking ----------

/** Returns true if the app has SYSTEM_ALERT_WINDOW permission */
export async function canDrawOverlays(): Promise<boolean> {
    return OverlayModule.canDrawOverlays();
}

/** Returns true if the app has PACKAGE_USAGE_STATS permission */
export async function hasUsageStatsPermission(): Promise<boolean> {
    return OverlayModule.hasUsageStatsPermission();
}

// ---------- Permission Requesting ----------

/** Opens Android Settings → "Draw over other apps" */
export function requestOverlayPermission(): void {
    OverlayModule.requestOverlayPermission();
}

/** Opens Android Settings → "Usage access" */
export function requestUsageStatsPermission(): void {
    OverlayModule.requestUsageStatsPermission();
}

/** Helper: request all required permissions if not already granted */
export async function requestAllPermissions(): Promise<{
    overlay: boolean;
    usageStats: boolean;
}> {
    const overlay = await canDrawOverlays();
    const usageStats = await hasUsageStatsPermission();

    if (!overlay) {
        requestOverlayPermission();
    }
    if (!usageStats) {
        requestUsageStatsPermission();
    }

    return { overlay, usageStats };
}

// ---------- Service Control ----------

/** Start the background detection service */
export async function startOverlayService(): Promise<boolean> {
    return OverlayModule.startOverlayService();
}

/** Stop the background detection service */
export async function stopOverlayService(): Promise<boolean> {
    return OverlayModule.stopOverlayService();
}

/** Returns true if the overlay service is currently running */
export async function isServiceRunning(): Promise<boolean> {
    return OverlayModule.isServiceRunning();
}

// ---------- Blocked Apps ----------

/** Set the list of package names to block (e.g. 'com.instagram.android') */
export async function setBlockedApps(packages: string[]): Promise<boolean> {
    return OverlayModule.setBlockedApps(packages);
}

/** Get the currently configured blocked app package names */
export async function getBlockedApps(): Promise<string[]> {
    return OverlayModule.getBlockedApps();
}

// ---------- Overlay Control ----------

/** Programmatically dismiss the overlay (call after prayer completed) */
export function dismissOverlay(): void {
    OverlayModule.dismissOverlay();
}

// ---------- Event Listeners ----------

/** Listen for when the user successfully completes prayer and dismisses overlay */
export function onOverlayDismissed(callback: () => void) {
    const subscription = overlayEmitter.addListener(
        OverlayModule.EVENT_OVERLAY_DISMISSED ?? 'onOverlayDismissed',
        callback,
    );
    return () => subscription.remove();
}

export default {
    canDrawOverlays,
    hasUsageStatsPermission,
    requestOverlayPermission,
    requestUsageStatsPermission,
    requestAllPermissions,
    startOverlayService,
    stopOverlayService,
    isServiceRunning,
    setBlockedApps,
    getBlockedApps,
    dismissOverlay,
    onOverlayDismissed,
};
