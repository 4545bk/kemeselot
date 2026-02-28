package com.kemeselot

import android.os.Bundle
import android.view.KeyEvent
import android.view.WindowManager
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate

/**
 * OverlayActivity
 *
 * Launched as a full-screen overlay when a blocked app is detected.
 * - Runs above the lock screen
 * - Intercepts Back and Recent Apps buttons
 * - Shows the PrayerOverlay React Native screen
 */
class OverlayActivity : ReactActivity() {

    companion object {
        // Global reference used by OverlayModule to dismiss programmatically
        var instance: OverlayActivity? = null
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        // Draw over the lock screen
        window.addFlags(
            WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED or
                    WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD or
                    WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON or
                    WindowManager.LayoutParams.FLAG_FULLSCREEN
        )
        super.onCreate(savedInstanceState)
        instance = this
    }

    override fun getMainComponentName(): String = "KemeselotOverlay"

    override fun createReactActivityDelegate(): ReactActivityDelegate =
        DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

    /** Block the hardware Back button while overlay is showing */
    override fun onBackPressed() {
        // Do nothing — user must complete prayer to unlock
    }

    /** Block the Recent Apps button */
    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        if (keyCode == KeyEvent.KEYCODE_APP_SWITCH) {
            return true // Consume — do not switch apps
        }
        return super.onKeyDown(keyCode, event)
    }

    /** Called by OverlayModule when prayer is complete */
    fun dismissOverlay() {
        // Notify the service that overlay was dismissed
        OverlayService.isRunning.let {
            val serviceRef = OverlayService()
            serviceRef.onOverlayDismissed()
        }
        finish()
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }
}
