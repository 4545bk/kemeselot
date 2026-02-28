package com.kemeselot

import android.app.*
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.os.Handler
import android.os.IBinder
import android.os.Looper
import android.app.usage.UsageStatsManager
import android.util.Log
import androidx.core.app.NotificationCompat

class OverlayService : Service() {

    companion object {
        const val TAG = "KemeselotOverlay"
        const val CHANNEL_ID = "kemeselot_overlay_channel"
        const val NOTIFICATION_ID = 1001
        const val PREFS_NAME = "KemeselotPrefs"
        const val PREFS_BLOCKED_APPS = "blocked_apps"
        const val CHECK_INTERVAL_MS = 1000L // Check every 1 second

        // Intent actions
        const val ACTION_START = "com.kemeselot.START_OVERLAY"
        const val ACTION_STOP = "com.kemeselot.STOP_OVERLAY"
        const val ACTION_UPDATE_BLOCKED = "com.kemeselot.UPDATE_BLOCKED_APPS"

        // Whether service is running
        var isRunning = false
    }

    private val handler = Handler(Looper.getMainLooper())
    private var blockedPackages: Set<String> = emptySet()
    private var lastForegroundApp: String = ""
    private var overlayShowing = false
    private lateinit var prefs: SharedPreferences

    // Runnable that checks foreground app periodically
    private val checkRunnable = object : Runnable {
        override fun run() {
            checkForegroundApp()
            handler.postDelayed(this, CHECK_INTERVAL_MS)
        }
    }

    override fun onCreate() {
        super.onCreate()
        prefs = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        loadBlockedApps()
        createNotificationChannel()
        isRunning = true
        Log.d(TAG, "OverlayService created")
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_STOP -> {
                stopSelf()
                return START_NOT_STICKY
            }
            ACTION_UPDATE_BLOCKED -> {
                loadBlockedApps()
            }
        }

        // Start as foreground service with persistent notification
        startForeground(NOTIFICATION_ID, buildNotification())

        // Begin periodic checking
        handler.post(checkRunnable)

        Log.d(TAG, "OverlayService started, monitoring ${blockedPackages.size} blocked apps")
        return START_STICKY // Restart if killed
    }

    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacks(checkRunnable)
        isRunning = false
        Log.d(TAG, "OverlayService destroyed")
    }

    override fun onBind(intent: Intent?): IBinder? = null

    // ---------- Core Detection Logic ----------

    private fun checkForegroundApp() {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as? UsageStatsManager
            ?: return

        val now = System.currentTimeMillis()
        // Query the last 5 seconds to reliably detect the foreground app
        val stats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            now - 5000,
            now
        )

        if (stats.isNullOrEmpty()) {
            Log.w(TAG, "UsageStats empty — ensure PACKAGE_USAGE_STATS permission is granted")
            return
        }

        // Find the most recently used app
        val foregroundApp = stats
            .filter { it.lastTimeUsed > 0 }
            .maxByOrNull { it.lastTimeUsed }
            ?.packageName ?: return

        // Only act if the foreground app changed
        if (foregroundApp == lastForegroundApp) return
        lastForegroundApp = foregroundApp

        Log.d(TAG, "Foreground app: $foregroundApp")

        // Check if this app is in the blocked list
        if (blockedPackages.contains(foregroundApp) && !overlayShowing) {
            Log.d(TAG, "BLOCKED app detected: $foregroundApp — launching overlay")
            launchOverlay(foregroundApp)
        }
    }

    private fun launchOverlay(packageName: String) {
        overlayShowing = true

        val intent = Intent(this, OverlayActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or
                    Intent.FLAG_ACTIVITY_SINGLE_TOP or
                    Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("blocked_package", packageName)
        }
        startActivity(intent)
    }

    fun onOverlayDismissed() {
        overlayShowing = false
        Log.d(TAG, "Overlay dismissed — monitoring resumed")
    }

    // ---------- Helpers ----------

    private fun loadBlockedApps() {
        val saved = prefs.getStringSet(PREFS_BLOCKED_APPS, emptySet()) ?: emptySet()
        blockedPackages = saved
        Log.d(TAG, "Loaded ${blockedPackages.size} blocked apps: $blockedPackages")
    }

    private fun createNotificationChannel() {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Kemeselot Prayer Guard",
            NotificationManager.IMPORTANCE_LOW
        ).apply {
            description = "Monitors apps to keep your prayer commitment"
            setShowBadge(false)
        }
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }

    private fun buildNotification(): Notification {
        val openIntent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("☦ Kemeselot Active")
            .setContentText("Prayer guard is watching over you")
            .setSmallIcon(android.R.drawable.ic_lock_lock)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setCategory(NotificationCompat.CATEGORY_SERVICE)
            .build()
    }
}
