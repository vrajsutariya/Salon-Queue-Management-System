import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { BarberAvatar } from '../components/BarberAvatar';
import { BrandLogo } from '../components/BrandLogo';

/**
 * Screen 7: Owner Settings (/admin)
 * Protected by 4-digit PIN lock (Default: 1234).
 * Master queue switch, live daily analytics, barber roster & service catalog management.
 */
export const AdminSettings = () => {
  const { lang, t } = useLanguage();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => sessionStorage.getItem('cb_owner_auth') === 'true'
  );
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(null);
  const [pinShaking, setPinShaking] = useState(false);
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Dashboard Data State
  const [settings, setSettings] = useState({ isQueueOpen: true, closingTime: '9:00 PM' });
  const [stats, setStats] = useState({
    customersServed: 0,
    avgWaitTimeMinutes: 0,
    noShowCount: 0,
    todayRevenue: 0,
    waitingCount: 0,
  });
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState(null);

  // Modals State
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [serviceForm, setServiceForm] = useState({
    nameEn: '',
    nameGu: '',
    durationMinutes: 30,
    priceInr: 150,
    isActive: true,
  });

  const [showBarberModal, setShowBarberModal] = useState(false);
  const [editingBarber, setEditingBarber] = useState(null);
  const [barberForm, setBarberForm] = useState({
    name: '',
    avatarPreset: 'Ravi',
    isOnDuty: true,
  });

  const [confirmDelete, setConfirmDelete] = useState(null);

  const pinInputRef = useRef(null);

  // Auto-focus PIN input
  useEffect(() => {
    if (!isAuthenticated && pinInputRef.current) {
      pinInputRef.current.focus();
    }
  }, [isAuthenticated]);

  // Toast notification
  const triggerNotice = (msg, isError = false) => {
    setActionNotice({ message: msg, isError });
    setTimeout(() => setActionNotice(null), 4500);
  };

  // Fetch Dashboard Data
  const fetchDashboardData = async () => {
    try {
      const [settingsRes, statsRes, barbersRes, servicesRes] = await Promise.all([
        api.getAdminSettings().catch(() => ({ success: false, settings: { isQueueOpen: true } })),
        api.getAdminStats().catch(() => ({ success: false, stats: {} })),
        api.getAllBarbers().catch(() => ({ success: false, barbers: [] })),
        api.getAllServices().catch(() => ({ success: false, services: [] })),
      ]);

      if (settingsRes.success && settingsRes.settings) setSettings(settingsRes.settings);
      if (statsRes.success && statsRes.stats) setStats(statsRes.stats);
      if (barbersRes.success) setBarbers(barbersRes.barbers || []);
      if (servicesRes.success) setServices(servicesRes.services || []);
    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchDashboardData();

      const handleUpdate = () => fetchDashboardData();
      socket.on('queue:updated', handleUpdate);
      socket.on('salon:status-changed', handleUpdate);
      socket.on('services:updated', handleUpdate);
      socket.on('barber:updated', handleUpdate);

      return () => {
        socket.off('queue:updated', handleUpdate);
        socket.off('salon:status-changed', handleUpdate);
        socket.off('services:updated', handleUpdate);
        socket.off('barber:updated', handleUpdate);
      };
    }
  }, [isAuthenticated]);

  // --- PIN VERIFICATION ---
  const handleVerifyPin = async (pinToTest = pin) => {
    if (pinToTest.length !== 4) return;
    setVerifyingPin(true);
    setPinError(null);

    try {
      const res = await api.verifyAdminPin(pinToTest);
      if (res.ok && res.data.success) {
        sessionStorage.setItem('cb_owner_auth', 'true');
        setIsAuthenticated(true);
        setPin('');
      } else {
        setPinError('Incorrect PIN. Try again.');
        setPinShaking(true);
        setTimeout(() => setPinShaking(false), 500);
        setPin('');
      }
    } catch (err) {
      console.error('PIN verification error:', err);
      // Fallback verification for offline development
      if (pinToTest === '1234') {
        sessionStorage.setItem('cb_owner_auth', 'true');
        setIsAuthenticated(true);
        setPin('');
      } else {
        setPinError('Incorrect PIN. Try again.');
        setPinShaking(true);
        setTimeout(() => setPinShaking(false), 500);
        setPin('');
      }
    } finally {
      setVerifyingPin(false);
    }
  };

  const handleKeypadPress = (val) => {
    if (pin.length < 4) {
      const newPin = pin + val;
      setPin(newPin);
      if (newPin.length === 4) {
        handleVerifyPin(newPin);
      }
    }
  };

  const handleKeypadBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setPinError(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('cb_owner_auth');
    setIsAuthenticated(false);
    setPin('');
  };

  // --- MASTER QUEUE SWITCH ---
  const handleToggleQueue = async () => {
    const nextState = !settings.isQueueOpen;
    try {
      const res = await api.toggleQueue(nextState);
      if (res.ok && res.data.success) {
        setSettings((prev) => ({ ...prev, isQueueOpen: nextState }));
        triggerNotice(
          nextState
            ? 'Online Queue is now OPEN. Clients can join from home.'
            : 'Online Queue is CLOSED. Walk-ins remain operational at desk.'
        );
      }
    } catch (err) {
      console.error('Error toggling queue:', err);
      triggerNotice('Error updating master queue switch.', true);
    }
  };

  // --- SERVICE ACTIONS ---
  const handleOpenAddService = () => {
    setEditingService(null);
    setServiceForm({
      nameEn: '',
      nameGu: '',
      durationMinutes: 30,
      priceInr: 150,
      isActive: true,
    });
    setShowServiceModal(true);
  };

  const handleOpenEditService = (srv) => {
    setEditingService(srv);
    setServiceForm({
      nameEn: srv.name?.en || (typeof srv.name === 'string' ? srv.name : ''),
      nameGu: srv.name?.gu || '',
      durationMinutes: srv.durationMinutes || 30,
      priceInr: srv.priceInr || 150,
      isActive: srv.isActive !== false,
    });
    setShowServiceModal(true);
  };

  const handleSaveService = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: {
          en: serviceForm.nameEn.trim(),
          gu: serviceForm.nameGu.trim() || serviceForm.nameEn.trim(),
        },
        durationMinutes: Number(serviceForm.durationMinutes),
        priceInr: Number(serviceForm.priceInr),
        isActive: serviceForm.isActive,
      };

      if (editingService) {
        const res = await api.updateService(editingService._id, payload);
        if (res.ok) {
          triggerNotice(`Service "${payload.name.en}" updated.`);
          setShowServiceModal(false);
          fetchDashboardData();
        }
      } else {
        const res = await api.addService(payload);
        if (res.ok) {
          triggerNotice(`New service "${payload.name.en}" created.`);
          setShowServiceModal(false);
          fetchDashboardData();
        }
      }
    } catch (err) {
      console.error('Error saving service:', err);
      triggerNotice('Failed to save service.', true);
    }
  };

  const handleToggleServiceActive = async (srv) => {
    try {
      const nextActive = !srv.isActive;
      const res = await api.updateService(srv._id, { isActive: nextActive });
      if (res.ok) {
        triggerNotice(`Service "${srv.name?.en || srv.name}" set to ${nextActive ? 'Active' : 'Inactive'}.`);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error toggling service active state:', err);
    }
  };

  const handleDeleteService = async (srvId) => {
    try {
      const res = await api.deleteService(srvId);
      if (res.ok) {
        triggerNotice('Service removed from catalog.');
        setConfirmDelete(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error deleting service:', err);
    }
  };

  // --- BARBER ACTIONS ---
  const handleOpenAddBarber = () => {
    setEditingBarber(null);
    setBarberForm({
      name: '',
      avatarPreset: 'Ravi',
      isOnDuty: true,
    });
    setShowBarberModal(true);
  };

  const handleOpenEditBarber = (barber) => {
    setEditingBarber(barber);
    setBarberForm({
      name: barber.name || '',
      avatarPreset: barber.name || 'Ravi',
      isOnDuty: barber.isOnDuty !== false,
    });
    setShowBarberModal(true);
  };

  const handleSaveBarber = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: barberForm.name.trim(),
        photo: barberForm.avatarPreset,
        isOnDuty: barberForm.isOnDuty,
      };

      if (editingBarber) {
        const res = await api.updateBarber(editingBarber._id, payload);
        if (res.ok) {
          triggerNotice(`Barber "${payload.name}" updated.`);
          setShowBarberModal(false);
          fetchDashboardData();
        }
      } else {
        const res = await api.addBarber(payload);
        if (res.ok) {
          triggerNotice(`Barber "${payload.name}" added to team.`);
          setShowBarberModal(false);
          fetchDashboardData();
        } else {
          triggerNotice(res.data?.message || 'Error adding barber.', true);
        }
      }
    } catch (err) {
      console.error('Error saving barber:', err);
      triggerNotice('Failed to save barber.', true);
    }
  };

  const handleToggleBarberDuty = async (barber) => {
    try {
      const nextDuty = !barber.isOnDuty;
      const res = await api.updateBarber(barber._id, { isOnDuty: nextDuty });
      if (res.ok) {
        triggerNotice(`Barber ${barber.name} is now ${nextDuty ? 'On Duty' : 'Off Duty'}.`);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error toggling barber duty:', err);
    }
  };

  const handleDeleteBarber = async (barberId) => {
    try {
      const res = await api.deleteBarber(barberId);
      if (res.ok) {
        triggerNotice('Barber removed from roster.');
        setConfirmDelete(null);
        fetchDashboardData();
      }
    } catch (err) {
      console.error('Error deleting barber:', err);
    }
  };

  // ==========================================
  // RENDER: 1. PIN LOCK VERIFICATION SCREEN
  // ==========================================
  if (!isAuthenticated) {
    return (
      <div className="container py-5 d-flex align-items-center justify-content-center min-vh-75">
        <motion.div
          className={`salon-card p-4 p-md-5 text-center shadow-lg position-relative ${pinShaking ? 'pin-shake' : ''}`}
          style={{
            maxWidth: '420px',
            width: '100%',
            background: 'linear-gradient(180deg, #16161C 0%, #0E0E12 100%)',
            border: '1.5px solid var(--border-color)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 30px rgba(229, 195, 120, 0.1)',
          }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35 }}
        >
          {/* Brand Emblem */}
          <div className="mb-3 d-flex justify-content-center">
            <BrandLogo size="md" to="" />
          </div>

          <h2
            className="salon-heading mb-1 text-white"
            style={{ fontFamily: "'Fraunces', serif", fontSize: '1.85rem' }}
          >
            Owner Access
          </h2>
          <p className="text-secondary small mb-4">
            Enter 4-digit security PIN to unlock salon configuration
          </p>

          {/* Masked PIN 4-Dot Indicators */}
          <div className="d-flex justify-content-center gap-3 mb-4">
            {[0, 1, 2, 3].map((idx) => (
              <span
                key={idx}
                className={`pin-dot ${pin.length > idx ? 'filled' : ''}`}
              />
            ))}
          </div>

          {/* Hidden Keyboard Input */}
          <input
            ref={pinInputRef}
            type="password"
            maxLength={4}
            value={pin}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              setPin(val);
              if (val.length === 4) handleVerifyPin(val);
            }}
            className="position-absolute opacity-0"
            style={{ pointerEvents: 'none' }}
            aria-label="Security PIN"
          />

          {/* Error Message */}
          {pinError && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-danger small fw-semibold mb-3 d-flex align-items-center justify-content-center gap-1"
            >
              <i className="bi bi-exclamation-circle-fill"></i>
              <span>{pinError}</span>
            </motion.div>
          )}

          {/* On-Screen Numeric Keypad */}
          <div className="d-flex flex-column gap-2 mb-3 align-items-center">
            {[
              [1, 2, 3],
              [4, 5, 6],
              [7, 8, 9],
            ].map((row, rIdx) => (
              <div key={rIdx} className="d-flex gap-3">
                {row.map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(String(num))}
                    className="pin-keypad-btn"
                  >
                    {num}
                  </button>
                ))}
              </div>
            ))}
            <div className="d-flex gap-3">
              <button
                type="button"
                onClick={() => setPin('')}
                className="pin-keypad-btn"
                style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}
                title="Clear PIN"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleKeypadPress('0')}
                className="pin-keypad-btn"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleKeypadBackspace}
                className="pin-keypad-btn"
                title="Backspace"
              >
                <i className="bi bi-backspace"></i>
              </button>
            </div>
          </div>

          <div className="text-secondary small mt-3 border-top pt-3" style={{ borderColor: 'var(--border-color)', fontSize: '0.76rem' }}>
            Default factory access code: <span className="fw-bold" style={{ color: 'var(--accent-color)' }}>1234</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // ==========================================
  // RENDER: 2. OWNER MANAGEMENT DASHBOARD
  // ==========================================
  return (
    <div className="container py-4 py-md-5" style={{ maxWidth: '1140px' }}>
      {/* Action Notification Toast Banner */}
      <AnimatePresence>
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`alert ${actionNotice.isError ? 'alert-danger' : 'alert-success'} d-flex align-items-center justify-content-between mb-4 rounded-4 shadow-lg`}
            style={{
              backgroundColor: actionNotice.isError ? 'rgba(248, 81, 73, 0.18)' : 'rgba(46, 160, 67, 0.18)',
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

      {/* Dashboard Header Bar */}
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3 p-3 p-md-4 rounded-4" style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-accent px-3 py-1 rounded-pill">
              <i className="bi bi-shield-check me-1"></i> Owner Portal
            </span>
          </div>
          <h1
            className="salon-heading mb-0 text-white"
            style={{ fontFamily: "'Fraunces', serif", fontSize: '2rem' }}
          >
            Salon Operations & Settings
          </h1>
          <p className="text-secondary small mb-0">
            Master queue controls, staff on-duty roster, and live service catalog pricing.
          </p>
        </div>

        {/* Lock / Logout Session Button */}
        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={handleLogout}
            className="btn btn-outline-secondary d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
            style={{ minHeight: '44px' }}
            title="Lock dashboard and end session"
          >
            <i className="bi bi-lock-fill text-warning"></i>
            <span className="small fw-semibold text-white">Lock / Logout</span>
          </button>
        </div>
      </div>

      {/* 1. Real-Time Daily Analytics Cards */}
      <div className="row g-3 g-md-4 mb-4">
        {/* Customers Served */}
        <div className="col-6 col-lg-3">
          <div className="salon-card p-3 p-md-4 h-100">
            <span className="text-secondary small d-block mb-1 text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
              Customers Served
            </span>
            <div className="d-flex align-items-baseline gap-2">
              <span className="display-6 fw-bold" style={{ fontFamily: "'Fraunces', serif", color: 'var(--accent-color)' }}>
                {stats.customersServed}
              </span>
              <span className="small text-secondary">today</span>
            </div>
            <small className="text-secondary d-block mt-2">
              <i className="bi bi-check2-circle text-success me-1"></i> Completed checkout
            </small>
          </div>
        </div>

        {/* Average Wait Time */}
        <div className="col-6 col-lg-3">
          <div className="salon-card p-3 p-md-4 h-100">
            <span className="text-secondary small d-block mb-1 text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
              Avg Wait Time
            </span>
            <div className="d-flex align-items-baseline gap-2">
              <span className="display-6 fw-bold" style={{ fontFamily: "'Fraunces', serif", color: 'var(--amber-warning)' }}>
                ~{stats.avgWaitTimeMinutes}
              </span>
              <span className="small text-secondary">mins</span>
            </div>
            <small className="text-secondary d-block mt-2">
              <i className="bi bi-clock-history me-1 text-warning"></i> Join to chair call
            </small>
          </div>
        </div>

        {/* No-Show Count */}
        <div className="col-6 col-lg-3">
          <div className="salon-card p-3 p-md-4 h-100">
            <span className="text-secondary small d-block mb-1 text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
              No-Show Count
            </span>
            <div className="d-flex align-items-baseline gap-2">
              <span className="display-6 fw-bold" style={{ fontFamily: "'Fraunces', serif", color: stats.noShowCount > 0 ? 'var(--color-danger)' : 'var(--text-secondary)' }}>
                {stats.noShowCount}
              </span>
              <span className="small text-secondary">tickets</span>
            </div>
            <small className="text-secondary d-block mt-2">
              <i className="bi bi-person-x me-1"></i> Unclaimed turns
            </small>
          </div>
        </div>

        {/* Today's Estimated Revenue */}
        <div className="col-6 col-lg-3">
          <div className="salon-card p-3 p-md-4 h-100">
            <span className="text-secondary small d-block mb-1 text-uppercase" style={{ fontSize: '0.72rem', letterSpacing: '0.08em' }}>
              Today's Revenue
            </span>
            <div className="d-flex align-items-baseline gap-2">
              <span className="display-6 fw-bold" style={{ fontFamily: "'Fraunces', serif", color: 'var(--color-success)' }}>
                ₹{stats.todayRevenue}
              </span>
            </div>
            <small className="text-secondary d-block mt-2">
              <i className="bi bi-cash-stack text-success me-1"></i> Offline desk totals
            </small>
          </div>
        </div>
      </div>

      {/* 2. Master Queue Switch & Business Hours Control */}
      <motion.div
        className="salon-card p-4 p-md-4 mb-4"
        style={{
          background: 'linear-gradient(180deg, rgba(22, 22, 28, 0.95) 0%, rgba(14, 14, 18, 0.98) 100%)',
          border: settings.isQueueOpen ? '1px solid var(--border-color)' : '1px solid var(--amber-warning)',
        }}
      >
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h3 className="salon-heading text-white mb-0" style={{ fontSize: '1.35rem' }}>
                Master Online Queue Control
              </h3>
              <span className={`badge ${settings.isQueueOpen ? 'badge-status-in-chair' : 'badge-status-waiting'} px-3 py-1 rounded-pill`}>
                {settings.isQueueOpen ? 'Queue is OPEN' : 'Queue is CLOSED'}
              </span>
            </div>
            <p className="text-secondary small mb-0" style={{ maxWidth: '620px' }}>
              {settings.isQueueOpen
                ? 'Customers can join the queue online from home. When closed, remote sign-ups are paused while Reception walk-ins remain active.'
                : 'Online joining is paused. New clients on the website will be advised to walk in directly.'}
            </p>
          </div>

          <div className="d-flex align-items-center gap-3">
            <button
              type="button"
              onClick={handleToggleQueue}
              className={`btn px-4 py-3 fw-bold d-inline-flex align-items-center gap-2 ${
                settings.isQueueOpen ? 'btn-outline-gold' : 'btn-gold shadow-lg'
              }`}
              style={{ minHeight: '48px', borderRadius: '12px' }}
            >
              <i className={`bi ${settings.isQueueOpen ? 'bi-pause-circle-fill' : 'bi-play-circle-fill'} fs-5`}></i>
              <span>{settings.isQueueOpen ? 'Close Online Queue' : 'Open Online Queue'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 3. Barber Staff Management Panel */}
      <motion.div className="salon-card p-4 p-md-4 mb-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-people-fill fs-4" style={{ color: 'var(--accent-color)' }}></i>
            <h3 className="salon-heading text-white mb-0" style={{ fontSize: '1.35rem' }}>
              Stylist Roster & Duty Schedule
            </h3>
          </div>
          <button
            type="button"
            onClick={handleOpenAddBarber}
            className="btn btn-gold btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
          >
            <i className="bi bi-person-plus-fill"></i>
            <span>+ Add New Barber</span>
          </button>
        </div>

        {/* Barber Table / Cards */}
        <div className="row g-3">
          {barbers.map((barber) => (
            <div key={barber._id} className="col-12 col-md-4">
              <div
                className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between"
                style={{
                  backgroundColor: 'rgba(8, 8, 10, 0.75)',
                  border: `1px solid ${barber.isOnDuty ? 'var(--border-color)' : 'rgba(255,255,255,0.06)'}`,
                  opacity: barber.isOnDuty ? 1 : 0.65,
                }}
              >
                <div>
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <BarberAvatar
                        name={barber.name}
                        size="md"
                        status={barber.status}
                        active={barber.isOnDuty}
                      />
                      <div>
                        <h5 className="salon-heading text-white mb-0" style={{ fontSize: '1.15rem' }}>
                          Barber {barber.name}
                        </h5>
                        <span className="small text-secondary text-capitalize">
                          Status: {barber.status}
                        </span>
                      </div>
                    </div>

                    <span className={`badge ${barber.isOnDuty ? 'badge-status-in-chair' : 'badge-status-done'} px-2 py-1 small rounded-pill`}>
                      {barber.isOnDuty ? 'On Duty' : 'Off Duty'}
                    </span>
                  </div>
                </div>

                {/* Duty Toggle & Edit Actions */}
                <div className="d-flex justify-content-between align-items-center pt-3 border-top" style={{ borderColor: 'var(--border-color)' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleBarberDuty(barber)}
                    className={`btn btn-sm ${barber.isOnDuty ? 'btn-outline-secondary' : 'btn-outline-gold'} px-3 py-1`}
                    style={{ fontSize: '0.8rem' }}
                    title={barber.isOnDuty ? 'Take off duty' : 'Put on duty'}
                  >
                    <i className={`bi ${barber.isOnDuty ? 'bi-toggle-on text-success fs-6' : 'bi-toggle-off fs-6'} me-1`}></i>
                    {barber.isOnDuty ? 'Set Off Duty' : 'Set On Duty'}
                  </button>

                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEditBarber(barber)}
                      className="btn btn-sm btn-outline-gold px-2 py-1"
                      title="Edit Barber"
                    >
                      <i className="bi bi-pencil-fill"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete({ type: 'barber', id: barber._id, name: barber.name })}
                      className="btn btn-sm btn-outline-danger px-2 py-1"
                      title="Remove Barber"
                    >
                      <i className="bi bi-trash-fill"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* 4. Service Catalog Management */}
      <motion.div className="salon-card p-4 p-md-4">
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-scissors fs-4" style={{ color: 'var(--accent-color)' }}></i>
            <h3 className="salon-heading text-white mb-0" style={{ fontSize: '1.35rem' }}>
              Services Catalog & Pricing
            </h3>
          </div>
          <button
            type="button"
            onClick={handleOpenAddService}
            className="btn btn-gold btn-sm d-flex align-items-center gap-2 px-3 py-2 rounded-pill"
          >
            <i className="bi bi-plus-circle-fill"></i>
            <span>+ Add New Service</span>
          </button>
        </div>

        {/* Services List Table */}
        <div className="table-responsive">
          <table className="table reception-table align-middle">
            <thead>
              <tr>
                <th>Service Name (EN / GU)</th>
                <th>Duration</th>
                <th>Price</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {services.map((srv) => (
                <tr key={srv._id} style={{ opacity: srv.isActive ? 1 : 0.6 }}>
                  <td>
                    <div className="fw-semibold text-white">
                      {srv.name?.en || (typeof srv.name === 'string' ? srv.name : 'Service')}
                    </div>
                    {srv.name?.gu && (
                      <small className="text-secondary">{srv.name.gu}</small>
                    )}
                  </td>
                  <td>
                    <span className="badge px-2 py-1" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
                      <i className="bi bi-clock me-1 text-warning"></i>
                      {srv.durationMinutes} mins
                    </span>
                  </td>
                  <td>
                    <span className="fw-bold" style={{ color: 'var(--accent-color)', fontSize: '1.1rem' }}>
                      ₹{srv.priceInr}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleToggleServiceActive(srv)}
                      className={`btn btn-sm ${srv.isActive ? 'btn-outline-gold' : 'btn-outline-secondary'} py-1 px-2`}
                      style={{ fontSize: '0.78rem' }}
                    >
                      <i className={`bi ${srv.isActive ? 'bi-check-circle-fill text-success' : 'bi-x-circle text-secondary'} me-1`}></i>
                      {srv.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="text-end">
                    <div className="d-inline-flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEditService(srv)}
                        className="btn btn-sm btn-outline-gold px-2 py-1"
                        title="Edit Service"
                      >
                        <i className="bi bi-pencil-fill"></i>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete({ type: 'service', id: srv._id, name: srv.name?.en || 'Service' })}
                        className="btn btn-sm btn-outline-danger px-2 py-1"
                        title="Delete Service"
                      >
                        <i className="bi bi-trash-fill"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* MODAL: ADD / EDIT SERVICE */}
      <AnimatePresence>
        {showServiceModal && (
          <div className="glass-modal-backdrop">
            <motion.div
              className="glass-modal p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="salon-heading text-white mb-0">
                  {editingService ? 'Edit Service' : 'Add New Service'}
                </h4>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowServiceModal(false)}
                />
              </div>

              <form onSubmit={handleSaveService}>
                <div className="mb-3">
                  <label className="form-label text-white small fw-semibold">
                    Service Name (English) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Beard Styling"
                    value={serviceForm.nameEn}
                    onChange={(e) => setServiceForm({ ...serviceForm, nameEn: e.target.value })}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label text-white small fw-semibold">
                    Service Name (Gujarati)
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="દા.ત. દાઢી સ્ટાઈલિંગ"
                    value={serviceForm.nameGu}
                    onChange={(e) => setServiceForm({ ...serviceForm, nameGu: e.target.value })}
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-6">
                    <label className="form-label text-white small fw-semibold">
                      Duration (Minutes) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={5}
                      step={5}
                      className="form-control"
                      value={serviceForm.durationMinutes}
                      onChange={(e) => setServiceForm({ ...serviceForm, durationMinutes: e.target.value })}
                    />
                  </div>
                  <div className="col-6">
                    <label className="form-label text-white small fw-semibold">
                      Price (₹ INR) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      step={10}
                      className="form-control"
                      value={serviceForm.priceInr}
                      onChange={(e) => setServiceForm({ ...serviceForm, priceInr: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-check form-switch mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="serviceActiveSwitch"
                    checked={serviceForm.isActive}
                    onChange={(e) => setServiceForm({ ...serviceForm, isActive: e.target.checked })}
                  />
                  <label className="form-check-label text-white small" htmlFor="serviceActiveSwitch">
                    Active & Available in Queue
                  </label>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowServiceModal(false)}
                    className="btn btn-outline-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-gold px-4">
                    Save Service
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ADD / EDIT BARBER */}
      <AnimatePresence>
        {showBarberModal && (
          <div className="glass-modal-backdrop">
            <motion.div
              className="glass-modal p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                <h4 className="salon-heading text-white mb-0">
                  {editingBarber ? 'Edit Stylist' : 'Add New Stylist'}
                </h4>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowBarberModal(false)}
                />
              </div>

              <form onSubmit={handleSaveBarber}>
                <div className="mb-3">
                  <label className="form-label text-white small fw-semibold">
                    Barber Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Sameer"
                    value={barberForm.name}
                    onChange={(e) => setBarberForm({ ...barberForm, name: e.target.value })}
                  />
                </div>

                {/* Vector Avatar Preset Selection */}
                <div className="mb-3">
                  <label className="form-label text-white small fw-semibold d-block">
                    Vector Avatar Style
                  </label>
                  <div className="d-flex gap-3 justify-content-center py-2">
                    {['Ravi', 'Amit', 'Imran', 'Any'].map((preset) => (
                      <div
                        key={preset}
                        onClick={() => setBarberForm({ ...barberForm, avatarPreset: preset })}
                        className="text-center cursor-pointer p-2 rounded-3"
                        style={{
                          border: barberForm.avatarPreset === preset ? '2px solid var(--accent-color)' : '1px solid transparent',
                          backgroundColor: barberForm.avatarPreset === preset ? 'rgba(229, 195, 120, 0.12)' : 'transparent',
                          cursor: 'pointer',
                        }}
                      >
                        <BarberAvatar name={preset} size="md" active={barberForm.avatarPreset === preset} />
                        <small className="d-block text-secondary mt-1" style={{ fontSize: '0.72rem' }}>
                          {preset}
                        </small>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="form-check form-switch mb-4">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="barberDutySwitch"
                    checked={barberForm.isOnDuty}
                    onChange={(e) => setBarberForm({ ...barberForm, isOnDuty: e.target.checked })}
                  />
                  <label className="form-check-label text-white small" htmlFor="barberDutySwitch">
                    On Duty Today (Accepts customers)
                  </label>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowBarberModal(false)}
                    className="btn btn-outline-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-gold px-4">
                    Save Stylist
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CONFIRM DELETE MODAL */}
      <AnimatePresence>
        {confirmDelete && (
          <div className="glass-modal-backdrop">
            <motion.div
              className="glass-modal p-4 text-center"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ maxWidth: '420px' }}
            >
              <i className="bi bi-exclamation-triangle text-warning display-4 d-block mb-2"></i>
              <h4 className="text-white mb-2">Confirm Removal</h4>
              <p className="text-secondary small mb-4">
                Are you sure you want to remove <strong>{confirmDelete.name}</strong> from the salon system?
              </p>
              <div className="d-flex justify-content-center gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(null)}
                  className="btn btn-outline-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (confirmDelete.type === 'service') {
                      handleDeleteService(confirmDelete.id);
                    } else {
                      handleDeleteBarber(confirmDelete.id);
                    }
                  }}
                  className="btn btn-danger"
                >
                  Yes, Remove
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
