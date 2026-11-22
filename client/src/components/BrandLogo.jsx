import React from 'react';
import { Link } from 'react-router-dom';

export const BrandLogo = ({ size = 'md', to = '/' }) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 34;

  const content = (
    <div className="d-flex align-items-center gap-2 brand-logo-root">
      {/* Luxury Vector Emblem */}
      <div
        className="brand-emblem-wrap d-flex align-items-center justify-content-center"
        style={{
          width: `${iconSize + 6}px`,
          height: `${iconSize + 6}px`,
          borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(229, 195, 120, 0.16) 0%, rgba(14, 14, 18, 0.9) 100%)',
          border: '1px solid rgba(229, 195, 120, 0.3)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
          flexShrink: 0,
        }}
      >
        <svg
          width={iconSize - 6}
          height={iconSize - 6}
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="brandGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF9E6" />
              <stop offset="45%" stopColor="#E5C378" />
              <stop offset="100%" stopColor="#A37E3E" />
            </linearGradient>
            <linearGradient id="brandBladeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8E8A80" />
              <stop offset="50%" stopColor="#E5C378" />
              <stop offset="100%" stopColor="#FFFFFF" />
            </linearGradient>
          </defs>
          {/* Regal Crown Peaks */}
          <path
            d="M6 14L10 24H26L30 14L22 18L18 8L14 18L6 14Z"
            fill="url(#brandGoldGrad)"
            stroke="url(#brandGoldGrad)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
          {/* Crown Jewels Dots */}
          <circle cx="6" cy="12" r="1.5" fill="#FFF9E6" />
          <circle cx="18" cy="6.5" r="1.8" fill="#FFF9E6" />
          <circle cx="30" cy="12" r="1.5" fill="#FFF9E6" />
          {/* Crossed Precision Barber Scissors at base */}
          <path
            d="M11 27L25 27M13 25L23 29M23 25L13 29"
            stroke="url(#brandBladeGrad)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="18" cy="27" r="1.2" fill="#E5C378" />
        </svg>
      </div>
    </div>
  );

  if (!to) return content;

  return (
    <Link to={to} className="text-decoration-none">
      {content}
    </Link>
  );
};
