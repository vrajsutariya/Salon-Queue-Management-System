import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

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
      if (selectedServices.length >= 3) {
        // Block 4th selection
        return;
      }
      setSelectedServices((prev) => [...prev, serviceId]);
    }
  };

  // Calculations for sticky summary
  const summary = useMemo(() => {
    const selectedObjects = servicesList.filter((s) => selectedServices.includes(s._id));
    const totalMinutes = selectedObjects.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    const totalPrice = selectedObjects.reduce((acc, curr) => acc + (curr.priceInr || 0), 0);

    // Dynamic wait estimate: current salon queue wait + this service
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
        // Store in localStorage for status persistence
        localStorage.setItem('salon_active_ticket', ticketId);
        navigate(`/status/${ticketId}`);
      } else if (response.status === 409 && response.data.alreadyActive) {
        // Existing ticket found
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
    <div className="container py-4 animate-fade-in-up">
      <div className="mb-4">
        <Link to="/" className="btn btn-sm btn-outline-gold mb-2">
          <i className="bi bi-arrow-left me-1"></i> {t('backHome')}
        </Link>
        <h2 className="fw-bold mb-1" style={{ color: 'var(--text-main)' }}>
          {t('joinTitle')}
        </h2>
        <p className="text-muted mb-0">{t('joinSubtitle')}</p>
      </div>

      {activeAlert && (
        <div className="alert alert-info d-flex align-items-center mb-4" role="alert">
          <div className="spinner-border spinner-border-sm me-3" role="status"></div>
          <div>{activeAlert}</div>
        </div>
      )}

      {errorMessage && (
        <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
          <i className="bi bi-exclamation-octagon-fill me-2 fs-5"></i>
          <div>{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row g-4">
          {/* Main Form Left Column */}
          <div className="col-lg-8">
            {/* 1. Customer Details */}
            <div className="salon-card p-4 mb-4">
              <h5 className="fw-bold mb-3" style={{ color: 'var(--accent-gold)' }}>
                <i className="bi bi-person-circle me-2"></i>1. Customer Information
              </h5>

              <div className="mb-3">
                <label className="form-label text-white fw-semibold" htmlFor="customerName">
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
                <label className="form-label text-white fw-semibold" htmlFor="phone">
                  {t('phone')} <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-dark border-secondary text-muted">+91</span>
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
                <div className="d-flex justify-content-between mt-1">
                  <small className="text-muted">{t('phoneHelp')}</small>
                  <small className={cleanPhone.length === 10 ? 'text-success' : 'text-muted'}>
                    {cleanPhone.length}/10 digits
                  </small>
                </div>
                {touched.phone && !isPhoneValid && (
                  <div className="text-danger small mt-1">{t('phoneValidation')}</div>
                )}
              </div>
            </div>

            {/* 2. Service Selection Cards */}
            <div className="salon-card p-4 mb-4">
              <div className="d-flex flex-wrap align-items-center justify-content-between mb-2">
                <h5 className="fw-bold mb-0" style={{ color: 'var(--accent-gold)' }}>
                  <i className="bi bi-card-checklist me-2"></i>2. {t('servicesTitle')}
                </h5>
                <span className="badge badge-gold">
                  {selectedServices.length}/3 Selected
                </span>
              </div>
              <p className="text-muted small mb-3">{t('servicesSub')}</p>

              {selectedServices.length >= 3 && (
                <div className="alert alert-warning py-2 px-3 small d-flex align-items-center mb-3">
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
                    const serviceName =
                      service.name?.[lang] || service.name?.en || service.name;

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
                            <div className="fw-bold text-white mb-1">{serviceName}</div>
                            <div className="small text-muted d-flex align-items-center gap-2">
                              <span>
                                <i className="bi bi-clock me-1 text-warning"></i>
                                {service.durationMinutes} {t('minutes')}
                              </span>
                              <span>•</span>
                              <span className="fw-semibold" style={{ color: 'var(--accent-gold)' }}>
                                ₹{service.priceInr}
                              </span>
                            </div>
                          </div>

                          <div className="ms-2">
                            {isSelected ? (
                              <i className="bi bi-check-circle-fill fs-4" style={{ color: 'var(--accent-gold)' }}></i>
                            ) : (
                              <i className="bi bi-circle fs-4 text-muted"></i>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Barber Picker */}
            <div className="salon-card p-4 mb-4">
              <h5 className="fw-bold mb-1" style={{ color: 'var(--accent-gold)' }}>
                <i className="bi bi-scissors me-2"></i>3. {t('barberTitle')}
              </h5>
              <p className="text-muted small mb-3">{t('barberSub')}</p>

              <div className="row g-3">
                {/* Option 1: Any Barber (Fastest) */}
                <div className="col-12 col-md-6">
                  <div
                    className={`selectable-card d-flex align-items-center gap-3 ${
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
                    <div
                      className="rounded-circle d-flex align-items-center justify-content-center"
                      style={{
                        width: '42px',
                        height: '42px',
                        backgroundColor: 'var(--accent-gold-light)',
                        color: 'var(--accent-gold)',
                        border: '1px solid var(--accent-gold)',
                      }}
                    >
                      <i className="bi bi-lightning-charge-fill fs-5"></i>
                    </div>
                    <div>
                      <div className="fw-bold text-white">{t('fastestAvailable')}</div>
                      <small className="text-muted">First available chair</small>
                    </div>
                  </div>
                </div>

                {/* Option 2: Individual Barbers */}
                {barbersList.map((barber) => {
                  const isSelected = preferredBarber === barber._id || preferredBarber === barber.name;
                  return (
                    <div key={barber._id} className="col-12 col-md-6">
                      <div
                        className={`selectable-card d-flex align-items-center gap-3 ${
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
                        <img
                          src={barber.photo || 'https://via.placeholder.com/42'}
                          alt={barber.name}
                          className="rounded-circle border"
                          style={{
                            width: '42px',
                            height: '42px',
                            objectFit: 'cover',
                            borderColor: 'var(--border-color)',
                          }}
                        />
                        <div>
                          <div className="fw-bold text-white">{barber.name}</div>
                          <small className="text-muted text-capitalize">
                            Status: {barber.status}
                          </small>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sticky Summary Bar / Card Right Column */}
          <div className="col-lg-4">
            <div className="salon-card p-4 sticky-summary">
              <h5 className="fw-bold mb-3 border-bottom pb-2" style={{ color: 'var(--accent-gold)', borderColor: 'var(--border-color)' }}>
                <i className="bi bi-receipt me-2"></i>{t('summaryTitle')}
              </h5>

              {/* Selected Services Breakdown */}
              <div className="mb-3">
                <span className="small text-muted d-block mb-2">{t('selectedServicesCount')} ({summary.count}/3):</span>
                {summary.selectedObjects.length > 0 ? (
                  <ul className="list-unstyled mb-0">
                    {summary.selectedObjects.map((s) => (
                      <li key={s._id} className="d-flex justify-content-between small text-white py-1 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
                        <span>{s.name?.[lang] || s.name?.en || s.name}</span>
                        <span style={{ color: 'var(--accent-gold)' }}>₹{s.priceInr}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="small text-warning fst-italic mb-0">
                    {t('minServiceRequired')}
                  </p>
                )}
              </div>

              {/* Metrics */}
              <div className="p-3 rounded mb-3" style={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-color)' }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">{t('totalDuration')}:</span>
                  <span className="fw-bold text-white">{summary.totalMinutes} {t('minutes')}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted small">{t('expectedWait')}:</span>
                  <span className="fw-bold" style={{ color: 'var(--status-waiting)' }}>
                    ~{summary.expectedWait} {t('minutes')}
                  </span>
                </div>
                <div className="d-flex justify-content-between pt-2 border-top" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="fw-bold text-white">{t('totalPrice')}:</span>
                  <span className="fw-bold fs-5" style={{ color: 'var(--accent-gold)' }}>₹{summary.totalPrice}</span>
                </div>
              </div>

              {/* Confirm & Join Button */}
              <button
                type="submit"
                className="btn btn-gold w-100 py-3 fw-bold text-uppercase shadow"
                disabled={!isFormValid || submitting}
              >
                {submitting ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    {t('joining')}
                  </>
                ) : (
                  <>
                    <i className="bi bi-check-lg me-2 fs-5"></i>
                    {t('confirmAndJoin')}
                  </>
                )}
              </button>

              <small className="text-muted text-center d-block mt-3" style={{ fontSize: '0.75rem' }}>
                Offline payment in cash/UPI upon completion at the salon desk.
              </small>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
