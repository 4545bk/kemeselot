import React, { createContext, useContext, useCallback } from 'react';
import { translations, LanguageCode, TranslationKey } from './translations';
import { useAppStore } from '../store/appStore';

interface LanguageContextType {
    language: LanguageCode;
    setLanguage: (lang: LanguageCode) => void;
    t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
    language: 'am',
    setLanguage: () => {},
    t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const language = useAppStore(state => state.language);
    const setLanguage = useAppStore(state => state.setLanguage);

    const t = useCallback(
        (key: TranslationKey): string => {
            const langStrings = translations[language];
            return (langStrings as any)?.[key] ?? translations.en[key] ?? key;
        },
        [language],
    );

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useTranslation = () => useContext(LanguageContext);
