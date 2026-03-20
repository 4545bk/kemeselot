import React, { useEffect, useRef } from 'react';
import ErrorBoundary from './src/components/ErrorBoundary';
import { AppState as RNAppState, DeviceEventEmitter } from 'react-native';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import AppNavigator from './src/navigation/AppNavigator';
import { RootStackParamList } from './src/navigation/AppNavigator';
import { changeWallpaperIfNeeded } from './src/services/wallpaperService';
import { preCacheCloudinaryWallpapers } from './src/services/cloudinaryService';
import { setupAudioPlayer } from './src/services/audioService';
import { hasPendingPrayerIntent, getLastBlockedApp } from './src/services/appBlockerService';
import { useAppStore } from './src/store/appStore';
import { ThemeProvider, useThemeColors } from './src/theme/ThemeContext';
import { LanguageProvider } from './src/i18n/LanguageContext';

let lastResetDate = '';

function checkDailyReset() {
    const today = new Date().toISOString().split('T')[0];
    if (lastResetDate !== today) {
        lastResetDate = today;
        const store = useAppStore.getState();
        if (store.psalmsCompletedToday > 0) {
            store.resetDailyProgress();
            console.log('[App] Daily progress reset for new day');
        }
    }
}

/** Inner component that uses theme context for NavigationContainer */
const AppContent: React.FC = () => {
    const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
    const { colors, isDark } = useThemeColors();

    // Check for pending prayer intent (from overlay "Start Prayer" button)
    const checkPrayerIntent = async () => {
        const pending = await hasPendingPrayerIntent();
        if (pending && navigationRef.current) {
            // Record distraction event
            const pkg = await getLastBlockedApp();
            useAppStore.getState().recordDistraction(pkg);
            setTimeout(() => {
                try {
                    navigationRef.current?.navigate('PrayerOverlay');
                } catch (e) {
                    console.warn('[App] Could not navigate to PrayerOverlay:', e);
                }
            }, 500);
        }
    };

    useEffect(() => {
        setupAudioPlayer();
        changeWallpaperIfNeeded();
        preCacheCloudinaryWallpapers(3);
        checkDailyReset();
        checkPrayerIntent();

        const prayerSub = DeviceEventEmitter.addListener('openPrayerSession', async () => {
            console.log('[App] Received openPrayerSession event');
            // Record distraction event
            const pkg = await getLastBlockedApp();
            useAppStore.getState().recordDistraction(pkg);
            try {
                navigationRef.current?.navigate('PrayerOverlay');
            } catch (e) {
                console.warn('[App] Could not navigate to PrayerOverlay:', e);
            }
        });

        const subscription = RNAppState.addEventListener('change', (nextState) => {
            if (nextState === 'active') {
                checkDailyReset();
                changeWallpaperIfNeeded();
                checkPrayerIntent();
            }
        });

        return () => {
            subscription.remove();
            prayerSub.remove();
        };
    }, []);

    return (
        <NavigationContainer
            ref={navigationRef}
            theme={{
                dark: isDark,
                colors: {
                    primary: colors.gold,
                    background: colors.backgroundDark,
                    card: colors.backgroundPrimary,
                    text: colors.textPrimary,
                    border: colors.surfaceLight,
                    notification: colors.crimson,
                },
                fonts: {
                    regular: {
                        fontFamily: 'System',
                        fontWeight: '400',
                    },
                    medium: {
                        fontFamily: 'System',
                        fontWeight: '500',
                    },
                    bold: {
                        fontFamily: 'System',
                        fontWeight: '700',
                    },
                    heavy: {
                        fontFamily: 'System',
                        fontWeight: '900',
                    },
                },
            }}>
            <AppNavigator />
        </NavigationContainer>
    );
};

const App: React.FC = () => {
    return (
        <ErrorBoundary>
            <ThemeProvider>
                <LanguageProvider>
                    <AppContent />
                </LanguageProvider>
            </ThemeProvider>
        </ErrorBoundary>
    );
};

export default App;
