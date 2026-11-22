import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const WaitingAreaTV = () => {
  const { t } = useLanguage();

  return (
    <div className="container-fluid py-4 px-md-5" style={{ minHeight: '85vh' }}>
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
        <div>
          <h1 className="fw-bold display-6 mb-0" style={{ color: 'var(--accent-gold)' }}>
            <i className="bi bi-tv me-3"></i>Crown & Blade Waiting Lounge
          </h1>
          <span className="text-muted">Screen 6 • 10-Foot UI Fullscreen Public Board</span>
        </div>
        <div className="text-end">
          <span className="badge badge-gold fs-6 px-3 py-2">LIVE SYNC READY</span>
        </div>
      </div>

      <div className="alert alert-dark border border-secondary mb-4" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-muted)' }}>
        <i className="bi bi-info-circle me-2 text-warning"></i>
        {t('skeletonNote')} - High-contrast TV layout with audio chime and flash visual cue when customers are called.
      </div>

      <div className="row g-4">
        {/* Left Column: Now Serving */}
        <div className="col-lg-6">
          <div className="salon-card p-4 h-100">
            <h2 className="fw-bold mb-4" style={{ color: 'var(--accent-gold)' }}>
              NOW SERVING
            </h2>
            <div className="p-4 rounded mb-3" style={{ backgroundColor: 'var(--bg-dark)', border: '2px solid var(--accent-gold)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h1 className="display-4 fw-bold text-white mb-0">#A-101</h1>
                  <p className="lead text-warning mb-0">Station 1 • Barber Rahul</p>
                </div>
                <span className="badge badge-status-in-chair fs-5 px-3 py-2">
                  {t('status_IN_CHAIR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Up Next */}
        <div className="col-lg-6">
          <div className="salon-card p-4 h-100">
            <h2 className="fw-bold mb-4" style={{ color: 'var(--status-called)' }}>
              UP NEXT
            </h2>
            <div className="p-3 rounded mb-3" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="fw-bold text-white mb-0">#A-102</h3>
                  <small className="text-muted">Customer: Vikas • Est: 15 mins</small>
                </div>
                <span className="badge badge-status-waiting fs-6 px-3 py-2">
                  {t('status_WAITING')}
                </span>
              </div>
            </div>
            <div className="p-3 rounded" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h3 className="fw-bold text-white mb-0">#A-103</h3>
                  <small className="text-muted">Customer: Jay • Est: 35 mins</small>
                </div>
                <span className="badge badge-status-waiting fs-6 px-3 py-2">
                  {t('status_WAITING')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
