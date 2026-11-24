import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { BarberAvatar } from '../components/BarberAvatar';

/**
 * Screen 5: Barber View (/barber/:name)
 * Ergonomic, mobile-first styling console with large 48px+ tap targets,
 * live elapsed service timer, one-tap break toggle, and real-time chair lifecycle.
 */
export const BarberView = () => {
  const { name: currentParamName } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();

  const [barbers, setBarbers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [actionLoading, setActionLoading] = useState(false);

  // Digital timer tick every 1000ms
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Barber Station Data
  const fetchBarberStationData = async () => {
    try {
      const [barbersRes, queueRes] = await Promise.all([
        api.getBarbers(),
        api.getQueue('all'),
      ]);

      if (barbersRes.success) setBarbers(barbersRes.barbers || []);
      if (queueRes.success) setTickets(queueRes.tickets || []);
    } catch (err) {
      console.error('Error fetching barber station data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBarberStationData();

    const handleQueueUpdated = () => fetchBarberStationData();
    const handleBarberUpdated = () => fetchBarberStationData();

    socket.on('connect', handleQueueUpdated);
    socket.on('queue:updated', handleQueueUpdated);
    socket.on('ticket:called', handleQueueUpdated);
    socket.on('ticket:started', handleQueueUpdated);
    socket.on('ticket:done', handleQueueUpdated);
    socket.on('ticket:cancelled', handleQueueUpdated);
    socket.on('ticket:no-show', handleQueueUpdated);
    socket.on('barber:updated', handleBarberUpdated);
    socket.on('barber:status-changed', handleBarberUpdated);

    const interval = setInterval(fetchBarberStationData, 10000);

    return () => {
      socket.off('connect', handleQueueUpdated);
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('ticket:called', handleQueueUpdated);
      socket.off('ticket:started', handleQueueUpdated);
      socket.off('ticket:done', handleQueueUpdated);
      socket.off('ticket:cancelled', handleQueueUpdated);
      socket.off('ticket:no-show', handleQueueUpdated);
      socket.off('barber:updated', handleBarberUpdated);
      socket.off('barber:status-changed', handleBarberUpdated);
      clearInterval(interval);
    };
  }, []);

  const triggerNotice = (msg, isError = false) => {
    setActionNotice({ message: msg, isError });
    setTimeout(() => setActionNotice(null), 4500);
  };

  // Determine active selected barber matching the URL parameter
  const activeBarber = useMemo(() => {
    if (!barbers.length) return null;
    const match = barbers.find(
      (b) => b.name?.toLowerCase() === currentParamName?.toLowerCase()
    );
    return match || barbers[0];
  }, [barbers, currentParamName]);

  // Current customer in chair or called for this barber
  const activeCustomer = useMemo(() => {
    if (!activeBarber) return null;
    return tickets.find(
      (t) =>
        t.assignedBarber &&
        (t.assignedBarber._id === activeBarber._id ||
          t.assignedBarber === activeBarber._id ||
          t.assignedBarber.name?.toLowerCase() === activeBarber.name?.toLowerCase()) &&
        ['called', 'in-chair'].includes(t.status)
    );
  }, [tickets, activeBarber]);

  // Upcoming waiting tickets eligible for this barber (FIFO)
  // Eligible: preferredBarber == 'any' OR matches activeBarber.name OR activeBarber._id
  const upNextList = useMemo(() => {
    if (!activeBarber) return [];
    return tickets.filter((t) => {
      if (t.status !== 'waiting') return false;
      const pref = String(t.preferredBarber || '').toLowerCase().trim();
      const barberNameLower = String(activeBarber.name || '').toLowerCase().trim();
      const barberIdStr = String(activeBarber._id || '');
      return pref === 'any' || pref === barberNameLower || pref === barberIdStr;
    });
  }, [tickets, activeBarber]);

  // First waiting customer preview ("Next for You")
  const nextPreviewCustomer = useMemo(() => {
    return upNextList.length > 0 ? upNextList[0] : null;
  }, [upNextList]);

  // --- ACTIONS ---

  // 1. Toggle Break (POST /api/barbers/:name/toggle-break)
  const handleToggleBreak = async () => {
    if (!activeBarber) return;
    setActionLoading(true);
    try {
      const res = await api.toggleBarberBreak(activeBarber.name || activeBarber._id);
      if (res.ok && res.data.success) {
        const isNowBreak = res.data.barber?.status === 'break';
        triggerNotice(
          isNowBreak
            ? `${activeBarber.name} is now On Break.`
            : `${activeBarber.name} is now Available.`
        );
        fetchBarberStationData();
      } else {
        triggerNotice(res.data?.message || 'Error updating break status.', true);
      }
    } catch (err) {
      console.error('Error toggling break:', err);
      triggerNotice('Network error updating break status.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Start Service (POST /api/queue/:id/start) -> transitions from 'called' to 'in-chair'
  const handleStartService = async (ticketId) => {
    setActionLoading(true);
    try {
      const res = await api.startService(ticketId);
      if (res.ok && res.data.success) {
        triggerNotice(`Customer seated! Service started for ${res.data.ticket.token}.`);
        fetchBarberStationData();
      } else {
        triggerNotice(res.data?.message || 'Failed to start service.', true);
      }
    } catch (err) {
      console.error('Error starting service:', err);
      triggerNotice('Network error starting service.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Mark Service Complete (POST /api/queue/:id/done) -> marks 'done' & frees barber chair
  const handleCompleteService = async (ticketId) => {
    setActionLoading(true);
    try {
      const res = await api.completeService(ticketId);
      if (res.ok && res.data.success) {
        triggerNotice(`Service completed for ${res.data.ticket.token}. Chair is now free!`);
        fetchBarberStationData();
      } else {
        triggerNotice(res.data?.message || 'Failed to complete service.', true);
      }
    } catch (err) {
      console.error('Error completing service:', err);
      triggerNotice('Network error completing service.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Call Next Customer (POST /api/queue/call-next)
  const handleCallNext = async () => {
    if (!activeBarber) return;
    setActionLoading(true);
    try {
      const res = await api.callNext(activeBarber._id);
      if (res.ok && res.data.success) {
        triggerNotice(`Called ${res.data.ticket.token} (${res.data.ticket.customerName})!`);
        fetchBarberStationData();
      } else if (res.data?.noMatch) {
        triggerNotice(t('noMatchingCustomer'), true);
      } else {
        triggerNotice(res.data?.message || 'Unable to call next customer.', true);
      }
    } catch (err) {
      console.error('Error calling next:', err);
      triggerNotice('Network error calling next customer.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // Running elapsed timer display formatted as MM:SS (or HH:MM:SS)
  const getElapsedString = (timestamp) => {
    if (!timestamp) return '00:00';
    const totalSeconds = Math.max(0, Math.floor((currentTime - new Date(timestamp)) / 1000));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    if (mins >= 60) {
      const hrs = Math.floor(mins / 60);
      const remMins = mins % 60;
      return `${hrs}h ${remMins < 10 ? '0' : ''}${remMins}m ${secs < 10 ? '0' : ''}${secs}s`;
    }
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isOnBreak = activeBarber?.status === 'break';
  const isBusy = activeBarber?.status === 'busy' || !!activeCustomer;

  return (
    <div className="container py-3 py-md-4 px-2 px-sm-3" style={{ maxWidth: '960px' }}>
      {/* Toast Notice Banner */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`alert ${
              actionNotice.isError ? 'alert-danger' : 'alert-success'
            } d-flex align-items-center justify-content-between mb-3 rounded-4 shadow-lg`}
            style={{
              backgroundColor: actionNotice.isError ? 'rgba(248, 81, 73, 0.18)' : 'rgba(46, 160, 67, 0.18)',
              borderColor: actionNotice.isError ? 'var(--color-danger)' : 'var(--color-success)',
              color: actionNotice.isError ? '#FFA49E' : '#7EE787',
              minHeight: '48px',
            }}
          >
            <div className="d-flex align-items-center gap-2">
              <i className={`bi ${actionNotice.isError ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill'} fs-5`}></i>
              <span className="fw-semibold">{actionNotice.message}</span>
            </div>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={() => setActionNotice(null)}
              aria-label="Close"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Station Switcher Tabs (Seamless Ergonomic Barber Selection) */}
      <div
        className="d-flex align-items-center gap-2 p-2 mb-3 rounded-4 overflow-auto"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <span className="small text-secondary px-2 d-none d-sm-inline fw-semibold text-uppercase" style={{ fontSize: '0.75rem', letterSpacing: '0.08em' }}>
          Stations:
        </span>
        {barbers.map((b) => {
          const isSelected = activeBarber?._id === b._id;
          return (
            <button
              key={b._id}
              type="button"
              onClick={() => navigate(`/barber/${b.name}`)}
              className={`btn d-flex align-items-center gap-2 px-3 py-2 ${
                isSelected ? 'btn-gold shadow-sm' : 'btn-outline-secondary'
              }`}
              style={{
                borderRadius: '12px',
                minHeight: '48px',
                flexShrink: 0,
              }}
            >
              <BarberAvatar name={b.name} photo={b.photo} size="xs" status={b.status} active={isSelected} />
              <span className="fw-semibold">{b.name}</span>
              {b.status === 'break' && (
                <span className="badge bg-warning text-dark px-1 py-0 small" style={{ fontSize: '0.68rem' }}>
                  Break
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 1. Barber Header Card */}
      {activeBarber && (
        <motion.div
          className="salon-card p-3 p-md-4 mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'linear-gradient(180deg, rgba(22, 22, 28, 0.95) 0%, rgba(14, 14, 18, 0.98) 100%)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
            {/* Left: Vector Avatar & Identity */}
            <div className="d-flex align-items-center gap-3">
              <BarberAvatar
                name={activeBarber.name}
                photo={activeBarber.photo}
                size="lg"
                status={activeBarber.status}
                active={isBusy}
              />
              <div>
                <div className="d-flex align-items-center gap-2 mb-1">
                  <h2 className="salon-heading mb-0 text-white" style={{ fontSize: '1.65rem' }}>
                    Barber {activeBarber.name}
                  </h2>
                  <span
                    className={`badge ${
                      isOnBreak
                        ? 'badge-status-waiting'
                        : isBusy
                        ? 'badge-status-in-chair'
                        : 'badge-accent'
                    } px-2 py-1 rounded-pill small`}
                  >
                    {isOnBreak ? t('barber_break') : isBusy ? t('barber_busy') : t('barber_free')}
                  </span>
                </div>
                <div className="d-flex align-items-center gap-2 small text-secondary">
                  <span>{t('stationConsole')}</span>
                  <span>•</span>
                  <span style={{ color: 'var(--accent-color)', fontFamily: 'monospace' }}>
                    {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Break Toggle Button (Prominent 48px+ tap target) */}
            <div>
              <button
                type="button"
                onClick={handleToggleBreak}
                disabled={actionLoading || !!activeCustomer}
                className={`btn d-inline-flex align-items-center justify-content-center gap-2 px-4 py-2 fw-semibold ${
                  isOnBreak
                    ? 'btn-gold shadow-sm'
                    : 'btn-outline-secondary'
                }`}
                style={{
                  minHeight: '48px',
                  borderRadius: '12px',
                  minWidth: '160px',
                }}
                title={
                  activeCustomer
                    ? 'Please finish the current customer before taking a break.'
                    : isOnBreak
                    ? 'Click to end break and set status to Available'
                    : 'Click to take a break'
                }
              >
                <i className={`bi ${isOnBreak ? 'bi-play-circle-fill text-success fs-5' : 'bi-pause-circle-fill text-warning fs-5'}`}></i>
                <span>{isOnBreak ? t('barberFreeToggle') : t('barberBreakToggle')}</span>
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 2. Active Customer in Chair Card / Empty State */}
      <motion.div
        className="salon-card p-3 p-sm-4 mb-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        style={{
          background: activeCustomer
            ? activeCustomer.status === 'in-chair'
              ? 'linear-gradient(180deg, rgba(20, 24, 22, 0.96) 0%, rgba(12, 14, 13, 0.98) 100%)'
              : 'linear-gradient(180deg, rgba(20, 22, 28, 0.96) 0%, rgba(12, 13, 17, 0.98) 100%)'
            : 'var(--bg-card)',
          border: activeCustomer
            ? activeCustomer.status === 'in-chair'
              ? '1px solid rgba(46, 160, 67, 0.5)'
              : '1px solid rgba(56, 189, 248, 0.5)'
            : '1px solid var(--border-color)',
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
          <div className="d-flex align-items-center gap-2">
            <i
              className={`bi ${activeCustomer ? 'bi-person-check-fill' : 'bi-chair'} fs-4`}
              style={{ color: 'var(--accent-color)' }}
            ></i>
            <h3 className="salon-heading mb-0 text-white" style={{ fontSize: '1.35rem' }}>
              {activeCustomer ? t('activeInChair') : t('chairFree')}
            </h3>
          </div>
          {activeCustomer ? (
            <span
              className={`badge ${
                activeCustomer.status === 'in-chair'
                  ? 'badge-status-in-chair'
                  : 'badge-status-called'
              } px-3 py-1 rounded-pill fs-6`}
            >
              {activeCustomer.status === 'in-chair' ? t('status_IN_CHAIR') : t('status_CALLED')}
            </span>
          ) : (
            <span className="badge badge-accent px-3 py-1 rounded-pill">Chair Free</span>
          )}
        </div>

        {activeCustomer ? (
          <div>
            {/* Customer Header & Live Running Elapsed Timer */}
            <div className="d-flex flex-wrap justify-content-between align-items-center mb-3 p-3 rounded-4" style={{ backgroundColor: 'rgba(8, 8, 10, 0.75)', border: '1px solid var(--border-color)' }}>
              <div className="d-flex align-items-center gap-3">
                <span
                  className="px-3 py-1 rounded-3 fw-bold text-center"
                  style={{
                    fontFamily: "'Fraunces', serif",
                    background: 'var(--gold-gradient-subtle)',
                    border: '1.5px solid var(--accent-color)',
                    color: 'var(--accent-color)',
                    fontSize: '1.45rem',
                    minWidth: '75px',
                  }}
                >
                  {activeCustomer.token}
                </span>
                <div>
                  <h4 className="salon-heading text-white mb-0" style={{ fontSize: '1.4rem' }}>
                    {activeCustomer.customerName}
                  </h4>
                  <span className="text-secondary small">
                    <i className="bi bi-telephone me-1"></i> +91 {activeCustomer.phone}
                  </span>
                </div>
              </div>

              {/* Running Elapsed Timer */}
              <div className="text-end mt-2 mt-sm-0">
                <span className="small d-block text-secondary text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
                  {activeCustomer.status === 'in-chair' ? 'Elapsed Service Time' : 'Time Since Called'}
                </span>
                <span
                  className="fw-bold"
                  style={{
                    fontFamily: "'Jost', monospace",
                    color: 'var(--accent-color)',
                    fontSize: '1.75rem',
                    letterSpacing: '1px',
                  }}
                >
                  {getElapsedString(activeCustomer.inChairAt || activeCustomer.calledAt)}
                </span>
              </div>
            </div>

            {/* Selected Services Pill List */}
            <div className="mb-4">
              <span className="small text-secondary d-block mb-2 fw-semibold">Services Requested:</span>
              <div className="d-flex flex-wrap gap-2">
                {activeCustomer.services?.map((s) => (
                  <span
                    key={s._id || s}
                    className="badge px-3 py-2 rounded-pill d-inline-flex align-items-center gap-2"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)',
                      fontSize: '0.88rem',
                    }}
                  >
                    <i className="bi bi-scissors text-warning"></i>
                    <span>{s.name?.[lang] || s.name?.en || s.name}</span>
                    <span className="text-secondary small">({s.durationMinutes}m · ₹{s.priceInr})</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons (Strict Minimum 48px Tap Targets) */}
            <div className="d-flex flex-column gap-2 pt-2">
              {activeCustomer.status === 'called' ? (
                <button
                  type="button"
                  onClick={() => handleStartService(activeCustomer._id)}
                  disabled={actionLoading}
                  className="btn btn-gold py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-lg"
                  style={{
                    minHeight: '52px',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                  }}
                >
                  <i className="bi bi-play-fill fs-4"></i>
                  <span>{t('startService')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleCompleteService(activeCustomer._id)}
                  disabled={actionLoading}
                  className="btn btn-gold py-3 fw-bold d-flex align-items-center justify-content-center gap-2 shadow-lg"
                  style={{
                    minHeight: '52px',
                    borderRadius: '12px',
                    fontSize: '1.1rem',
                  }}
                >
                  <i className="bi bi-check2-circle fs-4"></i>
                  <span>{t('markDone')}</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Empty State: Elegant illustration with exact specified text */
          <div className="text-center py-5">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: '76px',
                height: '76px',
                background: 'rgba(229, 195, 120, 0.1)',
                border: '1px dashed var(--accent-color)',
              }}
            >
              <i className="bi bi-scissors fs-1" style={{ color: 'var(--accent-color)' }}></i>
            </div>
            <h5 className="text-white mb-2" style={{ fontSize: '1.25rem' }}>
              {t('noCustomerInChairState')}
            </h5>
            <p className="text-secondary small mb-4 mx-auto" style={{ maxWidth: '440px' }}>
              {t('chairVacantCalling')}
            </p>

            <button
              type="button"
              onClick={handleCallNext}
              disabled={actionLoading || upNextList.length === 0 || isOnBreak}
              className="btn btn-gold px-4 py-3 fw-bold d-inline-flex align-items-center justify-content-center gap-2 shadow-lg"
              style={{
                minHeight: '48px',
                borderRadius: '12px',
                minWidth: '220px',
              }}
            >
              <i className="bi bi-megaphone-fill fs-5"></i>
              <span>{t('callNextCustomer')} ({upNextList.length})</span>
            </button>
          </div>
        )}
      </motion.div>

      {/* 3. "Next for You" Preview Card */}
      <motion.div
        className="salon-card p-3 p-md-4 mb-3"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-hourglass-split fs-4" style={{ color: 'var(--accent-color)' }}></i>
            <h4 className="salon-heading mb-0 text-white" style={{ fontSize: '1.2rem' }}>
              Next for You
            </h4>
          </div>
          <span className="badge badge-accent px-3 py-1 rounded-pill small">
            {upNextList.length} in Queue
          </span>
        </div>

        {nextPreviewCustomer ? (
          <div>
            {/* Highlighted Banner for Next Customer */}
            <div
              className="p-3 rounded-4 mb-3 d-flex flex-wrap justify-content-between align-items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, rgba(229, 195, 120, 0.12) 0%, rgba(14, 14, 18, 0.8) 100%)',
                border: '1px solid rgba(229, 195, 120, 0.4)',
              }}
            >
              <div className="d-flex align-items-center gap-3">
                <span
                  className="px-2 py-1 rounded-3 fw-bold text-center"
                  style={{
                    background: 'rgba(229, 195, 120, 0.18)',
                    border: '1px solid var(--accent-color)',
                    color: 'var(--accent-color)',
                    fontSize: '1.15rem',
                    minWidth: '60px',
                  }}
                >
                  {nextPreviewCustomer.token}
                </span>
                <div>
                  <div className="fw-semibold text-white fs-5">{nextPreviewCustomer.customerName}</div>
                  <small style={{ color: 'var(--text-secondary)' }}>
                    {nextPreviewCustomer.services?.map((s) => s.name?.[lang] || s.name?.en || s.name).join(', ')}
                    {' · '}
                    {nextPreviewCustomer.services?.reduce((acc, s) => acc + (s.durationMinutes || 0), 0)} min
                  </small>
                </div>
              </div>

              <div className="text-end">
                {nextPreviewCustomer.preferredBarber?.toLowerCase() === activeBarber?.name?.toLowerCase() ? (
                  <span className="badge badge-accent px-2 py-1" style={{ fontSize: '0.75rem' }}>
                    <i className="bi bi-star-fill me-1"></i> Requested You
                  </span>
                ) : (
                  <span className="badge px-2 py-1" style={{ background: 'rgba(255, 255, 255, 0.08)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                    {t('fastestAvailable')}
                  </span>
                )}
                <div className="small text-secondary mt-1">1st in your line</div>
              </div>
            </div>

            {/* Upcoming Customers Accordion/List */}
            {upNextList.length > 1 && (
              <div className="d-flex flex-column gap-2">
                <span className="small text-secondary fw-semibold">Upcoming After:</span>
                {upNextList.slice(1, 5).map((ticket, index) => {
                  const isSpecific =
                    ticket.preferredBarber?.toLowerCase() === activeBarber?.name?.toLowerCase();
                  return (
                    <div
                      key={ticket._id}
                      className="p-2 px-3 rounded-3 d-flex align-items-center justify-content-between"
                      style={{
                        backgroundColor: 'rgba(8, 8, 10, 0.6)',
                        border: '1px solid var(--border-color)',
                      }}
                    >
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold small" style={{ color: 'var(--accent-color)', minWidth: '48px' }}>
                          {ticket.token}
                        </span>
                        <span className="text-white small fw-medium">{ticket.customerName}</span>
                        <span className="text-secondary small d-none d-sm-inline">
                          ({ticket.services?.map((s) => s.name?.[lang] || s.name?.en || s.name).join(', ')})
                        </span>
                      </div>
                      <div className="small text-secondary">
                        {isSpecific ? (
                          <span className="text-warning">Requested You</span>
                        ) : (
                          <span>Any Barber</span>
                        )}
                        {' · '}Line #{index + 2}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-secondary small">
            <i className="bi bi-check2-circle fs-3 text-success d-block mb-1"></i>
            No customers waiting for {activeBarber?.name} or Any Barber right now.
          </div>
        )}
      </motion.div>
    </div>
  );
};
