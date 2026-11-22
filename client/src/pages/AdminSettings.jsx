import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const AdminSettings = () => {
  const { t } = useLanguage();

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--accent-gold)' }}>
            <i className="bi bi-gear me-2"></i>{t('admin')}
          </h2>
          <small className="text-muted">Screen 7 • Operational Settings, Staff Roster & Services</small>
        </div>
        <span className="badge badge-gold px-3 py-2">Salon Owner Portal</span>
      </div>

      <div className="alert alert-dark border border-secondary mb-4" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-muted)' }}>
        <i className="bi bi-info-circle me-2 text-warning"></i>
        {t('skeletonNote')} - Configuration for barbers, service menu, daily resets, and operational toggles will be fully editable in later steps.
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="salon-card p-4">
            <h5 className="fw-bold mb-3" style={{ color: 'var(--accent-gold)' }}>
              <i className="bi bi-sliders me-2"></i>Salon Controls
            </h5>
            <div className="d-flex justify-content-between align-items-center p-3 rounded mb-3" style={{ backgroundColor: 'var(--bg-dark)' }}>
              <span>Salon Operating Status</span>
              <span className="badge bg-success">{t('salonOpen')}</span>
            </div>
            <button className="btn btn-outline-danger w-100 disabled" disabled>
              Reset Queue For Today
            </button>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="salon-card p-4">
            <h5 className="fw-bold mb-3" style={{ color: 'var(--accent-gold)' }}>
              <i className="bi bi-people me-2"></i>Barber Roster Preview
            </h5>
            <ul className="list-group list-group-flush rounded">
              <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                <span>Rahul (Station 1)</span>
                <span className="badge bg-success">Active</span>
              </li>
              <li className="list-group-item d-flex justify-content-between align-items-center bg-dark text-white border-secondary">
                <span>Amit (Station 2)</span>
                <span className="badge bg-success">Active</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
