/**
 * @format
 */

import { AppRegistry } from 'react-native';
import TrackPlayer from 'react-native-track-player';
import App from './App';
import PrayerOverlayScreen from './src/screens/PrayerOverlayScreen';
import { name as appName } from './app.json';
import PlaybackService from './src/services/trackPlayerService';

// Main app entry point
AppRegistry.registerComponent(appName, () => App);

// Overlay entry point — launched by OverlayActivity as a separate React root
AppRegistry.registerComponent('KemeselotOverlay', () => PrayerOverlayScreen);

// TrackPlayer background service (required for audio to work in background)
TrackPlayer.registerPlaybackService(() => PlaybackService);
