import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { socket } from '../services/socket';

export const Home = () => {
  const { t } = useLanguage();
  const [liveStatus, setLiveStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStatus = async () => {
    try {
      const data = await api.getSalonLiveStatus();
      if (data.success) {
        setLiveStatus(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching live status:', err);
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    // Listen to real-time queue updates from server
    const handleQueueUpdated = () => {
      fetchStatus();
    };

    socket.on('queue:updated', handleQueueUpdated);

    // Periodic poll fallback every 20 seconds
    const interval = setInterval(fetchStatus, 20000);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      clearInterval(interval);
    };
  }, []);

  const waitingCount = liveStatus?.waitingCount ?? 0;
  const estimatedWait = liveStatus?.estimatedWaitMinutes ?? 0;
  const barbers = liveStatus?.activeBarbers || [];

  return (
    <div className="container py-4 animate-fade-in-up">
      {/* 1. Header / Live Salon Status Badge */}
      <div className="d-flex flex-wrap align-items-center justify-content-between mb-3 gap-2">
        <div className="d-flex align-items-center gap-2">
          <span style={{ fontSize: '1.75rem' }}>👑</span>
          <div>
            <h2 className="fw-bold mb-0" style={{ color: 'var(--text-main)', letterSpacing: '0.5px' }}>
              {t('appTitle')}
            </h2>
            <small className="text-muted">{t('welcomeHomeSubtitle')}</small>
          </div>
        </div>

        <div>
          <span
            className="badge badge-gold px-3 py-2 rounded-pill fs-6 d-inline-flex align-items-center gap-2"
            style={{ border: '1px solid var(--accent-gold)' }}
          >
            <span className="dot-indicator dot-free"></span>
            <span className="fw-semibold">{t('salonOpen')}</span>
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between" role="alert">
          <div>
            <i className="bi bi-exclamation-triangle-fill me-2"></i>
            {error}
          </div>
          <button className="btn btn-sm btn-outline-dark" onClick={fetchStatus}>
            Retry
          </button>
        </div>
      )}

      {/* 2. Live Queue Hero Card */}
      <div
        className="salon-card p-4 p-md-5 mb-4 text-center position-relative overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, var(--bg-charcoal) 0%, var(--bg-card) 100%)',
          borderColor: 'var(--border-color)',
        }}
      >
        <span className="badge badge-gold px-3 py-1 mb-3 rounded-pill text-uppercase">
          <i className="bi bi-broadcast me-1"></i> Live Queue Status
        </span>

        {/* Dynamic Queue Metric */}
        <div className="my-3">
          <div className="display-3 fw-bold mb-1" style={{ color: 'var(--accent-gold)' }}>
            {loading ? '...' : waitingCount}
          </div>
          <p className="lead fw-semibold mb-2" style={{ color: 'var(--text-main)' }}>
            {waitingCount} {t('peopleWaiting')}
          </p>
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
            <i className="bi bi-hourglass-split text-warning"></i>
            <span className="text-muted small">
              {waitingCount > 0
                ? t('aboutWait').replace('{time}', estimatedWait)
                : t('noWait')}
            </span>
          </div>
        </div>

        {/* Big Prominent Call to Action */}
        <div className="mt-4 pt-2">
          <Link
            to="/join"
            className="btn btn-gold btn-lg w-100 py-3 fs-5 fw-bold text-uppercase d-flex align-items-center justify-content-center gap-2 shadow-lg"
            style={{ borderRadius: '10px' }}
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>{t('joinQueue')}</span>
          </Link>
        </div>
      </div>

      {/* 3. Barber Status Chips */}
      <div className="salon-card p-4 mb-4">
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2" style={{ borderColor: 'var(--border-color)' }}>
          <h5 className="fw-bold mb-0" style={{ color: 'var(--accent-gold)' }}>
            <i className="bi bi-scissors me-2"></i>{t('barberTeamTitle')}
          </h5>
          <span className="badge badge-gold">{barbers.length} {t('activeBarbers')}</span>
        </div>

        <div className="d-flex flex-wrap gap-3">
          {barbers.length > 0 ? (
            barbers.map((barber) => {
              const statusClass =
                barber.status === 'free'
                  ? 'barber-chip-free'
                  : barber.status === 'busy'
                  ? 'barber-chip-busy'
                  : 'barber-chip-break';

              const dotClass =
                barber.status === 'free'
                  ? 'dot-free'
                  : barber.status === 'busy'
                  ? 'dot-busy'
                  : 'dot-break';

              const statusLabel =
                barber.status === 'free'
                  ? t('barber_free')
                  : barber.status === 'busy'
                  ? t('barber_busy')
                  : t('barber_break');

              return (
                <div key={barber._id} className={`barber-chip ${statusClass}`}>
                  <img
                    src={barber.photo || 'https://via.placeholder.com/32'}
                    alt={barber.name}
                    className="barber-avatar-sm"
                  />
                  <div>
                    <span className="fw-bold text-white me-2">{barber.name}</span>
                    <span className="small text-muted d-inline-flex align-items-center gap-1">
                      <span className={`dot-indicator ${dotClass}`}></span>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <span className="text-muted">{t('loadingStatus')}</span>
          )}
        </div>
      </div>

      {/* 4. Quick Navigation Portal Grid */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <div className="salon-card p-3 h-100 d-flex flex-column justify-content-between">
            <div>
              <h6 className="fw-bold" style={{ color: 'var(--accent-gold)' }}>
                <i className="bi bi-tv me-2"></i>{t('waitingTV')}
              </h6>
              <p className="text-muted small mb-3">Lobby television display showing live tickets called to stations.</p>
            </div>
            <Link to="/display" className="btn btn-sm btn-outline-gold w-100">
              <i className="bi bi-box-arrow-up-right me-1"></i> {t('waitingTV')}
            </Link>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="salon-card p-3 h-100 d-flex flex-column justify-content-between">
            <div>
              <h6 className="fw-bold" style={{ color: 'var(--accent-gold)' }}>
                <i className="bi bi-clipboard2-check me-2"></i>{t('reception')}
              </h6>
              <p className="text-muted small mb-3">Front desk dashboard for receptionist queue management.</p>
            </div>
            <Link to="/reception" className="btn btn-sm btn-outline-gold w-100">
              <i className="bi bi-shield-lock me-1"></i> {t('reception')}
            </Link>
          </div>
        </div>

        <div className="col-12 col-md-4">
          <div className="salon-card p-3 h-100 d-flex flex-column justify-content-between">
            <div>
              <h6 className="fw-bold" style={{ color: 'var(--accent-gold)' }}>
                <i className="bi bi-person-badge me-2"></i>{t('barberView')}
              </h6>
              <p className="text-muted small mb-3">Individual styling chair screen for on-duty barbers.</p>
            </div>
            <Link to="/barber/Ravi" className="btn btn-sm btn-outline-gold w-100">
              <i className="bi bi-scissors me-1"></i> {t('barberView')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
