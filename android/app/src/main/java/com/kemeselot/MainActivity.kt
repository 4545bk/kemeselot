package com.kemeselot

import android.content.Intent
import android.os.Build
import android.os.Bundle

import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
import com.facebook.react.bridge.Arguments
import com.facebook.react.modules.core.DeviceEventManagerModule

import expo.modules.ReactActivityDelegateWrapper

class MainActivity : ReactActivity() {

    companion object {
        var pendingOpenPrayer: Boolean = false
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        setTheme(R.style.AppTheme)
        super.onCreate(null)
        handleOpenPrayerIntent(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleOpenPrayerIntent(intent)
    }

    private fun handleOpenPrayerIntent(intent: Intent?) {
        if (intent?.getBooleanExtra("openPrayer", false) == true) {
            pendingOpenPrayer = true
            // Emit event to JS if React context is ready
            try {
                val reactContext = reactNativeHost.reactInstanceManager.currentReactContext
                reactContext?.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                    ?.emit("openPrayerSession", null)
            } catch (e: Exception) {
                // React not ready yet — pendingOpenPrayer flag will be checked by JS
            }
            // Clear the extra so it doesn't re-trigger
            intent.removeExtra("openPrayer")
        }
    }

    override fun getMainComponentName(): String = "main"

    override fun createReactActivityDelegate(): ReactActivityDelegate {
        return ReactActivityDelegateWrapper(
              this,
              BuildConfig.IS_NEW_ARCHITECTURE_ENABLED,
              object : DefaultReactActivityDelegate(
                  this,
                  mainComponentName,
                  fabricEnabled
              ){})
    }

    override fun invokeDefaultOnBackPressed() {
        if (Build.VERSION.SDK_INT <= Build.VERSION_CODES.R) {
            if (!moveTaskToBack(false)) {
                super.invokeDefaultOnBackPressed()
            }
            return
        }
        super.invokeDefaultOnBackPressed()
    }
}
