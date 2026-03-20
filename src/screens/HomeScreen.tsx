import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Spacing, FontSize, BorderRadius, getShadows } from '../theme';
import {
  getTodayPsalms,
  getWeeklySchedule,
  getTodayEthiopianDate,
  getDailyQuote,
} from '../services/mezmureService';
import { useAppStore } from '../store/appStore';
import { useThemeColors } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';
import { generateInsights } from '../services/insightsService';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors } = useThemeColors();
  const { t } = useTranslation();
  const Shadows = getShadows(colors);
  const todayReading = getTodayPsalms();
  const weeklySchedule = getWeeklySchedule();
  const ethDate = getTodayEthiopianDate();
  const dailyQuote = getDailyQuote();
  const {
    psalmsCompletedToday,
    dailyQuota,
    streakCount,
    checkAndResetStreak,
    prayerSlots,
    prayerHistory,
    distractionEvents,
    isPremium,
  } = useAppStore();
  const todayVerse = todayReading.psalms[0];

  useEffect(() => {
    checkAndResetStreak();
  }, [checkAndResetStreak]);

  const progress = Math.min(psalmsCompletedToday / dailyQuota, 1);
  const progressAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(progressAnim, {
      toValue: progress,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  // Prayer commitment progress
  const today = new Date().toISOString().split('T')[0];
  const todayCompleted = prayerHistory[today] || [];
  const enabledSlots = prayerSlots.filter(s => s.enabled);

  // Behavior insights
  const insights = useMemo(() => generateInsights(distractionEvents), [distractionEvents]);

  const s = getStyles(colors);

  return (
    <View style={s.container}>
      <StatusBar
        barStyle={colors.backgroundDark === '#0D0D1A' ? 'light-content' : 'dark-content'}
        backgroundColor={colors.backgroundDark}
      />
      <ScrollView
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header Cross Symbol */}
        <View style={[s.crossContainer, Shadows.glow]}>
          <Text style={s.crossSymbol}>✞</Text>
        </View>

        {/* App Title */}
        <Text style={s.title}>{t('app_name_amharic')}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <Text style={s.subtitle}>{t('app_name')}</Text>
          {isPremium && (
            <View style={{
              backgroundColor: colors.gold,
              width: 20,
              height: 20,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Text style={{ color: colors.backgroundDark, fontSize: 12, fontWeight: '900' }}>✓</Text>
            </View>
          )}
        </View>
        <Text style={s.tagline}>{t('app_tagline')}</Text>

        {/* Ethiopian Date */}
        <Text style={s.ethDate}>
          {ethDate.month} {ethDate.day}, {ethDate.year} ዓ.ም
        </Text>

        {/* Divider */}
        <View style={s.divider} />

        {/* Streak Tracker */}
        {streakCount > 0 && (
          <View style={[s.streakCard, Shadows.glow]}>
            <Text style={s.streakIcon}>🔥</Text>
            <View style={s.streakTextContainer}>
              <Text style={s.streakValue}>{streakCount} {t('day_streak')}</Text>
              <Text style={s.streakLabel}>{t('discipline_over_distraction')}</Text>
            </View>
          </View>
        )}

        {/* Daily Progress Section */}
        <View style={s.progressCard}>
          <View style={s.progressTextContainer}>
            <Text style={s.progressLabel}>{t('daily_prayer_goal')}</Text>
            <Text style={s.progressValue}>
              {psalmsCompletedToday} / {dailyQuota} {t('psalms_label')}
            </Text>
          </View>
          <View style={s.progressBarTrack}>
            <Animated.View style={[s.progressBarFill, { width: progressWidth }]} />
          </View>
          {psalmsCompletedToday >= dailyQuota && (
            <Text style={s.progressSuccessText}>{t('daily_goal_completed')}</Text>
          )}
        </View>

        {/* Behavior Insights */}
        {insights.length > 0 && (
          <View style={[s.insightsCard]}>
            <Text style={s.insightsTitle}>🧠 {t('your_insights')}</Text>
            {insights.map((msg, idx) => (
              <Text key={idx} style={s.insightLine}>{msg}</Text>
            ))}
          </View>
        )}

        {/* Prayer Plan Card */}
        <TouchableOpacity
          style={[s.prayerPlanCard, Shadows.sm]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PrayerCommitment')}>
          <View style={s.prayerPlanHeader}>
            <Text style={s.prayerPlanTitle}>{t('prayer_commitment')}</Text>
            <Text style={s.prayerPlanBadge}>
              {todayCompleted.length}/{enabledSlots.length}
            </Text>
          </View>
          {enabledSlots.slice(0, 3).map(slot => {
            const isDone = todayCompleted.includes(slot.id);
            return (
              <View key={slot.id} style={s.prayerSlotRow}>
                <Text style={[s.prayerSlotLabel, isDone && s.prayerSlotDone]}>
                  {isDone ? '✓ ' : '○ '}{slot.label}
                </Text>
                <Text style={s.prayerSlotTime}>
                  {slot.time === 'anytime' ? '🕐' : slot.time}
                </Text>
              </View>
            );
          })}
          <Text style={s.prayerPlanLink}>{t('manage_prayer_plan')}</Text>
        </TouchableOpacity>

        {/* Today's Reading Card — Tappable */}
        <TouchableOpacity
          style={[s.card, Shadows.md]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PsalmReader', { dayOfWeek: new Date().getDay() })}>
          <Text style={s.cardLabel}>{t('todays_reading')}</Text>
          <Text style={s.dayName}>
            {todayReading.dayNameAmharic} / {todayReading.dayName}
          </Text>
          <Text style={s.psalmRange}>{todayReading.psalmRange}</Text>

          {todayVerse && (
            <View style={s.versePreview}>
              <Text style={s.verseTitle}>{todayVerse.chapter}</Text>
              <Text style={s.verseGeez} numberOfLines={3}>{todayVerse.verses[0]}</Text>
            </View>
          )}
          <Text style={s.tapHint}>{t('tap_to_read')}</Text>
        </TouchableOpacity>

        {/* Daily Quote Card */}
        <View style={s.quoteCard}>
          <Text style={s.quoteIcon}>"</Text>
          <Text style={s.quoteText}>{dailyQuote.text}</Text>
          <Text style={s.quoteSource}>— {dailyQuote.source}</Text>
        </View>

        {/* Start Prayer Button */}
        <TouchableOpacity
          style={[s.startButton, Shadows.lg]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('PrayerOverlay')}>
          <Text style={s.startButtonText}>{t('begin_prayer')}</Text>
        </TouchableOpacity>

        {/* Weekly Schedule Extension */}
        <Text style={s.sectionTitle}>{t('weekly_schedule')}</Text>
        {weeklySchedule.map((entry, index) => (
          <TouchableOpacity
            key={entry.dayName}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('PsalmReader', { dayOfWeek: index })}
            style={[
              s.scheduleRow,
              entry.dayName === todayReading.dayName &&
              s.scheduleRowActive,
            ]}>
            <View>
              <Text
                style={[
                  s.scheduleDay,
                  entry.dayName === todayReading.dayName &&
                  s.scheduleDayActive,
                ]}>
                {entry.dayNameAmharic} / {entry.dayName}
              </Text>
            </View>
            <View style={s.scheduleRight}>
              <Text
                style={[
                  s.schedulePsalms,
                  entry.dayName === todayReading.dayName &&
                  s.schedulePsalmsActive,
                ]}>
                {entry.psalmRange}
              </Text>
              <Text style={s.scheduleArrow}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

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
    scrollContent: {
      paddingHorizontal: Spacing.lg,
      paddingTop: Spacing.xxl,
      alignItems: 'center',
    },
    crossContainer: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: colors.gold,
      marginBottom: Spacing.md,
    },
    crossSymbol: {
      fontSize: 32,
      color: colors.gold,
    },
    title: {
      fontSize: FontSize.h1,
      fontWeight: '700',
      color: colors.gold,
      letterSpacing: 4,
    },
    subtitle: {
      fontSize: FontSize.lg,
      fontWeight: '600',
      color: colors.textPrimary,
      letterSpacing: 1,
      marginTop: -Spacing.xs,
    },
    tagline: {
      fontSize: FontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: Spacing.xs,
      fontStyle: 'italic',
    },
    ethDate: {
      fontSize: FontSize.sm,
      color: colors.goldLight,
      textAlign: 'center',
      marginTop: Spacing.sm,
    },
    divider: {
      width: 80,
      height: 2,
      backgroundColor: colors.gold,
      marginVertical: Spacing.lg,
      borderRadius: 1,
      opacity: 0.6,
    },
    streakCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      borderRadius: BorderRadius.lg,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.3)',
      marginBottom: Spacing.lg,
    },
    streakIcon: {
      fontSize: 28,
      marginRight: Spacing.sm,
    },
    streakTextContainer: {
      justifyContent: 'center',
    },
    streakValue: {
      fontSize: FontSize.md,
      fontWeight: '800',
      color: colors.gold,
      letterSpacing: 0.5,
    },
    streakLabel: {
      fontSize: FontSize.xs,
      color: colors.textSecondary,
      fontStyle: 'italic',
    },
    progressCard: {
      width: '100%',
      backgroundColor: 'rgba(212, 175, 55, 0.05)',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.15)',
      marginBottom: Spacing.lg,
    },
    progressTextContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      marginBottom: Spacing.xs,
    },
    progressLabel: {
      fontSize: FontSize.xs,
      fontWeight: '700',
      color: colors.textMuted,
      letterSpacing: 1,
    },
    progressValue: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: colors.gold,
    },
    progressBarTrack: {
      width: '100%',
      height: 8,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.gold,
      borderRadius: 4,
    },
    progressSuccessText: {
      fontSize: FontSize.xs,
      color: colors.success,
      textAlign: 'center',
      marginTop: Spacing.sm,
      fontStyle: 'italic',
    },
    // Behavior Insights
    insightsCard: {
      width: '100%',
      backgroundColor: 'rgba(212, 175, 55, 0.06)',
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(212, 175, 55, 0.15)',
      marginBottom: Spacing.md,
    },
    insightsTitle: {
      fontSize: FontSize.md,
      fontWeight: '700',
      color: colors.gold,
      marginBottom: Spacing.sm,
    },
    insightLine: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
      marginBottom: 4,
      lineHeight: 20,
    },
    // Prayer Plan Card
    prayerPlanCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: colors.goldDark,
      marginBottom: Spacing.md,
    },
    prayerPlanHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: Spacing.sm,
    },
    prayerPlanTitle: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: colors.gold,
    },
    prayerPlanBadge: {
      fontSize: FontSize.sm,
      fontWeight: '700',
      color: colors.textPrimary,
      backgroundColor: 'rgba(212,175,55,0.15)',
      paddingHorizontal: Spacing.sm,
      paddingVertical: 2,
      borderRadius: BorderRadius.round,
    },
    prayerSlotRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 3,
    },
    prayerSlotLabel: {
      fontSize: FontSize.sm,
      color: colors.textSecondary,
    },
    prayerSlotDone: {
      color: colors.success,
    },
    prayerSlotTime: {
      fontSize: FontSize.xs,
      color: colors.textMuted,
    },
    prayerPlanLink: {
      fontSize: FontSize.xs,
      color: colors.goldDark,
      fontStyle: 'italic',
      marginTop: Spacing.sm,
      textAlign: 'right',
    },
    card: {
      width: '100%',
      backgroundColor: colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.goldDark,
      marginBottom: Spacing.md,
    },
    cardLabel: {
      fontSize: FontSize.xs,
      fontWeight: '600',
      color: colors.textMuted,
      letterSpacing: 2,
      marginBottom: Spacing.sm,
    },
    dayName: {
      fontSize: FontSize.h3,
      fontWeight: '700',
      color: colors.gold,
    },
    psalmRange: {
      fontSize: FontSize.lg,
      color: colors.textPrimary,
      marginTop: Spacing.xs,
    },
    versePreview: {
      marginTop: Spacing.md,
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.surfaceLight,
      width: '100%',
      alignItems: 'center',
    },
    verseTitle: {
      fontSize: FontSize.sm,
      fontWeight: '600',
      color: colors.goldLight,
      marginBottom: Spacing.xs,
    },
    verseGeez: {
      fontSize: FontSize.md,
      color: colors.textPrimary,
      textAlign: 'center',
      lineHeight: 22,
    },
    quoteCard: {
      width: '100%',
      padding: Spacing.lg,
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
      borderRadius: BorderRadius.lg,
      borderLeftWidth: 3,
      borderLeftColor: colors.gold,
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    quoteIcon: {
      fontSize: 32,
      color: colors.gold,
      opacity: 0.3,
      position: 'absolute',
      top: 5,
      left: 10,
    },
    quoteText: {
      fontSize: FontSize.md,
      color: colors.textSecondary,
      fontStyle: 'italic',
      lineHeight: 24,
      textAlign: 'center',
    },
    quoteSource: {
      fontSize: FontSize.xs,
      color: colors.textMuted,
      textAlign: 'right',
      marginTop: Spacing.sm,
    },
    sectionTitle: {
      fontSize: FontSize.xl,
      fontWeight: '600',
      color: colors.goldLight,
      alignSelf: 'flex-start',
      marginTop: Spacing.xl,
      marginBottom: Spacing.md,
    },
    scheduleRow: {
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.xs,
    },
    scheduleRowActive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.goldDark,
    },
    scheduleDay: {
      fontSize: FontSize.md,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    scheduleDayActive: {
      color: colors.gold,
      fontWeight: '700',
    },
    schedulePsalms: {
      fontSize: FontSize.sm,
      color: colors.textMuted,
    },
    schedulePsalmsActive: {
      color: colors.textPrimary,
    },
    startButton: {
      width: '100%',
      backgroundColor: colors.crimson,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.lg,
      alignItems: 'center',
      marginTop: Spacing.md,
    },
    startButtonText: {
      fontSize: FontSize.lg,
      fontWeight: '700',
      color: colors.goldLight,
      letterSpacing: 1,
    },
    tapHint: {
      fontSize: FontSize.xs,
      color: colors.goldDark,
      marginTop: Spacing.sm,
      fontStyle: 'italic',
    },
    scheduleRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.sm,
    },
    scheduleArrow: {
      fontSize: FontSize.xl,
      color: colors.goldDark,
      fontWeight: '700',
    },
  });

export default HomeScreen;
