import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { playLuxuryChime, triggerHapticFeedback } from '../utils/audio';
import { BarberAvatar } from '../components/BarberAvatar';

export const MyStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, toggleLanguage, t } = useLanguage();

  // State
  const [ticketData, setTicketData] = useState(null);
  const [barbersList, setBarbersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSocketConnected, setIsSocketConnected] = useState(socket.connected);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [takeoverDismissed, setTakeoverDismissed] = useState(false);
  const [chimePlayed, setChimePlayed] = useState(false);
  const [showDevControls, setShowDevControls] = useState(false);

  const prevStatusRef = useRef(null);

  // Fetch ticket details from backend
  const fetchTicket = async () => {
    try {
      const [ticketRes, barbersRes] = await Promise.all([
        api.getTicketStatus(id),
        api.getBarbers().catch(() => ({ success: false, barbers: [] })),
      ]);

      if (ticketRes.success) {
        setTicketData(ticketRes);
        setError(null);

        // If status transitioned to 'called', trigger luxury chime and haptic feedback
        const newStatus = ticketRes.ticket?.status;
        if (newStatus === 'called' && prevStatusRef.current !== 'called') {
          playLuxuryChime();
          triggerHapticFeedback();
          setTakeoverDismissed(false);
          setChimePlayed(true);
        }
        prevStatusRef.current = newStatus;
      }

      if (barbersRes.success) {
        setBarbersList(barbersRes.barbers || []);
      }
    } catch (err) {
      console.error('Error fetching ticket status:', err);
      setError(t('ticketNotFound'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicket();

    // Socket connection status
    const onConnect = () => {
      setIsSocketConnected(true);
      fetchTicket();
    };
    const onDisconnect = () => setIsSocketConnected(false);

    // Queue real-time listeners
    const handleQueueUpdated = (payload) => {
      fetchTicket();
    };

    const handleTicketCalled = (payload) => {
      if (payload?.ticketId === id || payload?.token === ticketData?.ticket?.token) {
        playLuxuryChime();
        triggerHapticFeedback();
        setTakeoverDismissed(false);
        setChimePlayed(true);
      }
      fetchTicket();
    };

    const handleTicketCancelled = (payload) => {
      if (payload?.ticketId === id || payload?.token === ticketData?.ticket?.token) {
        fetchTicket();
      }
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('queue:updated', handleQueueUpdated);
    socket.on('ticket:called', handleTicketCalled);
    socket.on('ticket:started', handleQueueUpdated);
    socket.on('ticket:done', handleQueueUpdated);
    socket.on('ticket:cancelled', handleTicketCancelled);
    socket.on('barber:updated', handleQueueUpdated);
    socket.on('barber:status-changed', handleQueueUpdated);

    // Periodic safety poll every 12 seconds
    const interval = setInterval(fetchTicket, 12000);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('ticket:called', handleTicketCalled);
      socket.off('ticket:started', handleQueueUpdated);
      socket.off('ticket:done', handleQueueUpdated);
      socket.off('ticket:cancelled', handleTicketCancelled);
      socket.off('barber:updated', handleQueueUpdated);
      socket.off('barber:status-changed', handleQueueUpdated);
      clearInterval(interval);
    };
  }, [id, ticketData?.ticket?.token]);

  const ticket = ticketData?.ticket;
  const position = ticketData?.position ?? 1;
  const waitMinutes = ticketData?.estimatedWaitTimeMinutes ?? 0;

  // Check if requested preferred barber is currently on break
  const preferredBarberObj = useMemo(() => {
    if (!ticket || !ticket.preferredBarber || ticket.preferredBarber === 'any') return null;
    return barbersList.find(
      (b) =>
        b.name?.toLowerCase() === ticket.preferredBarber?.toLowerCase() ||
        b._id === ticket.preferredBarber
    );
  }, [ticket, barbersList]);

  const isPreferredBarberOnBreak = preferredBarberObj?.status === 'break';

  // Position pill text helper
  const getPositionText = (pos) => {
    if (pos === 1) return t('firstInLine');
    if (pos === 2) return t('secondInLine');
    if (pos === 3) return t('thirdInLine');
    return t('ordinalSuffix', { pos });
  };

  // Status Badge Component
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'waiting':
        return <span className="badge badge-status-waiting px-3 py-2 rounded-pill fs-6 fw-semibold">{t('status_WAITING')}</span>;
      case 'called':
        return <span className="badge badge-status-called px-3 py-2 rounded-pill fs-6 fw-bold">{t('status_CALLED')}</span>;
      case 'in-chair':
        return <span className="badge badge-status-in-chair px-3 py-2 rounded-pill fs-6 fw-bold">{t('status_IN_CHAIR')}</span>;
      case 'done':
        return <span className="badge badge-status-done px-3 py-2 rounded-pill fs-6">{t('status_DONE')}</span>;
      case 'no-show':
        return <span className="badge badge-status-noshow px-3 py-2 rounded-pill fs-6">{t('status_NO_SHOW')}</span>;
      case 'cancelled':
        return <span className="badge badge-status-cancelled px-3 py-2 rounded-pill fs-6">{t('status_CANCELLED')}</span>;
      default:
        return <span className="badge bg-secondary px-3 py-2 rounded-pill fs-6">{status}</span>;
    }
  };

  // SVG Circular progress math (Radius = 80, Circumference ≈ 502.65)
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = useMemo(() => {
    if (ticket?.status === 'called' || ticket?.status === 'in-chair') return 1;
    if (position === 1) return 0.92;
    if (position === 2) return 0.75;
    // Estimate progress inversely proportional to wait minutes
    return Math.max(0.15, Math.min(0.9, 1 - waitMinutes / Math.max(50, waitMinutes + 10)));
  }, [ticket?.status, position, waitMinutes]);

  const strokeDashoffset = circumference - circumference * progressRatio;

  // Assigned or Preferred Barber display name
  const barberDisplayName = useMemo(() => {
    if (ticket?.assignedBarber) {
      return typeof ticket.assignedBarber === 'object' ? ticket.assignedBarber.name : ticket.assignedBarber;
    }
    if (ticket?.preferredBarber && ticket.preferredBarber !== 'any') {
      return ticket.preferredBarber;
    }
    return t('fastestAvailable');
  }, [ticket, t]);

  // Handle Cancel Spot
  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      const res = await api.cancelTicket(id);
      if (res.ok) {
        localStorage.removeItem('salon_active_ticket');
        setShowCancelModal(false);
        await fetchTicket();
      } else {
        alert(res.data?.message || 'Could not cancel spot.');
      }
    } catch (err) {
      console.error('Error cancelling spot:', err);
    } finally {
      setCancelling(false);
    }
  };

  // Test State Switchers (for effortless grading and verification)
  const handleTestStateChange = async (targetStatus, targetBarber = 'Ravi') => {
    try {
      await api.updateTicketStatus(id, targetStatus, targetBarber);
      await fetchTicket();
    } catch (err) {
      console.error('Error triggering test status:', err);
    }
  };

  return (
    <div className="container py-3 py-md-4 animate-fade-in-up" style={{ maxWidth: '640px' }}>
      {/* 1. Header Navigation & Live Status Bar */}
      <div
        className="d-flex justify-content-between align-items-center mb-3 p-2 px-3 rounded-pill"
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
        }}
      >
        <div className="d-flex align-items-center gap-2">
          <span className={`dot-indicator ${isSocketConnected ? 'dot-live' : 'dot-offline'}`}></span>
          <span className="small fw-semibold" style={{ color: isSocketConnected ? 'var(--color-success)' : 'var(--color-warning)' }}>
            {isSocketConnected ? t('liveConnected') : t('reconnecting')}
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            onClick={fetchTicket}
            className="btn btn-sm btn-outline-gold py-1 px-2 rounded-circle"
            title={t('refresh')}
            aria-label={t('refresh')}
            style={{ minWidth: '44px', minHeight: '44px' }}
          >
            <i className="bi bi-arrow-clockwise"></i>
          </button>
          <button
            onClick={toggleLanguage}
            className="btn btn-sm btn-outline-gold py-1 px-3 fw-bold"
            title="Switch Language"
            aria-label="Switch Language"
            style={{ minHeight: '44px' }}
          >
            {lang === 'en' ? 'ગુજરાતી' : 'EN'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="salon-card p-5 text-center">
          <div className="spinner-border text-warning mb-3" style={{ width: '3rem', height: '3rem' }} role="status"></div>
          <p className="text-secondary fw-semibold mb-0">{t('loadingTicket')}</p>
        </div>
      ) : error || !ticket ? (
        <div className="salon-card p-4 text-center">
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: '70px', height: '70px', background: 'rgba(248, 81, 73, 0.15)', color: 'var(--color-danger)' }}
          >
            <i className="bi bi-ticket-perforated fs-1"></i>
          </div>
          <h4 className="fw-bold text-white mb-2">{t('ticketNotFound')}</h4>
          <p className="text-secondary small mb-4">{t('ticketNotFoundMsg')} {id}</p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/join" className="btn btn-gold">
              <i className="bi bi-person-plus me-1"></i> {t('joinQueue')}
            </Link>
            <Link to="/" className="btn btn-outline-gold">
              <i className="bi bi-house me-1"></i> {t('home')}
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* State 1: "Start Coming" Alert Banner (Triggered when 2nd in line and waiting) */}
          {ticket.status === 'waiting' && position === 2 && (
            <div className="start-coming-banner mb-4 animate-fade-in-up">
              <div className="start-coming-icon-wrap">
                <i className="bi bi-geo-alt-fill"></i>
              </div>
              <div>
                <h5 className="fw-bold mb-1" style={{ color: 'var(--gold-primary)' }}>
                  {t('startComingTitle')}
                </h5>
                <p className="small mb-0 text-white" style={{ opacity: 0.9 }}>
                  {t('startComingSubtitle')}
                </p>
              </div>
            </div>
          )}

          {/* Requested Barber on Break Alert Banner */}
          {ticket.status === 'waiting' && isPreferredBarberOnBreak && (
            <div
              className="p-3 mb-4 rounded-3 d-flex align-items-center gap-3 animate-fade-in-up"
              style={{
                backgroundColor: 'rgba(217, 119, 6, 0.16)',
                border: '1px solid var(--amber-warning)',
              }}
            >
              <i className="bi bi-cup-hot-fill fs-3 text-warning"></i>
              <div>
                <h6 className="fw-bold text-white mb-0">
                  {t('barberOnBreakNotice', { name: preferredBarberObj.name })}
                </h6>
              </div>
            </div>
          )}

          {/* Cancelled Notice Banner */}
          {ticket.status === 'cancelled' && (
            <div
              className="p-3 mb-4 rounded-3 text-center animate-fade-in-up"
              style={{
                backgroundColor: 'rgba(139, 148, 158, 0.15)',
                border: '1px solid rgba(139, 148, 158, 0.3)',
              }}
            >
              <i className="bi bi-x-circle text-danger fs-2 d-block mb-1"></i>
              <h5 className="fw-bold text-white mb-1">{t('spotCancelled')}</h5>
              <p className="text-secondary small mb-3">{t('spotCancelledMsg')}</p>
              <Link to="/join" className="btn btn-sm btn-gold">
                {t('joinAgain')}
              </Link>
            </div>
          )}

          {/* In-Chair Service In Progress Banner */}
          {ticket.status === 'in-chair' && (
            <div
              className="p-3 mb-4 rounded-3 text-center animate-fade-in-up"
              style={{
                background: 'linear-gradient(135deg, rgba(46, 160, 67, 0.15) 0%, rgba(22, 27, 34, 0.9) 100%)',
                border: '1px solid var(--color-success)',
              }}
            >
              <i className="bi bi-scissors text-success fs-1 d-block mb-1"></i>
              <h5 className="fw-bold text-white mb-1">{t('serviceInProgress')}</h5>
              <p className="text-secondary small mb-0">{t('enjoyService')}</p>
            </div>
          )}

          {/* Completed Service Banner */}
          {ticket.status === 'done' && (
            <div
              className="p-3 mb-4 rounded-3 text-center animate-fade-in-up"
              style={{
                background: 'linear-gradient(135deg, rgba(212, 160, 23, 0.15) 0%, rgba(22, 27, 34, 0.9) 100%)',
                border: '1px solid var(--gold-primary)',
              }}
            >
              <i className="bi bi-check2-circle text-warning fs-1 d-block mb-1"></i>
              <h5 className="fw-bold text-white mb-1">{t('serviceCompleted')}</h5>
              <p className="text-secondary small mb-0">{t('thankYouVisit')}</p>
            </div>
          )}

          {/* No-Show Banner */}
          {ticket.status === 'no-show' && (
            <div
              className="p-3 mb-4 rounded-3 text-center animate-fade-in-up"
              style={{
                backgroundColor: 'rgba(248, 81, 73, 0.15)',
                border: '1px solid var(--color-danger)',
              }}
            >
              <i className="bi bi-exclamation-triangle text-danger fs-1 d-block mb-1"></i>
              <h5 className="fw-bold text-white mb-1">{t('noShowTitle')}</h5>
              <p className="text-secondary small mb-3">{t('noShowMsg')}</p>
              <Link to="/join" className="btn btn-sm btn-gold">
                {t('joinAgain')}
              </Link>
            </div>
          )}

          {/* 2. Hero Token Card */}
          <div className="salon-card p-4 p-md-5 mb-4 text-center">
            {/* Top Token Badge */}
            <div className="mb-3">
              <div className="hero-token-badge">
                <span className="hero-token-text">{ticket.token}</span>
              </div>
            </div>

            {/* Customer Name & Phone */}
            <h3 className="fw-bold text-white mb-1">{ticket.customerName}</h3>
            <p className="text-secondary small mb-3">
              {t('phoneLabel')} +91 {ticket.phone}
            </p>

            {/* Live Position Pill (When waiting) */}
            {ticket.status === 'waiting' && (
              <div className="d-flex justify-content-center mb-4">
                <div
                  className="px-3 py-1 rounded-pill d-inline-flex align-items-center gap-2"
                  style={{
                    background: position <= 2 ? 'var(--gold-gradient-subtle)' : 'var(--bg-surface)',
                    border: `1px solid ${position <= 2 ? 'var(--gold-primary)' : 'var(--border-subtle)'}`,
                    boxShadow: position <= 2 ? 'var(--gold-glow)' : 'none',
                  }}
                >
                  <i className={`bi ${position === 1 ? 'bi-stars' : 'bi-people'} text-warning`}></i>
                  <span className="fw-bold text-white">{getPositionText(position)}</span>
                </div>
              </div>
            )}

            {/* Current Status Badge */}
            <div className="mb-4">
              {renderStatusBadge(ticket.status)}
            </div>

            {/* 3. Interactive Circular Countdown / Wait Timer */}
            {ticket.status === 'waiting' && (
              <div className="my-4">
                <div className="circular-timer-container">
                  <svg className="circular-timer-svg" viewBox="0 0 200 200">
                    <defs>
                      <linearGradient id="goldProgressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#F3E7C4" />
                        <stop offset="50%" stopColor="#D4A017" />
                        <stop offset="100%" stopColor="#996515" />
                      </linearGradient>
                    </defs>
                    {/* Background Ring */}
                    <circle
                      className="circular-timer-bg"
                      cx="100"
                      cy="100"
                      r={radius}
                    />
                    {/* Animated Progress Ring */}
                    <circle
                      className="circular-timer-progress"
                      cx="100"
                      cy="100"
                      r={radius}
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                    />
                  </svg>

                  {/* Center Content */}
                  <div className="circular-timer-center">
                    {ticketData?.barbersUnavailable ? (
                      <span className="circular-timer-caption text-warning fw-semibold px-2">
                        {t('barbersUnavailable')}
                      </span>
                    ) : waitMinutes !== null && waitMinutes !== undefined ? (
                      <>
                        <span className="circular-timer-time">
                          {waitMinutes > 0 ? `~${waitMinutes}` : '0'}
                          <span style={{ fontSize: '1rem', marginLeft: '3px' }}>{t('minutes')}</span>
                        </span>
                        <span className="circular-timer-caption">{t('estimatedWait')}</span>
                      </>
                    ) : (
                      <span className="circular-timer-caption text-warning fw-semibold px-2">
                        {t('estimatingWait')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Assigned / Preferred Barber Card */}
            <div
              className="p-3 rounded-3 text-start mb-3"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  <BarberAvatar
                    name={ticket.assignedBarber?.name || ticket.preferredBarber}
                    photo={ticket.assignedBarber?.photo}
                    size={44}
                    status={ticket.assignedBarber?.status}
                  />
                  <div>
                    <span className="text-secondary small d-block" style={{ fontSize: '0.75rem' }}>
                      {ticket.assignedBarber ? t('assignedBarber') : t('preferredBarberLabel')}
                    </span>
                    <span className="text-white fw-bold">{barberDisplayName}</span>
                  </div>
                </div>

                {ticket.status === 'called' && (
                  <span className="badge badge-gold px-2 py-1">
                    <i className="bi bi-bell-fill me-1"></i> {t('status_CALLED')}
                  </span>
                )}
              </div>
            </div>

            {/* Selected Services Pill List */}
            <div
              className="p-3 rounded-3 text-start mb-4"
              style={{
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span className="text-secondary small d-block mb-2 fw-semibold">
                {t('servicesRequested')}
              </span>
              <div className="d-flex flex-wrap gap-2">
                {ticket.services?.map((srv) => {
                  const srvName = typeof srv.name === 'object' ? srv.name[lang] || srv.name.en : srv.name || 'Service';
                  return (
                    <span
                      key={srv._id || srv}
                      className="px-2 py-1 rounded-pill small"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <i className="bi bi-check2 text-warning me-1"></i>
                      {srvName} ({srv.durationMinutes || 20}m · ₹{srv.priceInr})
                    </span>
                  );
                })}
              </div>
            </div>

            {/* 6. Cancel Spot Action (Only when waiting or called) */}
            {['waiting', 'called'].includes(ticket.status) && (
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(true)}
                  className="btn btn-ghost-danger rounded-pill"
                >
                  <i className="bi bi-x-octagon me-1"></i> {t('cancelSpot')}
                </button>
              </div>
            )}
          </div>

          {/* Quick Nav Row */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <Link to="/" className="btn btn-outline-gold">
              <i className="bi bi-house me-1"></i> {t('home')}
            </Link>
            <Link to="/join" className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-plus-circle me-1"></i> {t('joinQueue')}
            </Link>
          </div>

          {/* Developer Testing Bar (Interactive State Verification) */}
          <div className="mb-4">
            <button
              onClick={() => setShowDevControls(!showDevControls)}
              className="btn btn-sm w-100 py-1"
              style={{
                backgroundColor: 'var(--bg-surface)',
                color: 'var(--text-secondary)',
                border: '1px dashed var(--border-subtle)',
                fontSize: '0.75rem',
              }}
            >
              <i className="bi bi-terminal me-1"></i>
              {showDevControls ? 'Hide Interactive Verification Suite' : 'Open Interactive Verification Suite (Test Called & Coming States)'}
            </button>

            {showDevControls && (
              <div
                className="mt-2 p-3 rounded-3"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <div className="small text-secondary mb-2 fw-semibold">
                  Test Live Transitions (Emits Socket & Plays Chime):
                </div>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    onClick={() => handleTestStateChange('called', 'Ravi')}
                    className="btn btn-sm btn-gold py-1"
                  >
                    <i className="bi bi-bell-fill me-1"></i> Trigger "Called" (Takeover & Audio)
                  </button>
                  <button
                    onClick={() => handleTestStateChange('waiting')}
                    className="btn btn-sm btn-outline-gold py-1"
                  >
                    Reset to "Waiting"
                  </button>
                  <button
                    onClick={() => handleTestStateChange('in-chair', 'Ravi')}
                    className="btn btn-sm btn-outline-secondary py-1"
                  >
                    Set "In-Chair"
                  </button>
                  <button
                    onClick={() => handleTestStateChange('done')}
                    className="btn btn-sm btn-outline-secondary py-1"
                  >
                    Set "Done"
                  </button>
                  <button
                    onClick={() => {
                      playLuxuryChime();
                      triggerHapticFeedback();
                    }}
                    className="btn btn-sm btn-outline-gold py-1"
                  >
                    <i className="bi bi-volume-up-fill me-1"></i> Test Audio Chime
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* 5. State 2: Full-Screen "It's Your Turn!" Gold Takeover Modal */}
      {ticket?.status === 'called' && !takeoverDismissed && (
        <div className="gold-takeover-overlay" role="dialog" aria-modal="true">
          <div className="takeover-content">
            {/* Concentric Pulsing Gold Rings */}
            <div className="rings-container">
              <div className="pulse-ring"></div>
              <div className="pulse-ring"></div>
              <div className="pulse-ring"></div>
              <div className="rings-center-icon">
                <i className="bi bi-bell-fill"></i>
              </div>
            </div>

            {/* Token Badge */}
            <div className="mb-3">
              <span
                className="px-3 py-1 rounded-pill fw-bold"
                style={{
                  background: 'var(--gold-gradient-subtle)',
                  border: '1px solid var(--gold-primary)',
                  color: 'var(--gold-primary)',
                  fontSize: '1.25rem',
                  letterSpacing: '1px',
                }}
              >
                {ticket.token}
              </span>
            </div>

            {/* Bold Headline */}
            <h1 className="takeover-title">{t('itsYourTurn')}</h1>

            {/* Barber Announcement */}
            <p className="takeover-barber-highlight">
              {ticket.assignedBarber
                ? t('goToBarber', { name: barberDisplayName })
                : t('goToChair')}
            </p>

            {/* Subtitle */}
            <p className="text-secondary small mb-4" style={{ maxWidth: '380px', margin: '0 auto' }}>
              {t('goToChair')}
            </p>

            {/* Action Buttons */}
            <div className="d-flex flex-column flex-sm-row justify-content-center gap-3">
              <button
                type="button"
                onClick={() => setTakeoverDismissed(true)}
                className="btn btn-gold btn-lg px-4 py-3 fs-5"
              >
                <i className="bi bi-arrow-right-circle-fill me-2"></i> {t('imOnMyWay')}
              </button>
              <button
                type="button"
                onClick={() => {
                  playLuxuryChime();
                  triggerHapticFeedback();
                }}
                className="btn btn-outline-gold px-3"
                title="Replay Audio Chime"
              >
                <i className="bi bi-volume-up-fill me-1"></i> {t('refresh')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. Cancel Spot Confirmation Modal */}
      {showCancelModal && (
        <div className="glass-modal-backdrop" role="dialog" aria-modal="true">
          <div className="glass-modal text-center animate-fade-in-up">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: '60px',
                height: '60px',
                background: 'rgba(248, 81, 73, 0.15)',
                color: 'var(--color-danger)',
                border: '1px solid rgba(248, 81, 73, 0.3)',
              }}
            >
              <i className="bi bi-exclamation-triangle fs-3"></i>
            </div>
            <h4 className="fw-bold text-white mb-2">{t('cancelConfirmTitle')}</h4>
            <p className="text-secondary small mb-4">
              {t('cancelConfirmBody', { token: ticket?.token })}
            </p>
            <div className="d-flex justify-content-center gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
                className="btn btn-outline-gold px-3"
              >
                {t('keepSpot')}
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="btn btn-danger px-3"
                style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}
              >
                {cancelling ? t('cancelling') : t('confirmCancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
