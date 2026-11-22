import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { BrandLogo } from '../components/BrandLogo';

export const WaitingAreaTV = () => {
  const { lang, t } = useLanguage();
  const [tickets, setTickets] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calledAlert, setCalledAlert] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Digital clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Web Audio chime for TV callouts
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.warn('AudioContext not allowed or supported:', e);
    }
  };

  const fetchTVQueue = async () => {
    try {
      const res = await api.getQueue('all');
      if (res.success) {
        setTickets(res.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching TV queue data:', err);
    }
  };

  useEffect(() => {
    fetchTVQueue();

    const handleQueueUpdated = () => fetchTVQueue();
    const handleTicketCalled = (data) => {
      fetchTVQueue();
      playChime();
      if (data?.token) {
        setCalledAlert(data);
        setTimeout(() => setCalledAlert(null), 8000);
      }
    };

    socket.on('queue:updated', handleQueueUpdated);
    socket.on('ticket:called', handleTicketCalled);
    socket.on('ticket:cancelled', handleQueueUpdated);

    const interval = setInterval(fetchTVQueue, 10000);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('ticket:called', handleTicketCalled);
      socket.off('ticket:cancelled', handleQueueUpdated);
      clearInterval(interval);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Now Serving (called or in-chair)
  const nowServingList = useMemo(() => {
    return tickets
      .filter((t) => ['called', 'in-chair'].includes(t.status))
      .sort((a, b) => new Date(b.calledAt || b.joinedAt) - new Date(a.calledAt || a.joinedAt));
  }, [tickets]);

  // Up Next (waiting)
  const upNextList = useMemo(() => {
    return tickets
      .filter((t) => t.status === 'waiting')
      .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt));
  }, [tickets]);

  return (
    <div
      className="container-fluid py-4 px-3 px-md-5 min-vh-100 d-flex flex-column justify-content-between position-relative"
      style={{
        backgroundColor: 'var(--bg-deep)',
        color: 'var(--text-secondary)',
      }}
    >
      {/* Top Banner & TV Header */}
      <div
        className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="d-flex align-items-center gap-3">
          <BrandLogo size="lg" />
          <div className="ps-3 border-start" style={{ borderColor: 'var(--border-color)' }}>
            <h1 className="salon-heading mb-0" style={{ fontSize: '1.8rem', color: 'var(--heading-color)' }}>
              Waiting Lounge Display
            </h1>
            <span className="small" style={{ color: 'var(--text-secondary)', letterSpacing: '0.06em' }}>
              Real-time Chair Calling Board • Audio Announcement Enabled
            </span>
          </div>
        </div>

        {/* Live Clock & Fullscreen Toggle */}
        <div className="d-flex align-items-center gap-3 mt-3 mt-md-0">
          <div
            className="px-4 py-2 rounded-pill d-flex align-items-center gap-2"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 14px rgba(0,0,0,0.5)',
            }}
          >
            <span className="dot-indicator dot-live"></span>
            <span
              className="fw-bold"
              style={{
                fontFamily: 'monospace',
                fontSize: '1.35rem',
                color: 'var(--accent-color)',
                letterSpacing: '1px',
              }}
            >
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>

          <button
            type="button"
            onClick={toggleFullscreen}
            className="btn btn-outline-gold d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
            title="Toggle 10-Foot Fullscreen TV View"
          >
            <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'}`}></i>
            <span className="d-none d-sm-inline">{isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}</span>
          </button>
        </div>
      </div>

      {/* Floating Calling Chime Banner */}
      <AnimatePresence>
        {calledAlert && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="p-4 rounded-4 mb-4 text-center shadow-lg position-relative"
            style={{
              background: 'linear-gradient(135deg, rgba(229, 195, 120, 0.25) 0%, rgba(20, 20, 24, 0.98) 100%)',
              border: '2px solid var(--accent-color)',
              boxShadow: '0 10px 40px rgba(229, 195, 120, 0.3)',
            }}
          >
            <div className="d-flex align-items-center justify-content-center gap-3">
              <i className="bi bi-bell-fill fs-1 text-warning animate-pulse"></i>
              <div>
                <h2 className="salon-heading text-white mb-0 display-6">
                  Token {calledAlert.token} is Called!
                </h2>
                <p className="mb-0 fs-5" style={{ color: 'var(--accent-color)' }}>
                  Please proceed to {calledAlert.assignedBarber?.name ? `Barber ${calledAlert.assignedBarber.name}` : 'your styling station'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main 2-Column Split: Now Serving vs Up Next */}
      <div className="row g-4 g-xl-5 flex-grow-1 mb-4">
        {/* Left Column: Now Serving */}
        <div className="col-12 col-lg-6">
          <div
            className="salon-card p-4 p-md-5 h-100 d-flex flex-column"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 20, 25, 0.95) 0%, rgba(12, 12, 16, 0.98) 100%)',
              border: '1px solid rgba(229, 195, 120, 0.35)',
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-scissors fs-3" style={{ color: 'var(--accent-color)' }}></i>
                <h2 className="salon-heading mb-0 text-uppercase" style={{ fontSize: '1.5rem', letterSpacing: '0.08em', color: 'var(--accent-color)' }}>
                  Now Serving
                </h2>
              </div>
              <span className="badge badge-accent px-3 py-1 rounded-pill">
                {nowServingList.length} In Chairs
              </span>
            </div>

            {nowServingList.length === 0 ? (
              <div className="text-center py-5 my-auto">
                <i className="bi bi-pause-circle display-3 d-block mb-3 opacity-40" style={{ color: 'var(--accent-color)' }}></i>
                <h4 className="text-white">All Chairs Available</h4>
                <p className="text-secondary small">Waiting for barbers to call next customers.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3 my-auto">
                {nowServingList.map((ticket) => {
                  const barberName =
                    ticket.assignedBarber?.name ||
                    (typeof ticket.assignedBarber === 'string' ? ticket.assignedBarber : 'Station Stylist');

                  return (
                    <motion.div
                      key={ticket._id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="p-4 rounded-4 position-relative overflow-hidden"
                      style={{
                        backgroundColor: 'rgba(10, 10, 14, 0.85)',
                        border: '1px solid rgba(229, 195, 120, 0.45)',
                        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center gap-4">
                          <span
                            className="display-4 fw-bold text-center px-3 py-1 rounded-3"
                            style={{
                              fontFamily: "'Fraunces', serif",
                              background: 'var(--gold-gradient)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent',
                              border: '2px solid rgba(229, 195, 120, 0.4)',
                              minWidth: '120px',
                            }}
                          >
                            {ticket.token}
                          </span>
                          <div>
                            <h3 className="salon-heading text-white mb-1" style={{ fontSize: '1.6rem' }}>
                              {ticket.customerName}
                            </h3>
                            <div className="d-flex align-items-center gap-2">
                              <span className="badge badge-accent px-2 py-1">
                                Barber {barberName}
                              </span>
                              <span className="text-secondary small">
                                {ticket.services?.map((s) => s.name?.[lang] || s.name?.en || s.name).join(', ')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`badge ${
                            ticket.status === 'in-chair'
                              ? 'badge-status-in-chair'
                              : 'badge-status-called'
                          } px-3 py-2 fs-6 rounded-pill`}
                        >
                          {ticket.status === 'in-chair' ? t('status_IN_CHAIR') : t('status_CALLED')}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Up Next */}
        <div className="col-12 col-lg-6">
          <div
            className="salon-card p-4 p-md-5 h-100 d-flex flex-column"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 20, 25, 0.95) 0%, rgba(12, 12, 16, 0.98) 100%)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-hourglass-split fs-3" style={{ color: 'var(--amber-warning)' }}></i>
                <h2 className="salon-heading mb-0 text-uppercase" style={{ fontSize: '1.5rem', letterSpacing: '0.08em', color: 'var(--amber-warning)' }}>
                  Up Next In Line
                </h2>
              </div>
              <span className="badge badge-status-waiting px-3 py-1 rounded-pill">
                {upNextList.length} Waiting
              </span>
            </div>

            {upNextList.length === 0 ? (
              <div className="text-center py-5 my-auto">
                <i className="bi bi-check2-circle display-3 d-block mb-3 opacity-40 text-success"></i>
                <h4 className="text-white">Waiting Room Clear</h4>
                <p className="text-secondary small">No customers currently waiting in the lounge.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3 my-auto">
                {upNextList.slice(0, 6).map((ticket, index) => {
                  return (
                    <motion.div
                      key={ticket._id}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-3 px-4 rounded-4 d-flex justify-content-between align-items-center"
                      style={{
                        backgroundColor: 'rgba(10, 10, 14, 0.7)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span
                          className="fs-4 fw-bold text-center px-3 py-1 rounded-3"
                          style={{
                            background: 'rgba(217, 119, 6, 0.15)',
                            border: '1px solid rgba(217, 119, 6, 0.4)',
                            color: 'var(--amber-warning)',
                            minWidth: '75px',
                          }}
                        >
                          {ticket.token}
                        </span>
                        <div>
                          <div className="fw-semibold text-white fs-5">{ticket.customerName}</div>
                          <small style={{ color: 'var(--text-secondary)' }}>
                            {ticket.services?.map((s) => s.name?.[lang] || s.name?.en || s.name).join(', ')}
                          </small>
                        </div>
                      </div>

                      <div className="text-end">
                        <span className="badge px-3 py-1 rounded-pill" style={{ background: 'rgba(255, 255, 255, 0.06)', color: 'var(--text-secondary)' }}>
                          {ticket.preferredBarber === 'any' ? t('fastestAvailable') : `Prefers ${ticket.preferredBarber}`}
                        </span>
                        <div className="small text-secondary mt-1">
                          Line #{index + 1}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Footer */}
      <div className="text-center py-2 border-top small" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
        Crown & Blade Salon • Live Walk-in Synchronization System • TV Public Board
      </div>
    </div>
  );
};
