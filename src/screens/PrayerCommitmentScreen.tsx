import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Switch,
    StatusBar,
    Alert,
    TextInput,
} from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Spacing, FontSize, BorderRadius, getShadows } from '../theme';
import { useAppStore, PrayerSlot } from '../store/appStore';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_LABELS_AM = ['እሑድ', 'ሰኞ', 'ማክ', 'ረቡ', 'ሐሙ', 'ዓርብ', 'ቅዳ'];

const PrayerCommitmentScreen: React.FC = () => {
    const { colors } = useThemeColors();
    const { t, language } = useTranslation();
    const Shadows = getShadows(colors);
    const {
        prayerSlots,
        activePrayerPreset,
        prayerHistory,
        setPrayerSlots,
        setActivePrayerPreset,
        recordPrayerSlotCompleted,
    } = useAppStore();

    const today = new Date().toISOString().split('T')[0];
    const todayCompleted = prayerHistory[today] || [];
    const enabledSlots = prayerSlots.filter(s => s.enabled);

    // Get last 7 days
    const last7Days = useMemo(() => {
        const days: { date: string; label: string; isToday: boolean }[] = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayIdx = d.getDay();
            days.push({
                date: dateStr,
                label: language === 'am' || language === 'ti' ? DAY_LABELS_AM[dayIdx] : DAY_LABELS[dayIdx],
                isToday: i === 0,
            });
        }
        return days;
    }, [language]);

    const presets = [
        { key: 'morning-evening' as const, label: t('preset_morning_evening') },
        { key: 'dawn-dusk-night' as const, label: t('preset_dawn_dusk_night') },
        { key: 'custom' as const, label: t('preset_custom') },
    ];

    const toggleSlot = (id: string) => {
        const updated = prayerSlots.map(s =>
            s.id === id ? { ...s, enabled: !s.enabled } : s,
        );
        setPrayerSlots(updated);
        setActivePrayerPreset('custom');
    };

    const updateSlotTime = (id: string, time: string) => {
        const updated = prayerSlots.map(s =>
            s.id === id ? { ...s, time } : s,
        );
        setPrayerSlots(updated);
        setActivePrayerPreset('custom');
    };

    const updateSlotLabel = (id: string, label: string) => {
        const updated = prayerSlots.map(s =>
            s.id === id ? { ...s, label } : s,
        );
        setPrayerSlots(updated);
        setActivePrayerPreset('custom');
    };

    const removeSlot = (id: string) => {
        const updated = prayerSlots.filter(s => s.id !== id);
        setPrayerSlots(updated);
        setActivePrayerPreset('custom');
    };

    const addSlot = () => {
        const newId = `custom-${Date.now()}`;
        setPrayerSlots([
            ...prayerSlots,
            { id: newId, label: `Prayer ${prayerSlots.length + 1}`, time: 'anytime', enabled: true },
        ]);
        setActivePrayerPreset('custom');
    };

    const markSlotDone = async (slotId: string) => {
        if (todayCompleted.includes(slotId)) return;
        recordPrayerSlotCompleted(slotId);
        try {
            const { recordPrayerCompleted } = require('../services/appBlockerService');
            await recordPrayerCompleted();
        } catch (e) {
            console.error('Failed to record native completion', e);
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

                {/* Title */}
                <Text style={s.title}>{t('prayer_plan')}</Text>
                <Text style={s.subtitle}>{t('prayer_commitment_subtitle')}</Text>

                {/* Preset Selector */}
                <View style={s.presetRow}>
                    {presets.map(p => (
                        <TouchableOpacity
                            key={p.key}
                            style={[s.presetChip, activePrayerPreset === p.key && s.presetChipActive]}
                            onPress={() => setActivePrayerPreset(p.key)}
                            activeOpacity={0.7}
                        >
                            <Text style={[s.presetText, activePrayerPreset === p.key && s.presetTextActive]}>
                                {p.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Prayer Slots */}
                <View style={s.section}>
                    {prayerSlots.map(slot => {
                        const isDone = todayCompleted.includes(slot.id);
                        return (
                            <View key={slot.id} style={[s.slotCard, isDone && s.slotCardDone]}>
                                <View style={s.slotHeader}>
                                    <Switch
                                        value={slot.enabled}
                                        onValueChange={() => toggleSlot(slot.id)}
                                        trackColor={{ false: colors.surfaceLight, true: colors.crimsonLight }}
                                        thumbColor={slot.enabled ? colors.gold : colors.textMuted}
                                    />
                                    <TextInput
                                        style={s.slotLabel}
                                        value={slot.label}
                                        onChangeText={(text) => updateSlotLabel(slot.id, text)}
                                        placeholderTextColor={colors.textMuted}
                                    />
                                    {isDone && <Text style={s.doneBadge}>✓</Text>}
                                </View>

                                <View style={s.slotBody}>
                                    {slot.time === 'anytime' ? (
                                        <TouchableOpacity
                                            style={s.anyTimeChip}
                                            onPress={() => updateSlotTime(slot.id, '06:00')}
                                        >
                                            <Text style={s.anyTimeText}>{t('any_time')}</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={s.timeRow}>
                                            <TextInput
                                                style={s.timeInput}
                                                value={slot.time}
                                                onChangeText={(text) => updateSlotTime(slot.id, text)}
                                                placeholder="HH:mm"
                                                placeholderTextColor={colors.textMuted}
                                                maxLength={5}
                                            />
                                            <TouchableOpacity
                                                onPress={() => updateSlotTime(slot.id, 'anytime')}
                                                style={s.anyTimeBtnSmall}
                                            >
                                                <Text style={s.anyTimeBtnText}>{t('any_time')}</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    <View style={s.slotActions}>
                                        {!isDone && slot.enabled && (
                                            <TouchableOpacity
                                                style={s.markDoneBtn}
                                                onPress={() => markSlotDone(slot.id)}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={s.markDoneText}>✓ {t('completed')}</Text>
                                            </TouchableOpacity>
                                        )}
                                        <TouchableOpacity
                                            onPress={() => removeSlot(slot.id)}
                                            style={s.removeBtn}
                                        >
                                            <Text style={s.removeBtnText}>✕</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    <TouchableOpacity style={s.addBtn} onPress={addSlot} activeOpacity={0.7}>
                        <Text style={s.addBtnText}>{t('add_slot')}</Text>
                    </TouchableOpacity>
                </View>

                {/* Today's Progress */}
                <View style={s.progressSection}>
                    <Text style={s.progressTitle}>
                        {t('today')}: {todayCompleted.length}/{enabledSlots.length} {t('prayers_today')}
                    </Text>
                    <View style={s.progressBarTrack}>
                        <View
                            style={[
                                s.progressBarFill,
                                {
                                    width: enabledSlots.length > 0
                                        ? `${(todayCompleted.length / enabledSlots.length) * 100}%`
                                        : '0%',
                                },
                            ]}
                        />
                    </View>
                </View>

                {/* Weekly History */}
                <View style={s.section}>
                    <Text style={s.sectionTitle}>{t('weekly_history')}</Text>
                    <View style={s.historyGrid}>
                        {last7Days.map(day => {
                            const dayCompleted = prayerHistory[day.date] || [];
                            const dayTotal = enabledSlots.length;
                            const ratio = dayTotal > 0 ? dayCompleted.length / dayTotal : 0;

                            return (
                                <View key={day.date} style={s.historyDay}>
                                    <Text style={[s.historyLabel, day.isToday && s.historyLabelToday]}>
                                        {day.label}
                                    </Text>
                                    <View
                                        style={[
                                            s.historyDot,
                                            ratio >= 1
                                                ? s.historyDotComplete
                                                : ratio > 0
                                                    ? s.historyDotPartial
                                                    : s.historyDotEmpty,
                                        ]}
                                    >
                                        {ratio >= 1 && <Text style={s.historyCheck}>✓</Text>}
                                    </View>
                                    <Text style={s.historyCount}>
                                        {dayCompleted.length}/{dayTotal}
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </View>

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
        title: {
            fontSize: FontSize.h2,
            fontWeight: '800',
            color: colors.gold,
            textAlign: 'center',
        },
        subtitle: {
            fontSize: FontSize.sm,
            color: colors.textSecondary,
            textAlign: 'center',
            marginTop: Spacing.xs,
            marginBottom: Spacing.lg,
        },
        presetRow: {
            flexDirection: 'row',
            gap: Spacing.sm,
            justifyContent: 'center',
            marginBottom: Spacing.lg,
        },
        presetChip: {
            paddingVertical: Spacing.sm,
            paddingHorizontal: Spacing.md,
            borderRadius: BorderRadius.round,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.surfaceLight,
        },
        presetChipActive: {
            backgroundColor: colors.crimson,
            borderColor: colors.crimson,
        },
        presetText: {
            fontSize: FontSize.sm,
            fontWeight: '600',
            color: colors.textSecondary,
        },
        presetTextActive: {
            color: '#FFFFFF',
        },
        section: {
            marginBottom: Spacing.lg,
        },
        sectionTitle: {
            fontSize: FontSize.xl,
            fontWeight: '700',
            color: colors.gold,
            marginBottom: Spacing.md,
        },
        slotCard: {
            backgroundColor: colors.surface,
            borderRadius: BorderRadius.lg,
            padding: Spacing.md,
            marginBottom: Spacing.sm,
            borderWidth: 1,
            borderColor: colors.surfaceLight,
        },
        slotCardDone: {
            borderColor: colors.success,
            opacity: 0.8,
        },
        slotHeader: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
        },
        slotLabel: {
            flex: 1,
            fontSize: FontSize.md,
            fontWeight: '600',
            color: colors.textPrimary,
            padding: 0,
        },
        doneBadge: {
            fontSize: FontSize.lg,
            color: colors.success,
            fontWeight: '700',
        },
        slotBody: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: Spacing.sm,
        },
        anyTimeChip: {
            backgroundColor: 'rgba(212,175,55,0.15)',
            paddingVertical: 4,
            paddingHorizontal: Spacing.md,
            borderRadius: BorderRadius.round,
            borderWidth: 1,
            borderColor: colors.goldDark,
        },
        anyTimeText: {
            fontSize: FontSize.sm,
            color: colors.gold,
            fontWeight: '600',
        },
        timeRow: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
        },
        timeInput: {
            backgroundColor: colors.backgroundDark,
            color: colors.gold,
            fontSize: FontSize.md,
            fontWeight: '700',
            paddingHorizontal: Spacing.sm,
            paddingVertical: 4,
            borderRadius: BorderRadius.md,
            borderWidth: 1,
            borderColor: colors.goldDark,
            textAlign: 'center',
            width: 70,
        },
        anyTimeBtnSmall: {
            paddingHorizontal: Spacing.sm,
            paddingVertical: 4,
        },
        anyTimeBtnText: {
            fontSize: FontSize.xs,
            color: colors.textMuted,
            fontWeight: '600',
        },
        slotActions: {
            flexDirection: 'row',
            alignItems: 'center',
            gap: Spacing.sm,
        },
        markDoneBtn: {
            backgroundColor: 'rgba(16,185,129,0.15)',
            paddingVertical: 4,
            paddingHorizontal: Spacing.sm,
            borderRadius: BorderRadius.round,
            borderWidth: 1,
            borderColor: colors.success,
        },
        markDoneText: {
            fontSize: FontSize.xs,
            color: colors.success,
            fontWeight: '700',
        },
        removeBtn: {
            paddingHorizontal: Spacing.sm,
            paddingVertical: 4,
        },
        removeBtnText: {
            fontSize: FontSize.md,
            color: colors.error,
            fontWeight: '700',
        },
        addBtn: {
            paddingVertical: Spacing.md,
            alignItems: 'center',
            borderRadius: BorderRadius.lg,
            borderWidth: 1,
            borderColor: colors.goldDark,
            borderStyle: 'dashed',
        },
        addBtnText: {
            fontSize: FontSize.md,
            fontWeight: '600',
            color: colors.gold,
        },
        progressSection: {
            marginBottom: Spacing.lg,
        },
        progressTitle: {
            fontSize: FontSize.md,
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: Spacing.xs,
        },
        progressBarTrack: {
            width: '100%',
            height: 8,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 4,
            overflow: 'hidden',
        },
        progressBarFill: {
            height: '100%',
            backgroundColor: colors.gold,
            borderRadius: 4,
        },
        historyGrid: {
            flexDirection: 'row',
            justifyContent: 'space-between',
        },
        historyDay: {
            alignItems: 'center',
            gap: Spacing.xs,
        },
        historyLabel: {
            fontSize: FontSize.xs,
            color: colors.textMuted,
            fontWeight: '600',
        },
        historyLabelToday: {
            color: colors.gold,
            fontWeight: '700',
        },
        historyDot: {
            width: 32,
            height: 32,
            borderRadius: 16,
            alignItems: 'center',
            justifyContent: 'center',
        },
        historyDotComplete: {
            backgroundColor: colors.success,
        },
        historyDotPartial: {
            backgroundColor: colors.warning,
        },
        historyDotEmpty: {
            backgroundColor: colors.surfaceLight,
        },
        historyCheck: {
            color: '#FFFFFF',
            fontSize: FontSize.md,
            fontWeight: '700',
        },
        historyCount: {
            fontSize: FontSize.xs,
            color: colors.textMuted,
        },
    });

export default PrayerCommitmentScreen;
