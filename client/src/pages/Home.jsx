import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { socket } from '../services/socket';

export const Home = () => {
  const { lang, t } = useLanguage();
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
      console.error('Error fetching live salon status:', err);
      setError(t('networkError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();

    const handleQueueUpdated = () => fetchStatus();
    socket.on('queue:updated', handleQueueUpdated);
    const interval = setInterval(fetchStatus, 15000);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      clearInterval(interval);
    };
  }, []);

  const waitingCount = liveStatus?.waitingCount ?? 0;
  const estimatedWait = liveStatus?.estimatedWaitMinutes ?? 0;
  const barbers = liveStatus?.activeBarbers || [];

  return (
    <div className="container py-4" style={{ maxWidth: '1060px' }}>
      {/* 1. Atelier Hero Banner */}
      <motion.div
        className="d-flex flex-wrap align-items-center justify-content-between mb-4 gap-3 pt-2"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span
              className="px-2 py-0 rounded-pill small fw-semibold text-uppercase"
              style={{
                background: 'rgba(229, 195, 120, 0.12)',
                border: '1px solid rgba(229, 195, 120, 0.3)',
                color: 'var(--accent-color)',
                fontSize: '0.72rem',
                letterSpacing: '0.1em',
              }}
            >
              Walk-in Lounge
            </span>
          </div>
          <h1
            className="mb-1 salon-heading"
            style={{
              fontSize: '2.5rem',
              color: 'var(--heading-color)',
              lineHeight: 1.15,
            }}
          >
            {t('welcomeHomeTitle')}
          </h1>
          <p
            className="mb-0"
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              maxWidth: '680px',
              lineHeight: 1.55,
            }}
          >
            {t('welcomeHomeSubtitle')}
          </p>
        </div>

        <div>
          <div
            className="px-3 py-2 rounded-pill d-inline-flex align-items-center gap-2"
            style={{
              background: 'rgba(14, 14, 18, 0.75)',
              border: '1px solid rgba(46, 160, 67, 0.35)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <span className="dot-indicator dot-free"></span>
            <span className="fw-semibold small" style={{ color: 'var(--heading-color)' }}>
              {t('salonOpen')}
            </span>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="alert alert-warning d-flex align-items-center justify-content-between mb-4 rounded-3" role="alert">
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-triangle-fill text-warning fs-5"></i>
            <span>{error}</span>
          </div>
          <button className="btn btn-sm btn-outline-dark" onClick={fetchStatus}>
            Retry
          </button>
        </div>
      )}

      {/* 2. Interactive Live Queue Hero Showcase */}
      <motion.div
        className="salon-card p-4 p-md-5 mb-4 text-center position-relative"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        style={{
          background: 'linear-gradient(180deg, rgba(22, 22, 28, 0.95) 0%, rgba(13, 13, 17, 0.98) 100%)',
          boxShadow: '0 16px 40px rgba(0, 0, 0, 0.8), 0 0 30px rgba(229, 195, 120, 0.1)',
        }}
      >
        {/* Subtle Top Radial Lighting */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '320px',
            height: '140px',
            background: 'radial-gradient(ellipse at top, rgba(229, 195, 120, 0.18) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Live Queue Pulse Badge */}
        <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill mb-3" style={{ background: 'rgba(229, 195, 120, 0.1)', border: '1px solid rgba(229, 195, 120, 0.28)' }}>
          <span className="dot-indicator dot-live"></span>
          <span
            className="small fw-semibold text-uppercase"
            style={{ color: 'var(--accent-color)', fontSize: '0.75rem', letterSpacing: '0.12em' }}
          >
            Live Queue Status
          </span>
        </div>

        {/* Dynamic Queue Metric */}
        <div className="my-2 position-relative">
          <motion.div
            key={waitingCount}
            initial={{ scale: 0.9, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="display-2 fw-bold mb-1"
            style={{
              fontFamily: "'Fraunces', serif",
              background: 'var(--gold-gradient)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              lineHeight: 1,
            }}
          >
            {loading ? '...' : waitingCount}
          </motion.div>

          <p
            className="lead fw-medium mb-3"
            style={{ color: 'var(--heading-color)', fontSize: '1.25rem' }}
          >
            {waitingCount === 1 ? `1 ${t('peopleWaiting')}` : `${waitingCount} ${t('peopleWaiting')}`}
          </p>

          <div
            className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill"
            style={{
              backgroundColor: 'rgba(8, 8, 10, 0.7)',
              border: '1px solid var(--border-color)',
            }}
          >
            <i className="bi bi-clock-history text-warning"></i>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>
              {waitingCount > 0
                ? t('aboutWait').replace('{time}', estimatedWait)
                : t('noWait')}
            </span>
          </div>
        </div>

        {/* Prominent Call to Action */}
        <div className="mt-4 pt-2 mx-auto" style={{ maxWidth: '480px' }}>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Link
              to="/join"
              className="btn btn-gold btn-lg w-100 py-3 fs-5 d-flex align-items-center justify-content-center gap-2 shadow-lg"
              style={{ borderRadius: '12px' }}
            >
              <i className="bi bi-person-plus-fill"></i>
              <span>{t('joinQueue')}</span>
              <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </motion.div>
        </div>
      </motion.div>

      {/* 3. Barbers on Duty Today */}
      <motion.div
        className="salon-card p-4 mb-4"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-scissors fs-5" style={{ color: 'var(--accent-color)' }}></i>
            <h5 className="salon-heading mb-0" style={{ fontSize: '1.25rem', color: 'var(--heading-color)' }}>
              {t('barberTeamTitle')}
            </h5>
          </div>
          <span className="badge badge-accent px-3 py-1 rounded-pill">
            {barbers.length} {t('activeBarbers')}
          </span>
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
                    src={barber.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                    alt={barber.name}
                    className="barber-avatar-sm"
                  />
                  <div>
                    <span className="fw-semibold text-white me-2" style={{ fontSize: '0.95rem' }}>
                      {barber.name}
                    </span>
                    <span className="small d-inline-flex align-items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
                      <span className={`dot-indicator ${dotClass}`}></span>
                      {statusLabel}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <span style={{ color: 'var(--text-secondary)' }}>{t('loadingStatus')}</span>
          )}
        </div>
      </motion.div>

      {/* 4. Quick Navigation Portal Grid */}
      <div className="row g-3">
        <div className="col-12 col-md-4">
          <motion.div
            className="salon-card p-4 h-100 d-flex flex-column justify-content-between"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-tv fs-5" style={{ color: 'var(--accent-color)' }}></i>
                <h6 className="salon-heading mb-0" style={{ fontSize: '1.1rem' }}>
                  {t('waitingTV')}
                </h6>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }} className="mb-3">
                Lobby television display showing live tickets called to styling stations in real time.
              </p>
            </div>
            <Link to="/display" className="btn btn-outline-gold w-100 py-2">
              <i className="bi bi-box-arrow-up-right me-1"></i> {t('waitingTV')}
            </Link>
          </motion.div>
        </div>

        <div className="col-12 col-md-4">
          <motion.div
            className="salon-card p-4 h-100 d-flex flex-column justify-content-between"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-clipboard2-check fs-5" style={{ color: 'var(--accent-color)' }}></i>
                <h6 className="salon-heading mb-0" style={{ fontSize: '1.1rem' }}>
                  {t('reception')}
                </h6>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }} className="mb-3">
                Front desk coordination dashboard for walk-in registrations and chair assignments.
              </p>
            </div>
            <Link to="/reception" className="btn btn-outline-gold w-100 py-2">
              <i className="bi bi-shield-check me-1"></i> {t('reception')}
            </Link>
          </motion.div>
        </div>

        <div className="col-12 col-md-4">
          <motion.div
            className="salon-card p-4 h-100 d-flex flex-column justify-content-between"
            whileHover={{ y: -4 }}
            transition={{ duration: 0.2 }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-person-badge fs-5" style={{ color: 'var(--accent-color)' }}></i>
                <h6 className="salon-heading mb-0" style={{ fontSize: '1.1rem' }}>
                  {t('barberView')}
                </h6>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5 }} className="mb-3">
                Styling chair console for barbers to manage customer callouts, in-chair timing, and service completion.
              </p>
            </div>
            <Link to="/barber/Ravi" className="btn btn-outline-gold w-100 py-2">
              <i className="bi bi-scissors me-1"></i> {t('barberView')}
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
