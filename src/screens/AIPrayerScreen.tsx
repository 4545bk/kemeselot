import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    StatusBar,
    Dimensions,
    ActivityIndicator,
    PanResponder,
    GestureResponderEvent,
    PanResponderGestureState,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useThemeColors } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Spacing, FontSize, BorderRadius, getShadows } from '../theme';
import { generatePrayer, getMoodEmoji } from '../services/aiPrayerService';
import { recordPrayerCompleted, dismissOverlay } from '../services/appBlockerService';
import { unlockDevice } from '../services/overlayService';
import { useAppStore } from '../store/appStore';

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 80;
const THUMB_SIZE = 30;
const TRACK_PADDING = THUMB_SIZE / 2;
const USABLE_WIDTH = SLIDER_WIDTH - THUMB_SIZE;

type Step = 'relationship' | 'feeling' | 'prayer';

/* ------------------------------------------------------------------ */
/*  Draggable Mood Slider                                              */
/* ------------------------------------------------------------------ */
interface MoodSliderProps {
    value: number;
    onChange: (v: number) => void;
    labels: string[];
}

const MoodSlider: React.FC<MoodSliderProps> = ({ value, onChange, labels }) => {
    const thumbX = useRef(new Animated.Value((value / 4) * USABLE_WIDTH)).current;
    const currentValue = useRef(value);

    // Keep the thumb in sync when value changes externally
    useEffect(() => {
        currentValue.current = value;
        Animated.spring(thumbX, {
            toValue: (value / 4) * USABLE_WIDTH,
            useNativeDriver: false,
            friction: 7,
        }).start();
    }, [value]);

    const snapToNearest = useCallback((rawX: number) => {
        const clamped = Math.max(0, Math.min(rawX, USABLE_WIDTH));
        const snapped = Math.round((clamped / USABLE_WIDTH) * 4);
        onChange(snapped);
    }, [onChange]);

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: (_e: GestureResponderEvent, _gs: PanResponderGestureState) => {
                // Stop any ongoing animation
                thumbX.stopAnimation();
            },
            onPanResponderMove: (_e: GestureResponderEvent, gs: PanResponderGestureState) => {
                const startX = (currentValue.current / 4) * USABLE_WIDTH;
                const newX = Math.max(0, Math.min(startX + gs.dx, USABLE_WIDTH));
                thumbX.setValue(newX);
            },
            onPanResponderRelease: (_e: GestureResponderEvent, gs: PanResponderGestureState) => {
                const startX = (currentValue.current / 4) * USABLE_WIDTH;
                const finalX = Math.max(0, Math.min(startX + gs.dx, USABLE_WIDTH));
                snapToNearest(finalX);
            },
        })
    ).current;

    // Track fill width interpolation
    const fillWidth = thumbX.interpolate({
        inputRange: [0, USABLE_WIDTH],
        outputRange: [TRACK_PADDING, SLIDER_WIDTH - TRACK_PADDING],
        extrapolate: 'clamp',
    });

    // Tap on track to jump
    const handleTrackPress = (e: GestureResponderEvent) => {
        const touchX = e.nativeEvent.locationX - TRACK_PADDING;
        snapToNearest(touchX);
    };

    return (
        <View style={sliderStyles.container}>
            {/* Track background (tappable) */}
            <TouchableOpacity
                activeOpacity={1}
                onPress={handleTrackPress}
                style={sliderStyles.trackTouchable}
            >
                <View style={sliderStyles.track}>
                    {/* Fill */}
                    <Animated.View style={[sliderStyles.fill, { width: fillWidth }]} />

                    {/* Step dots */}
                    {[0, 1, 2, 3, 4].map(i => (
                        <View
                            key={i}
                            style={[
                                sliderStyles.stepDot,
                                {
                                    left: TRACK_PADDING + (i / 4) * USABLE_WIDTH - 4,
                                },
                                i <= value && sliderStyles.stepDotActive,
                            ]}
                        />
                    ))}
                </View>
            </TouchableOpacity>

            {/* Draggable thumb */}
            <Animated.View
                {...panResponder.panHandlers}
                style={[
                    sliderStyles.thumb,
                    {
                        transform: [{ translateX: thumbX }],
                    },
                ]}
            >
                <View style={sliderStyles.thumbInner} />
            </Animated.View>

            {/* Labels below */}
            <View style={sliderStyles.labelsRow}>
                {labels.map((label, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => onChange(i)}
                        activeOpacity={0.7}
                        style={sliderStyles.labelTouch}
                    >
                        <Text
                            style={[
                                sliderStyles.label,
                                i === value && sliderStyles.labelActive,
                            ]}
                        >
                            {label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};

const sliderStyles = StyleSheet.create({
    container: {
        width: SLIDER_WIDTH,
        marginVertical: Spacing.lg,
        alignItems: 'flex-start',
    },
    trackTouchable: {
        width: SLIDER_WIDTH,
        height: 40,
        justifyContent: 'center',
    },
    track: {
        width: SLIDER_WIDTH,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.15)',
        borderRadius: 3,
    },
    fill: {
        position: 'absolute',
        left: 0,
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 3,
    },
    stepDot: {
        position: 'absolute',
        top: -1,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },
    stepDotActive: {
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    thumb: {
        position: 'absolute',
        top: 5, // vertically center on track (40/2 - 30/2 = 5)
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    thumbInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    labelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: SLIDER_WIDTH,
        marginTop: Spacing.sm,
    },
    labelTouch: {
        flex: 1,
        alignItems: 'center',
    },
    label: {
        fontSize: FontSize.xs,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: '600',
        textAlign: 'center',
    },
    labelActive: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: FontSize.sm,
    },
});

/* ------------------------------------------------------------------ */
/*  AI Prayer Screen                                                    */
/* ------------------------------------------------------------------ */
const AIPrayerScreen: React.FC = () => {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { colors } = useThemeColors();
    const { t } = useTranslation();
    const { recordPrayerStreak } = useAppStore();
    const Shadows = getShadows(colors);

    const [step, setStep] = useState<Step>('relationship');
    const [relationshipLevel, setRelationshipLevel] = useState(3); // 0-4
    const [feelingLevel, setFeelingLevel] = useState(3); // 0-4
    const [prayer, setPrayer] = useState<{ amharic: string; english: string } | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);

    const fadeAnim = useRef(new Animated.Value(1)).current;
    const slideAnim = useRef(new Animated.Value(0)).current;

    const animateTransition = (callback: () => void) => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
            Animated.timing(slideAnim, { toValue: -30, duration: 200, useNativeDriver: true }),
        ]).start(() => {
            callback();
            slideAnim.setValue(30);
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(slideAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]).start();
        });
    };

    const handleContinueRelationship = () => {
        animateTransition(() => setStep('feeling'));
    };

    const handleContinueFeeling = () => {
        animateTransition(() => {
            setStep('prayer');
            setIsGenerating(true);
            setTimeout(() => {
                const result = generatePrayer(relationshipLevel, feelingLevel);
                setPrayer(result);
                setIsGenerating(false);
            }, 1500);
        });
    };

    const handlePrayed = async () => {
        try {
            await recordPrayerCompleted();
            recordPrayerStreak();
        } catch (_) {}
        try {
            await dismissOverlay();
        } catch (_) {}
        unlockDevice();
        navigation.replace('PrayerResult');
    };

    const handleTraditional = () => {
        navigation.replace('PrayerOverlay');
    };

    // Background colors per step (inspired by the reference screenshots)
    const stepBg =
        step === 'relationship'
            ? '#2D5F3B'
            : step === 'feeling'
                ? '#1B3A5C'
                : colors.backgroundDark;

    const moodLabels = [
        t('mood_terrible'),
        t('mood_bad'),
        t('mood_okay'),
        t('mood_good'),
        t('mood_great'),
    ];

    return (
        <View style={[styles.root, { backgroundColor: stepBg }]}>
            <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

            <Animated.View
                style={[
                    styles.content,
                    { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
                ]}
            >
                {step === 'relationship' && (
                    <>
                        <View style={styles.spacer} />
                        <Text style={styles.question}>{t('relationship_question')}</Text>
                        <Text style={styles.emoji}>{getMoodEmoji(relationshipLevel)}</Text>

                        <MoodSlider
                            value={relationshipLevel}
                            onChange={setRelationshipLevel}
                            labels={moodLabels}
                        />

                        <View style={styles.spacer} />
                        <TouchableOpacity
                            style={styles.continueBtn}
                            onPress={handleContinueRelationship}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.continueBtnText}>{t('continue_btn')}</Text>
                        </TouchableOpacity>
                        <View style={{ height: Spacing.xxl }} />
                    </>
                )}

                {step === 'feeling' && (
                    <>
                        <View style={styles.spacer} />
                        <Text style={styles.question}>{t('feeling_question')}</Text>
                        <Text style={styles.emoji}>{getMoodEmoji(feelingLevel)}</Text>

                        <MoodSlider
                            value={feelingLevel}
                            onChange={setFeelingLevel}
                            labels={moodLabels}
                        />

                        <View style={styles.spacer} />
                        <TouchableOpacity
                            style={styles.continueBtn}
                            onPress={handleContinueFeeling}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.continueBtnText}>{t('continue_btn')}</Text>
                        </TouchableOpacity>
                        <View style={{ height: Spacing.xxl }} />
                    </>
                )}

                {step === 'prayer' && (
                    <>
                        <View style={styles.spacer} />
                        {isGenerating ? (
                            <>
                                <ActivityIndicator size="large" color={colors.gold} />
                                <Text style={[styles.generatingText, { color: colors.textSecondary }]}>
                                    {t('generating_prayer')}
                                </Text>
                            </>
                        ) : prayer ? (
                            <>
                                <Text style={[styles.prayerTitle, { color: colors.gold }]}>
                                    {t('your_prayer')}
                                </Text>
                                <Text style={[styles.readHint, { color: colors.textSecondary }]}>
                                    {t('read_sincerely')}
                                </Text>
                                <View style={[styles.prayerCard, {
                                    backgroundColor: colors.surface,
                                    borderColor: colors.gold,
                                }]}>
                                    <Text style={[styles.prayerText, { color: colors.textPrimary }]}>
                                        {prayer.amharic}
                                    </Text>
                                </View>
                                <View style={styles.spacer} />
                                <TouchableOpacity
                                    style={[styles.prayedBtn, {
                                        backgroundColor: colors.gold,
                                        ...Shadows.glow,
                                    }]}
                                    onPress={handlePrayed}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.prayedBtnText, { color: colors.backgroundDark }]}>
                                        {t('i_have_prayed')}
                                    </Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.traditionalBtn}
                                    onPress={handleTraditional}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.traditionalBtnText, { color: colors.textMuted }]}>
                                        {t('try_traditional')}
                                    </Text>
                                </TouchableOpacity>
                            </>
                        ) : null}
                        <View style={{ height: Spacing.xxl }} />
                    </>
                )}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    spacer: {
        flex: 1,
    },
    question: {
        fontSize: FontSize.h3,
        fontWeight: '700',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: Spacing.xl,
        lineHeight: 38,
    },
    emoji: {
        fontSize: 64,
        marginBottom: Spacing.sm,
    },
    continueBtn: {
        width: '80%',
        backgroundColor: '#FFFFFF',
        paddingVertical: Spacing.md,
        borderRadius: BorderRadius.round,
        alignItems: 'center',
    },
    continueBtnText: {
        fontSize: FontSize.lg,
        fontWeight: '600',
        color: '#333333',
    },
    generatingText: {
        fontSize: FontSize.lg,
        marginTop: Spacing.lg,
        textAlign: 'center',
    },
    prayerTitle: {
        fontSize: FontSize.h3,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: Spacing.xs,
    },
    readHint: {
        fontSize: FontSize.sm,
        fontStyle: 'italic',
        textAlign: 'center',
        marginBottom: Spacing.lg,
    },
    prayerCard: {
        width: '100%',
        padding: Spacing.xl,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderLeftWidth: 4,
    },
    prayerText: {
        fontSize: FontSize.lg,
        lineHeight: 30,
        textAlign: 'center',
    },
    prayedBtn: {
        width: '80%',
        paddingVertical: Spacing.md + 4,
        borderRadius: BorderRadius.round,
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    prayedBtnText: {
        fontSize: FontSize.lg,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    traditionalBtn: {
        paddingVertical: Spacing.sm,
    },
    traditionalBtnText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
    },
});

export default AIPrayerScreen;
