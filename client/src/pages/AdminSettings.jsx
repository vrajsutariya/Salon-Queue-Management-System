import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export const AdminSettings = () => {
  const { lang, t } = useLanguage();
  const [barbers, setBarbers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [bRes, sRes] = await Promise.all([api.getBarbers(), api.getServices()]);
        if (bRes.success) setBarbers(bRes.barbers || []);
        if (sRes.success) setServices(sRes.services || []);
      } catch (err) {
        console.error('Error fetching admin data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="container py-4 py-md-5" style={{ maxWidth: '1060px' }}>
      <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-2">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-accent px-3 py-1 rounded-pill">
              <i className="bi bi-shield-lock me-1"></i> Salon Management
            </span>
          </div>
          <h1 className="salon-heading mb-1" style={{ fontSize: '2.4rem' }}>
            {t('admin')}
          </h1>
          <p style={{ color: 'var(--text-secondary)' }} className="mb-0 small">
            Salon operations, active staff roster, and live service catalog overview.
          </p>
        </div>
        <span className="badge badge-gold px-3 py-2 rounded-pill">Owner Dashboard</span>
      </div>

      <div className="row g-4 mb-4">
        {/* Salon Operating Status */}
        <div className="col-12 col-lg-6">
          <motion.div
            className="salon-card p-4 p-md-5 h-100"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="d-flex align-items-center gap-2 mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <i className="bi bi-toggles fs-4" style={{ color: 'var(--accent-color)' }}></i>
              <h4 className="salon-heading mb-0" style={{ fontSize: '1.25rem' }}>
                Operational Controls
              </h4>
            </div>

            <div
              className="d-flex justify-content-between align-items-center p-3 rounded-3 mb-3"
              style={{ backgroundColor: 'rgba(8, 8, 10, 0.75)', border: '1px solid var(--border-color)' }}
            >
              <div>
                <span className="fw-semibold text-white d-block">Operating Status</span>
                <small className="text-secondary">Walk-in queue acceptance</small>
              </div>
              <span className="badge badge-status-in-chair px-3 py-2 rounded-pill">
                <span className="dot-indicator dot-live me-1"></span> {t('salonOpen')}
              </span>
            </div>

            <div
              className="d-flex justify-content-between align-items-center p-3 rounded-3 mb-4"
              style={{ backgroundColor: 'rgba(8, 8, 10, 0.75)', border: '1px solid var(--border-color)' }}
            >
              <div>
                <span className="fw-semibold text-white d-block">Operating Hours</span>
                <small className="text-secondary">Standard daily walk-in window</small>
              </div>
              <span className="fw-bold" style={{ color: 'var(--accent-color)' }}>
                10:00 AM – 9:00 PM
              </span>
            </div>

            <div className="p-3 rounded-3" style={{ background: 'rgba(229, 195, 120, 0.06)', border: '1px solid rgba(229, 195, 120, 0.2)' }}>
              <div className="d-flex align-items-center gap-2 small" style={{ color: 'var(--accent-color)' }}>
                <i className="bi bi-info-circle-fill"></i>
                <span>Queue resets automatically every midnight for clean daily tokens (S-1, S-2...).</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Barber Roster */}
        <div className="col-12 col-lg-6">
          <motion.div
            className="salon-card p-4 p-md-5 h-100"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
              <div className="d-flex align-items-center gap-2">
                <i className="bi bi-people fs-4" style={{ color: 'var(--accent-color)' }}></i>
                <h4 className="salon-heading mb-0" style={{ fontSize: '1.25rem' }}>
                  Stylist Team Roster
                </h4>
              </div>
              <span className="badge badge-accent px-3 py-1 rounded-pill small">
                {barbers.length} Barbers
              </span>
            </div>

            {loading ? (
              <p className="text-secondary small py-4 text-center">Loading team roster...</p>
            ) : (
              <div className="d-flex flex-column gap-2">
                {barbers.map((barber, idx) => (
                  <div
                    key={barber._id}
                    className="p-3 rounded-3 d-flex justify-content-between align-items-center"
                    style={{ backgroundColor: 'rgba(8, 8, 10, 0.75)', border: '1px solid var(--border-color)' }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <img
                        src={barber.photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
                        alt={barber.name}
                        className="rounded-circle border"
                        style={{ width: '38px', height: '38px', objectFit: 'cover', borderColor: 'var(--border-color)' }}
                      />
                      <div>
                        <span className="fw-semibold text-white d-block">{barber.name}</span>
                        <small className="text-secondary">Station #{idx + 1}</small>
                      </div>
                    </div>
                    <span
                      className={`badge ${
                        barber.status === 'free'
                          ? 'badge-status-in-chair'
                          : barber.status === 'busy'
                          ? 'badge-status-noshow'
                          : 'badge-status-waiting'
                      } px-2 py-1 rounded-pill small text-capitalize`}
                    >
                      {barber.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Services Menu Catalog */}
      <motion.div
        className="salon-card p-4 p-md-5"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom" style={{ borderColor: 'var(--border-color)' }}>
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-journal-text fs-4" style={{ color: 'var(--accent-color)' }}></i>
            <h4 className="salon-heading mb-0" style={{ fontSize: '1.25rem' }}>
              Service Catalog
            </h4>
          </div>
          <span className="badge badge-accent px-3 py-1 rounded-pill small">
            {services.length} Active Services
          </span>
        </div>

        <div className="row g-3">
          {services.map((srv) => (
            <div key={srv._id} className="col-12 col-md-4">
              <div
                className="p-3 rounded-3 h-100 d-flex flex-column justify-content-between"
                style={{ backgroundColor: 'rgba(8, 8, 10, 0.75)', border: '1px solid var(--border-color)' }}
              >
                <div>
                  <h6 className="fw-semibold text-white mb-1">
                    {srv.name?.[lang] || srv.name?.en || srv.name}
                  </h6>
                  <small className="text-secondary d-block">
                    Standard Duration: {srv.durationMinutes} mins
                  </small>
                </div>
                <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top" style={{ borderColor: 'var(--border-color)' }}>
                  <span className="small text-secondary">Walk-in Price</span>
                  <span className="fw-bold" style={{ color: 'var(--accent-color)', fontSize: '1.05rem' }}>
                    ₹{srv.priceInr}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};
