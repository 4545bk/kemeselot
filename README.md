# Kemeselot (ቀመሰሎት) - Ethiopian Orthodox Prayer Lock App

Kemeselot is a spiritually focused Android application designed to help users remain disciplined in their daily prayers. It implements a unique "Prayer Lock" functionality that uses native Android overlays to block distracting apps (Social Media, Games) until a scheduled prayer or reading is completed.

---

## 🚀 Tech Stack

### Core Frameworks
*   **React Native (v0.76.6):** High-performance cross-platform development with the **New Architecture (Fabric + TurboModules)** enabled.
*   **TypeScript:** Type-safe development across the entire JavaScript codebase.
*   **Kotlin (Native Android):** Custom native code for foreground services, overlay windows, and usage stats monitoring.

### State & Navigation
*   **Zustand:** Lightweight and fast state management for app configuration and user progress.
*   **React Navigation:** Stack-based navigation for fluid transitions between Home, Settings, and Prayer modes.

### Media & Design
*   **React Native Track Player:** Background audio streaming for daily chants.
*   **React Native Fast Image:** Efficient, cached image rendering for high-quality spiritual wallpapers.
*   **Cloudinary:** Dynamic image delivery with real-time dark overlays for text legibility.

### Voice & Prayer Logic
*   **React Native Voice:** Speech recognition to power the "Voice Prayer Mode," where the timer only progresses when Ge'ez/Amharic/English speech is detected.

---

## 🏛️ Core Architecture

The app uses a hybrid architecture combining high-level React Native UI with low-level Android System components:

1.  **Overlay Service (`OverlayService.kt`):** A persistent Android Foreground Service that monitors the top-most application using `UsageStatsManager`.
2.  **Native Bridge (`OverlayModule.kt`):** A custom bridge that allows React Native to communicate with the service, providing lists of blocked apps and receiving lock triggers.
3.  **Independence Activity (`OverlayActivity.kt`):** A dedicated full-screen Android Activity that hosts the `PrayerOverlayScreen`. It is configured to:
    *   Draw over other applications.
    *   Intercept the 'Back' and 'Recent Apps' buttons.
    *   Persist until dismissal via the app's internal logic.
4.  **Audio Handler (`audioService.ts`):** Managed centralized logic for streaming daily chants mapped to the Ethiopian week.

---

## ✨ Key Features

### 1. The Prayer Guard (Native Overlay)
*   **Blocked Apps:** Users can select which apps (e.g., TikTok, Instagram) should trigger the prayer lock.
*   **Priority Overlay:** Uses `SYSTEM_ALERT_WINDOW` permissions to ensure the prayer screen always stays on top.
*   **Boot Persistence:** Automatically restarts the lock service even if the phone is rebooted.

### 2. Mezmure Dawit (Psalms) Integration
*   **Ge'ez Scripture:** Full 151 psalms in their original Ge'ez script.
*   **Reading Schedule:** Implements the official 7-day Ethiopian Orthodox reading schedule.
    *   *Example: Sunday (Ps 1-21), Saturday (Ps 119-151).*
*   **Ethiopian Calendar:** Built-in Geez calendar logic to determine the current liturgical day.

### 3. Dual Prayer Modes
*   **Silent Mode:** A continuous meditative timer.
*   **Voice Mode:** An interactive mode where the timer only ticks while the app detects the user praying aloud. Includes a pulsing visual indicator.

### 4. Liturgical Ambiance
*   **Daily Chants:** Automatically streams the appropriate Orthodox chant for the day (e.g., Tselote Haymanot).
*   **Spiritual Wallpapers:** Deterministically cycles through high-definition spiritual images provided via Cloudinary or Unsplash.

---

## 📂 Folder Structure

```
kemeselot/
├── android/               # Native Android (Kotlin) logic: Services, Modules, Activities
├── assets/
│   ├── data/              # Mezmure Dawit JSON (151 Psalms)
│   └── images/            # Local icons and fallback images
├── src/
│   ├── components/        # Reusable UI (PermissionsSetup, AudioPlayer)
│   ├── navigation/        # AppNavigator (Screens routing)
│   ├── screens/           # Main UI: HomeScreen, Settings, PrayerOverlay
│   ├── services/          # Business logic: Mezmure, Wallpaper, Overlay, Audio
│   ├── store/             # Zustand state stores
│   └── theme/             # Design Tokens: Colors (Midnight, Gold), Spacing, Fonts
├── index.js               # Entry point (Registers Main App & Overlay Root)
└── package.json           # Dependencies and scripts
```

---

## 🛠️ Setup & Installation

### Requirements
*   Android Studio (Ladybug or later)
*   Node.js (v18+)
*   Gemini API Key (optional, for assisted features)

### Steps
1.  **Install Dependencies:**
    ```bash
    npm install
    ```
2.  **Build Native Modules:**
    ```bash
    npx react-native run-android
    ```
3.  **Grant Permissions:** On first launch, the app will request:
    *   *Draw Over Other Apps*
    *   *Usage Access*
    *   *Microphone (for Voice Mode)*

---

## 🗺️ Roadmap
*    [ ] Integration of Kidase (Liturgy) audio streams.
*    [ ] Support for multiple languages (Tigrinya, Oromo).
*    [ ] Community prayer sync (Praying with others in real-time).
*    [ ] Prayer journal and history tracking.

---

**ስብሐት ለእግዚአብሔር**
*Glory be to God.*
