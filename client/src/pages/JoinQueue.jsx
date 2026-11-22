import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const JoinQueue = () => {
  const { t } = useLanguage();

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-7">
          <div className="salon-card p-4">
            <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <h3 className="mb-0 fw-bold" style={{ color: 'var(--accent-gold)' }}>
                <i className="bi bi-person-plus me-2"></i>{t('joinQueue')}
              </h3>
              <span className="badge badge-gold">Screen 2</span>
            </div>

            <div className="alert alert-dark border border-secondary mb-4" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-muted)' }}>
              <i className="bi bi-info-circle me-2 text-warning"></i>
              {t('skeletonNote')}
            </div>

            <div className="p-3 mb-3 rounded" style={{ backgroundColor: 'var(--bg-dark)', border: '1px dashed var(--border-color)' }}>
              <h6 className="fw-semibold text-white mb-2">Form Elements (To be wired in Step 2):</h6>
              <ul className="text-muted small mb-0 ps-3">
                <li>Customer Name Input (Required)</li>
                <li>Phone Number (10 digits)</li>
                <li>Multi-select Service Catalog (Haircut, Beard Trim, Hair Wash, Facial)</li>
                <li>Barber Preference Dropdown (Any Barber / Specific Barber)</li>
                <li>Dynamic Live Estimation Summary (Total Duration & Wait Time)</li>
              </ul>
            </div>

            <button type="button" className="btn btn-gold w-100 disabled" disabled>
              {t('joinQueue')} (Wired in Step 2)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
