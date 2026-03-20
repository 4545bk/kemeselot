package com.kemeselot

import android.animation.AnimatorSet
import android.animation.ObjectAnimator
import android.animation.ValueAnimator
import android.content.Context
import android.graphics.*
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.view.animation.AccelerateDecelerateInterpolator
import android.view.animation.DecelerateInterpolator
import android.view.animation.OvershootInterpolator
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView

/**
 * Full-screen blocking overlay with premium feel:
 * - Layered gradient background with subtle shimmer
 * - 300ms fade-in + scale animation with spring overshoot
 * - Staggered child element animations
 * - Smooth fade-out on dismiss
 */
object OverlayManager {

    private var overlayView: View? = null
    private var windowManager: WindowManager? = null
    private var currentBlockedPackage: String? = null

    fun isShowing(): Boolean = overlayView != null
    fun getCurrentBlockedPackage(): String? = currentBlockedPackage

    fun showOverlay(context: Context, blockedPackage: String) {
        if (overlayView != null) return

        currentBlockedPackage = blockedPackage
        windowManager = context.getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val layoutType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        } else {
            @Suppress("DEPRECATION")
            WindowManager.LayoutParams.TYPE_PHONE
        }

        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.MATCH_PARENT,
            WindowManager.LayoutParams.MATCH_PARENT,
            layoutType,
            WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
                    WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS or
                    WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
            PixelFormat.TRANSLUCENT
        )
        params.gravity = Gravity.CENTER

        // Add enter/exit window animations
        params.windowAnimations = android.R.style.Animation_Toast

        overlayView = createOverlayLayout(context)

        try {
            windowManager?.addView(overlayView, params)
            animateIn(overlayView!!)
        } catch (e: Exception) {
            e.printStackTrace()
            overlayView = null
        }
    }

    fun hideOverlay() {
        try {
            if (overlayView != null && windowManager != null) {
                animateOut(overlayView!!) {
                    try {
                        windowManager?.removeView(overlayView)
                    } catch (_: Exception) {}
                    overlayView = null
                    windowManager = null
                    currentBlockedPackage = null
                }
            } else {
                overlayView = null
                windowManager = null
                currentBlockedPackage = null
            }
        } catch (e: Exception) {
            e.printStackTrace()
            overlayView = null
            windowManager = null
            currentBlockedPackage = null
        }
    }

    // ---------- Premium Animations ----------

    private fun animateIn(view: View) {
        // Start invisible, slightly scaled down and translated
        view.alpha = 0f
        view.scaleX = 0.88f
        view.scaleY = 0.88f
        view.translationY = 40f

        // Main container animation: fade + scale + slide
        val fadeIn = ObjectAnimator.ofFloat(view, "alpha", 0f, 1f)
        val scaleX = ObjectAnimator.ofFloat(view, "scaleX", 0.88f, 1f)
        val scaleY = ObjectAnimator.ofFloat(view, "scaleY", 0.88f, 1f)
        val slideUp = ObjectAnimator.ofFloat(view, "translationY", 40f, 0f)

        val mainAnim = AnimatorSet().apply {
            playTogether(fadeIn, scaleX, scaleY, slideUp)
            duration = 300
            interpolator = DecelerateInterpolator(2.0f)
        }
        mainAnim.start()

        // Stagger child elements for premium feel
        if (view is LinearLayout) {
            for (i in 0 until view.childCount) {
                val child = view.getChildAt(i)
                child.alpha = 0f
                child.translationY = 20f
                child.animate()
                    .alpha(1f)
                    .translationY(0f)
                    .setDuration(250)
                    .setStartDelay(150L + (i * 60L))
                    .setInterpolator(DecelerateInterpolator(1.5f))
                    .start()
            }
        }
    }

    private fun animateOut(view: View, onEnd: () -> Unit) {
        val fadeOut = ObjectAnimator.ofFloat(view, "alpha", 1f, 0f)
        val scaleX = ObjectAnimator.ofFloat(view, "scaleX", 1f, 0.92f)
        val scaleY = ObjectAnimator.ofFloat(view, "scaleY", 1f, 0.92f)
        val slideDown = ObjectAnimator.ofFloat(view, "translationY", 0f, 30f)

        val exitAnim = AnimatorSet().apply {
            playTogether(fadeOut, scaleX, scaleY, slideDown)
            duration = 200
            interpolator = AccelerateDecelerateInterpolator()
        }
        exitAnim.addListener(object : android.animation.AnimatorListenerAdapter() {
            override fun onAnimationEnd(animation: android.animation.Animator) {
                onEnd()
            }
        })
        exitAnim.start()
    }

    // ---------- Premium Layout ----------

    private fun createOverlayLayout(context: Context): View {
        // Rich gradient background: deep navy → dark crimson → near-black
        val gradientBg = GradientDrawable(
            GradientDrawable.Orientation.TOP_BOTTOM,
            intArrayOf(
                Color.parseColor("#0D0D1A"),   // Deep navy
                Color.parseColor("#1A0A14"),   // Dark crimson tint
                Color.parseColor("#0A0A0F")    // Near black
            )
        )

        val container = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER
            background = gradientBg
            setPadding(dp(context, 32), dp(context, 64), dp(context, 32), dp(context, 64))
        }

        // Decorative top line — gold accent
        val accentLine = View(context).apply {
            val lineGradient = GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                intArrayOf(
                    Color.TRANSPARENT,
                    Color.parseColor("#D4AF37"),
                    Color.TRANSPARENT
                )
            )
            background = lineGradient
        }
        val lineParams = LinearLayout.LayoutParams(dp(context, 120), dp(context, 2))
        lineParams.gravity = Gravity.CENTER
        lineParams.bottomMargin = dp(context, 24)
        container.addView(accentLine, lineParams)

        // Cross symbol with glow effect
        val cross = TextView(context).apply {
            text = "✞"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 72f)
            setTextColor(Color.parseColor("#D4AF37"))
            gravity = Gravity.CENTER
            setShadowLayer(24f, 0f, 0f, Color.parseColor("#80D4AF37"))
        }
        container.addView(cross)

        // Title with letter spacing
        val title = TextView(context).apply {
            text = "ከመ-ፀሎት"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 38f)
            setTextColor(Color.parseColor("#D4AF37"))
            gravity = Gravity.CENTER
            typeface = Typeface.DEFAULT_BOLD
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                letterSpacing = 0.08f
            }
            setPadding(0, dp(context, 12), 0, dp(context, 4))
        }
        container.addView(title)

        // Subtitle
        val subtitle = TextView(context).apply {
            text = "Prayer Guard"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            setTextColor(Color.parseColor("#8B7355"))
            gravity = Gravity.CENTER
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                letterSpacing = 0.2f
            }
            setPadding(0, 0, 0, dp(context, 24))
        }
        container.addView(subtitle)

        // Decorative divider
        val divider = View(context).apply {
            val divGradient = GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                intArrayOf(
                    Color.TRANSPARENT,
                    Color.parseColor("#40D4AF37"),
                    Color.TRANSPARENT
                )
            )
            background = divGradient
        }
        val divParams = LinearLayout.LayoutParams(dp(context, 200), dp(context, 1))
        divParams.gravity = Gravity.CENTER
        divParams.bottomMargin = dp(context, 24)
        container.addView(divider, divParams)

        // Message
        val missedTime = BlockedAppsManager.getMissedPrayerTime()
        val messageText = if (missedTime != null) {
            "You missed your prayer scheduled at $missedTime.\n\nComplete it now to unlock."
        } else {
            "This app is locked.\n\nComplete your prayer to unlock."
        }

        val message = TextView(context).apply {
            text = messageText
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            setTextColor(Color.parseColor("#D0D0D8"))
            gravity = Gravity.CENTER
            setPadding(dp(context, 16), 0, dp(context, 16), dp(context, 8))
            setLineSpacing(dp(context, 8).toFloat(), 1f)
        }
        container.addView(message)

        // Prayer progress
        val totalScheduled = BlockedAppsManager.getPrayerScheduleSize()
        val totalGoal = if (totalScheduled > 0) totalScheduled else BlockedAppsManager.getDailyPrayerGoal()
        val prayersLeft = totalGoal - BlockedAppsManager.getPrayersCompletedToday()

        val progressText = TextView(context).apply {
            text = "🙏 $prayersLeft prayer${if (prayersLeft != 1) "s" else ""} remaining today"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 14f)
            setTextColor(Color.parseColor("#8B8B9E"))
            gravity = Gravity.CENTER
            setPadding(0, dp(context, 8), 0, dp(context, 40))
        }
        container.addView(progressText)

        // Premium button with rounded corners and gradient
        val buttonBg = GradientDrawable().apply {
            shape = GradientDrawable.RECTANGLE
            cornerRadius = dp(context, 16).toFloat()
            colors = intArrayOf(
                Color.parseColor("#8B0000"),
                Color.parseColor("#6B0000")
            )
            orientation = GradientDrawable.Orientation.TOP_BOTTOM
        }

        val button = Button(context).apply {
            text = "☦ Start Prayer to Unlock"
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 18f)
            setTextColor(Color.parseColor("#E8CC6D"))
            background = buttonBg
            typeface = Typeface.DEFAULT_BOLD
            setPadding(dp(context, 28), dp(context, 20), dp(context, 28), dp(context, 20))
            isAllCaps = false
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                elevation = dp(context, 8).toFloat()
                stateListAnimator = null
            }
            setOnClickListener {
                // First hide the overlay, then launch prayer
                hideOverlay()
                // Launch app with prayer intent after overlay dismisses
                val intent = context.packageManager.getLaunchIntentForPackage(context.packageName)
                intent?.addFlags(
                    android.content.Intent.FLAG_ACTIVITY_NEW_TASK or
                    android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP or
                    android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP
                )
                intent?.putExtra("openPrayer", true)
                try {
                    context.startActivity(intent)
                } catch (e: Exception) {
                    e.printStackTrace()
                }
            }
        }
        val buttonParams = LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.MATCH_PARENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        ).apply {
            setMargins(dp(context, 16), 0, dp(context, 16), dp(context, 24))
        }
        container.addView(button, buttonParams)

        // Bottom accent line
        val bottomLine = View(context).apply {
            val lineGradient = GradientDrawable(
                GradientDrawable.Orientation.LEFT_RIGHT,
                intArrayOf(
                    Color.TRANSPARENT,
                    Color.parseColor("#40D4AF37"),
                    Color.TRANSPARENT
                )
            )
            background = lineGradient
        }
        val bottomLineParams = LinearLayout.LayoutParams(dp(context, 80), dp(context, 2))
        bottomLineParams.gravity = Gravity.CENTER
        container.addView(bottomLine, bottomLineParams)

        return container
    }

    private fun dp(context: Context, value: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value.toFloat(),
            context.resources.displayMetrics
        ).toInt()
    }
}
