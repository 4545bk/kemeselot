import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Animated,
    StatusBar,
    ScrollView,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../theme';
import {
    canDrawOverlays,
    hasUsageStatsPermission,
    requestOverlayPermission,
    requestUsageStatsPermission,
} from '../services/overlayService';
import { useAppStore } from '../store/appStore';

const PermissionOnboardingScreen: React.FC = () => {
    const { setPermissionsGranted } = useAppStore();
    const [overlayGranted, setOverlayGranted] = useState(false);
    const [usageGranted, setUsageGranted] = useState(false);
    const [checking, setChecking] = useState(true);

    const fadeAnim = React.useRef(new Animated.Value(0)).current;
    const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

    const checkPermissions = useCallback(async () => {
        const overlay = await canDrawOverlays();
        const usage = await hasUsageStatsPermission();

        setOverlayGranted(overlay);
        setUsageGranted(usage);
        setChecking(false);

        if (overlay && usage) {
            setPermissionsGranted(true);
        }
    }, [setPermissionsGranted]);

    useEffect(() => {
        checkPermissions();
        // Check periodically while on this screen
        const interval = setInterval(checkPermissions, 2000);

        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 8,
                useNativeDriver: true,
            }),
        ]).start();

        return () => clearInterval(interval);
    }, [checkPermissions, fadeAnim, scaleAnim]);

    if (checking) return <View style={styles.container} />;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={Colors.backgroundDark} />
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
                    <Image
                        source={require('../../assets/images/onboarding_icon.png')}
                        style={styles.mainIcon}
                        resizeMode="contain"
                    />

                    <Text style={styles.title}>Welcome to ቀመሰሎት</Text>
                    <Text style={styles.subtitle}>To protect your prayer time, we need two sacred permissions from your device.</Text>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>1. Usage Access</Text>
                            {usageGranted ? <Text style={styles.badgeSuccess}>✓ Granted</Text> : <Text style={styles.badgePending}>Pending</Text>}
                        </View>
                        <Text style={styles.cardDescription}>
                            Allows the app to detect when you open distracting apps during prayer time.
                        </Text>
                        {!usageGranted && (
                            <TouchableOpacity style={styles.grantButton} onPress={requestUsageStatsPermission}>
                                <Text style={styles.grantButtonText}>Grant Usage Access</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <View style={styles.card}>
                        <View style={styles.cardHeader}>
                            <Text style={styles.cardTitle}>2. Draw Over Apps</Text>
                            {overlayGranted ? <Text style={styles.badgeSuccess}>✓ Granted</Text> : <Text style={styles.badgePending}>Pending</Text>}
                        </View>
                        <Text style={styles.cardDescription}>
                            Allows the app to show the prayer lock screen over other applications.
                        </Text>
                        {!overlayGranted && (
                            <TouchableOpacity style={styles.grantButton} onPress={requestOverlayPermission}>
                                <Text style={styles.grantButtonText}>Grant Display Over Apps</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <Text style={styles.footerText}>
                        Your privacy is sacred. We never collect or store your data.
                    </Text>
                </Animated.View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.backgroundDark,
    },
    scrollContent: {
        flexGrow: 1,
        padding: Spacing.xl,
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
    },
    mainIcon: {
        width: 140,
        height: 140,
        marginBottom: Spacing.lg,
        ...Shadows.glow,
    },
    title: {
        fontSize: FontSize.h2,
        fontWeight: 'bold',
        color: Colors.gold,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontSize: FontSize.md,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 22,
    },
    card: {
        backgroundColor: Colors.surface,
        width: '100%',
        borderRadius: BorderRadius.lg,
        padding: Spacing.lg,
        marginBottom: Spacing.lg,
        borderWidth: 1,
        borderColor: 'rgba(212, 175, 55, 0.2)',
        ...Shadows.md,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    cardTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
    },
    cardDescription: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        lineHeight: 20,
        marginBottom: Spacing.md,
    },
    grantButton: {
        backgroundColor: Colors.crimson,
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
    },
    grantButtonText: {
        color: Colors.white,
        fontWeight: 'bold',
        fontSize: FontSize.md,
    },
    badgeSuccess: {
        color: Colors.success,
        fontWeight: 'bold',
        fontSize: FontSize.xs,
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    badgePending: {
        color: Colors.gold,
        fontWeight: 'bold',
        fontSize: FontSize.xs,
        backgroundColor: 'rgba(212, 175, 55, 0.1)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: BorderRadius.sm,
    },
    footerText: {
        fontSize: FontSize.xs,
        color: 'rgba(255, 255, 255, 0.4)',
        textAlign: 'center',
        marginTop: Spacing.lg,
    },
});

export default PermissionOnboardingScreen;
