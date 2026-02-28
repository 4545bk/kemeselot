import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, Shadows } from '../theme';
import {
  getTodayPsalms,
  getWeeklySchedule,
  getTodayEthiopianDate,
  getDailyQuote,
} from '../services/mezmureService';
import { useAppStore } from '../store/appStore';

const HomeScreen: React.FC = () => {
  const todayReading = getTodayPsalms();
  const weeklySchedule = getWeeklySchedule();
  const ethDate = getTodayEthiopianDate();
  const dailyQuote = getDailyQuote();
  const { psalmsCompletedToday, dailyQuota } = useAppStore();
  const todayVerse = todayReading.psalms[0];

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

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={Colors.backgroundDark}
      />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Header Cross Symbol */}
        <View style={styles.crossContainer}>
          <Text style={styles.crossSymbol}>✞</Text>
        </View>

        {/* App Title */}
        <Text style={styles.title}>ቀመሰሎት</Text>
        <Text style={styles.subtitle}>Kemeselot</Text>
        <Text style={styles.tagline}>Mezmure Dawit Prayer Lock</Text>

        {/* Ethiopian Date */}
        <Text style={styles.ethDate}>
          {ethDate.month} {ethDate.day}, {ethDate.year} ዓ.ም
        </Text>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Daily Progress Section */}
        <View style={styles.progressCard}>
          <View style={styles.progressTextContainer}>
            <Text style={styles.progressLabel}>DAILY PRAYER GOAL</Text>
            <Text style={styles.progressValue}>
              {psalmsCompletedToday} / {dailyQuota} Psalms
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
          </View>
          {psalmsCompletedToday >= dailyQuota && (
            <Text style={styles.progressSuccessText}>☦ Daily goal completed. Praise be to God!</Text>
          )}
        </View>

        {/* Today's Reading Card */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>TODAY'S READING</Text>
          <Text style={styles.dayName}>
            {todayReading.dayNameAmharic} / {todayReading.dayName}
          </Text>
          <Text style={styles.psalmRange}>{todayReading.psalmRange}</Text>

          {/* Preview verse */}
          {todayVerse && (
            <View style={styles.versePreview}>
              <Text style={styles.verseTitle}>{todayVerse.chapter}</Text>
              <Text style={styles.verseGeez} numberOfLines={3}>{todayVerse.verses[0]}</Text>
            </View>
          )}
        </View>

        {/* Daily Quote Card */}
        <View style={styles.quoteCard}>
          <Text style={styles.quoteIcon}>“</Text>
          <Text style={styles.quoteText}>{dailyQuote.text}</Text>
          <Text style={styles.quoteSource}>— {dailyQuote.source}</Text>
        </View>

        {/* Start Prayer Button */}
        <TouchableOpacity style={styles.startButton} activeOpacity={0.8}>
          <Text style={styles.startButtonText}>☦ Begin Prayer Session</Text>
        </TouchableOpacity>

        {/* Weekly Schedule Extension */}
        <Text style={styles.sectionTitle}>Weekly Schedule</Text>
        {weeklySchedule.map(entry => (
          <View
            key={entry.dayName}
            style={[
              styles.scheduleRow,
              entry.dayName === todayReading.dayName &&
              styles.scheduleRowActive,
            ]}>
            <View>
              <Text
                style={[
                  styles.scheduleDay,
                  entry.dayName === todayReading.dayName &&
                  styles.scheduleDayActive,
                ]}>
                {entry.dayNameAmharic} / {entry.dayName}
              </Text>
            </View>
            <Text
              style={[
                styles.schedulePsalms,
                entry.dayName === todayReading.dayName &&
                styles.schedulePsalmsActive,
              ]}>
              {entry.psalmRange}
            </Text>
          </View>
        ))}

        <View style={{ height: Spacing.xxl }} />
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    alignItems: 'center',
  },
  crossContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.gold,
    ...Shadows.glow,
    marginBottom: Spacing.md,
  },
  crossSymbol: {
    fontSize: 32,
    color: Colors.gold,
  },
  title: {
    fontSize: FontSize.h1,
    fontWeight: '700',
    color: Colors.gold,
    letterSpacing: 4,
  },
  subtitle: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.textPrimary,
    letterSpacing: 1,
    marginTop: -Spacing.xs,
  },
  tagline: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    fontStyle: 'italic',
  },
  ethDate: {
    fontSize: FontSize.sm,
    color: Colors.goldLight,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  divider: {
    width: 80,
    height: 2,
    backgroundColor: Colors.gold,
    marginVertical: Spacing.lg,
    borderRadius: 1,
    opacity: 0.6,
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
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  progressValue: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.gold,
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
    backgroundColor: Colors.gold,
    borderRadius: 4,
  },
  progressSuccessText: {
    fontSize: FontSize.xs,
    color: Colors.success,
    textAlign: 'center',
    marginTop: Spacing.sm,
    fontStyle: 'italic',
  },
  card: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.goldDark,
    ...Shadows.md,
    marginBottom: Spacing.md,
  },
  cardLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.textMuted,
    letterSpacing: 2,
    marginBottom: Spacing.sm,
  },
  dayName: {
    fontSize: FontSize.h3,
    fontWeight: '700',
    color: Colors.gold,
  },
  psalmRange: {
    fontSize: FontSize.lg,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  versePreview: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.surfaceLight,
    width: '100%',
    alignItems: 'center',
  },
  verseTitle: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.goldLight,
    marginBottom: Spacing.xs,
  },
  verseGeez: {
    fontSize: FontSize.md,
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 22,
  },
  quoteCard: {
    width: '100%',
    padding: Spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.gold,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  quoteIcon: {
    fontSize: 32,
    color: Colors.gold,
    opacity: 0.3,
    position: 'absolute',
    top: 5,
    left: 10,
  },
  quoteText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    lineHeight: 24,
    textAlign: 'center',
  },
  quoteSource: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'right',
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: '600',
    color: Colors.goldLight,
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
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.goldDark,
  },
  scheduleDay: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  scheduleDayActive: {
    color: Colors.gold,
    fontWeight: '700',
  },
  schedulePsalms: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  schedulePsalmsActive: {
    color: Colors.textPrimary,
  },
  startButton: {
    width: '100%',
    backgroundColor: Colors.crimson,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.lg,
  },
  startButtonText: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.goldLight,
    letterSpacing: 1,
  },
});

export default HomeScreen;
