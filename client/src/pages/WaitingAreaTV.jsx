import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { BrandLogo } from '../components/BrandLogo';
import { BarberAvatar } from '../components/BarberAvatar';
import { playLuxuryChime } from '../utils/audio';

/**
 * Screen 6: Waiting Area TV Display (/display)
 * High-visibility lounge display readable from 5 meters away.
 * Dual-column layout: Barber Station Status Rows (col-md-7) & Up Next in Line (col-md-5).
 * Real-time Web Audio API synthesized chimes & glowing gold station flash on Call Next.
 */
export const WaitingAreaTV = () => {
  const { lang, t } = useLanguage();

  const [barbers, setBarbers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [calledAlert, setCalledAlert] = useState(null);
  const [flashingBarberId, setFlashingBarberId] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Digital clock tick every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Barbers and Queue for TV
  const fetchTVData = async () => {
    try {
      const [barbersRes, queueRes] = await Promise.all([
        api.getBarbers(),
        api.getQueue('all'),
      ]);

      if (barbersRes.success) setBarbers(barbersRes.barbers || []);
      if (queueRes.success) setTickets(queueRes.tickets || []);
    } catch (err) {
      console.error('Error fetching TV data:', err);
    }
  };

  useEffect(() => {
    fetchTVData();

    const handleQueueUpdated = () => fetchTVData();
    const handleBarberUpdated = () => fetchTVData();

    const handleTicketCalled = (data) => {
      fetchTVData();

      // Trigger Web Audio synthesized chime if enabled
      if (soundEnabled) {
        playLuxuryChime();
      }

      // Identify barber station to trigger glowing gold animation
      const bId = data?.assignedBarber?._id || data?.barberId;
      const bName = data?.assignedBarber?.name || data?.barberName;
      setFlashingBarberId(bId || bName);
      setTimeout(() => setFlashingBarberId(null), 4000);

      // Slide-in alert banner for 8 seconds
      if (data?.token) {
        setCalledAlert(data);
        setTimeout(() => setCalledAlert(null), 8000);
      }
    };

    socket.on('connect', handleQueueUpdated);
    socket.on('queue:updated', handleQueueUpdated);
    socket.on('ticket:called', handleTicketCalled);
    socket.on('ticket:started', handleQueueUpdated);
    socket.on('ticket:done', handleQueueUpdated);
    socket.on('ticket:cancelled', handleQueueUpdated);
    socket.on('ticket:no-show', handleQueueUpdated);
    socket.on('barber:updated', handleBarberUpdated);
    socket.on('barber:status-changed', handleBarberUpdated);

    const interval = setInterval(fetchTVData, 10000);

    return () => {
      socket.off('connect', handleQueueUpdated);
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('ticket:called', handleTicketCalled);
      socket.off('ticket:started', handleQueueUpdated);
      socket.off('ticket:done', handleQueueUpdated);
      socket.off('ticket:cancelled', handleQueueUpdated);
      socket.off('ticket:no-show', handleQueueUpdated);
      socket.off('barber:updated', handleBarberUpdated);
      socket.off('barber:status-changed', handleBarberUpdated);
      clearInterval(interval);
    };
  }, [soundEnabled]);

  // Toggle audio policy
  const handleToggleSound = () => {
    if (!soundEnabled) {
      // Test chime to unlock AudioContext
      playLuxuryChime();
      setSoundEnabled(true);
    } else {
      setSoundEnabled(false);
    }
  };

  // Fullscreen toggle for TV display
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Up Next Queue (First 5 waiting tickets sorted FIFO)
  const upNextList = useMemo(() => {
    return tickets
      .filter((t) => t.status === 'waiting')
      .sort((a, b) => new Date(a.joinedAt) - new Date(b.joinedAt))
      .slice(0, 5);
  }, [tickets]);

  // Format wait estimate
  const formatWaitTime = (ticket, index) => {
    if (ticket.estimatedWaitTimeMinutes) {
      return `~${ticket.estimatedWaitTimeMinutes}m wait`;
    }
    const mins = Math.max(5, (index + 1) * 15);
    return `~${mins}m wait`;
  };

  return (
    <div
      className="container-fluid py-3 px-3 px-md-5 min-vh-100 d-flex flex-column justify-content-between position-relative"
      style={{
        backgroundColor: '#08080A',
        color: 'var(--text-secondary)',
        fontFamily: "'Jost', sans-serif",
      }}
    >
      {/* 1. Top Bar: Salon Logo, Live Clock, Sound & Fullscreen Controls */}
      <div
        className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom"
        style={{ borderColor: 'var(--border-color)' }}
      >
        <div className="d-flex align-items-center gap-3">
          <BrandLogo size="lg" />
          <div className="ps-3 border-start" style={{ borderColor: 'var(--border-color)' }}>
            <h1
              className="salon-heading mb-0"
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 'clamp(1.3rem, 4vw, 2rem)',
                color: 'var(--heading-color)',
                letterSpacing: '-0.02em',
              }}
            >
              Crown & Blade Lounge
            </h1>
            <span
              className="small fw-semibold text-uppercase"
              style={{ color: 'var(--accent-color)', letterSpacing: '0.12em', fontSize: '0.78rem' }}
            >
              Live Styling Stations & Waiting Board
            </span>
          </div>
        </div>

        {/* Live Clock & Sound Enable Toggle */}
        <div className="d-flex align-items-center gap-3 mt-2 mt-md-0">
          {/* Sound Toggle (Autoplay Policy Compliance) */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`btn btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-pill ${
              soundEnabled ? 'btn-gold shadow-sm' : 'btn-outline-secondary'
            }`}
            style={{ minHeight: '44px' }}
            title={soundEnabled ? 'Chime sound is active' : 'Click to enable audio chime announcements'}
          >
            <i className={`bi ${soundEnabled ? 'bi-volume-up-fill text-dark fs-5' : 'bi-volume-mute-fill fs-5'}`}></i>
            <span className="fw-semibold small">
              {soundEnabled ? 'Sound: ON' : 'Click to Enable Sound'}
            </span>
          </button>

          {/* Large Digital Clock (Jost) */}
          <div
            className="px-4 py-2 rounded-pill d-flex align-items-center gap-2"
            style={{
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
              minHeight: '44px',
            }}
          >
            <span className="dot-indicator dot-live me-1"></span>
            <span
              className="fw-bold"
              style={{
                fontFamily: "'Jost', monospace",
                fontSize: '1.45rem',
                color: 'var(--accent-color)',
                letterSpacing: '1px',
              }}
            >
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="btn btn-outline-secondary d-none d-sm-flex align-items-center justify-content-center rounded-circle"
            style={{ width: '44px', height: '44px' }}
            title="Toggle TV Fullscreen"
          >
            <i className={`bi ${isFullscreen ? 'bi-fullscreen-exit' : 'bi-arrows-fullscreen'} text-white`}></i>
          </button>
        </div>
      </div>

      {/* 2. Floating Call Alert Chime Banner */}
      <AnimatePresence>
        {calledAlert && (
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 20 }}
            className="p-3 p-md-4 rounded-4 mb-4 text-center shadow-lg position-relative"
            style={{
              background: 'linear-gradient(135deg, rgba(229, 195, 120, 0.3) 0%, rgba(20, 20, 26, 0.98) 100%)',
              border: '2px solid var(--accent-color)',
              boxShadow: '0 12px 50px rgba(229, 195, 120, 0.45)',
            }}
          >
            <div className="d-flex align-items-center justify-content-center gap-3">
              <i className="bi bi-bell-fill display-5 text-warning animate-pulse"></i>
              <div>
                <h2
                  className="salon-heading text-white mb-0 display-6"
                  style={{ fontFamily: "'Fraunces', serif" }}
                >
                  Token {calledAlert.token} is Called!
                </h2>
                <p className="mb-0 fs-5" style={{ color: 'var(--accent-color)', fontFamily: "'Jost', sans-serif" }}>
                  Please proceed to {calledAlert.assignedBarber?.name ? `Barber ${calledAlert.assignedBarber.name}` : 'your styling station'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Main Split: Barber Station Status Rows (col-md-7) & Up Next Queue (col-md-5) */}
      <div className="row g-4 g-xl-5 flex-grow-1 mb-4">
        {/* Left Section: Barber Station Status Rows (col-md-7) */}
        <div className="col-12 col-md-7">
          <div
            className="salon-card p-4 p-md-4 h-100 d-flex flex-column"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 20, 26, 0.96) 0%, rgba(12, 12, 16, 0.98) 100%)',
              border: '1px solid rgba(229, 195, 120, 0.35)',
            }}
          >
            {/* Section Header */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-scissors fs-3" style={{ color: 'var(--accent-color)' }}></i>
                <h2
                  className="salon-heading mb-0 text-uppercase"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: '1.6rem',
                    letterSpacing: '0.06em',
                    color: 'var(--heading-color)',
                  }}
                >
                  Styling Stations
                </h2>
              </div>
              <span className="badge badge-accent px-3 py-1 rounded-pill fs-6">
                {barbers.length} Stations Active
              </span>
            </div>

            {/* Barber Station Rows */}
            <div className="d-flex flex-column gap-3 my-auto">
              {barbers.map((barber, index) => {
                // Find active customer in chair or called for this barber
                const activeCust = tickets.find(
                  (t) =>
                    ['called', 'in-chair'].includes(t.status) &&
                    (t.assignedBarber?._id === barber._id ||
                      t.assignedBarber === barber._id ||
                      t.assignedBarber?.name?.toLowerCase() === barber.name?.toLowerCase())
                );

                const isFlashing =
                  flashingBarberId === barber._id ||
                  String(flashingBarberId).toLowerCase() === barber.name?.toLowerCase();

                const isOnBreak = barber.status === 'break';
                const isFree = barber.status === 'free' && !activeCust;

                return (
                  <motion.div
                    key={barber._id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.08 }}
                    className={`p-3 p-xl-4 rounded-4 position-relative overflow-hidden ${
                      isFlashing ? 'tv-station-flashing' : ''
                    }`}
                    style={{
                      backgroundColor: 'rgba(10, 10, 14, 0.88)',
                      border: isFlashing
                        ? '2px solid var(--accent-color)'
                        : activeCust
                        ? '1px solid rgba(229, 195, 120, 0.45)'
                        : '1px solid var(--border-color)',
                      boxShadow: isFlashing
                        ? '0 0 35px rgba(229, 195, 120, 0.6)'
                        : '0 8px 24px rgba(0, 0, 0, 0.5)',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between gap-3">
                      {/* Barber Vector Avatar (80px x 80px) & Title */}
                      <div className="d-flex align-items-center gap-3 gap-xl-4">
                        <BarberAvatar
                          name={barber.name}
                          photo={barber.photo}
                          size={80}
                          status={barber.status}
                          active={!!activeCust}
                        />
                        <div>
                          <div className="text-secondary small text-uppercase" style={{ letterSpacing: '0.08em', fontSize: '0.75rem' }}>
                            Station #{index + 1}
                          </div>
                          <h3
                            className="salon-heading text-white mb-1"
                            style={{ fontFamily: "'Fraunces', serif", fontSize: '1.75rem' }}
                          >
                            Barber {barber.name}
                          </h3>
                          {activeCust ? (
                            <div className="d-flex align-items-center gap-2">
                              <span className="fw-semibold text-white fs-6">
                                {activeCust.customerName}
                              </span>
                              <span className="text-secondary small d-none d-sm-inline">
                                • {activeCust.services?.map((s) => s.name?.[lang] || s.name?.en || s.name).join(', ')}
                              </span>
                            </div>
                          ) : isOnBreak ? (
                            <span className="small text-warning">
                              <i className="bi bi-cup-hot me-1"></i> {t('barber_break')}
                            </span>
                          ) : (
                            <span className="small" style={{ color: 'var(--text-secondary)' }}>
                              {t('readyForNextClient')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right Status Badge / Current Token Display */}
                      <div className="text-end">
                        {activeCust ? (
                          <div className="d-flex flex-column align-items-end">
                            <span
                              className="px-3 py-1 rounded-3 fw-bold text-center d-inline-block shadow-sm"
                              style={{
                                fontFamily: "'Fraunces', serif",
                                background: 'var(--gold-gradient-subtle)',
                                border: '2px solid var(--accent-color)',
                                color: 'var(--accent-color)',
                                fontSize: '1.85rem',
                                minWidth: '130px',
                                letterSpacing: '1px',
                              }}
                            >
                              Now: {activeCust.token}
                            </span>
                            <span
                              className={`badge ${
                                activeCust.status === 'in-chair'
                                  ? 'badge-status-in-chair'
                                  : 'badge-status-called'
                              } px-2 py-1 mt-1 rounded-pill small`}
                            >
                              {activeCust.status === 'in-chair' ? t('status_IN_CHAIR') : t('status_CALLED')}
                            </span>
                          </div>
                        ) : isOnBreak ? (
                          <div className="px-3 py-2 rounded-3 text-center" style={{ background: 'rgba(217, 119, 6, 0.15)', border: '1px solid var(--amber-warning)' }}>
                            <span className="fw-bold fs-5 text-warning d-block">
                              {t('barber_break')}
                            </span>
                            <small className="text-secondary">{t('onBreakBeBack')}</small>
                          </div>
                        ) : (
                          <div className="px-3 py-2 rounded-3 text-center" style={{ background: 'rgba(229, 195, 120, 0.08)', border: '1px solid rgba(229, 195, 120, 0.25)' }}>
                            <span
                              className="fw-bold fs-5 d-block"
                              style={{ color: 'var(--accent-color)', fontFamily: "'Fraunces', serif" }}
                            >
                              {t('chairAvailable')}
                            </span>
                            <small className="text-secondary">{t('chairFree')}</small>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Section: "Up Next" Queue Column (col-md-5) */}
        <div className="col-12 col-md-5">
          <div
            className="salon-card p-4 p-md-4 h-100 d-flex flex-column"
            style={{
              background: 'linear-gradient(180deg, rgba(20, 20, 26, 0.96) 0%, rgba(12, 12, 16, 0.98) 100%)',
              border: '1px solid var(--border-color)',
            }}
          >
            {/* Column Header: "Up Next in Line" */}
            <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-hourglass-split fs-3" style={{ color: 'var(--amber-warning)' }}></i>
                <h2
                  className="salon-heading mb-0 text-uppercase"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: '1.6rem',
                    letterSpacing: '0.06em',
                    color: 'var(--amber-warning)',
                  }}
                >
                  {t('upNextInLine')}
                </h2>
              </div>
              <span className="badge badge-status-waiting px-3 py-1 rounded-pill fs-6">
                {t('next5InQueue')}
              </span>
            </div>

            {/* Next 5 Tokens List with Estimated Wait Times */}
            {upNextList.length === 0 ? (
              <div className="text-center py-5 my-auto">
                <i className="bi bi-check2-circle display-3 d-block mb-3 text-success opacity-50"></i>
                <h4 className="text-white" style={{ fontFamily: "'Fraunces', serif" }}>
                  {t('waitingRoomClear')}
                </h4>
                <p className="text-secondary small">{t('noCustomersInLounge')}</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3 my-auto">
                {upNextList.map((ticket, index) => {
                  return (
                    <motion.div
                      key={ticket._id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.06 }}
                      className="p-3 px-4 rounded-4 d-flex justify-content-between align-items-center"
                      style={{
                        backgroundColor: 'rgba(10, 10, 14, 0.75)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div className="d-flex align-items-center gap-3">
                        {/* Token Badge (Jost/Fraunces) */}
                        <span
                          className="fw-bold text-center px-3 py-2 rounded-3"
                          style={{
                            fontFamily: "'Jost', monospace",
                            fontSize: '1.65rem',
                            background: 'rgba(217, 119, 6, 0.15)',
                            border: '1.5px solid rgba(217, 119, 6, 0.5)',
                            color: 'var(--amber-warning)',
                            minWidth: '95px',
                            letterSpacing: '0.5px',
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
                        <span
                          className="badge px-3 py-1 rounded-pill fw-semibold"
                          style={{
                            background: 'rgba(229, 195, 120, 0.12)',
                            color: 'var(--accent-color)',
                            border: '1px solid rgba(229, 195, 120, 0.25)',
                            fontSize: '0.82rem',
                          }}
                        >
                          {formatWaitTime(ticket, index)}
                        </span>
                        <div className="small text-secondary mt-1">
                          {ticket.preferredBarber === 'any' ? 'Any Barber' : `Prefers ${ticket.preferredBarber}`}
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

      {/* Subtle TV Footer */}
      <div className="text-center py-2 border-top small" style={{ borderColor: 'var(--border-color)', color: 'var(--text-secondary)' }}>
        Crown & Blade Salon • Real-time Multi-Device Walk-in System • Waiting Lounge Public Display
      </div>
    </div>
  );
};
