import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

/**
 * Mobile Navigation Dock
 * Ultra-sleek, thumb-friendly bottom navigation bar for mobile recording & handheld usage.
 * Strictly visible on mobile & tablet viewports (d-lg-none).
 */
export const MobileNavDock = () => {
  const { t } = useLanguage();
  const location = useLocation();

  const navItems = [
    { to: '/', label: t('home'), icon: 'bi-house-door-fill' },
    { to: '/join', label: t('joinQueue'), icon: 'bi-person-plus-fill' },
    { to: '/reception', label: t('reception'), icon: 'bi-clipboard2-check-fill' },
    { to: '/barber/Ravi', label: t('barberView'), icon: 'bi-scissors', matchPrefix: '/barber' },
    { to: '/admin', label: t('admin'), icon: 'bi-gear-fill' },
  ];

  return (
    <nav
      className="mobile-nav-dock d-lg-none"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="mobile-nav-dock-inner d-flex align-items-center justify-content-around">
        {navItems.map((item) => {
          const isActive = item.matchPrefix
            ? location.pathname.startsWith(item.matchPrefix)
            : location.pathname === item.to;

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`mobile-nav-dock-item ${isActive ? 'active' : ''}`}
            >
              <div className="mobile-nav-dock-icon-wrap">
                <i className={`bi ${item.icon}`}></i>
                {isActive && <span className="mobile-nav-dock-dot" />}
              </div>
              <span className="mobile-nav-dock-label">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};
