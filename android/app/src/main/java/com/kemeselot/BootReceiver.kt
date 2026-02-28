package com.kemeselot

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent

/**
 * BootReceiver
 *
 * Restarts the OverlayService after device reboot so the prayer guard
 * is always active without requiring the user to manually open the app.
 */
class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == Intent.ACTION_BOOT_COMPLETED) {
            val serviceIntent = Intent(context, OverlayService::class.java).apply {
                action = OverlayService.ACTION_START
            }
            context.startForegroundService(serviceIntent)
        }
    }
}
