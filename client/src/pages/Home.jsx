import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Home = () => {
  const { t } = useLanguage();

  return (
    <div className="container py-4">
      {/* Hero Welcome Banner */}
      <div className="salon-card p-4 p-md-5 mb-4 text-center">
        <span className="badge badge-gold px-3 py-2 mb-3 rounded-pill text-uppercase">
          <i className="bi bi-clock-history me-1"></i> {t('salonOpen')}
        </span>
        <h1 className="display-5 fw-bold mb-3" style={{ color: 'var(--text-main)' }}>
          {t('welcomeHomeTitle')}
        </h1>
        <p className="lead text-muted mx-auto mb-4" style={{ maxWidth: '640px' }}>
          {t('welcomeHomeSubtitle')}
        </p>

        {/* Live Counters */}
        <div className="row g-3 justify-content-center mb-4">
          <div className="col-6 col-md-3">
            <div className="p-3 rounded" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}>
              <h3 className="fw-bold mb-0" style={{ color: 'var(--accent-gold)' }}>3</h3>
              <small className="text-muted">{t('waitingNow')}</small>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 rounded" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}>
              <h3 className="fw-bold mb-0" style={{ color: 'var(--status-in-chair)' }}>2</h3>
              <small className="text-muted">{t('activeBarbers')}</small>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="p-3 rounded" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}>
              <h3 className="fw-bold mb-0" style={{ color: 'var(--status-called)' }}>~15 {t('minutes')}</h3>
              <small className="text-muted">{t('avgWaitTime')}</small>
            </div>
          </div>
        </div>

        <div>
          <Link to="/join" className="btn btn-gold btn-lg px-4 me-2">
            <i className="bi bi-person-plus-fill me-2"></i>{t('joinQueue')}
          </Link>
          <Link to="/display" className="btn btn-outline-gold btn-lg px-4">
            <i className="bi bi-tv me-2"></i>{t('waitingTV')}
          </Link>
        </div>
      </div>

      {/* Screen Navigation Quick Grid */}
      <div className="row g-3">
        <div className="col-md-4">
          <div className="salon-card p-3 h-100">
            <h5 className="fw-bold" style={{ color: 'var(--accent-gold)' }}>
              <i className="bi bi-clipboard2-check me-2"></i>{t('reception')}
            </h5>
            <p className="text-muted small mb-3">Front-desk controls, walk-in management, and chair assignments.</p>
            <Link to="/reception" className="btn btn-sm btn-outline-gold">{t('reception')}</Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="salon-card p-3 h-100">
            <h5 className="fw-bold" style={{ color: 'var(--accent-gold)' }}>
              <i className="bi bi-scissors me-2"></i>{t('barberView')}
            </h5>
            <p className="text-muted small mb-3">Station view for barbers to call next client and complete services.</p>
            <Link to="/barber/Rahul" className="btn btn-sm btn-outline-gold">{t('barberView')}: Rahul</Link>
          </div>
        </div>
        <div className="col-md-4">
          <div className="salon-card p-3 h-100">
            <h5 className="fw-bold" style={{ color: 'var(--accent-gold)' }}>
              <i className="bi bi-gear me-2"></i>{t('admin')}
            </h5>
            <p className="text-muted small mb-3">Service menu configuration, staff management, and shop operations.</p>
            <Link to="/admin" className="btn btn-sm btn-outline-gold">{t('admin')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
