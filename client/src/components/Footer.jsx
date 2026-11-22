import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { BrandLogo } from './BrandLogo';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer
      className="py-4 mt-auto border-top"
      style={{
        backgroundColor: 'rgba(10, 10, 14, 0.95)',
        borderColor: 'var(--border-color)',
      }}
    >
      <div className="container d-flex flex-column flex-md-row align-items-center justify-content-between gap-3 text-center text-md-start" style={{ maxWidth: '1200px' }}>
        <BrandLogo size="sm" />

        <div className="d-flex flex-column align-items-center align-items-md-end">
          <span style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
            {t('footerText')}
          </span>
          <small style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
            Engineered with React, Vite, Bootstrap 5 & Socket.io • Real-Time Queue Synchronization
          </small>
        </div>
      </div>
    </footer>
  );
};
