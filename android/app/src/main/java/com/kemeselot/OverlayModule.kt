package com.kemeselot

import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Process
import android.provider.Settings
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule

class OverlayModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val MODULE_NAME = "OverlayModule"
        const val EVENT_OVERLAY_DISMISSED = "onOverlayDismissed"
    }

    override fun getName() = MODULE_NAME

    // ---------- Permission Checks ----------

    /**
     * Check if SYSTEM_ALERT_WINDOW permission is granted.
     * Returns true if the app can draw over other apps.
     */
    @ReactMethod
    fun canDrawOverlays(promise: Promise) {
        promise.resolve(Settings.canDrawOverlays(reactApplicationContext))
    }

    /**
     * Check if PACKAGE_USAGE_STATS permission is granted.
     * This must be granted manually by the user in Android Settings.
     */
    @ReactMethod
    fun hasUsageStatsPermission(promise: Promise) {
        val appOps = reactApplicationContext
            .getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            Process.myUid(),
            reactApplicationContext.packageName
        )
        promise.resolve(mode == AppOpsManager.MODE_ALLOWED)
    }

    // ---------- Permission Requests ----------

    /**
     * Open Android Settings so user can grant "Draw over other apps".
     */
    @ReactMethod
    fun requestOverlayPermission() {
        val intent = Intent(
            Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
            Uri.parse("package:${reactApplicationContext.packageName}")
        ).apply { flags = Intent.FLAG_ACTIVITY_NEW_TASK }
        reactApplicationContext.startActivity(intent)
    }

    /**
     * Open Android Settings so user can grant "Usage access".
     */
    @ReactMethod
    fun requestUsageStatsPermission() {
        val intent = Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK
        }
        reactApplicationContext.startActivity(intent)
    }

    // ---------- Service Control ----------

    /**
     * Start the background overlay/detection service.
     */
    @ReactMethod
    fun startOverlayService(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                action = OverlayService.ACTION_START
            }
            reactApplicationContext.startForegroundService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("START_SERVICE_ERROR", e.message)
        }
    }

    /**
     * Stop the background overlay/detection service.
     */
    @ReactMethod
    fun stopOverlayService(promise: Promise) {
        try {
            val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                action = OverlayService.ACTION_STOP
            }
            reactApplicationContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("STOP_SERVICE_ERROR", e.message)
        }
    }

    /**
     * Check if the overlay service is currently running.
     */
    @ReactMethod
    fun isServiceRunning(promise: Promise) {
        promise.resolve(OverlayService.isRunning)
    }

    // ---------- Blocked Apps Management ----------

    /**
     * Save the list of blocked app package names to SharedPreferences.
     * The service reads these on startup and when updated.
     */
    @ReactMethod
    fun setBlockedApps(packages: ReadableArray, promise: Promise) {
        try {
            val packageSet = mutableSetOf<String>()
            for (i in 0 until packages.size()) {
                packageSet.add(packages.getString(i))
            }
            val prefs = reactApplicationContext.getSharedPreferences(
                OverlayService.PREFS_NAME,
                Context.MODE_PRIVATE
            )
            prefs.edit().putStringSet(OverlayService.PREFS_BLOCKED_APPS, packageSet).apply()

            // Notify running service to reload its list
            if (OverlayService.isRunning) {
                val intent = Intent(reactApplicationContext, OverlayService::class.java).apply {
                    action = OverlayService.ACTION_UPDATE_BLOCKED
                }
                reactApplicationContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("SET_BLOCKED_ERROR", e.message)
        }
    }

    /**
     * Get the currently blocked app package names.
     */
    @ReactMethod
    fun getBlockedApps(promise: Promise) {
        val prefs = reactApplicationContext.getSharedPreferences(
            OverlayService.PREFS_NAME,
            Context.MODE_PRIVATE
        )
        val blocked = prefs.getStringSet(OverlayService.PREFS_BLOCKED_APPS, emptySet()) ?: emptySet()
        val array = Arguments.createArray()
        blocked.forEach { array.pushString(it) }
        promise.resolve(array)
    }

    /**
     * Dismiss the currently showing overlay.
     * Called from React Native after prayer is completed.
     */
    @ReactMethod
    fun dismissOverlay() {
        currentActivity?.let { activity ->
            if (activity is OverlayActivity) {
                activity.runOnUiThread { activity.dismissOverlay() }
            }
        }
    }

    // ---------- Events to JS ----------

    fun sendOverlayDismissedEvent() {
        reactApplicationContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(EVENT_OVERLAY_DISMISSED, null)
    }

    @ReactMethod
    fun addListener(eventName: String) { /* Required for RN built event emitter */ }

    @ReactMethod
    fun removeListeners(count: Int) { /* Required for RN built event emitter */ }
}
