import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="py-3 mt-auto border-top text-center" style={{ backgroundColor: 'var(--bg-charcoal)', borderColor: 'var(--border-color)', color: 'var(--text-muted)' }}>
      <div className="container">
        <small>{t('footerText')}</small>
      </div>
    </footer>
  );
};
