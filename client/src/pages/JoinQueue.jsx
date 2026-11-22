import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';
import { socket } from '../services/socket';
import { BarberAvatar } from '../components/BarberAvatar';

export const JoinQueue = () => {
  const { lang, t } = useLanguage();
  const navigate = useNavigate();

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [preferredBarber, setPreferredBarber] = useState('any');

  // Data Sources
  const [servicesList, setServicesList] = useState([]);
  const [barbersList, setBarbersList] = useState([]);
  const [liveStatus, setLiveStatus] = useState(null);

  // UI / Submission state
  const [loadingData, setLoadingData] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [activeAlert, setActiveAlert] = useState(null);
  const [touched, setTouched] = useState({ name: false, phone: false });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servicesRes, barbersRes, statusRes] = await Promise.all([
          api.getServices(),
          api.getBarbers(),
          api.getSalonLiveStatus(),
        ]);

        if (servicesRes.success) setServicesList(servicesRes.services);
        if (barbersRes.success) setBarbersList(barbersRes.barbers);
        if (statusRes.success) setLiveStatus(statusRes);
      } catch (err) {
        console.error('Error fetching data for join queue:', err);
        setErrorMessage(t('networkError'));
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();

    const handleUpdate = () => fetchData();
    socket.on('queue:updated', handleUpdate);
    socket.on('salon:status-changed', handleUpdate);
    socket.on('services:updated', handleUpdate);

    return () => {
      socket.off('queue:updated', handleUpdate);
      socket.off('salon:status-changed', handleUpdate);
      socket.off('services:updated', handleUpdate);
    };
  }, []);

  // Validation
  const isNameValid = customerName.trim().length >= 2;
  const cleanPhone = phone.replace(/\D/g, '');
  const isPhoneValid = cleanPhone.length === 10;
  const isServicesValid = selectedServices.length >= 1 && selectedServices.length <= 3;
  const isFormValid = isNameValid && isPhoneValid && isServicesValid;

  // Toggle service selection with strict 3-service limit
  const toggleService = (serviceId) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices((prev) => prev.filter((id) => id !== serviceId));
    } else {
      if (selectedServices.length >= 3) return;
      setSelectedServices((prev) => [...prev, serviceId]);
    }
  };

  // Calculations for sticky summary
  const summary = useMemo(() => {
    const selectedObjects = servicesList.filter((s) => selectedServices.includes(s._id));
    const totalMinutes = selectedObjects.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const totalPrice = selectedObjects.reduce((acc, curr) => acc + (curr.priceInr || 0), 0);
    const baseWait = liveStatus?.estimatedWaitMinutes || 0;
    const expectedWait = baseWait;

    return {
      count: selectedObjects.length,
      totalMinutes,
      totalPrice,
      expectedWait,
      selectedObjects,
    };
  }, [selectedServices, servicesList, liveStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, phone: true });

    if (!isFormValid) {
      if (!isServicesValid) {
        setErrorMessage(t('minServiceRequired'));
      }
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setActiveAlert(null);

    try {
      const response = await api.joinQueue({
        customerName: customerName.trim(),
        phone: cleanPhone,
        services: selectedServices,
        preferredBarber,
      });

      if (response.ok && response.data.success) {
        const ticketId = response.data.ticket._id;
        localStorage.setItem('salon_active_ticket', ticketId);
        navigate(`/status/${ticketId}`);
      } else if (response.status === 409 && response.data.alreadyActive) {
        setActiveAlert(t('alreadyActiveAlert'));
        const existingTicketId = response.data.ticket._id;
        localStorage.setItem('salon_active_ticket', existingTicketId);
        setTimeout(() => {
          navigate(`/status/${existingTicketId}`);
        }, 1800);
      } else {
        setErrorMessage(response.data.message || 'Error joining queue.');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setErrorMessage(t('networkError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container py-4 py-md-5" style={{ maxWidth: '1060px' }}>
      {/* Top Breadcrumb & Heading with Breathing Room */}
      <motion.div
        className="mb-4 mb-md-5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link to="/" className="btn btn-sm btn-outline-gold mb-3 px-3 py-1 rounded-pill">
          <i className="bi bi-arrow-left me-1"></i> {t('backHome')}
        </Link>
        <h1 className="salon-heading mb-1" style={{ fontSize: '2.4rem' }}>
          {t('joinTitle')}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '640px' }} className="mb-0">
          {t('joinSubtitle')}
        </p>
      </motion.div>

      {activeAlert && (
        <div className="alert alert-info d-flex align-items-center mb-4 rounded-3" role="alert">
          <div className="spinner-border spinner-border-sm me-3" role="status"></div>
          <div>{activeAlert}</div>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger d-flex align-items-center mb-4 rounded-3" role="alert">
          <i className="bi bi-exclamation-octagon-fill me-2 fs-5"></i>
          <div>{errorMessage}</div>
        </div>
      )}

      {liveStatus?.isQueueOpen === false ? (
        <motion.div
          className="salon-card p-4 p-md-5 text-center my-4"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            border: '1.5px solid var(--amber-warning)',
            background: 'linear-gradient(180deg, rgba(26, 22, 16, 0.95) 0%, rgba(14, 12, 10, 0.98) 100%)',
          }}
        >
          <div
            className="mx-auto mb-3 d-flex align-items-center justify-content-center rounded-circle"
            style={{ width: '80px', height: '80px', background: 'rgba(217, 119, 6, 0.15)', border: '1px solid var(--amber-warning)' }}
          >
            <i className="bi bi-door-closed display-4 text-warning"></i>
          </div>
          <h2 className="salon-heading text-white mb-2">Online Joining is Closed</h2>
          <p className="text-secondary mx-auto mb-4" style={{ maxWidth: '520px', fontSize: '1.05rem' }}>
            Online joining is closed for today. Walk-ins are still welcome at the salon. Please visit our front desk to take a spot.
          </p>
          <Link to="/" className="btn btn-gold px-4 py-2">
            <i className="bi bi-house me-1"></i> Return to Home
          </Link>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit}>
        <div className="row g-4 g-lg-5">
          {/* Main Form Left Column */}
          <div className="col-lg-8">
            {/* 1. Customer Details */}
            <motion.div
              className="salon-card p-4 p-md-5 mb-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="d-flex align-items-center gap-2 mb-3">
                <i className="bi bi-person-circle fs-5" style={{ color: 'var(--accent-color)' }}></i>
                <h5 className="salon-heading mb-0" style={{ fontSize: '1.25rem' }}>
                  1. Customer Details
                </h5>
              </div>

              <div className="mb-4">
                <label className="form-label text-white fw-semibold small" htmlFor="customerName">
                  {t('fullName')} <span className="text-danger">*</span>
                </label>
                <input
                  id="customerName"
                  type="text"
                  className={`form-control ${
                    touched.name && !isNameValid ? 'is-invalid' : touched.name && isNameValid ? 'is-valid' : ''
                  }`}
                  placeholder={t('fullNamePlaceholder')}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onBlur={() => setTouched((p) => ({ ...p, name: true }))}
                  required
                />
                {touched.name && !isNameValid && (
                  <div className="invalid-feedback">{t('nameValidation')}</div>
                )}
              </div>

              <div>
                <label className="form-label text-white fw-semibold small" htmlFor="phone">
                  {t('phone')} <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-secondary">+91</span>
                  <input
                    id="phone"
                    type="tel"
                    maxLength={10}
                    className={`form-control ${
                      touched.phone && !isPhoneValid ? 'is-invalid' : touched.phone && isPhoneValid ? 'is-valid' : ''
                    }`}
                    placeholder={t('phonePlaceholder')}
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setPhone(val);
                    }}
                    onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                    required
                  />
                </div>
                <div className="d-flex justify-content-between mt-2">
                  <small style={{ color: 'var(--text-secondary)' }}>{t('phoneHelp')}</small>
                  <small className={cleanPhone.length === 10 ? 'text-success fw-semibold' : 'text-muted'}>
                    {cleanPhone.length}/10 digits
                  </small>
                </div>
                {touched.phone && !isPhoneValid && (
                  <div className="text-danger small mt-1">{t('phoneValidation')}</div>
                )}
              </div>
            </motion.div>

            {/* 2. Service Selection Cards */}
            <motion.div
              className="salon-card p-4 p-md-5 mb-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-card-checklist fs-5" style={{ color: 'var(--accent-color)' }}></i>
                  <h5 className="salon-heading mb-0" style={{ fontSize: '1.25rem' }}>
                    2. {t('servicesTitle')}
                  </h5>
                </div>
                <span className="badge badge-accent px-3 py-1 rounded-pill">
                  {selectedServices.length}/3 Selected
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)' }} className="small mb-4">
                {t('servicesSub')}
              </p>

              {selectedServices.length >= 3 && (
                <div className="alert alert-warning py-2 px-3 small d-flex align-items-center mb-3 rounded-3">
                  <i className="bi bi-info-circle-fill me-2 text-warning"></i>
                  {t('maxServicesReached')}
                </div>
              )}

              {loadingData ? (
                <div className="text-center py-4 text-muted">
                  <div className="spinner-border text-warning spinner-border-sm me-2"></div>
                  {t('loadingStatus')}
                </div>
              ) : (
                <div className="row g-3">
                  {servicesList.map((service) => {
                    const isSelected = selectedServices.includes(service._id);
                    const isDisabled = !isSelected && selectedServices.length >= 3;
                    const serviceName = service.name?.[lang] || service.name?.en || service.name;

                    return (
                      <div key={service._id} className="col-12 col-md-6">
                        <div
                          className={`selectable-card d-flex justify-content-between align-items-center ${
                            isSelected ? 'selected' : ''
                          } ${isDisabled ? 'disabled' : ''}`}
                          onClick={() => !isDisabled && toggleService(service._id)}
                          role="checkbox"
                          aria-checked={isSelected}
                          aria-disabled={isDisabled}
                          tabIndex={isDisabled ? -1 : 0}
                          onKeyDown={(e) => {
                            if (e.key === ' ' || e.key === 'Enter') {
                              e.preventDefault();
                              if (!isDisabled) toggleService(service._id);
                            }
                          }}
                        >
                          <div>
                            <div className="fw-semibold text-white mb-1" style={{ fontSize: '0.98rem' }}>
                              {serviceName}
                            </div>
                            <div className="small d-flex align-items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                              <span>
                                <i className="bi bi-clock me-1 text-warning"></i>
                                {service.durationMinutes} {t('minutes')}
                              </span>
                              <span>•</span>
                              <span className="fw-semibold" style={{ color: 'var(--accent-color)' }}>
                                ₹{service.priceInr}
                              </span>
                            </div>
                          </div>

                          <div className="ms-2">
                            {isSelected ? (
                              <i className="bi bi-check-circle-fill fs-4" style={{ color: 'var(--accent-color)' }}></i>
                            ) : (
                              <i className="bi bi-circle fs-4 text-secondary opacity-50"></i>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* 3. Barber Preference (Fully Working & Verified) */}
            <motion.div
              className="salon-card p-4 p-md-5 mb-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
            >
              <div className="d-flex align-items-center gap-2 mb-2">
                <i className="bi bi-scissors fs-5" style={{ color: 'var(--accent-color)' }}></i>
                <h5 className="salon-heading mb-0" style={{ fontSize: '1.25rem' }}>
                  3. {t('barberTitle')}
                </h5>
              </div>
              <p style={{ color: 'var(--text-secondary)' }} className="small mb-4">
                {t('barberSub')}
              </p>

              <div className="row g-3">
                {/* Option 1: Any Barber (Fastest) */}
                <div className="col-12 col-md-6">
                  <div
                    className={`selectable-card d-flex align-items-center justify-content-between ${
                      preferredBarber === 'any' ? 'selected' : ''
                    }`}
                    onClick={() => setPreferredBarber('any')}
                    role="radio"
                    aria-checked={preferredBarber === 'any'}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === ' ' || e.key === 'Enter') setPreferredBarber('any');
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <BarberAvatar
                        name="any"
                        size={48}
                        active={preferredBarber === 'any'}
                      />
                      <div>
                        <div className="fw-semibold text-white">{t('fastestAvailable')}</div>
                        <small style={{ color: 'var(--text-secondary)' }}>First available chair</small>
                      </div>
                    </div>

                    <div>
                      {preferredBarber === 'any' ? (
                        <i className="bi bi-check-circle-fill fs-4" style={{ color: 'var(--accent-color)' }}></i>
                      ) : (
                        <i className="bi bi-circle fs-4 text-secondary opacity-50"></i>
                      )}
                    </div>
                  </div>
                </div>

                {/* Option 2: Individual Barbers */}
                {barbersList.map((barber) => {
                  const isSelected = preferredBarber === barber.name || preferredBarber === barber._id;
                  return (
                    <div key={barber._id} className="col-12 col-md-6">
                      <div
                        className={`selectable-card d-flex align-items-center justify-content-between ${
                          isSelected ? 'selected' : ''
                        }`}
                        onClick={() => setPreferredBarber(barber.name)}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') setPreferredBarber(barber.name);
                        }}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <BarberAvatar
                            name={barber.name}
                            size={48}
                            status={barber.status}
                            active={isSelected}
                            showStatusDot
                          />
                          <div>
                            <div className="fw-semibold text-white">{barber.name}</div>
                            <small className="text-capitalize" style={{ color: 'var(--text-secondary)' }}>
                              Status: {barber.status}
                            </small>
                          </div>
                        </div>

                        <div>
                          {isSelected ? (
                            <i className="bi bi-check-circle-fill fs-4" style={{ color: 'var(--accent-color)' }}></i>
                          ) : (
                            <i className="bi bi-circle fs-4 text-secondary opacity-50"></i>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Sticky Summary Bar / Card Right Column */}
          <div className="col-lg-4">
            <motion.div
              className="salon-card p-4 sticky-summary"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
            >
              <div className="d-flex align-items-center gap-2 mb-3 border-bottom pb-3" style={{ borderColor: 'var(--border-color)' }}>
                <i className="bi bi-receipt fs-5" style={{ color: 'var(--accent-color)' }}></i>
                <h5 className="salon-heading mb-0" style={{ fontSize: '1.25rem' }}>
                  {t('summaryTitle')}
                </h5>
              </div>

              {/* Selected Services Breakdown */}
              <div className="mb-3">
                <span className="small d-block mb-2 fw-medium" style={{ color: 'var(--text-secondary)' }}>
                  {t('selectedServicesCount')} ({summary.count}/3):
                </span>
                {summary.selectedObjects.length > 0 ? (
                  <ul className="list-unstyled mb-0">
                    {summary.selectedObjects.map((s) => (
                      <li key={s._id} className="d-flex justify-content-between small text-white py-2 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                        <span>{s.name?.[lang] || s.name?.en || s.name}</span>
                        <span style={{ color: 'var(--accent-color)' }} className="fw-semibold">
                          ₹{s.priceInr}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="small text-warning fst-italic mb-0">
                    {t('minServiceRequired')}
                  </p>
                )}
              </div>

              {/* Preferred Stylist Highlight */}
              <div className="d-flex justify-content-between align-items-center p-2 mb-3 rounded-3" style={{ background: 'rgba(229, 195, 120, 0.08)', border: '1px solid rgba(229, 195, 120, 0.2)' }}>
                <span className="small text-secondary fw-medium">Stylist:</span>
                <span className="badge badge-accent px-2 py-1">
                  {preferredBarber === 'any' ? t('fastestAvailable') : `Barber ${preferredBarber}`}
                </span>
              </div>

              {/* Metrics */}
              <div className="p-3 rounded-3 mb-4" style={{ backgroundColor: 'rgba(8, 8, 10, 0.75)', border: '1px solid var(--border-color)' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="small" style={{ color: 'var(--text-secondary)' }}>{t('totalDuration')}:</span>
                  <span className="fw-bold text-white">{summary.totalMinutes} {t('minutes')}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="small" style={{ color: 'var(--text-secondary)' }}>{t('expectedWait')}:</span>
                  <span className="fw-bold" style={{ color: 'var(--status-waiting)' }}>
                    ~{summary.expectedWait} {t('minutes')}
                  </span>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="fw-bold text-white">{t('totalPrice')}:</span>
                  <span className="fw-bold fs-5" style={{ color: 'var(--accent-color)' }}>₹{summary.totalPrice}</span>
                </div>
              </div>

              {/* Confirm & Join Button */}
              <button
                type="submit"
                className="btn btn-gold w-100 py-3 fw-bold text-uppercase shadow-lg"
                disabled={!isFormValid || submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    {t('joining')}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check2-circle me-2 fs-5"></i>
                    {t('confirmAndJoin')}
                  </>
                )}
              </button>

              <small className="text-center d-block mt-3" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Walk-ins pay offline at the desk upon service completion.
              </small>
            </motion.div>
          </div>
        </div>
      </form>
      )}
    </div>
  );
};
