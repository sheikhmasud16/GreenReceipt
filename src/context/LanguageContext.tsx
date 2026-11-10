import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from '../types';
import { translations } from '../i18n/translations';
import { useAuth } from './AuthContext';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.bn;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, updateProfile } = useAuth();
  const [language, setLanguageState] = useState<Language>('bn');

  useEffect(() => {
    if (profile?.preferredLanguage) {
      setLanguageState(profile.preferredLanguage);
    }
  }, [profile?.preferredLanguage]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (profile) {
      updateProfile({ preferredLanguage: lang });
    }
  };

  const t = translations[language] || translations.bn;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
