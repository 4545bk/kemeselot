import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    LayoutAnimation,
    Platform,
    UIManager,
    StatusBar,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Spacing, FontSize, BorderRadius, getShadows } from '../theme';
import { getTodayPsalms, getWeeklySchedule } from '../services/mezmureService';
import { useAppStore } from '../store/appStore';
import { useThemeColors } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

type PsalmReaderRouteProp = RouteProp<RootStackParamList, 'PsalmReader'>;

const PsalmReaderScreen: React.FC = () => {
    const route = useRoute<PsalmReaderRouteProp>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { colors } = useThemeColors();
    const { t } = useTranslation();
    const Shadows = getShadows(colors);

    const { dailyQuota, psalmsCompletedToday, markPsalmAsRead } = useAppStore();
    const { dayOfWeek } = route.params;

    const schedule = getWeeklySchedule();
    const dayEntry = schedule[dayOfWeek] ?? schedule[0];
    const todayPsalms = getTodayPsalms(dayOfWeek);

    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [readPsalms, setReadPsalms] = useState<Set<number>>(new Set());

    const handleToggle = (index: number) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedIndex(expandedIndex === index ? null : index);
    };

    const markAsRead = (index: number) => {
        if (!readPsalms.has(index)) {
            const updated = new Set(readPsalms);
            updated.add(index);
            setReadPsalms(updated);
            markPsalmAsRead();
        }
    };

    const s = getStyles(colors);

    return (
        <View style={s.container}>
            <StatusBar
                barStyle={colors.backgroundDark === '#0D0D1A' ? 'light-content' : 'dark-content'}
                backgroundColor={colors.backgroundDark}
            />
            <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={s.header}>
                    <Text style={s.dayTitle}>
                        {dayEntry.dayNameAmharic} / {dayEntry.dayName}
                    </Text>
                    <Text style={s.psalmRange}>{dayEntry.psalmRange}</Text>
                    <Text style={s.readCount}>
                        {readPsalms.size} {t('of_label')} {todayPsalms.psalms.length} {t('read_label')}
                    </Text>
                    {/* Progress bar */}
                    <View style={s.progressTrack}>
                        <View
                            style={[
                                s.progressFill,
                                {
                                    width: todayPsalms.psalms.length > 0
                                        ? `${(readPsalms.size / todayPsalms.psalms.length) * 100}%`
                                        : '0%',
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* Psalms list */}
                {todayPsalms.psalms.map((psalm, index) => {
                    const isExpanded = expandedIndex === index;
                    const isRead = readPsalms.has(index);

                    return (
                        <View key={index} style={s.psalmCard}>
                            <TouchableOpacity
                                style={s.psalmHeader}
                                onPress={() => handleToggle(index)}
                                activeOpacity={0.7}>
                                <Text style={[s.psalmChapter, isRead && s.psalmChapterRead]}>
                                    {psalm.chapter}
                                </Text>
                                {isRead && (
                                    <Text style={s.readBadge}>{t('read_badge')}</Text>
                                )}
                                <Text style={s.expandIcon}>{isExpanded ? '▲' : '▼'}</Text>
                            </TouchableOpacity>

                            {isExpanded && (
                                <View style={s.psalmBody}>
                                    {psalm.verses.map((verse: string, vi: number) => (
                                        <Text key={vi} style={s.verse}>
                                            {verse}
                                        </Text>
                                    ))}
                                    {!isRead && (
                                        <TouchableOpacity
                                            style={s.markReadBtn}
                                            onPress={() => markAsRead(index)}
                                            activeOpacity={0.7}>
                                            <Text style={s.markReadText}>{t('read_badge')}</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                        </View>
                    );
                })}

                {/* Start Prayer Button */}
                <TouchableOpacity
                    style={[s.startButton, Shadows.lg]}
                    onPress={() => navigation.navigate('PrayerOverlay')}
                    activeOpacity={0.8}>
                    <Text style={s.startButtonText}>{t('start_prayer_session')}</Text>
                </TouchableOpacity>

                <View style={{ height: Spacing.xxl }} />
            </ScrollView>
        </View>
    );
};

const getStyles = (colors: any) =>
    StyleSheet.create({
        container: {
            flex: 1,
            backgroundColor: colors.backgroundDark,
        },
        scroll: {
            padding: Spacing.lg,
        },
        header: {
            alignItems: 'center',
            marginBottom: Spacing.lg,
        },
        dayTitle: {
            fontSize: FontSize.h3,
            fontWeight: '700',
            color: colors.gold,
        },
        psalmRange: {
            fontSize: FontSize.lg,
            color: colors.textPrimary,
            marginTop: Spacing.xs,
        },
        readCount: {
            fontSize: FontSize.sm,
            color: colors.textSecondary,
            marginTop: Spacing.xs,
        },
        progressTrack: {
            width: '100%',
            height: 6,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 3,
            overflow: 'hidden',
            marginTop: Spacing.sm,
        },
        progressFill: {
            height: '100%',
            backgroundColor: colors.gold,
            borderRadius: 3,
        },
        psalmCard: {
            backgroundColor: colors.surface,
            borderRadius: BorderRadius.lg,
            marginBottom: Spacing.sm,
            borderWidth: 1,
            borderColor: colors.surfaceLight,
            overflow: 'hidden',
        },
        psalmHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: Spacing.md,
        },
        psalmChapter: {
            flex: 1,
            fontSize: FontSize.md,
            fontWeight: '600',
            color: colors.textPrimary,
        },
        psalmChapterRead: {
            color: colors.textMuted,
        },
        readBadge: {
            fontSize: FontSize.xs,
            color: colors.success,
            fontWeight: '700',
            marginRight: Spacing.sm,
        },
        expandIcon: {
            fontSize: FontSize.sm,
            color: colors.textMuted,
        },
        psalmBody: {
            padding: Spacing.md,
            paddingTop: 0,
        },
        verse: {
            fontSize: FontSize.md,
            color: colors.textPrimary,
            lineHeight: 24,
            marginBottom: Spacing.sm,
        },
        markReadBtn: {
            marginTop: Spacing.sm,
            backgroundColor: 'rgba(16,185,129,0.15)',
            paddingVertical: Spacing.sm,
            borderRadius: BorderRadius.lg,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.success,
        },
        markReadText: {
            fontSize: FontSize.sm,
            fontWeight: '700',
            color: colors.success,
        },
        startButton: {
            backgroundColor: colors.crimson,
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.lg,
            alignItems: 'center',
            marginTop: Spacing.lg,
        },
        startButtonText: {
            fontSize: FontSize.lg,
            fontWeight: '700',
            color: colors.goldLight,
            letterSpacing: 1,
        },
    });

export default PsalmReaderScreen;
