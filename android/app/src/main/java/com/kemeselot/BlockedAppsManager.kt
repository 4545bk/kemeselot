package com.kemeselot

import android.content.Context
import android.content.SharedPreferences
import java.text.SimpleDateFormat
import java.util.*

/**
 * Manages the set of blocked app package names, daily prayer tracking,
 * and cooldown state. Data is persisted via SharedPreferences.
 */
object BlockedAppsManager {

    private const val PREFS_NAME = "kemeselot_blocked_apps"
    private const val KEY_BLOCKED = "blocked_packages"
    private const val KEY_DAILY_GOAL = "daily_prayer_goal"
    private const val KEY_SCHEDULE = "prayer_schedule"
    private const val KEY_PRAYERS_TODAY = "prayers_completed_today"
    private const val KEY_PRAYER_DATE = "prayer_date"
    private const val KEY_COOLDOWN_UNTIL = "cooldown_until_global"

    private val blockedPackages = mutableSetOf<String>()
    private val prayerSchedule = mutableSetOf<String>() // format: "HH:mm"
    private var prefs: SharedPreferences? = null

    // Daily prayer tracking
    private var dailyPrayerGoal: Int = 1       // default: pray once per day
    private var prayersCompletedToday: Int = 0
    private var prayerDate: String = ""
    private var lastMissedTime: String? = null

    fun init(context: Context) {
        prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        loadFromPrefs()
        checkDateReset()
    }

    private fun loadFromPrefs() {
        val stored = prefs?.getStringSet(KEY_BLOCKED, emptySet()) ?: emptySet()
        blockedPackages.clear()
        blockedPackages.addAll(stored)
        
        val storedSchedule = prefs?.getStringSet(KEY_SCHEDULE, emptySet()) ?: emptySet()
        prayerSchedule.clear()
        prayerSchedule.addAll(storedSchedule)

        dailyPrayerGoal = prefs?.getInt(KEY_DAILY_GOAL, 1) ?: 1
        prayersCompletedToday = prefs?.getInt(KEY_PRAYERS_TODAY, 0) ?: 0
        prayerDate = prefs?.getString(KEY_PRAYER_DATE, "") ?: ""
    }

    /** Reset prayer count if it's a new day */
    private fun checkDateReset() {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())
        if (prayerDate != today) {
            prayersCompletedToday = 0
            prayerDate = today
            prefs?.edit()
                ?.putInt(KEY_PRAYERS_TODAY, 0)
                ?.putString(KEY_PRAYER_DATE, today)
                ?.apply()
        }
    }

    // ==================== Blocked Apps ====================

    fun setBlockedApps(packages: List<String>) {
        blockedPackages.clear()
        blockedPackages.addAll(packages)
        prefs?.edit()?.putStringSet(KEY_BLOCKED, blockedPackages.toSet())?.apply()
    }

    fun getBlockedPackages(): Set<String> = blockedPackages.toSet()

    /**
     * Set the strict daily prayer schedule.
     * Expects a list of formatted times like ["06:00", "12:00"]
     */
    fun setPrayerSchedule(times: List<String>) {
        prayerSchedule.clear()
        prayerSchedule.addAll(times)
        prefs?.edit()?.putStringSet(KEY_SCHEDULE, prayerSchedule.toSet())?.apply()
    }

    /**
     * Check if a given package should be blocked right now.
     * Block applies if the user is BEHIND their prayer schedule.
     */
    fun isBlocked(packageName: String): Boolean {
        if (!blockedPackages.contains(packageName)) return false

        checkDateReset()

        // Calculate schedule pass
        val currentTimeString = SimpleDateFormat("HH:mm", Locale.US).format(Date())
        
        // Sort schedule to evaluate oldest missed times first
        val sortedSchedule = prayerSchedule.toList().sorted()
        
        var passedCount = 0
        var earliestMissed: String? = null

        for (time in sortedSchedule) {
            if (currentTimeString >= time) {
                passedCount++
                if (passedCount > prayersCompletedToday && earliestMissed == null) {
                    earliestMissed = time
                }
            }
        }

        // Check global cooldown (brief period right after prayer to let user switch apps)
        val cooldownUntil = prefs?.getLong(KEY_COOLDOWN_UNTIL, 0L) ?: 0L
        if (System.currentTimeMillis() < cooldownUntil) {
            lastMissedTime = null
            return false
        }

        // If user is behind schedule, BLOCK
        if (prayersCompletedToday < passedCount) {
            lastMissedTime = earliestMissed
            return true
        }

        lastMissedTime = null
        return false
    }

    fun getMissedPrayerTime(): String? = lastMissedTime

    fun getPrayerScheduleSize(): Int = prayerSchedule.size

    // ==================== Prayer Tracking ====================

    /** Set how many times per day the user wants to pray (1, 2, or 3) */
    fun setDailyPrayerGoal(goal: Int) {
        dailyPrayerGoal = goal
        prefs?.edit()?.putInt(KEY_DAILY_GOAL, goal)?.apply()
    }

    fun getDailyPrayerGoal(): Int = dailyPrayerGoal

    fun getPrayersCompletedToday(): Int {
        checkDateReset()
        return prayersCompletedToday
    }

    fun hasDailyGoalMet(): Boolean {
        checkDateReset()
        return prayersCompletedToday >= dailyPrayerGoal
    }

    /**
     * Record that the user completed a prayer session.
     * Called only when the prayer timer actually finishes.
     */
    fun recordPrayerSession() {
        checkDateReset()
        prayersCompletedToday++
        prefs?.edit()?.putInt(KEY_PRAYERS_TODAY, prayersCompletedToday)?.apply()

        // Grant a short 30-second cooldown so user can navigate smoothly
        val until = System.currentTimeMillis() + 30_000L
        prefs?.edit()?.putLong(KEY_COOLDOWN_UNTIL, until)?.apply()
    }
}
