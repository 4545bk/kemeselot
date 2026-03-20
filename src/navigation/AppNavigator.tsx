import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PsalmReaderScreen from '../screens/PsalmReaderScreen';
import PrayerOverlayScreen from '../screens/PrayerOverlayScreen';
import WowOnboardingScreen from '../screens/WowOnboardingScreen';
import PrayerResultScreen from '../screens/PrayerResultScreen';
import PrayerCommitmentScreen from '../screens/PrayerCommitmentScreen';
import AIPrayerScreen from '../screens/AIPrayerScreen';
import { PremiumScreen } from '../screens/PremiumScreen';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useAppStore } from '../store/appStore';
import { useThemeColors } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';

export type RootStackParamList = {
    Home: undefined;
    Settings: undefined;
    PsalmReader: { dayOfWeek: number };
    PrayerOverlay: undefined;
    WowOnboarding: undefined;
    PrayerResult: undefined;
    PrayerCommitment: undefined;
    AIPrayer: undefined;
    Premium: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
    const [hydrated, setHydrated] = React.useState(false);
    const onboardingDone = useAppStore(state => state.onboardingDone);
    const { colors } = useThemeColors();
    const { t } = useTranslation();

    React.useEffect(() => {
        const unsub = useAppStore.persist.onFinishHydration(() => {
            setHydrated(true);
        });

        if (useAppStore.persist.hasHydrated()) {
            setHydrated(true);
        }

        return unsub;
    }, []);

    if (!hydrated) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.backgroundDark, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ color: colors.gold, fontSize: 32, marginBottom: 16 }}>✞</Text>
                <ActivityIndicator color={colors.gold} size="large" />
            </View>
        );
    }
    const showOnboarding = !onboardingDone;

    return (
        <Stack.Navigator
            initialRouteName={showOnboarding ? 'WowOnboarding' : 'Home'}
            screenOptions={{
                headerStyle: { backgroundColor: colors.backgroundDark },
                headerTintColor: colors.gold,
                headerTitleStyle: { fontWeight: '700', fontSize: 20 },
                contentStyle: { backgroundColor: colors.backgroundDark },
                animation: 'fade_from_bottom',
            }}>
            {showOnboarding ? (
                <Stack.Screen
                    name="WowOnboarding"
                    options={{ headerShown: false }}
                >
                    {() => <WowOnboardingScreen onComplete={() => setHydrated(h => h)} />}
                </Stack.Screen>
            ) : (
                <>
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                        options={({ navigation }) => ({
                            title: t('home_title'),
                            headerTitleAlign: 'center',
                            headerRight: () => (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Settings')}
                                    style={styles.gearButton}>
                                    <Text style={styles.gearText}>⚙️</Text>
                                </TouchableOpacity>
                            ),
                        })}
                    />
                    <Stack.Screen
                        name="PsalmReader"
                        component={PsalmReaderScreen}
                        options={{
                            title: '📖 Mezmure Dawit',
                            headerTitleAlign: 'center',
                        }}
                    />
                    <Stack.Screen
                        name="PrayerOverlay"
                        component={PrayerOverlayScreen}
                        options={{
                            title: '🙏 Prayer Session',
                            headerTitleAlign: 'center',
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="Settings"
                        component={SettingsScreen}
                        options={{
                            title: t('settings_title'),
                            headerTitleAlign: 'center',
                        }}
                    />
                    <Stack.Screen
                        name="PrayerResult"
                        component={PrayerResultScreen}
                        options={{
                            headerShown: false,
                            animation: 'slide_from_bottom',
                        }}
                    />
                    <Stack.Screen
                        name="PrayerCommitment"
                        component={PrayerCommitmentScreen}
                        options={{
                            title: t('prayer_plan'),
                            headerTitleAlign: 'center',
                        }}
                    />
                    <Stack.Screen
                        name="AIPrayer"
                        component={AIPrayerScreen}
                        options={{
                            headerShown: false,
                            animation: 'slide_from_bottom',
                        }}
                    />
                    <Stack.Screen
                        name="Premium"
                        component={PremiumScreen}
                        options={{ title: 'Kemeselot Premium' }}
                    />
                </>
            )}
        </Stack.Navigator>
    );
};

const styles = StyleSheet.create({
    gearButton: {
        paddingHorizontal: 8,
    },
    gearText: {
        fontSize: 22,
    },
});

export default AppNavigator;
