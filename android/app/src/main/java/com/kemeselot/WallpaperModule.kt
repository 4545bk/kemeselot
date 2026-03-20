package com.kemeselot

import com.facebook.react.bridge.*
import android.app.WallpaperManager
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.DisplayMetrics
import android.view.WindowManager
import java.io.ByteArrayOutputStream
import java.io.ByteArrayInputStream
import java.io.InputStream
import java.net.URL

class WallpaperModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "WallpaperModule"

    /**
     * Set the phone wallpaper from a URI.
     * Handles: file://, content://, asset://, http://, and Cloudinary cached files.
     * Compresses large images to screen dimensions.
     */
    @ReactMethod
    fun setWallpaper(imageUri: String, promise: Promise) {
        Thread {
            try {
                val wallpaperManager = WallpaperManager.getInstance(reactApplicationContext)

                // Get screen dimensions
                val wm = reactApplicationContext.getSystemService(android.content.Context.WINDOW_SERVICE) as WindowManager
                val metrics = DisplayMetrics()
                wm.defaultDisplay.getMetrics(metrics)
                val screenWidth = metrics.widthPixels
                val screenHeight = metrics.heightPixels

                // Read entire image into memory buffer so we can decode twice
                val imageBytes = readImageBytes(imageUri)
                if (imageBytes == null || imageBytes.isEmpty()) {
                    promise.reject("WALLPAPER_ERROR", "Failed to read image data from: $imageUri")
                    return@Thread
                }

                // First pass: decode bounds only
                val boundsOptions = BitmapFactory.Options().apply {
                    inJustDecodeBounds = true
                }
                BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size, boundsOptions)

                // Calculate sample size
                val imgWidth = boundsOptions.outWidth
                val imgHeight = boundsOptions.outHeight
                var sampleSize = 1
                if (imgWidth > screenWidth || imgHeight > screenHeight) {
                    val widthRatio = imgWidth.toFloat() / screenWidth.toFloat()
                    val heightRatio = imgHeight.toFloat() / screenHeight.toFloat()
                    sampleSize = Math.max(1, Math.floor(Math.min(widthRatio, heightRatio).toDouble()).toInt())
                }

                // Second pass: decode with compression
                val decodeOptions = BitmapFactory.Options().apply {
                    inSampleSize = sampleSize
                    inPreferredConfig = Bitmap.Config.ARGB_8888
                }
                val bitmap = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size, decodeOptions)

                if (bitmap != null) {
                    val finalBitmap = if (bitmap.width > screenWidth * 1.5 || bitmap.height > screenHeight * 1.5) {
                        val scaled = Bitmap.createScaledBitmap(bitmap, screenWidth, screenHeight, true)
                        if (scaled !== bitmap) bitmap.recycle()
                        scaled
                    } else {
                        bitmap
                    }

                    // Set BOTH home screen AND lock screen wallpaper
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) {
                        // Android 7+ (API 24): Set both screens with flags
                        wallpaperManager.setBitmap(
                            finalBitmap, null, true,
                            WallpaperManager.FLAG_SYSTEM or WallpaperManager.FLAG_LOCK
                        )
                    } else {
                        // Older Android: setBitmap sets both by default
                        wallpaperManager.setBitmap(finalBitmap)
                    }

                    if (finalBitmap !== bitmap) finalBitmap.recycle()
                    android.util.Log.d("WallpaperModule", "Wallpaper set successfully! Size: ${finalBitmap.width}x${finalBitmap.height}")
                    promise.resolve(true)
                } else {
                    promise.reject("WALLPAPER_ERROR", "Failed to decode image")
                }
            } catch (e: Exception) {
                e.printStackTrace()
                promise.reject("WALLPAPER_ERROR", e.message)
            }
        }.start()
    }

    /**
     * Read image bytes from various URI schemes into a byte array.
     * This allows us to decode the image multiple times (bounds + actual decode).
     */
    private fun readImageBytes(imageUri: String): ByteArray? {
        var inputStream: InputStream? = null
        try {
            inputStream = when {
                // Local file (including Cloudinary cached files)
                imageUri.startsWith("file://") || imageUri.startsWith("/") -> {
                    val path = if (imageUri.startsWith("file://")) {
                        Uri.parse(imageUri).path ?: return null
                    } else {
                        imageUri
                    }
                    java.io.FileInputStream(path)
                }
                imageUri.startsWith("content://") -> {
                    val uri = Uri.parse(imageUri)
                    reactApplicationContext.contentResolver.openInputStream(uri)
                }
                imageUri.startsWith("asset://") -> {
                    val assetPath = imageUri.removePrefix("asset://")
                    reactApplicationContext.assets.open(assetPath)
                }
                imageUri.startsWith("http://") || imageUri.startsWith("https://") -> {
                    val url = URL(imageUri)
                    val connection = url.openConnection()
                    connection.connectTimeout = 10000
                    connection.readTimeout = 10000
                    connection.doInput = true
                    connection.connect()
                    connection.inputStream
                }
                else -> {
                    // Try to resolve as an Android drawable resource.
                    // React Native release builds pack assets into the drawable folder
                    // and expo-asset returns the resource name (e.g. "assets_wallpapers_photo_52...")
                    // instead of a file path.
                    val resId = reactApplicationContext.resources.getIdentifier(
                        imageUri.substringBeforeLast("."), // in case it has an extension, though usually it doesn't
                        "drawable", 
                        reactApplicationContext.packageName
                    )
                    
                    if (resId != 0) {
                        reactApplicationContext.resources.openRawResource(resId)
                    } else {
                        // Fallback to content URI
                        val uri = Uri.parse(imageUri)
                        reactApplicationContext.contentResolver.openInputStream(uri)
                    }
                }
            }

            if (inputStream == null) return null

            val buffer = ByteArrayOutputStream()
            val data = ByteArray(4096)
            var bytesRead: Int
            while (inputStream.read(data).also { bytesRead = it } != -1) {
                buffer.write(data, 0, bytesRead)
            }
            return buffer.toByteArray()
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        } finally {
            try { inputStream?.close() } catch (_: Exception) {}
        }
    }
}
