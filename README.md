# Kemeselot (ከመ-ፀሎት) ☦️

Kemeselot is a spiritual discipline and app-blocking utility for Android, built with React Native (Expo). It is inspired by Ethiopian Orthodox iconography and faith, helping users maintain their daily prayer commitments by substituting digital distractions with spiritual reflection (Mezmure Dawit / Psalms).

---

## 🏗️ Tech Stack
* **Framework:** React Native (Expo 52)
* **State Management:** Zustand (with file-based persistence)
* **Navigation:** React Navigation (Native Stack)
* **Audio & Speech:** `expo-av` for audio playback, `expo-speech` for Text-to-Speech
* **Native Integrations:** 
  * Accessibility Service (Detects when blocked apps are opened)
  * System Alert Window / Overlay (Displays the prayer lock screen over blocked apps)
  * Native Wallpaper Manager (Updates the device lock/home screen wallpaper)

---

## 🌟 Core Features

### 1. Prayer Guard (App Blocker) 🛡️
* Blocks distracting apps (like Instagram, TikTok, etc.)
* When a blocked app is opened, Kemeselot intercepts it and shows a **Prayer Lock Screen**.
* The user must complete a prayer session before the blocked app is unlocked.
* **Modes:**
  * **Strict Mode:** User must complete the full prayer session. No skipping.
  * **Flexible Mode:** Allows a 5-minute "Quick Access" skip without praying.
  * **Focus Hours:** Rules only apply during user-defined times (e.g., 09:00 to 17:00). Outside these hours, apps are accessible.

### 2. Daily Prayer Commitment 🙏
* Users can set up a personalized daily prayer schedule.
* **Presets:** Morning & Evening, Dawn-Dusk-Night, or Custom.
* **Time Slots:** Can be tied to a specific time (e.g., "06:00") or set to "Any Time".
* **Weekly History:** Tracks completion of prayer slots over the last 7 days.
* Once all daily prayers are completed, blocked apps remain unlocked for the rest of the day.

### 3. AI Prayer Mode (Reflection) 🤖
* A guided reflection flow before unlocking an app:
  1. **Relationship:** Evaluates how the user feels about their relationship with God today (Terrible to Great).
  2. **Feeling:** Evaluates the user's general mood today.
  3. **Personalized Prayer:** Generates a custom Amharic prayer based on the selected mood grid (25 pre-written templates).
* Encourages reading the personalized prayer sincerely before clicking "I Have Prayed" to unlock the app.

### 4. Mezmure Dawit (Psalm Reader) 📖
* Displays the daily prescribed psalms (grouped by the day of the week).
* Users can read them directly in the app.
* Tracks the **Daily Quota** of psalms read.
* **Prayer Overlay Session:** During a blocked app intercept, the screen autos-scrolls through the day's appointed psalms at a configurable interval.

### 5. Prayer Modes (Silent vs. Voice) 🤫🎤
* **Silent Mode:** The timer runs continuously while the user reads the psalms silently.
* **Voice Mode:** The app uses speech detection (or reads aloud using Text-to-Speech) so the timer only runs while the prayer is actively being spoken.

### 6. Streaks and Gamification 🔥
* Tracks consecutive days the user has met their daily prayer goal.
* Displays a "Victory" screen upon successful completion of a session, encouraging them to share their milestone.

### 7. Wallpaper Sync 🌅
* Optionally syncs the device's wallpaper with beautiful Ethiopian Orthodox spiritual art.
* Wallpapers can change automatically every *N* successful prayer unlocks.

### 8. Customization 🎨🌍
* **Light / Dark Mode:** Full app theme support with deep crimson and Ethiopian gold accents.
* **Multi-Language Support (i18n):** Fully translated UI available in:
  * English 🇬🇧
  * Amharic (አማርኛ) 🇪🇹
  * Oromifa (Afaan Oromoo) 🇪🇹
  * Tigrinya (ትግርኛ) 🇪🇷/🇪🇹

---

## 📂 Project Structure (Key Files)

### State & Foundation
* `src/store/appStore.ts`: The central Zustand store. Holds all user preferences (prayer slots, themes, language, daily progress, blocked apps list) and persists them using `fileStorage.ts`.
* `src/theme.ts` & `ThemeContext.tsx`: Defines the design system (Colors, Spacing, Fonts, Shadows) and provides dynamic Light/Dark mode switching.
* `src/i18n/translations.ts` & `LanguageContext.tsx`: The translation dictionary and React context hook (`useTranslation()`).

### Screens
* `HomeScreen.tsx`: Weekly schedule, streak tracker, daily progress, and quick access to the prayer plan.
* `SettingsScreen.tsx`: Central hub for configuring Prayer Guard, Smart Blocking Rules, Prayer Commitment, Appearance, Language, and AI Prayer settings.
* `PrayerOverlayScreen.tsx`: The actual lock screen that appears over blocked apps. Handles timers, audio chants, psalm auto-scrolling, and voice mode TTS.
* `PrayerCommitmentScreen.tsx`: UI for managing the user's customized daily prayer slots (presets, times, enable/disable switches) and viewing the 7-day history grid.
* `AIPrayerScreen.tsx`: The 3-step interactive slider form (Relationship → Feeling → Prayer Output) using smooth React Native animations and draggable `PanResponder` sliders.
* `PrayerResultScreen.tsx`: The victory screen shown after a prayer is successfully completed.
* `PsalmReaderScreen.tsx`: A dedicated screen for reading through the entire daily psalm selection.

### Services (Core Logic)
* `appBlockerService.ts`: Interfaces with the Native Android Accessibility Service to detect app launches, checks overlay permissions, and manages unlocking.
* `audioService.ts`: Uses `expo-av` to play continuous background Ethiopian Orthodox chants during a prayer session.
* `wallpaperService.ts`: Fetches and applies wallpapers to the device background.
* `aiPrayerService.ts`: Contains the 5x5 matrix of pre-written Amharic prayers and utility functions for generating mood-based outputs.
* `mezmureService.ts`: Provides the text (Geez + English) for the Psalms mapped to specific days of the week.

---

## 🚀 How to Run

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Start Development Server:**
   ```bash
   npx expo start
   ```

3. **Build Release APK (Android):**
   *(Required for Accessibility Service and Overlay functionality)*
   ```bash
   cd android
   .\gradlew.bat assembleRelease
   ```
   *The built APK will be located at `android/app/build/outputs/apk/release/app-release.apk`.*
