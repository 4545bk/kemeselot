package com.kemeselot

import android.content.ComponentName
import android.content.Intent
import android.os.Build
import android.provider.Settings
import android.text.TextUtils
import com.facebook.react.bridge.*

/**
 * React Native bridge to the native app-blocking system.
 * Exposes blocked apps, daily prayer tracking, permissions, and overlay control.
 */
class ReactNativeBridgeModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppBlockerModule"

    init {
        BlockedAppsManager.init(reactContext.applicationContext)
    }

    // ==================== Blocked Apps ====================

    @ReactMethod
    fun setBlockedApps(packages: ReadableArray, promise: Promise) {
        try {
            val list = mutableListOf<String>()
            for (i in 0 until packages.size()) {
                packages.getString(i)?.let { list.add(it) }
            }
            BlockedAppsManager.setBlockedApps(list)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_BLOCKED_ERROR", e.message)
        }
    }

    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        try {
            val arr = Arguments.createArray()
            BlockedAppsManager.getBlockedPackages().forEach { arr.pushString(it) }
            promise.resolve(arr)
        } catch (e: Exception) {
            promise.reject("GET_BLOCKED_ERROR", e.message)
        }
    }

    /**
     * Returns all user-installed (launchable) apps on the device.
     * Each entry: { packageName: string, appName: string }
     */
    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val pm = reactApplicationContext.packageManager
            val mainIntent = android.content.Intent(android.content.Intent.ACTION_MAIN, null)
            mainIntent.addCategory(android.content.Intent.CATEGORY_LAUNCHER)

            val apps = pm.queryIntentActivities(mainIntent, 0)
            val result = Arguments.createArray()
            val ownPackage = reactApplicationContext.packageName
            val seen = mutableSetOf<String>()

            for (resolveInfo in apps) {
                val pkg = resolveInfo.activityInfo.packageName
                // Skip our own app and duplicates
                if (pkg == ownPackage || seen.contains(pkg)) continue
                seen.add(pkg)

                val map = Arguments.createMap()
                map.putString("packageName", pkg)
                map.putString("appName", resolveInfo.loadLabel(pm).toString())
                result.pushMap(map)
            }

            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("INSTALLED_APPS_ERROR", e.message)
        }
    }

    // ==================== Daily Prayer Tracking ====================

    @ReactMethod
    fun setPrayerSchedule(times: ReadableArray, promise: Promise) {
        try {
            val list = mutableListOf<String>()
            for (i in 0 until times.size()) {
                times.getString(i)?.let { list.add(it) }
            }
            BlockedAppsManager.setPrayerSchedule(list)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_SCHEDULE_ERROR", e.message)
        }
    }

    @ReactMethod
    fun setDailyPrayerGoal(goal: Int, promise: Promise) {
        BlockedAppsManager.setDailyPrayerGoal(goal)
        promise.resolve(true)
    }

    @ReactMethod
    fun getDailyPrayerGoal(promise: Promise) {
        promise.resolve(BlockedAppsManager.getDailyPrayerGoal())
    }

    @ReactMethod
    fun getPrayersCompletedToday(promise: Promise) {
        promise.resolve(BlockedAppsManager.getPrayersCompletedToday())
    }

    @ReactMethod
    fun hasDailyGoalMet(promise: Promise) {
        promise.resolve(BlockedAppsManager.hasDailyGoalMet())
    }

    /**
     * Called ONLY when the prayer timer actually finishes.
     * Records the session and hides the overlay.
     */
    @ReactMethod
    fun recordPrayerCompleted(promise: Promise) {
        BlockedAppsManager.recordPrayerSession()
        OverlayManager.hideOverlay()
        promise.resolve(true)
    }

    // ==================== Overlay & Permissions ====================

    @ReactMethod
    fun hasOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun requestOverlayPermission(promise: Promise) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
            !Settings.canDrawOverlays(reactApplicationContext)
        ) {
            val intent = Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                android.net.Uri.parse("package:" + reactApplicationContext.packageName)
            )
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(false)
        } else {
            promise.resolve(true)
        }
    }

    @ReactMethod
    fun dismissOverlay(promise: Promise) {
        OverlayManager.hideOverlay()
        promise.resolve(true)
    }

    // ==================== Accessibility ====================

    @ReactMethod
    fun isAccessibilityServiceEnabled(promise: Promise) {
        promise.resolve(isAccessibilityEnabled())
    }

    @ReactMethod
    fun openAccessibilitySettings(promise: Promise) {
        try {
            val intent = Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ACCESSIBILITY_ERROR", e.message)
        }
    }

    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        promise.resolve(AppBlockAccessibilityService.isRunning())
    }

    // ==================== Helpers ====================

    private fun isAccessibilityEnabled(): Boolean {
        val expectedComponentName = ComponentName(
            reactApplicationContext,
            AppBlockAccessibilityService::class.java
        )
        val enabledServices = Settings.Secure.getString(
            reactApplicationContext.contentResolver,
            Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES
        ) ?: return false

        val colonSplitter = TextUtils.SimpleStringSplitter(':')
        colonSplitter.setString(enabledServices)
        while (colonSplitter.hasNext()) {
            val componentNameStr = colonSplitter.next()
            val enabledComponent = ComponentName.unflattenFromString(componentNameStr)
            if (enabledComponent != null && enabledComponent == expectedComponentName) {
                return true
            }
        }
        return false
    }

    /**
     * Check if the app was launched via the overlay's "Start Prayer" button.
     * Returns true once, then clears the flag.
     */
    @ReactMethod
    fun hasPendingPrayerIntent(promise: Promise) {
        val pending = MainActivity.pendingOpenPrayer
        if (pending) {
            MainActivity.pendingOpenPrayer = false
        }
        promise.resolve(pending)
    }
}
