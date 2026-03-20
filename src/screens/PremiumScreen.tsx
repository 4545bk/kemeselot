import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAppStore } from '../store/appStore';
import { useThemeColors } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Spacing, FontSize, BorderRadius, getShadows } from '../theme';
import { uploadReceipt, checkPaymentStatus, PaymentStatusResult } from '../services/paymentService';
import { AuthScreen } from './AuthScreen';

export const PremiumScreen: React.FC = () => {
    const { colors } = useThemeColors();
    const { t } = useTranslation();
    const Shadows = getShadows(colors);
    const { isPremium, paymentStatus, setPaymentStatus, setIsPremium, authToken, authUser, logout } = useAppStore();

    const [loading, setLoading] = useState(false);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [showAuth, setShowAuth] = useState(false);
    const [rejectionNote, setRejectionNote] = useState<string | null>(null);
    const [submittedAt, setSubmittedAt] = useState<string | null>(null);

    const pickImage = async () => {
        try {
            // Request permission first
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please allow access to your photo library to upload a receipt.',
                    [{ text: 'OK' }]
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setImageUri(result.assets[0].uri);
            }
        } catch (error: any) {
            console.error('Image picker error:', error);
            Alert.alert('Error', 'Could not open image picker: ' + (error.message || ''));
        }
    };

    const handleUpload = async () => {
        if (!imageUri) return;
        try {
            setLoading(true);
            await uploadReceipt(imageUri);
            setPaymentStatus('pending');
            setImageUri(null);
            Alert.alert('Success', 'Receipt uploaded successfully!');
        } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to upload receipt');
        } finally {
            setLoading(false);
        }
    };

    const refreshStatus = async () => {
        try {
            setLoading(true);
            const result = await checkPaymentStatus();
            setPaymentStatus(result.status);
            if (result.note) setRejectionNote(result.note);
            if (result.submittedAt) setSubmittedAt(result.submittedAt);
            if (result.status === 'approved' && !isPremium) {
                setIsPremium(true);
            }
        } catch (error) {
            console.error('Error refreshing status:', error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-poll if pending
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (paymentStatus === 'pending') {
            interval = setInterval(refreshStatus, 15000); // Check every 15 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [paymentStatus]);

    // Initial check on mount
    useEffect(() => {
        if (paymentStatus !== 'approved') {
            refreshStatus();
        }
    }, []);

    const s = getStyles(colors);

    // Show auth screen if not logged in
    if (!authToken || showAuth) {
        return <AuthScreen onSuccess={() => setShowAuth(false)} />;
    }

    if (isPremium || paymentStatus === 'approved') {
        return (
            <View style={[s.root, s.center]}>
                <Text style={s.bigEmoji}>🎉</Text>
                <Text style={s.successTitle}>{t('status_approved')}</Text>
                <Text style={s.descText}>You now have full access to all Kemeselot features.</Text>
                <Text style={[s.descText, { marginTop: Spacing.md, color: colors.textMuted }]}>
                    Logged in as: {authUser?.name || authUser?.phone}
                </Text>
            </View>
        );
    }

    return (
        <ScrollView style={s.root} contentContainerStyle={s.content}>
            <View style={s.header}>
                <Text style={s.title}>{t('premium_title')}</Text>
                <Text style={s.desc}>{t('premium_desc')}</Text>
            </View>

            {/* Status Banner */}
            {paymentStatus === 'pending' && (
                <View style={[s.banner, s.bannerPending]}>
                    <ActivityIndicator size="small" color="#92400E" />
                    <View style={{ flex: 1 }}>
                        <Text style={[s.bannerText, { color: '#92400E' }]}>{t('status_pending')}</Text>
                        {submittedAt && (
                            <Text style={{ fontSize: FontSize.xs, color: '#92400E', opacity: 0.7, marginTop: 2 }}>
                                Submitted: {new Date(submittedAt).toLocaleString()}
                            </Text>
                        )}
                    </View>
                </View>
            )}
            {paymentStatus === 'rejected' && (
                <View style={[s.banner, s.bannerRejected]}>
                    <View style={{ flex: 1 }}>
                        <Text style={[s.bannerText, { color: '#B91C1C' }]}>{t('status_rejected')}</Text>
                        {rejectionNote && (
                            <Text style={{ fontSize: FontSize.sm, color: '#B91C1C', opacity: 0.8, marginTop: 4 }}>
                                Reason: {rejectionNote}
                            </Text>
                        )}
                        <Text style={{ fontSize: FontSize.xs, color: '#B91C1C', opacity: 0.6, marginTop: 4 }}>
                            Please upload a new receipt below
                        </Text>
                    </View>
                </View>
            )}

            {/* Instructions */}
            <View style={[s.card, Shadows.sm]}>
                <Text style={s.cardTitle}>{t('payment_instructions')}</Text>
                <Text style={s.price}>{t('premium_price')}</Text>

                <View style={s.accountBox}>
                    <Text style={s.bankName}>{t('bank_cbe')}</Text>
                    <Text style={s.accountNumber} selectable>1000123456789</Text>
                    <Text style={s.accountName}>{t('account_name')}</Text>
                </View>

                <View style={s.accountBox}>
                    <Text style={s.bankName}>{t('telebirr')}</Text>
                    <Text style={s.accountNumber} selectable>0911234567</Text>
                    <Text style={s.accountName}>{t('account_name')}</Text>
                </View>
            </View>

            {/* Upload Area */}
            {/* Upload Area — show when no pending receipt OR when rejected */}
            {(paymentStatus !== 'pending') && (
                <View style={[s.card, Shadows.sm, { marginTop: Spacing.xl }]}>
                    <Text style={s.cardTitle}>{t('upload_receipt')}</Text>

                    {imageUri ? (
                        <View style={s.imagePreviewContainer}>
                            <Image source={{ uri: imageUri }} style={s.imagePreview} />
                            <TouchableOpacity style={s.changeBtn} onPress={pickImage}>
                                <Text style={s.changeBtnText}>Change</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity style={s.uploadBox} onPress={pickImage}>
                            <Text style={s.uploadIcon}>📷</Text>
                            <Text style={s.uploadText}>{t('pick_image')}</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style={[
                            s.submitBtn,
                            (!imageUri || loading) && s.submitBtnDisabled,
                        ]}
                        disabled={!imageUri || loading}
                        onPress={handleUpload}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.backgroundDark} />
                        ) : (
                            <Text style={s.submitBtnText}>{t('upload_receipt')}</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}

            {paymentStatus === 'pending' && (
                <TouchableOpacity style={s.refreshBtn} onPress={refreshStatus} disabled={loading}>
                    <Text style={s.refreshBtnText}>{loading ? '...' : t('refresh_status')}</Text>
                </TouchableOpacity>
            )}
            
            <View style={{ height: 40 }} />
        </ScrollView>
    );
};

const getStyles = (colors: any) =>
    StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.backgroundDark,
        },
        center: {
            justifyContent: 'center',
            alignItems: 'center',
            padding: Spacing.xl,
        },
        content: {
            padding: Spacing.xl,
        },
        header: {
            alignItems: 'center',
            marginBottom: Spacing.xxl,
            marginTop: Spacing.xl,
        },
        title: {
            fontSize: FontSize.h2,
            fontWeight: '800',
            color: colors.gold,
            marginBottom: Spacing.sm,
            textAlign: 'center',
        },
        desc: {
            fontSize: FontSize.md,
            color: colors.textSecondary,
            textAlign: 'center',
        },
        banner: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            padding: Spacing.md,
            borderRadius: BorderRadius.md,
            marginBottom: Spacing.xl,
            gap: Spacing.sm,
        },
        bannerPending: {
            backgroundColor: '#FEF3C7',
            borderWidth: 1,
            borderColor: '#FDE68A',
        },
        bannerRejected: {
            backgroundColor: '#FEE2E2',
            borderWidth: 1,
            borderColor: '#FECACA',
        },
        bannerText: {
            fontSize: FontSize.sm,
            fontWeight: '600',
        },
        card: {
            backgroundColor: colors.surface,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
            borderWidth: 1,
            borderColor: colors.border,
        },
        cardTitle: {
            fontSize: FontSize.lg,
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: Spacing.md,
        },
        price: {
            fontSize: FontSize.md,
            fontWeight: '600',
            color: colors.gold,
            marginBottom: Spacing.lg,
        },
        accountBox: {
            backgroundColor: 'rgba(0,0,0,0.2)',
            padding: Spacing.md,
            borderRadius: BorderRadius.md,
            marginBottom: Spacing.md,
        },
        bankName: {
            fontSize: FontSize.sm,
            color: colors.textSecondary,
            marginBottom: 4,
        },
        accountNumber: {
            fontSize: FontSize.xl,
            fontWeight: '700',
            color: colors.textPrimary,
            letterSpacing: 1,
            marginBottom: 4,
        },
        accountName: {
            fontSize: FontSize.xs,
            color: colors.textMuted,
        },
        uploadBox: {
            borderWidth: 2,
            borderColor: 'rgba(212, 175, 55, 0.3)',
            borderStyle: 'dashed',
            borderRadius: BorderRadius.lg,
            height: 120,
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: Spacing.xl,
            backgroundColor: 'rgba(212, 175, 55, 0.05)',
        },
        uploadIcon: {
            fontSize: 32,
            marginBottom: Spacing.sm,
        },
        uploadText: {
            fontSize: FontSize.sm,
            color: colors.gold,
            fontWeight: '600',
        },
        imagePreviewContainer: {
            alignItems: 'center',
            marginBottom: Spacing.xl,
        },
        imagePreview: {
            width: '100%',
            height: 200,
            borderRadius: BorderRadius.md,
            resizeMode: 'cover',
            marginBottom: Spacing.sm,
        },
        changeBtn: {
            padding: Spacing.sm,
        },
        changeBtnText: {
            color: colors.gold,
            fontSize: FontSize.sm,
            fontWeight: '600',
        },
        submitBtn: {
            backgroundColor: colors.gold,
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.round,
            alignItems: 'center',
        },
        submitBtnDisabled: {
            opacity: 0.5,
        },
        submitBtnText: {
            fontSize: FontSize.md,
            fontWeight: '700',
            color: colors.backgroundDark,
        },
        refreshBtn: {
            marginTop: Spacing.xl,
            alignItems: 'center',
            padding: Spacing.md,
        },
        refreshBtnText: {
            color: colors.textSecondary,
            fontSize: FontSize.sm,
            textDecorationLine: 'underline',
        },
        bigEmoji: {
            fontSize: 64,
            marginBottom: Spacing.lg,
        },
        successTitle: {
            fontSize: FontSize.h1,
            color: colors.success,
            fontWeight: '800',
            marginBottom: Spacing.sm,
            textAlign: 'center',
        },
        descText: {
            fontSize: FontSize.md,
            color: colors.textSecondary,
            textAlign: 'center',
        },
    });

export default PremiumScreen;
