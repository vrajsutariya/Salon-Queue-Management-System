import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { socket } from '../services/socket';
import { BrandLogo } from './BrandLogo';

export const Navbar = () => {
  const { lang, toggleLanguage, t } = useLanguage();
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const navLinks = [
    { to: '/', label: t('home'), icon: 'bi-house' },
    { to: '/join', label: t('joinQueue'), icon: 'bi-person-plus' },
    { to: '/reception', label: t('reception'), icon: 'bi-clipboard2-check' },
    { to: '/barber/Ravi', label: t('barberView'), icon: 'bi-scissors' },
    { to: '/display', label: t('waitingTV'), icon: 'bi-tv' },
    { to: '/admin', label: t('admin'), icon: 'bi-gear' },
  ];

  return (
    <header className="floating-nav-wrapper">
      <motion.nav
        className="floating-nav-island d-flex align-items-center justify-content-between mx-auto"
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        aria-label="Main Navigation"
      >
        {/* Brand Logo */}
        <div className="pe-2">
          <BrandLogo size="sm" />
        </div>

        {/* Snug Cohesive Navigation Links */}
        <div className="d-none d-lg-flex align-items-center gap-1 px-1">
          {navLinks.map((link) => {
            const isCustomActive = link.to.startsWith('/barber')
              ? location.pathname.startsWith('/barber')
              : undefined;

            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `floating-nav-link ${(isCustomActive ?? isActive) ? 'active' : ''}`
                }
              >
                <i className={`bi ${link.icon} opacity-75`}></i>
                <span>{link.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Right Controls: Live Status & Language Switch */}
        <div className="d-flex align-items-center gap-2 ps-2">

          {/* Dual-Language Toggle Pill */}
          <button
            type="button"
            className="btn btn-sm btn-outline-gold d-flex align-items-center gap-1 px-2 py-1 rounded-pill"
            style={{ fontSize: '0.78rem', minHeight: '32px' }}
            onClick={toggleLanguage}
            aria-label="Switch Language"
          >
            <i className="bi bi-translate text-warning"></i>
            <span className="fw-semibold">{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
          </button>

          {/* Mobile Hamburger Toggle */}
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-lg-none d-flex align-items-center justify-content-center p-1 rounded-circle"
            style={{ width: '36px', height: '36px' }}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            <i className={`bi ${mobileMenuOpen ? 'bi-x-lg' : 'bi-list'} fs-5 text-white`}></i>
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer Dropdown with Framer Motion */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="d-lg-none mt-2 p-3 rounded-4 shadow-lg mx-auto"
            style={{
              maxWidth: '860px',
              background: 'rgba(14, 14, 18, 0.96)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid rgba(229, 195, 120, 0.25)',
              pointerEvents: 'auto',
            }}
          >
            <div className="d-flex flex-column gap-2">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `floating-nav-link w-100 py-2 px-3 ${isActive ? 'active' : ''}`
                  }
                >
                  <i className={`bi ${link.icon} me-2 text-warning`}></i>
                  <span>{link.label}</span>
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
