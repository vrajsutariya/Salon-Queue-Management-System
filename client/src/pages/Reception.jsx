import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { BarberAvatar } from '../components/BarberAvatar';

export const Reception = () => {
  const { lang, toggleLanguage, t } = useLanguage();

  // Data State
  const [tickets, setTickets] = useState([]);
  const [barbers, setBarbers] = useState([]);
  const [servicesList, setServicesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState(null);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filter State ('active', 'waiting', 'called')
  const [filterTab, setFilterTab] = useState('active');

  // Walk-in Modal State
  const [showWalkinModal, setShowWalkinModal] = useState(false);
  const [walkinName, setWalkinName] = useState('');
  const [walkinPhone, setWalkinPhone] = useState('');
  const [walkinServices, setWalkinServices] = useState([]);
  const [walkinBarber, setWalkinBarber] = useState('any');
  const [submittingWalkin, setSubmittingWalkin] = useState(false);
  const [walkinError, setWalkinError] = useState(null);

  // Confirm Modal for Cancel / No-show
  const [actionConfirm, setActionConfirm] = useState(null);

  // Live Timer Tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Queue & Barbers
  const fetchDashboardData = async () => {
    try {
      const [queueRes, barbersRes, servicesRes] = await Promise.all([
        api.getQueue(),
        api.getBarbers(),
        api.getServices(),
      ]);

      if (queueRes.success) setTickets(queueRes.tickets || []);
      if (barbersRes.success) setBarbers(barbersRes.barbers || []);
      if (servicesRes.success) setServicesList(servicesRes.services || []);
    } catch (err) {
      console.error('Error fetching reception dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const handleQueueUpdated = () => fetchDashboardData();
    const handleTicketCalled = () => fetchDashboardData();
    const handleTicketCancelled = () => fetchDashboardData();
    const handleBarberUpdated = () => fetchDashboardData();

    socket.on('queue:updated', handleQueueUpdated);
    socket.on('ticket:called', handleTicketCalled);
    socket.on('ticket:started', handleQueueUpdated);
    socket.on('ticket:done', handleQueueUpdated);
    socket.on('ticket:cancelled', handleTicketCancelled);
    socket.on('ticket:no-show', handleQueueUpdated);
    socket.on('barber:updated', handleBarberUpdated);
    socket.on('barber:status-changed', handleBarberUpdated);

    const pollInterval = setInterval(fetchDashboardData, 15000);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('ticket:called', handleTicketCalled);
      socket.off('ticket:started', handleQueueUpdated);
      socket.off('ticket:done', handleQueueUpdated);
      socket.off('ticket:cancelled', handleTicketCancelled);
      socket.off('ticket:no-show', handleQueueUpdated);
      socket.off('barber:updated', handleBarberUpdated);
      socket.off('barber:status-changed', handleBarberUpdated);
      clearInterval(pollInterval);
    };
  }, []);

  const triggerNotice = (msg, isError = false) => {
    setActionNotice({ message: msg, isError });
    setTimeout(() => setActionNotice(null), 5000);
  };

  // 1. Call Next
  const handleCallNext = async (barberId, barberName) => {
    try {
      const res = await api.callNext(barberId);
      if (res.ok && res.data.success) {
        triggerNotice(
          t('calledSuccess', {
            token: res.data.ticket.token,
            barber: barberName,
          })
        );
        fetchDashboardData();
      } else if (res.data?.noMatch) {
        triggerNotice(t('noMatchingCustomer'), true);
      } else {
        triggerNotice(res.data?.message || 'Unable to call next customer.', true);
      }
    } catch (err) {
      console.error('Error calling next customer:', err);
      triggerNotice('Network error calling next customer.', true);
    }
  };

  // 2. Toggle Barber Break Status
  const handleToggleBarberStatus = async (barber) => {
    try {
      await api.toggleBarberBreak(barber.name || barber._id);
      fetchDashboardData();
    } catch (err) {
      console.error('Error toggling barber break status:', err);
    }
  };

  // 3. Register Walk-in Submission
  const handleSubmitWalkin = async (e) => {
    e.preventDefault();
    setWalkinError(null);

    const cleanPhone = walkinPhone.replace(/\D/g, '');
    if (walkinName.trim().length < 2) {
      setWalkinError(t('nameValidation'));
      return;
    }
    if (cleanPhone.length !== 10) {
      setWalkinError(t('phoneValidation'));
      return;
    }
    if (walkinServices.length === 0) {
      setWalkinError(t('minServiceRequired'));
      return;
    }

    setSubmittingWalkin(true);
    try {
      const res = await api.addWalkin({
        customerName: walkinName.trim(),
        phone: cleanPhone,
        services: walkinServices,
        preferredBarber: walkinBarber,
      });

      if (res.ok && res.data.success) {
        triggerNotice(`${t('walkinRegistered')} (${res.data.ticket.token})`);
        setWalkinName('');
        setWalkinPhone('');
        setWalkinServices([]);
        setWalkinBarber('any');
        setShowWalkinModal(false);
        fetchDashboardData();
      } else if (res.status === 409) {
        setWalkinError(t('alreadyActiveAlert'));
      } else {
        setWalkinError(res.data?.message || 'Error registering walk-in.');
      }
    } catch (err) {
      console.error('Error submitting walkin:', err);
      setWalkinError(t('networkError'));
    } finally {
      setSubmittingWalkin(false);
    }
  };

  // 4. Mark No-show
  const handleConfirmNoShow = async (ticketId) => {
    try {
      const res = await api.markNoShow(ticketId);
      if (res.ok) {
        triggerNotice(`Ticket marked as no-show.`);
        setActionConfirm(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error marking no-show:', err);
    }
  };

  // 5. Cancel Spot
  const handleConfirmCancel = async (ticketId) => {
    try {
      const res = await api.cancelTicket(ticketId);
      if (res.ok) {
        triggerNotice(`Ticket cancelled.`);
        setActionConfirm(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error cancelling ticket:', err);
    }
  };

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    if (filterTab === 'waiting') {
      return tickets.filter((t) => t.status === 'waiting');
    }
    if (filterTab === 'called') {
      return tickets.filter((t) => t.status === 'called');
    }
    return tickets;
  }, [tickets, filterTab]);

  // Summary Counts
  const counts = useMemo(() => {
    const waiting = tickets.filter((t) => t.status === 'waiting').length;
    const called = tickets.filter((t) => t.status === 'called').length;
    const inChair = tickets.filter((t) => t.status === 'in-chair').length;
    return { waiting, called, inChair, total: waiting + called + inChair };
  }, [tickets]);

  // Format wait elapsed time
  const formatElapsedTime = (joinedAt) => {
    if (!joinedAt) return '0m';
    const diffMs = currentTime - new Date(joinedAt);
    const totalMinutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);

    if (totalMinutes < 60) {
      return `${totalMinutes}m ${seconds < 10 ? '0' : ''}${seconds}s`;
    }
    const hours = Math.floor(totalMinutes / 60);
    const remainingMinutes = totalMinutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  const getElapsedMinutes = (joinedAt) => {
    if (!joinedAt) return 0;
    return Math.floor((currentTime - new Date(joinedAt)) / 60000);
  };

  return (
    <div className="container-fluid py-4 py-md-5 px-3 px-md-5 animate-fade-in-up" style={{ maxWidth: '1440px' }}>
      {/* Action Notification Toast Banner */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`alert ${actionNotice.isError ? 'alert-danger' : 'alert-success'} d-flex align-items-center justify-content-between mb-4 rounded-3 shadow-lg`}
            style={{
              backgroundColor: actionNotice.isError ? 'rgba(248, 81, 73, 0.16)' : 'rgba(46, 160, 67, 0.16)',
              borderColor: actionNotice.isError ? 'var(--color-danger)' : 'var(--color-success)',
              color: actionNotice.isError ? '#FFA49E' : '#7EE787',
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
            ></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacious Header with Digital Clock & Summary */}
      <div
        className="d-flex flex-wrap justify-content-between align-items-center mb-4 mb-md-5 p-4 rounded-4"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div className="mb-2 mb-lg-0">
          <div className="d-flex align-items-center gap-2 mb-1">
            <i className="bi bi-shield-check fs-4" style={{ color: 'var(--accent-color)' }}></i>
            <h2 className="mb-0 salon-heading" style={{ color: 'var(--heading-color)', fontSize: '2rem' }}>
              {t('receptionDashboard')}
            </h2>
          </div>
          <p className="text-secondary mb-0 small" style={{ fontSize: '0.9rem' }}>
            {t('receptionSubtitle')}
          </p>
        </div>

        {/* Live Clock & Summary Controls */}
        <div className="d-flex flex-wrap align-items-center gap-3">
          {/* Digital Clock */}
          <div
            className="px-3 py-2 rounded-pill d-flex align-items-center gap-2"
            style={{ backgroundColor: 'var(--bg-deep)', border: '1px solid var(--border-color)' }}
          >
            <i className="bi bi-clock text-warning"></i>
            <span className="fw-bold" style={{ color: 'var(--accent-color)', fontFamily: 'monospace', fontSize: '1.05rem', letterSpacing: '0.5px' }}>
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
            </span>
          </div>

          {/* Quick Metrics */}
          <div className="d-flex align-items-center gap-2">
            <span className="badge badge-status-waiting px-3 py-2 rounded-pill fw-semibold" title={t('waitingNow')}>
              <i className="bi bi-people me-1"></i> {counts.waiting} {t('status_WAITING')}
            </span>
            <span className="badge badge-status-called px-3 py-2 rounded-pill fw-semibold" title={t('status_CALLED')}>
              <i className="bi bi-bell me-1"></i> {counts.called} {t('status_CALLED')}
            </span>
            <span className="badge badge-status-in-chair px-3 py-2 rounded-pill fw-semibold" title={t('status_IN_CHAIR')}>
              <i className="bi bi-scissors me-1"></i> {counts.inChair} {t('status_IN_CHAIR')}
            </span>
          </div>

          {/* + Add Walk-in Button */}
          <button
            type="button"
            onClick={() => setShowWalkinModal(true)}
            className="btn btn-gold d-flex align-items-center gap-2 shadow-sm px-4"
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>{t('addWalkin')}</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Barbers Panel (Left) & Waiting Queue (Right) with Spacious Gap */}
      <div className="row g-4 g-xl-5">
        {/* Left Section: Active Barbers Panel (col-lg-5 col-xl-4) */}
        <div className="col-lg-5 col-xl-4">
          <div className="salon-card p-4 h-100">
            <div className="d-flex justify-content-between align-items-center pb-3 mb-4 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-scissors fs-5" style={{ color: 'var(--accent-color)' }}></i>
                <h5 className="salon-heading mb-0" style={{ color: 'var(--heading-color)', fontSize: '1.25rem' }}>
                  {t('activeBarbersPanel')}
                </h5>
              </div>
              <span className="badge badge-accent px-3 py-1 rounded-pill small">
                {barbers.filter((b) => b.isOnDuty).length} Active
              </span>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-warning spinner-border-sm mb-2" role="status"></div>
                <p className="text-secondary small mb-0">Loading barbers...</p>
              </div>
            ) : barbers.length === 0 ? (
              <p className="text-secondary small text-center py-5">No on-duty barbers found.</p>
            ) : (
              <div className="d-flex flex-column gap-3">
                {barbers.map((barber) => {
                  const activeCustomer = tickets.find(
                    (t) =>
                      t.assignedBarber &&
                      (t.assignedBarber._id === barber._id || t.assignedBarber === barber._id) &&
                      ['called', 'in-chair'].includes(t.status)
                  );

                  const isBusy = barber.status === 'busy' || !!activeCustomer;
                  const isOnBreak = barber.status === 'break';

                  return (
                    <div
                      key={barber._id}
                      className={`reception-barber-card ${isBusy ? 'is-busy' : isOnBreak ? 'is-break' : 'is-free'}`}
                    >
                      {/* Barber Top Info */}
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div className="d-flex align-items-center gap-3">
                          <BarberAvatar
                            name={barber.name}
                            photo={barber.photo}
                            size="sm"
                            status={barber.status}
                          />
                          <div>
                            <h6 className="mb-0 fw-semibold" style={{ color: 'var(--heading-color)', fontSize: '1.05rem', fontFamily: 'Fraunces, serif' }}>
                              Barber {barber.name}
                            </h6>
                            <div className="d-flex align-items-center gap-2 mt-1">
                              <span className={`dot-indicator ${isBusy ? 'dot-busy' : isOnBreak ? 'dot-break' : 'dot-free'}`}></span>
                              <span className="small text-secondary" style={{ fontSize: '0.8rem' }}>
                                {isBusy ? t('barber_busy') : isOnBreak ? t('barber_break') : t('barber_free')}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Break Toggle Button */}
                        <button
                          type="button"
                          onClick={() => handleToggleBarberStatus(barber)}
                          className={`btn btn-sm ${isOnBreak ? 'btn-outline-gold' : 'btn-outline-secondary'} py-1 px-2`}
                          style={{ fontSize: '0.75rem' }}
                          title={isOnBreak ? t('barberFreeToggle') : t('barberBreakToggle')}
                        >
                          <i className={`bi ${isOnBreak ? 'bi-play-fill text-success' : 'bi-pause-fill text-warning'} me-1`}></i>
                          {isOnBreak ? t('barberFreeToggle') : t('barberBreakToggle')}
                        </button>
                      </div>

                      {/* Current Customer in Chair / Called */}
                      <div className="in-chair-preview mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="text-secondary" style={{ fontSize: '0.74rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {t('currentInChair')}
                          </span>
                          {activeCustomer && (
                            <span className={`badge ${activeCustomer.status === 'called' ? 'badge-status-called' : 'badge-status-in-chair'} small px-2 py-0`}>
                              {activeCustomer.status === 'called' ? t('status_CALLED') : t('status_IN_CHAIR')}
                            </span>
                          )}
                        </div>

                        {activeCustomer ? (
                          <div>
                            <div className="d-flex align-items-center justify-content-between">
                              <span className="fw-bold" style={{ color: 'var(--accent-color)' }}>
                                {activeCustomer.token} • {activeCustomer.customerName}
                              </span>
                              <span className="small text-secondary" style={{ fontFamily: 'monospace' }}>
                                {formatElapsedTime(activeCustomer.inChairAt || activeCustomer.calledAt)}
                              </span>
                            </div>
                            <small className="text-secondary d-block mt-1 text-truncate" style={{ fontSize: '0.8rem' }}>
                              {activeCustomer.services?.map((s) => s.name?.[lang] || s.name?.en || s.name).join(', ')}
                            </small>
                          </div>
                        ) : (
                          <span className="text-secondary small fst-italic">
                            {t('noCustomerInChair')}
                          </span>
                        )}
                      </div>

                      {/* Action Button: [ Call Next ] */}
                      <button
                        type="button"
                        onClick={() => handleCallNext(barber._id, barber.name)}
                        disabled={isBusy || isOnBreak || counts.waiting === 0}
                        className={`btn w-100 ${isBusy || isOnBreak ? 'btn-outline-secondary' : 'btn-gold'} py-2`}
                      >
                        <i className="bi bi-telephone-outbound-fill me-2"></i>
                        {t('callNext')}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Section: Live Waiting Queue (Theme-Compliant Dark Noir, ZERO white background) */}
        <div className="col-lg-7 col-xl-8">
          <div className="salon-card p-4 h-100">
            {/* Header & Filter Controls with Breathing Room */}
            <div className="d-flex flex-wrap justify-content-between align-items-center pb-3 mb-4 border-bottom gap-3" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-list-check fs-5" style={{ color: 'var(--accent-color)' }}></i>
                  <h5 className="salon-heading mb-0" style={{ color: 'var(--heading-color)', fontSize: '1.25rem' }}>
                    {t('liveQueueList')}
                  </h5>
                </div>
                <small className="text-secondary">
                  {t('totalActiveCustomers', { count: tickets.length })}
                </small>
              </div>

              {/* Filter Tabs */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  onClick={() => setFilterTab('active')}
                  className={`btn ${filterTab === 'active' ? 'btn-gold' : 'btn-outline-secondary'} px-3`}
                >
                  {t('filterAll')} ({counts.total})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('waiting')}
                  className={`btn ${filterTab === 'waiting' ? 'btn-gold' : 'btn-outline-secondary'} px-3`}
                >
                  {t('filterWaiting')} ({counts.waiting})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('called')}
                  className={`btn ${filterTab === 'called' ? 'btn-gold' : 'btn-outline-secondary'} px-3`}
                >
                  {t('filterCalled')} ({counts.called})
                </button>
              </div>
            </div>

            {/* Waiting Queue List */}
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-warning mb-2" role="status"></div>
                <p className="text-secondary small">{t('loadingStatus')}</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-5">
                <i className="bi bi-inbox text-secondary display-5 d-block mb-3 opacity-50"></i>
                <h6 className="text-white mb-1">{t('emptyWaitingReception')}</h6>
                <p className="text-secondary small mb-4">{t('emptyWaitingDesc')}</p>
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(true)}
                  className="btn btn-sm btn-outline-gold px-4 py-2"
                >
                  <i className="bi bi-person-plus me-1"></i> {t('addWalkin')}
                </button>
              </div>
            ) : (
              <div className="table-responsive reception-table-wrap">
                <table className="reception-table w-100 align-middle mb-0">
                  <thead>
                    <tr>
                      <th style={{ width: '90px' }}>Token</th>
                      <th>{t('customer')}</th>
                      <th>{t('services')}</th>
                      <th>{t('preferredBarber')}</th>
                      <th>{t('waitingTime')}</th>
                      <th>{t('status')}</th>
                      <th className="text-end">{t('actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((ticket) => {
                      const elapsedMins = getElapsedMinutes(ticket.joinedAt);
                      const isDelayed = elapsedMins >= 60 && ticket.status === 'waiting';

                      return (
                        <tr
                          key={ticket._id}
                          className={isDelayed ? 'queue-row-delayed' : ''}
                        >
                          {/* Token Badge */}
                          <td>
                            <span
                              className="px-2 py-1 rounded fw-bold d-inline-block text-center"
                              style={{
                                background: 'rgba(229, 195, 120, 0.12)',
                                border: '1px solid var(--accent-color)',
                                color: 'var(--accent-color)',
                                minWidth: '55px',
                                fontSize: '0.95rem',
                              }}
                            >
                              {ticket.token}
                            </span>
                          </td>

                          {/* Customer Name & Phone */}
                          <td>
                            <div className="fw-semibold" style={{ color: 'var(--heading-color)', fontSize: '0.95rem' }}>
                              {ticket.customerName}
                            </div>
                            <small className="text-secondary" style={{ fontSize: '0.78rem' }}>
                              +91 {ticket.phone}
                            </small>
                          </td>

                          {/* Services Selected */}
                          <td>
                            <div className="d-flex flex-wrap gap-1">
                              {ticket.services?.map((s) => (
                                <span
                                  key={s._id || s}
                                  className="badge px-2 py-1"
                                  style={{
                                    backgroundColor: 'rgba(255, 255, 255, 0.06)',
                                    border: '1px solid var(--border-color)',
                                    color: 'var(--text-secondary)',
                                    fontSize: '0.75rem',
                                    fontWeight: 500,
                                  }}
                                >
                                  {s.name?.[lang] || s.name?.en || s.name} ({s.durationMinutes}m)
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Preferred Barber (Highlighted clearly) */}
                          <td>
                            {!ticket.preferredBarber || ticket.preferredBarber === 'any' ? (
                              <span
                                className="badge px-2 py-1"
                                style={{
                                  background: 'rgba(255, 255, 255, 0.05)',
                                  border: '1px solid rgba(255, 255, 255, 0.1)',
                                  color: 'var(--text-secondary)',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {t('fastestAvailable')}
                              </span>
                            ) : (
                              <span
                                className="badge badge-accent px-2 py-1 fw-semibold"
                                style={{ fontSize: '0.75rem' }}
                              >
                                <i className="bi bi-person-check-fill me-1"></i>
                                {barbers.find((b) => b._id === ticket.preferredBarber)?.name || ticket.preferredBarber}
                              </span>
                            )}
                          </td>

                          {/* Waiting Time (Running Timer & Highlighting Rule for > 60m) */}
                          <td>
                            <span
                              className="fw-semibold"
                              style={{
                                fontFamily: 'monospace',
                                color: isDelayed ? 'var(--amber-warning)' : 'var(--text-secondary)',
                                fontSize: '0.88rem',
                              }}
                            >
                              {formatElapsedTime(ticket.joinedAt)}
                            </span>
                            {isDelayed && (
                              <span className="badge queue-badge-delayed d-block mt-1" style={{ fontSize: '0.68rem', width: 'fit-content' }}>
                                <i className="bi bi-exclamation-triangle-fill me-1"></i> {t('waitTimeExceeded')}
                              </span>
                            )}
                          </td>

                          {/* Status */}
                          <td>
                            {ticket.status === 'waiting' && (
                              <span className="badge badge-status-waiting px-2 py-1 rounded-pill small">
                                {t('status_WAITING')}
                              </span>
                            )}
                            {ticket.status === 'called' && (
                              <span className="badge badge-status-called px-2 py-1 rounded-pill small">
                                <i className="bi bi-bell-fill me-1"></i> {t('status_CALLED')}
                              </span>
                            )}
                            {ticket.status === 'in-chair' && (
                              <span className="badge badge-status-in-chair px-2 py-1 rounded-pill small">
                                <i className="bi bi-scissors me-1"></i> {t('status_IN_CHAIR')}
                              </span>
                            )}
                          </td>

                          {/* Row Actions: [ No-show ] and [ Cancel ] */}
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              {ticket.status === 'called' && (
                                <button
                                  type="button"
                                  onClick={() => setActionConfirm({ type: 'no-show', ticket })}
                                  className="btn btn-outline-warning py-1 px-2"
                                  title={t('noShowBtn')}
                                  style={{ fontSize: '0.75rem' }}
                                >
                                  <i className="bi bi-person-x me-1"></i>
                                  {t('noShowBtn')}
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => setActionConfirm({ type: 'cancel', ticket })}
                                className="btn btn-ghost-danger py-1 px-2"
                                title={t('cancel')}
                                style={{ fontSize: '0.75rem' }}
                              >
                                <i className="bi bi-trash3"></i>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Register Walk-in Modal Dialog */}
      {showWalkinModal && (
        <div className="glass-modal-backdrop" role="dialog" aria-modal="true">
          <div className="glass-modal">
            <div className="d-flex justify-content-between align-items-start mb-3 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
              <div>
                <h4 className="salon-heading mb-1" style={{ color: 'var(--heading-color)' }}>
                  {t('walkinModalTitle')}
                </h4>
                <small className="text-secondary">{t('walkinModalSub')}</small>
              </div>
              <button
                type="button"
                className="btn-close btn-close-white"
                onClick={() => setShowWalkinModal(false)}
                aria-label="Close"
              ></button>
            </div>

            {walkinError && (
              <div className="alert alert-danger py-2 small mb-3 rounded-3">
                <i className="bi bi-exclamation-circle me-1"></i> {walkinError}
              </div>
            )}

            <form onSubmit={handleSubmitWalkin}>
              {/* Full Name */}
              <div className="mb-3">
                <label className="form-label small text-secondary fw-semibold">
                  {t('fullName')} *
                </label>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('fullNamePlaceholder')}
                  value={walkinName}
                  onChange={(e) => setWalkinName(e.target.value)}
                  required
                />
              </div>

              {/* 10-digit Phone */}
              <div className="mb-3">
                <label className="form-label small text-secondary fw-semibold">
                  {t('phone')} *
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-secondary">+91</span>
                  <input
                    type="tel"
                    className="form-control"
                    placeholder={t('phonePlaceholder')}
                    maxLength={10}
                    value={walkinPhone}
                    onChange={(e) => setWalkinPhone(e.target.value.replace(/\D/g, ''))}
                    required
                  />
                </div>
              </div>

              {/* Service Selection (Up to 3) */}
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label small text-secondary fw-semibold mb-0">
                    {t('servicesTitle')} (Max 3) *
                  </label>
                  <span className="small text-secondary">{walkinServices.length}/3 selected</span>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {servicesList.map((service) => {
                    const isSelected = walkinServices.includes(service._id);
                    return (
                      <button
                        key={service._id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setWalkinServices(walkinServices.filter((id) => id !== service._id));
                          } else if (walkinServices.length < 3) {
                            setWalkinServices([...walkinServices, service._id]);
                          }
                        }}
                        className={`btn btn-sm ${isSelected ? 'btn-gold' : 'btn-outline-secondary'} py-1 px-2`}
                        style={{ fontSize: '0.8rem' }}
                      >
                        {isSelected && <i className="bi bi-check me-1"></i>}
                        {service.name?.[lang] || service.name?.en || service.name} ({service.durationMinutes}m · ₹{service.priceInr})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Barber Preference */}
              <div className="mb-4">
                <label className="form-label small text-secondary fw-semibold mb-2">
                  {t('barberTitle')}
                </label>
                <div className="d-flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setWalkinBarber('any')}
                    className={`btn btn-sm ${walkinBarber === 'any' ? 'btn-gold' : 'btn-outline-secondary'} py-1 px-3`}
                  >
                    {t('fastestAvailable')}
                  </button>
                  {barbers.map((b) => (
                    <button
                      key={b._id}
                      type="button"
                      onClick={() => setWalkinBarber(b.name)}
                      className={`btn btn-sm ${walkinBarber === b.name ? 'btn-gold' : 'btn-outline-secondary'} py-1 px-3`}
                    >
                      {b.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="d-flex justify-content-end gap-2 pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={() => setShowWalkinModal(false)}
                  className="btn btn-outline-secondary px-3"
                  disabled={submittingWalkin}
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="btn btn-gold px-4"
                  disabled={submittingWalkin}
                >
                  {submittingWalkin ? t('joining') : t('confirmAndJoin')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for No-show / Cancel */}
      {actionConfirm && (
        <div className="glass-modal-backdrop" role="dialog" aria-modal="true">
          <div className="glass-modal text-center animate-fade-in-up">
            <div
              className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: '56px',
                height: '56px',
                background: actionConfirm.type === 'no-show' ? 'rgba(217, 119, 6, 0.15)' : 'rgba(248, 81, 73, 0.15)',
                color: actionConfirm.type === 'no-show' ? 'var(--amber-warning)' : 'var(--color-danger)',
                border: '1px solid var(--border-color)',
              }}
            >
              <i className={`bi ${actionConfirm.type === 'no-show' ? 'bi-person-x-fill' : 'bi-exclamation-triangle-fill'} fs-4`}></i>
            </div>

            <h5 className="salon-heading mb-2 text-white">
              {actionConfirm.type === 'no-show' ? t('noShowConfirm') : t('cancelTicketConfirm')}
            </h5>
            <p className="text-secondary small mb-4">
              Ticket: <strong className="text-white">{actionConfirm.ticket?.token}</strong> ({actionConfirm.ticket?.customerName})
            </p>

            <div className="d-flex justify-content-center gap-3">
              <button
                type="button"
                onClick={() => setActionConfirm(null)}
                className="btn btn-outline-secondary px-3"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (actionConfirm.type === 'no-show') {
                    handleConfirmNoShow(actionConfirm.ticket._id);
                  } else {
                    handleConfirmCancel(actionConfirm.ticket._id);
                  }
                }}
                className={`btn ${actionConfirm.type === 'no-show' ? 'btn-warning' : 'btn-danger'} px-4`}
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
