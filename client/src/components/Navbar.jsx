import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export const Navbar = () => {
  const { lang, toggleLanguage, t } = useLanguage();

  return (
    <nav className="navbar navbar-expand-lg navbar-dark border-bottom sticky-top" style={{ backgroundColor: 'var(--bg-charcoal)', borderColor: 'var(--border-color)' }}>
      <div className="container-fluid px-3 px-md-4">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <span style={{ fontSize: '1.5rem' }}>✂️</span>
          <div>
            <span className="fw-bold" style={{ color: 'var(--accent-gold)' }}>Crown & Blade</span>
            <small className="d-block text-muted" style={{ fontSize: '0.7rem', lineHeight: 1 }}>{t('appSubtitle')}</small>
          </div>
        </Link>

        <div className="d-flex align-items-center gap-2 order-lg-last ms-2">
          {/* Language Toggle Button */}
          <button
            type="button"
            className="btn btn-sm btn-outline-gold d-flex align-items-center gap-1"
            onClick={toggleLanguage}
            aria-label="Switch Language"
            title="Switch Language"
          >
            <i className="bi bi-translate"></i>
            <span className="fw-bold">{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
          </button>

          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#salonNavbar"
            aria-controls="salonNavbar"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>
        </div>

        <div className="collapse navbar-collapse" id="salonNavbar">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active text-warning fw-semibold' : ''}`} to="/">
                <i className="bi bi-house-door me-1"></i>{t('home')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active text-warning fw-semibold' : ''}`} to="/join">
                <i className="bi bi-person-plus me-1"></i>{t('joinQueue')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active text-warning fw-semibold' : ''}`} to="/reception">
                <i className="bi bi-clipboard2-check me-1"></i>{t('reception')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active text-warning fw-semibold' : ''}`} to="/barber/Rahul">
                <i className="bi bi-scissors me-1"></i>{t('barberView')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active text-warning fw-semibold' : ''}`} to="/display">
                <i className="bi bi-tv me-1"></i>{t('waitingTV')}
              </NavLink>
            </li>
            <li className="nav-item">
              <NavLink className={({ isActive }) => `nav-link ${isActive ? 'active text-warning fw-semibold' : ''}`} to="/admin">
                <i className="bi bi-gear me-1"></i>{t('admin')}
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};
