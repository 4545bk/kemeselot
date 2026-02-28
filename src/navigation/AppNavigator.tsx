import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PermissionOnboardingScreen from '../screens/PermissionOnboardingScreen';
import { Colors } from '../theme';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useAppStore } from '../store/appStore';

export type RootStackParamList = {
    Home: undefined;
    Settings: undefined;
    PrayerOverlay: undefined;
    PermissionOnboarding: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
    const { permissionsGranted } = useAppStore();

    return (
        <Stack.Navigator
            initialRouteName={permissionsGranted ? 'Home' : 'PermissionOnboarding'}
            screenOptions={{
                headerStyle: { backgroundColor: Colors.backgroundDark },
                headerTintColor: Colors.gold,
                headerTitleStyle: { fontWeight: '700', fontSize: 20 },
                contentStyle: { backgroundColor: Colors.backgroundDark },
                animation: 'fade_from_bottom',
            }}>
            {!permissionsGranted ? (
                <Stack.Screen
                    name="PermissionOnboarding"
                    component={PermissionOnboardingScreen}
                    options={{ headerShown: false }}
                />
            ) : (
                <>
                    <Stack.Screen
                        name="Home"
                        component={HomeScreen}
                        options={({ navigation }) => ({
                            title: '☦ Kemeselot',
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
                        name="Settings"
                        component={SettingsScreen}
                        options={{
                            title: 'Settings',
                            headerTitleAlign: 'center',
                        }}
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
