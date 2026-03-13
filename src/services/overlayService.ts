/**
 * Overlay Service — Stub (Native code stripped for clean build)
 * 
 * All functions return safe defaults. The overlay feature
 * will be re-added once the base app is building successfully.
 */

export async function canDrawOverlays(): Promise<boolean> {
    return false;
}

export async function hasUsageStatsPermission(): Promise<boolean> {
    return false;
}

export function requestOverlayPermission(): void {
    console.log('[OverlayService] Stub: overlay permission request skipped');
}

export function requestUsageStatsPermission(): void {
    console.log('[OverlayService] Stub: usage stats permission request skipped');
}

export async function requestAllPermissions(): Promise<{
    overlay: boolean;
    usageStats: boolean;
}> {
    return { overlay: false, usageStats: false };
}

export async function startOverlayService(): Promise<boolean> {
    console.log('[OverlayService] Stub: service start skipped');
    return false;
}

export async function stopOverlayService(): Promise<boolean> {
    console.log('[OverlayService] Stub: service stop skipped');
    return false;
}

export async function isServiceRunning(): Promise<boolean> {
    return false;
}

export async function setBlockedApps(_packages: string[]): Promise<boolean> {
    return false;
}

export async function getBlockedApps(): Promise<string[]> {
    return [];
}

export function dismissOverlay(): void { }

export function onOverlayDismissed(_callback: () => void) {
    return () => { }; // no-op unsubscribe
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
