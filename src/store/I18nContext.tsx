import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { en } from '../utils/i18n/en';
import type { TranslationKey } from '../utils/i18n/en';
import { es } from '../utils/i18n/es';

type Language = 'en' | 'es';

type TranslationsMap = {
    [key in Language]: Record<TranslationKey, string>;
};

const dictionaries: TranslationsMap = {
    en,
    es,
};

interface I18nContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey, params?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [language, setLanguage] = useState<Language>(() => {
        const saved = localStorage.getItem('language');
        if (saved === 'en' || saved === 'es') return saved;
        const browserLang = navigator.language.split('-')[0];
        return browserLang === 'es' ? 'es' : 'en';
    });

    useEffect(() => {
        localStorage.setItem('language', language);
        document.documentElement.lang = language;
    }, [language]);

    const t = useCallback((key: TranslationKey, params?: Record<string, string>): string => {
        let text = dictionaries[language][key] || dictionaries['en'][key] || key;

        if (params) {
            Object.entries(params).forEach(([paramKey, paramValue]) => {
                text = text.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
            });
        }

        return text;
    }, [language]);

    return (
        <I18nContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </I18nContext.Provider>
    );
};

export const useI18n = () => {
    const context = useContext(I18nContext);
    if (context === undefined) {
        throw new Error('useI18n must be used within an I18nProvider');
    }
    return context;
};
