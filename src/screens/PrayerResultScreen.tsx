import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    StatusBar,
    Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Spacing, FontSize, BorderRadius, getShadows } from '../theme';
import { useAppStore } from '../store/appStore';
import { useThemeColors } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';

const PrayerResultScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { colors } = useThemeColors();
    const { t } = useTranslation();
    const Shadows = getShadows(colors);
    const { streakCount } = useAppStore();

    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    useEffect(() => {
        Animated.sequence([
            Animated.parallel([
                Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 60, useNativeDriver: true }),
                Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ]),
            Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]).start();
    }, []);

    const handleShare = async () => {
        try {
            await Share.share({
                message: `☦ ${t('app_name')} — ${t('victory')}\n🔥 ${streakCount} ${t('day_streak')}\n${t('discipline_over_distraction')}`,
            });
        } catch (_) {}
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.backgroundDark }]}>
            <StatusBar
                barStyle={colors.backgroundDark === '#0D0D1A' ? 'light-content' : 'dark-content'}
                backgroundColor={colors.backgroundDark}
            />
            <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
                <Animated.View style={[styles.iconCircle, {
                    transform: [{ scale: scaleAnim }],
                    borderColor: colors.gold,
                    ...Shadows.glow,
                }]}>
                    <Text style={styles.checkMark}>✓</Text>
                </Animated.View>

                <Text style={[styles.title, { color: colors.gold }]}>{t('victory')}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {t('chose_discipline')}
                </Text>

                <Animated.View style={[styles.streakCard, {
                    transform: [{ translateY: slideAnim }],
                    backgroundColor: colors.surface,
                    borderColor: colors.goldDark,
                }]}>
                    <Text style={styles.streakIcon}>🔥</Text>
                    <View style={styles.streakInfo}>
                        <Text style={[styles.streakLabel, { color: colors.textMuted }]}>
                            {t('current_streak')}
                        </Text>
                        <Text style={[styles.streakValue, { color: colors.gold }]}>
                            {streakCount} {streakCount === 1 ? 'day' : 'days'}
                        </Text>
                        <Text style={[styles.streakMotivation, { color: colors.textSecondary }]}>
                            {t('keep_going')} 💪
                        </Text>
                    </View>
                </Animated.View>

                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.shareBtn, { borderColor: colors.goldDark }]}
                        onPress={handleShare}
                        activeOpacity={0.8}>
                        <Text style={[styles.shareBtnText, { color: colors.gold }]}>
                            {t('share_milestone')}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.homeBtn, {
                            backgroundColor: colors.crimson,
                            ...Shadows.lg,
                        }]}
                        onPress={() => navigation.replace('Home')}
                        activeOpacity={0.8}>
                        <Text style={[styles.homeBtnText, { color: colors.goldLight }]}>
                            {t('return_home')}
                        </Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },
    checkMark: { fontSize: 48, color: '#10B981', fontWeight: '700' },
    title: { fontSize: FontSize.h1, fontWeight: '800', letterSpacing: 3, marginBottom: Spacing.sm },
    subtitle: { fontSize: FontSize.md, textAlign: 'center', lineHeight: 22, marginBottom: Spacing.xl },
    streakCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: BorderRadius.xl,
        padding: Spacing.lg,
        borderWidth: 1,
        width: '100%',
        marginBottom: Spacing.xl,
    },
    streakIcon: { fontSize: 40, marginRight: Spacing.md },
    streakInfo: { flex: 1 },
    streakLabel: { fontSize: FontSize.xs, fontWeight: '600', letterSpacing: 1 },
    streakValue: { fontSize: FontSize.h2, fontWeight: '800', marginVertical: 2 },
    streakMotivation: { fontSize: FontSize.sm, fontStyle: 'italic' },
    actions: { width: '100%', gap: Spacing.md },
    shareBtn: {
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        borderWidth: 1,
    },
    shareBtnText: { fontSize: FontSize.md, fontWeight: '600' },
    homeBtn: {
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
    },
    homeBtnText: { fontSize: FontSize.lg, fontWeight: '700', letterSpacing: 1 },
});

export default PrayerResultScreen;
