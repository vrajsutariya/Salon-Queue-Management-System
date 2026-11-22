import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { socket } from '../services/socket';

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

  // Digital timer tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Barbers & Queue
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
    const handleTicketCalled = () => fetchBarberStationData();
    const handleBarberUpdated = () => fetchBarberStationData();

    socket.on('queue:updated', handleQueueUpdated);
    socket.on('ticket:called', handleTicketCalled);
    socket.on('ticket:cancelled', handleQueueUpdated);
    socket.on('barber:updated', handleBarberUpdated);

    const interval = setInterval(fetchBarberStationData, 12000);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('ticket:called', handleTicketCalled);
      socket.off('ticket:cancelled', handleQueueUpdated);
      socket.off('barber:updated', handleBarberUpdated);
      clearInterval(interval);
    };
  }, []);

  const triggerNotice = (msg, isError = false) => {
    setActionNotice({ message: msg, isError });
    setTimeout(() => setActionNotice(null), 4500);
  };

  // Determine active selected barber
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
          t.assignedBarber.name === activeBarber.name) &&
        ['called', 'in-chair'].includes(t.status)
    );
  }, [tickets, activeBarber]);

  // Upcoming tickets eligible for this barber (FIFO)
  // Eligible: preferredBarber is 'any' OR matches activeBarber.name OR activeBarber._id
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

  // Actions
  // 1. Call Next Customer
  const handleCallNext = async () => {
    if (!activeBarber) return;
    setActionLoading(true);
    try {
      const res = await api.callNext(activeBarber._id);
      if (res.ok && res.data.success) {
        triggerNotice(`Called customer ${res.data.ticket.token} (${res.data.ticket.customerName})!`);
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

  // 2. Start Service (transition from 'called' to 'in-chair')
  const handleStartService = async (ticketId) => {
    setActionLoading(true);
    try {
      const res = await api.updateTicketStatus(ticketId, 'in-chair');
      if (res.ok) {
        triggerNotice('Customer seated. Service started!');
        fetchBarberStationData();
      }
    } catch (err) {
      console.error('Error starting service:', err);
      triggerNotice('Error starting service.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Mark Service Complete (transition to 'done')
  const handleCompleteService = async (ticketId) => {
    setActionLoading(true);
    try {
      const res = await api.updateTicketStatus(ticketId, 'done');
      if (res.ok) {
        triggerNotice('Service marked as complete. Barber chair is now free!');
        fetchBarberStationData();
      }
    } catch (err) {
      console.error('Error completing service:', err);
      triggerNotice('Error completing service.', true);
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Toggle Barber Break
  const handleToggleBreak = async () => {
    if (!activeBarber) return;
    const nextStatus = activeBarber.status === 'break' ? 'free' : 'break';
    setActionLoading(true);
    try {
      await api.updateBarberStatus(activeBarber._id, nextStatus);
      triggerNotice(`Status updated to ${nextStatus}.`);
      fetchBarberStationData();
    } catch (err) {
      console.error('Error toggling status:', err);
      triggerNotice('Error toggling status.', true);
    } finally {
      setActionLoading(false);
    }
  };

  const getElapsedString = (timestamp) => {
    if (!timestamp) return 'Just started';
    const totalSeconds = Math.max(0, Math.floor((currentTime - new Date(timestamp)) / 1000));
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
  };

  return (
    <div className="container py-4 py-md-5" style={{ maxWidth: '1180px' }}>
      {/* Toast Notice */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`alert ${
              actionNotice.isError ? 'alert-danger' : 'alert-success'
            } d-flex align-items-center justify-content-between mb-4 rounded-3 shadow-lg`}
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
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header & Station Selector */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-accent px-3 py-1 rounded-pill">
              <i className="bi bi-scissors me-1"></i> Styling Station Console
            </span>
          </div>
          <h1 className="salon-heading mb-1" style={{ fontSize: '2.3rem' }}>
            {activeBarber ? `${t('barberView')}: ${activeBarber.name}` : t('barberView')}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mb-0 small">
            Dedicated workstation console for chair management, customer callouts, and service completion.
          </p>
        </div>

        {/* Digital Station Clock */}
        <div
          className="px-3 py-2 rounded-pill d-flex align-items-center gap-2"
          style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
        >
          <i className="bi bi-clock text-warning"></i>
          <span
            className="fw-bold"
            style={{
              color: 'var(--accent-color)',
              fontFamily: 'monospace',
              fontSize: '1rem',
              letterSpacing: '0.5px',
            }}
          >
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
        </div>
      </div>

      {/* Station Selector Tabs */}
      <div className="d-flex flex-wrap gap-2 mb-4 p-2 rounded-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        {barbers.map((b, idx) => {
          const isSelected = activeBarber?._id === b._id;
          return (
            <button
              key={b._id}
              type="button"
              onClick={() => navigate(`/barber/${b.name}`)}
              className={`btn ${isSelected ? 'btn-gold' : 'btn-outline-secondary'} d-flex align-items-center gap-2 px-3 py-2`}
              style={{ borderRadius: '10px' }}
            >
              <img
                src={b.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                alt={b.name}
                className="rounded-circle"
                style={{ width: '24px', height: '24px', objectFit: 'cover' }}
              />
              <span className="fw-semibold">{b.name}</span>
              <span className="small opacity-75">Station #{idx + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Active Barber Status Card & Actions */}
      {activeBarber && (
        <div className="row g-4 mb-4">
          {/* Left Column: Now in Chair / Called */}
          <div className="col-lg-6">
            <motion.div
              className="salon-card p-4 p-md-5 h-100 d-flex flex-column justify-content-between"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-person-workspace fs-4" style={{ color: 'var(--accent-color)' }}></i>
                    <h4 className="salon-heading mb-0" style={{ fontSize: '1.35rem' }}>
                      Now At Chair
                    </h4>
                  </div>
                  {activeCustomer ? (
                    <span
                      className={`badge ${
                        activeCustomer.status === 'in-chair'
                          ? 'badge-status-in-chair'
                          : 'badge-status-called'
                      } px-3 py-1 rounded-pill`}
                    >
                      {activeCustomer.status === 'in-chair' ? t('status_IN_CHAIR') : t('status_CALLED')}
                    </span>
                  ) : (
                    <span className="badge badge-accent px-3 py-1 rounded-pill">Chair Free</span>
                  )}
                </div>

                {activeCustomer ? (
                  <div className="p-4 rounded-4 mb-4" style={{ backgroundColor: 'rgba(8, 8, 10, 0.7)', border: '1px solid var(--border-color)' }}>
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <span
                          className="px-2 py-1 rounded fw-bold d-inline-block text-center mb-2"
                          style={{
                            background: 'rgba(229, 195, 120, 0.15)',
                            border: '1px solid var(--accent-color)',
                            color: 'var(--accent-color)',
                            fontSize: '1.1rem',
                            minWidth: '60px',
                          }}
                        >
                          {activeCustomer.token}
                        </span>
                        <h3 className="salon-heading text-white mb-0" style={{ fontSize: '1.4rem' }}>
                          {activeCustomer.customerName}
                        </h3>
                        <small style={{ color: 'var(--text-secondary)' }}>
                          +91 {activeCustomer.phone}
                        </small>
                      </div>

                      {/* Timer Display */}
                      <div className="text-end">
                        <span className="small d-block text-secondary">
                          {activeCustomer.status === 'in-chair' ? 'Elapsed Time' : 'Called Since'}
                        </span>
                        <span
                          className="fw-bold"
                          style={{
                            fontFamily: 'monospace',
                            color: 'var(--accent-color)',
                            fontSize: '1.2rem',
                          }}
                        >
                          {getElapsedString(activeCustomer.inChairAt || activeCustomer.calledAt)}
                        </span>
                      </div>
                    </div>

                    {/* Services Requested */}
                    <div className="mb-3">
                      <span className="small text-secondary d-block mb-1">Services In Progress:</span>
                      <div className="d-flex flex-wrap gap-2">
                        {activeCustomer.services?.map((s) => (
                          <span
                            key={s._id || s}
                            className="badge px-3 py-2"
                            style={{
                              backgroundColor: 'rgba(255, 255, 255, 0.06)',
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)',
                              fontSize: '0.82rem',
                            }}
                          >
                            {s.name?.[lang] || s.name?.en || s.name} ({s.durationMinutes}m · ₹{s.priceInr})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <i className="bi bi-cup-hot display-4 d-block mb-3" style={{ color: 'var(--accent-color)', opacity: 0.6 }}></i>
                    <h5 className="text-white mb-1">Chair is Currently Free</h5>
                    <p style={{ color: 'var(--text-secondary)' }} className="small mb-0">
                      Call the next customer from your queue below when ready.
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons for In-Chair */}
              <div className="d-flex flex-column gap-2 mt-3 pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
                {activeCustomer ? (
                  activeCustomer.status === 'called' ? (
                    <button
                      type="button"
                      onClick={() => handleStartService(activeCustomer._id)}
                      className="btn btn-gold py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                      disabled={actionLoading}
                    >
                      <i className="bi bi-scissors fs-5"></i>
                      <span>Seat Customer & Start Service</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCompleteService(activeCustomer._id)}
                      className="btn btn-gold py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                      disabled={actionLoading}
                    >
                      <i className="bi bi-check2-circle fs-5"></i>
                      <span>Mark Service Complete (Done)</span>
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={handleCallNext}
                    className="btn btn-gold py-3 fw-bold d-flex align-items-center justify-content-center gap-2"
                    disabled={actionLoading || upNextList.length === 0 || activeBarber.status === 'break'}
                  >
                    <i className="bi bi-megaphone-fill fs-5"></i>
                    <span>Call Next Customer ({upNextList.length} Waiting)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleToggleBreak}
                  className="btn btn-outline-secondary py-2 small"
                  disabled={actionLoading || !!activeCustomer}
                >
                  <i className={`bi ${activeBarber.status === 'break' ? 'bi-play-fill' : 'bi-pause-fill'} me-1`}></i>
                  {activeBarber.status === 'break' ? 'End Break & Set Free' : 'Take a Break'}
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Up Next For This Barber */}
          <div className="col-lg-6">
            <motion.div
              className="salon-card p-4 p-md-5 h-100 d-flex flex-column justify-content-between"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
                  <div className="d-flex align-items-center gap-2">
                    <i className="bi bi-hourglass-split fs-4" style={{ color: 'var(--accent-color)' }}></i>
                    <h4 className="salon-heading mb-0" style={{ fontSize: '1.35rem' }}>
                      Up Next For {activeBarber.name}
                    </h4>
                  </div>
                  <span className="badge badge-accent px-3 py-1 rounded-pill">
                    {upNextList.length} Eligible
                  </span>
                </div>

                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-warning spinner-border-sm mb-2" role="status"></div>
                    <p className="text-secondary small">Loading queue...</p>
                  </div>
                ) : upNextList.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-check2-all display-5 d-block mb-3 opacity-50" style={{ color: 'var(--accent-color)' }}></i>
                    <h6 className="text-white mb-1">Queue is clear!</h6>
                    <p style={{ color: 'var(--text-secondary)' }} className="small mb-0">
                      No customers are currently waiting for {activeBarber.name} or Any Barber.
                    </p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {upNextList.slice(0, 5).map((ticket, index) => {
                      const isSpecificPref =
                        ticket.preferredBarber?.toLowerCase() === activeBarber.name?.toLowerCase();

                      return (
                        <div
                          key={ticket._id}
                          className="p-3 rounded-3 d-flex align-items-center justify-content-between"
                          style={{
                            backgroundColor: 'rgba(8, 8, 10, 0.75)',
                            border: `1px solid ${isSpecificPref ? 'rgba(229, 195, 120, 0.4)' : 'var(--border-color)'}`,
                          }}
                        >
                          <div className="d-flex align-items-center gap-3">
                            <span
                              className="px-2 py-1 rounded fw-bold text-center"
                              style={{
                                background: 'rgba(229, 195, 120, 0.12)',
                                border: '1px solid var(--accent-color)',
                                color: 'var(--accent-color)',
                                fontSize: '0.92rem',
                                minWidth: '55px',
                              }}
                            >
                              {ticket.token}
                            </span>
                            <div>
                              <div className="fw-semibold text-white">{ticket.customerName}</div>
                              <div className="d-flex align-items-center gap-2 small" style={{ color: 'var(--text-secondary)' }}>
                                <span>
                                  {ticket.services?.map((s) => s.name?.[lang] || s.name?.en || s.name).join(', ')}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-end">
                            {isSpecificPref ? (
                              <span className="badge badge-accent px-2 py-1" style={{ fontSize: '0.72rem' }}>
                                <i className="bi bi-star-fill me-1"></i> Requested You
                              </span>
                            ) : (
                              <span className="badge px-2 py-1" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)', fontSize: '0.72rem' }}>
                                {t('fastestAvailable')}
                              </span>
                            )}
                            <div className="small text-secondary mt-1">
                              Queue #{index + 1}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Call Next Button footer */}
              <div className="pt-3 border-top mt-4" style={{ borderColor: 'var(--border-color)' }}>
                <button
                  type="button"
                  onClick={handleCallNext}
                  className="btn btn-outline-gold w-100 py-3 d-flex align-items-center justify-content-center gap-2"
                  disabled={actionLoading || upNextList.length === 0 || !!activeCustomer || activeBarber.status === 'break'}
                >
                  <i className="bi bi-megaphone"></i>
                  <span>Call Next Eligible Customer</span>
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
};
