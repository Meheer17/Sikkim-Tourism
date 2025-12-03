import { DEFAULT_LANGUAGE, isLanguageSupported } from '@/constants/languages';
import { SecureStorage } from '@/utils/storage';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  isLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<string>(DEFAULT_LANGUAGE);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load saved language preference on mount
    const loadLanguage = async () => {
      try {
        const saved = await SecureStorage.getItem('language');
        // Validate the saved language is still supported
        if (saved && isLanguageSupported(saved)) {
          setLanguageState(saved);
        } else {
          // Fall back to default if saved language is not supported
          setLanguageState(DEFAULT_LANGUAGE);
        }
      } catch (error) {
        console.error('Error loading language:', error);
        setLanguageState(DEFAULT_LANGUAGE);
      } finally {
        setIsLoaded(true);
      }
    };

    loadLanguage();
  }, []);

  const setLanguage = useCallback((lang: string) => {
    // Validate language is supported before setting
    if (isLanguageSupported(lang)) {
      setLanguageState(lang);
      SecureStorage.setItem('language', lang).catch((error) => {
        console.error('Error saving language:', error);
      });
    } else {
      console.warn(`Language '${lang}' is not supported`);
    }
  }, []);

  const value = React.useMemo(
    () => ({ language, setLanguage, isLoaded }),
    [language, setLanguage, isLoaded]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}
