import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const Reception = () => {
  const { t } = useLanguage();

  return (
    <div className="container py-4">
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <h2 className="fw-bold mb-1" style={{ color: 'var(--accent-gold)' }}>
            <i className="bi bi-clipboard2-check me-2"></i>{t('reception')}
          </h2>
          <small className="text-muted">Screen 4 • Front Desk Queue Coordination Center</small>
        </div>
        <button className="btn btn-gold disabled" disabled>
          <i className="bi bi-plus-circle me-1"></i> + Add Walk-in
        </button>
      </div>

      <div className="alert alert-dark border border-secondary mb-4" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-muted)' }}>
        <i className="bi bi-info-circle me-2 text-warning"></i>
        {t('skeletonNote')} - Queue table, chair assignment, 10-minute timer alerts, and quick actions will be fully functional in subsequent steps.
      </div>

      <div className="salon-card p-3 mb-4">
        <h5 className="salon-card-header mb-3">Live Reception Queue Table (Placeholder)</h5>
        <div className="table-responsive">
          <table className="table table-dark table-hover mb-0 align-middle">
            <thead>
              <tr className="border-bottom" style={{ borderColor: 'var(--border-color)', color: 'var(--accent-gold)' }}>
                <th>Ticket</th>
                <th>Customer</th>
                <th>Services</th>
                <th>Barber</th>
                <th>Est. Wait</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>#A-101</td>
                <td>Ramesh Patel</td>
                <td>Haircut (30m)</td>
                <td>Rahul</td>
                <td>0m (Now)</td>
                <td><span className="badge badge-status-in-chair">{t('status_IN_CHAIR')}</span></td>
                <td><button className="btn btn-sm btn-outline-secondary" disabled>Actions</button></td>
              </tr>
              <tr>
                <td>#A-102</td>
                <td>Vikas Shah</td>
                <td>Haircut + Beard (45m)</td>
                <td>{t('fastestAvailable')}</td>
                <td>~15 mins</td>
                <td><span className="badge badge-status-waiting">{t('status_WAITING')}</span></td>
                <td><button className="btn btn-sm btn-outline-secondary" disabled>Actions</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
