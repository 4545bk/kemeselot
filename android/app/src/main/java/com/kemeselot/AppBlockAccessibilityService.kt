package com.kemeselot

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.AccessibilityServiceInfo
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.provider.Settings
import android.util.Log
import android.view.accessibility.AccessibilityEvent

/**
 * AccessibilityService that monitors TYPE_WINDOW_STATE_CHANGED events to detect
 * when a blocked app becomes the foreground app, then triggers the overlay.
 *
 * Hardened against bypass via phone lock/unlock:
 * - Does NOT dismiss overlay when non-blocked apps appear (only RN bridge can dismiss)
 * - Tracks the last blocked package to re-trigger after screen unlock
 * - Listens for ACTION_USER_PRESENT to re-check blocking on unlock
 * - Listens for ACTION_SCREEN_OFF to remember blocking state
 */
class AppBlockAccessibilityService : AccessibilityService() {

    companion object {
        private const val TAG = "AppBlockService"
        var instance: AppBlockAccessibilityService? = null
            private set

        fun isRunning(): Boolean = instance != null
    }

    // Debounce: prevent multiple triggers within 1 second
    private var lastTriggerTime: Long = 0
    private var lastTriggeredPackage: String = ""

    // Track the package that was blocked when screen turned off
    private var pendingBlockedPackage: String? = null

    // Packages to always ignore (system, launchers, self)
    private val ignoredPackages = setOf(
        "com.android.systemui",
        "com.android.launcher",
        "com.android.launcher3",
        "com.google.android.apps.nexuslauncher",
        "com.sec.android.app.launcher",       // Samsung
        "com.huawei.android.launcher",        // Huawei
        "com.miui.home",                      // Xiaomi
        "com.oppo.launcher",                  // Oppo
        "com.android.settings",               // System settings
        "android",                            // Android framework
    )

    // BroadcastReceiver for screen on/off and user unlock events
    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                Intent.ACTION_SCREEN_OFF -> {
                    // Phone locked — remember if we were blocking something
                    if (OverlayManager.isShowing()) {
                        pendingBlockedPackage = OverlayManager.getCurrentBlockedPackage()
                        Log.d(TAG, "Screen off — remembering blocked package: $pendingBlockedPackage")
                    }
                }
                Intent.ACTION_USER_PRESENT -> {
                    // User unlocked the phone — re-check if we need to block
                    Log.d(TAG, "User unlocked — checking for pending blocks")
                    val pending = pendingBlockedPackage
                    if (pending != null && BlockedAppsManager.isBlocked(pending)) {
                        Log.d(TAG, "Re-triggering overlay for: $pending")
                        if (!OverlayManager.isShowing()) {
                            if (Settings.canDrawOverlays(applicationContext)) {
                                OverlayManager.showOverlay(applicationContext, pending)
                            }
                        }
                    }
                    pendingBlockedPackage = null
                }
            }
        }
    }

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this

        val info = AccessibilityServiceInfo().apply {
            eventTypes = AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
            feedbackType = AccessibilityServiceInfo.FEEDBACK_GENERIC
            flags = AccessibilityServiceInfo.FLAG_INCLUDE_NOT_IMPORTANT_VIEWS
            notificationTimeout = 300
        }
        serviceInfo = info

        // Initialize the blocked apps manager
        BlockedAppsManager.init(applicationContext)

        // Register for screen on/off/unlock events (safe for API 33+)
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
        }
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                registerReceiver(screenReceiver, filter, Context.RECEIVER_EXPORTED)
            } else {
                registerReceiver(screenReceiver, filter)
            }
        } catch (e: Exception) {
            Log.w(TAG, "Failed to register screen receiver: ${e.message}")
        }

        Log.d(TAG, "AccessibilityService connected — monitoring blocked apps")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        if (event?.eventType != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED) return

        val packageName = event.packageName?.toString() ?: return

        // --- Filter 1: Ignore our own app (prevents overlay loop) ---
        if (packageName == applicationContext.packageName) return

        // --- Filter 2: Ignore system packages and launchers ---
        if (ignoredPackages.contains(packageName)) return
        if (packageName.startsWith("com.android.launcher")) return

        // --- Filter 3: Debounce — skip if same app triggered within 1 second ---
        val now = System.currentTimeMillis()
        if (packageName == lastTriggeredPackage && (now - lastTriggerTime) < 1000) {
            return
        }

        // --- Check if this package should be blocked ---
        if (BlockedAppsManager.isBlocked(packageName)) {
            Log.d(TAG, "Blocked app detected: $packageName — showing overlay")

            lastTriggerTime = now
            lastTriggeredPackage = packageName
            pendingBlockedPackage = packageName

            if (!OverlayManager.isShowing()) {
                if (Settings.canDrawOverlays(applicationContext)) {
                    OverlayManager.showOverlay(applicationContext, packageName)
                } else {
                    Log.w(TAG, "Cannot show overlay — SYSTEM_ALERT_WINDOW not granted")
                }
            }
        }
        // NOTE: We intentionally do NOT hide the overlay when a non-blocked app appears.
        // The overlay can only be dismissed by completing prayer (via RN bridge).
        // This prevents lock-screen bypass where systemui hides the overlay.
    }

    override fun onInterrupt() {
        Log.d(TAG, "AccessibilityService interrupted")
    }

    override fun onDestroy() {
        super.onDestroy()
        try {
            unregisterReceiver(screenReceiver)
        } catch (_: Exception) {}
        instance = null
        OverlayManager.hideOverlay()
        Log.d(TAG, "AccessibilityService destroyed")
    }
}
