import React from 'react';
import { useParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const BarberView = () => {
  const { name } = useParams();
  const { t } = useLanguage();

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--accent-gold)' }}>
            <i className="bi bi-scissors me-2"></i>{t('barberView')} : {name || 'Rahul'}
          </h2>
          <small className="text-muted">Screen 5 • Dedicated Barber Station Dashboard</small>
        </div>
        <span className="badge badge-gold px-3 py-2">Station #1 • On-Duty</span>
      </div>

      <div className="alert alert-dark border border-secondary mb-4" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-muted)' }}>
        <i className="bi bi-info-circle me-2 text-warning"></i>
        {t('skeletonNote')} - Station workflow with active chair timer, call next customer button, and service completion triggers.
      </div>

      <div className="row g-4">
        <div className="col-lg-6">
          <div className="salon-card p-4 h-100">
            <h5 className="fw-bold text-warning mb-3">Now In Chair</h5>
            <div className="p-3 rounded mb-3" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="h4 text-white mb-0">#A-101 • Ramesh Patel</span>
                <span className="badge badge-status-in-chair">{t('status_IN_CHAIR')}</span>
              </div>
              <p className="text-muted mb-1">Services: Haircut (30 mins)</p>
              <p className="text-muted mb-0">Elapsed: 12 mins</p>
            </div>
            <button className="btn btn-gold w-100 disabled" disabled>
              Mark Service Complete (Done)
            </button>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="salon-card p-4 h-100">
            <h5 className="fw-bold text-info mb-3">Up Next For You</h5>
            <div className="p-3 rounded mb-3" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}>
              <div className="d-flex justify-content-between align-items-center mb-1">
                <span className="fw-bold text-white">#A-102 • Vikas Shah</span>
                <span className="badge badge-status-waiting">{t('status_WAITING')}</span>
              </div>
              <small className="text-muted">Requested: Any Barber • Est. 45m</small>
            </div>
            <button className="btn btn-outline-gold w-100 disabled" disabled>
              Call Next Customer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
