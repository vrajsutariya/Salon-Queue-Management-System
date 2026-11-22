import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const MyStatus = () => {
  const { id } = useParams();
  const { t } = useLanguage();

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-6">
          <div className="salon-card p-4 text-center">
            <span className="badge badge-gold px-3 py-1 rounded-pill mb-2">Screen 3</span>
            <h3 className="fw-bold mb-1" style={{ color: 'var(--accent-gold)' }}>
              {t('myStatus')}
            </h3>
            <p className="text-muted small mb-4">Ticket ID: <span className="text-white fw-bold">{id || 'TICKET-DEMO-101'}</span></p>

            <div className="py-4 px-3 mb-4 rounded" style={{ backgroundColor: 'var(--bg-dark)', border: '1px solid var(--border-color)' }}>
              <span className="badge badge-status-waiting fs-6 px-3 py-2 mb-3">
                {t('status_WAITING')}
              </span>
              <div className="display-4 fw-bold mb-2" style={{ color: 'var(--accent-gold)' }}>#2</div>
              <p className="text-muted mb-1">Your Position in Line</p>
              <h5 className="text-white mt-3">Est. Wait: ~15 {t('minutes')}</h5>
            </div>

            <div className="alert alert-dark border border-secondary text-start mb-4" style={{ backgroundColor: 'var(--bg-dark)', color: 'var(--text-muted)' }}>
              <small><i className="bi bi-info-circle me-1 text-warning"></i> {t('skeletonNote')}</small>
            </div>

            <div className="d-flex justify-content-between gap-2">
              <Link to="/" className="btn btn-outline-gold flex-grow-1">
                <i className="bi bi-arrow-left me-1"></i> {t('home')}
              </Link>
              <button className="btn btn-outline-danger flex-grow-1" disabled>
                {t('status_CANCELLED')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
