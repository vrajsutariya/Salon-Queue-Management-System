import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../locales/translations';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('salon_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('salon_lang', lang);
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'en' ? 'gu' : 'en'));
  };

  /**
   * Translate key with optional parameter interpolation
   * Example: t('goToBarber', { name: 'Ravi' }) -> "Go to Barber Ravi"
   */
  const t = (key, params = {}) => {
    const currentDict = translations[lang] || translations.en;
    let str = currentDict[key] || translations.en[key] || key;
    if (params && typeof params === 'object' && typeof str === 'string') {
      Object.entries(params).forEach(([k, v]) => {
        str = str.replace(new RegExp(`\\{${k}\\}`, 'g'), v !== undefined && v !== null ? v : '');
      });
    }
    return str;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLanguage, t }}>
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
