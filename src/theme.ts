/**
 * Kemeselot — Spiritual Design System
 *
 * A warm, reverent color palette inspired by Ethiopian Orthodox iconography.
 * Gold represents divine light; deep crimson represents sacrifice and devotion.
 *
 * Now supports Light and Dark modes.
 */

export interface ThemeColors {
    // Primary — Ethiopian Gold
    gold: string;
    goldLight: string;
    goldDark: string;

    // Secondary — Deep Crimson
    crimson: string;
    crimsonLight: string;
    crimsonDark: string;

    // Backgrounds
    backgroundDark: string;
    backgroundPrimary: string;
    surface: string;
    surfaceLight: string;

    // Text
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textGold: string;

    // Utility
    white: string;
    black: string;
    overlay: string;
    success: string;
    warning: string;
    error: string;
}

export const DarkColors: ThemeColors = {
    // Primary — Ethiopian Gold
    gold: '#D4AF37',
    goldLight: '#E8CC6D',
    goldDark: '#B8961E',

    // Secondary — Deep Crimson
    crimson: '#8B0000',
    crimsonLight: '#A52A2A',
    crimsonDark: '#5C0000',

    // Backgrounds
    backgroundDark: '#0D0D1A',
    backgroundPrimary: '#1A1A2E',
    surface: '#16213E',
    surfaceLight: '#1F2B47',

    // Text
    textPrimary: '#E8E8E8',
    textSecondary: '#B0B0B0',
    textMuted: '#6B7280',
    textGold: '#D4AF37',

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.7)',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
};

export const LightColors: ThemeColors = {
    // Primary — Ethiopian Gold (slightly richer for contrast)
    gold: '#B8961E',
    goldLight: '#D4AF37',
    goldDark: '#8B7513',

    // Secondary — Deep Crimson
    crimson: '#9B1B1B',
    crimsonLight: '#C0392B',
    crimsonDark: '#6B0F0F',

    // Backgrounds — Warm ivory/cream
    backgroundDark: '#F5F0E8',
    backgroundPrimary: '#FFFDF7',
    surface: '#F0EBE0',
    surfaceLight: '#E8E2D6',

    // Text
    textPrimary: '#1A1A2E',
    textSecondary: '#4A4A5A',
    textMuted: '#8B8B9A',
    textGold: '#8B7513',

    // Utility
    white: '#FFFFFF',
    black: '#000000',
    overlay: 'rgba(0, 0, 0, 0.3)',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
};

/** Backward-compatible alias — defaults to DarkColors for existing code */
export const Colors = DarkColors;

export const Spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
};

export const FontSize = {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 24,
    h3: 28,
    h2: 32,
    h1: 40,
};

export const BorderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    round: 9999,
};

export const getShadows = (colors: ThemeColors) => ({
    sm: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    md: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
    },
    lg: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    glow: {
        shadowColor: colors.gold,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
        elevation: 10,
    },
});

/** Backward-compatible Shadows using DarkColors */
export const Shadows = getShadows(DarkColors);

const Theme = {
    Colors,
    DarkColors,
    LightColors,
    Spacing,
    FontSize,
    BorderRadius,
    Shadows,
    getShadows,
};

export default Theme;
