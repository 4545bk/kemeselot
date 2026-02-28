import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Platform,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../theme';
import {
    canDrawOverlays,
    hasUsageStatsPermission,
    requestOverlayPermission,
    requestUsageStatsPermission,
    startOverlayService,
    isServiceRunning,
} from '../services/overlayService';

interface PermissionStatus {
    overlay: boolean | null;
    usageStats: boolean | null;
    serviceRunning: boolean;
}

interface Props {
    onAllGranted?: () => void;
}

const PermissionsSetup: React.FC<Props> = ({ onAllGranted }) => {
    const [status, setStatus] = useState<PermissionStatus>({
        overlay: null,
        usageStats: null,
        serviceRunning: false,
    });

    const checkPermissions = async () => {
        const overlay = await canDrawOverlays();
        const usageStats = await hasUsageStatsPermission();
        const serviceRunning = await isServiceRunning();
        setStatus({ overlay, usageStats, serviceRunning });

        if (overlay && usageStats && !serviceRunning) {
            await startOverlayService();
            setStatus(prev => ({ ...prev, serviceRunning: true }));
        }

        if (overlay && usageStats) {
            onAllGranted?.();
        }
    };

    useEffect(() => {
        checkPermissions();
        // Re-check every time component mounts (e.g. returning from Settings)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const allGranted = status.overlay && status.usageStats;

    if (allGranted) {
        return null; // Nothing to show once permissions are granted
    }

    return (
        <View style={styles.card}>
            <Text style={styles.title}>⚙️ Setup Required</Text>
            <Text style={styles.subtitle}>
                Grant these permissions to enable the prayer lock:
            </Text>

            {/* Overlay Permission */}
            <View style={styles.permRow}>
                <View style={styles.permInfo}>
                    <Text style={styles.permName}>Draw Over Other Apps</Text>
                    <Text style={styles.permDesc}>Required to show prayer screen</Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.permButton,
                        status.overlay && styles.permButtonGranted,
                    ]}
                    onPress={() => {
                        requestOverlayPermission();
                    }}
                    disabled={status.overlay === true}>
                    <Text style={styles.permButtonText}>
                        {status.overlay ? '✓ Granted' : 'Grant'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Usage Stats Permission */}
            <View style={styles.permRow}>
                <View style={styles.permInfo}>
                    <Text style={styles.permName}>Usage Access</Text>
                    <Text style={styles.permDesc}>Required to detect blocked apps</Text>
                </View>
                <TouchableOpacity
                    style={[
                        styles.permButton,
                        status.usageStats && styles.permButtonGranted,
                    ]}
                    onPress={() => {
                        requestUsageStatsPermission();
                    }}
                    disabled={status.usageStats === true}>
                    <Text style={styles.permButtonText}>
                        {status.usageStats ? '✓ Granted' : 'Grant'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Refresh Button */}
            <TouchableOpacity style={styles.refreshButton} onPress={checkPermissions}>
                <Text style={styles.refreshButtonText}>↻ Check Again</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        width: '100%',
        backgroundColor: Colors.surface,
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        borderColor: Colors.crimsonLight,
        marginVertical: Spacing.md,
        ...Shadows.md,
    },
    title: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.textPrimary,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.textSecondary,
        marginBottom: Spacing.md,
    },
    permRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    permInfo: {
        flex: 1,
        marginRight: Spacing.sm,
    },
    permName: {
        fontSize: FontSize.md,
        fontWeight: '600',
        color: Colors.textPrimary,
    },
    permDesc: {
        fontSize: FontSize.xs,
        color: Colors.textMuted,
    },
    permButton: {
        backgroundColor: Colors.crimson,
        paddingVertical: Spacing.xs,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    permButtonGranted: {
        backgroundColor: Colors.success,
    },
    permButtonText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.white,
    },
    refreshButton: {
        marginTop: Spacing.sm,
        alignItems: 'center',
        paddingVertical: Spacing.xs,
    },
    refreshButtonText: {
        fontSize: FontSize.sm,
        color: Colors.gold,
    },
});

export default PermissionsSetup;
