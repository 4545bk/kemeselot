import React, { createContext, useContext, useMemo } from 'react';
import { DarkColors, LightColors, ThemeColors } from '../theme';
import { useAppStore } from '../store/appStore';

export type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    isDark: boolean;
    colors: ThemeColors;
    setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({
    mode: 'dark',
    isDark: true,
    colors: DarkColors,
    setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const mode = useAppStore(state => state.themeMode);
    const setThemeMode = useAppStore(state => state.setThemeMode);

    const value = useMemo(
        () => ({
            mode,
            isDark: mode === 'dark',
            colors: mode === 'dark' ? DarkColors : LightColors,
            setThemeMode,
        }),
        [mode, setThemeMode],
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeColors = () => {
    const ctx = useContext(ThemeContext);
    return ctx;
};
