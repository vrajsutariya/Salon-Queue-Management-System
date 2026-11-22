import React from 'react';

/**
 * Crown & Blade - Luxury Vector Avatar System
 * Clean, minimalist SVG vector illustrations with champagne-gold (#E8DCC8 / #E5C378)
 * and deep noir accents. Replaces inconsistent photos with polished geometric styling.
 */
export const BarberAvatar = ({
  name = '',
  size = 'md',
  status = null,
  active = false,
  showStatusDot = false,
  className = '',
  style = {},
}) => {
  // Standardize sizes: sm: 40px, md: 48px, lg/card: 64px, xl/tv: 80px
  let pixelSize = 48;
  if (typeof size === 'number') {
    pixelSize = size;
  } else {
    switch (size) {
      case 'xs':
        pixelSize = 32;
        break;
      case 'sm':
        pixelSize = 40;
        break;
      case 'md':
        pixelSize = 48;
        break;
      case 'lg':
      case 'card':
        pixelSize = 64;
        break;
      case 'xl':
      case 'tv':
        pixelSize = 80;
        break;
      default:
        pixelSize = 48;
    }
  }

  const normalizedName = String(name || '').trim().toLowerCase();

  // Dynamic border styling based on active or status state
  let borderColor = 'var(--border-color, rgba(229, 195, 120, 0.2))';
  let glowShadow = 'none';

  if (active || status === 'busy' || status === 'in-chair') {
    borderColor = 'var(--accent-color, #E5C378)';
    glowShadow = '0 0 12px rgba(229, 195, 120, 0.35)';
  } else if (status === 'break') {
    borderColor = 'var(--amber-warning, #D97706)';
    glowShadow = '0 0 8px rgba(217, 119, 6, 0.25)';
  } else if (status === 'free') {
    borderColor = 'rgba(46, 160, 67, 0.55)';
    glowShadow = '0 0 8px rgba(46, 160, 67, 0.2)';
  }

  // Render SVG illustration per barber
  const renderVectorIllustration = () => {
    if (normalizedName.includes('ravi')) {
      // Ravi: Classic Suave Master Stylist (Pompadour, Groomed Mustache, Tuxedo Shears)
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-100 h-100">
          <defs>
            <radialGradient id="raviBg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#252532" />
              <stop offset="100%" stopColor="#0D0D12" />
            </radialGradient>
            <linearGradient id="raviGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2D6" />
              <stop offset="50%" stopColor="#E5C378" />
              <stop offset="100%" stopColor="#B38B3F" />
            </linearGradient>
            <linearGradient id="raviSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E2C9A8" />
              <stop offset="100%" stopColor="#C4A882" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <rect width="100" height="100" rx="50" fill="url(#raviBg)" />

          {/* Torso / Stylist Vest */}
          <path d="M22 100C22 84 34 76 50 76C66 76 78 84 78 100H22Z" fill="#171720" />
          <path d="M40 76L50 88L60 76H40Z" fill="url(#raviSkin)" />
          {/* Vest Lapels */}
          <path d="M36 76L50 94L38 100H22C22 88 28 80 36 76Z" fill="#20202C" stroke="url(#raviGold)" strokeWidth="0.75" />
          <path d="M64 76L50 94L62 100H78C78 88 72 80 64 76Z" fill="#20202C" stroke="url(#raviGold)" strokeWidth="0.75" />
          {/* Gold Scissors Crest on chest */}
          <path d="M47 88L53 94M53 88L47 94" stroke="url(#raviGold)" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="50" cy="91" r="0.8" fill="#FFF2D6" />

          {/* Neck */}
          <rect x="44" y="60" width="12" height="18" rx="3" fill="url(#raviSkin)" />

          {/* Face */}
          <path d="M35 44C35 34 42 32 50 32C58 32 65 34 65 44C65 56 59 64 50 64C41 64 35 56 35 44Z" fill="url(#raviSkin)" />
          {/* Ears */}
          <circle cx="34" cy="46" r="3.5" fill="#C4A882" />
          <circle cx="66" cy="46" r="3.5" fill="#C4A882" />

          {/* Groomed Mustache & Goatee */}
          <path d="M43 53C47 55 53 55 57 53C58 55 54 57 50 57C46 57 42 55 43 53Z" fill="#181822" stroke="url(#raviGold)" strokeWidth="0.5" />
          <path d="M48 59C49 61 51 61 52 59C51 62 49 62 48 59Z" fill="#181822" />

          {/* Eyes & Brows */}
          <path d="M41 42C43 41 45 41 47 42" stroke="#181822" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M53 42C55 41 57 41 59 42" stroke="#181822" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="44" cy="45" r="1.3" fill="#181822" />
          <circle cx="56" cy="45" r="1.3" fill="#181822" />

          {/* Signature Pompadour Haircut with Gold Accents */}
          <path
            d="M32 40C31 29 37 17 50 17C64 17 68 28 68 38C64 36 60 36 57 33C52 30 44 31 38 36C35 38 33 39 32 40Z"
            fill="#181822"
          />
          <path
            d="M38 24C44 19 54 19 63 25"
            stroke="url(#raviGold)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          <path
            d="M42 29C48 25 56 26 62 31"
            stroke="url(#raviGold)"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      );
    }

    if (normalizedName.includes('amit')) {
      // Amit: Contemporary High-Fade Stylist with Razor Comb Accents
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-100 h-100">
          <defs>
            <radialGradient id="amitBg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#222733" />
              <stop offset="100%" stopColor="#0B0E14" />
            </radialGradient>
            <linearGradient id="amitGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF5DC" />
              <stop offset="50%" stopColor="#E5C378" />
              <stop offset="100%" stopColor="#A37E3E" />
            </linearGradient>
            <linearGradient id="amitSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ECCDB0" />
              <stop offset="100%" stopColor="#CDAC8C" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <rect width="100" height="100" rx="50" fill="url(#amitBg)" />

          {/* Modern Stylist Polo / Jacket */}
          <path d="M22 100C22 84 34 76 50 76C66 76 78 84 78 100H22Z" fill="#141820" />
          <path d="M42 76L50 86L58 76H42Z" fill="url(#amitSkin)" />
          {/* Sleek Golden Zipper / Collar Line */}
          <path d="M50 86V100" stroke="url(#amitGold)" strokeWidth="1.2" strokeLinecap="round" />
          {/* Subtle Comb emblem on shoulder */}
          <path d="M30 86H38M31 89H37M32 92H36" stroke="url(#amitGold)" strokeWidth="0.9" strokeLinecap="round" />

          {/* Neck */}
          <rect x="44" y="60" width="12" height="18" rx="3" fill="url(#amitSkin)" />

          {/* Face */}
          <path d="M36 43C36 34 42 32 50 32C58 32 64 34 64 43C64 56 58 64 50 64C42 64 36 56 36 43Z" fill="url(#amitSkin)" />
          {/* Ears */}
          <circle cx="35" cy="46" r="3.5" fill="#CDAC8C" />
          <circle cx="65" cy="46" r="3.5" fill="#CDAC8C" />

          {/* Trim Jawline Stubble */}
          <path d="M37 50C40 60 46 64 50 64C54 64 60 60 63 50C63 56 57 62 50 62C43 62 37 56 37 50Z" fill="#151922" opacity="0.6" />

          {/* Eyes & Modern Eyebrow Notch */}
          <path d="M41 42C43 41 45 41 47 42" stroke="#151922" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M53 42L55 42M56.5 42L59 42" stroke="#151922" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="44" cy="45" r="1.3" fill="#151922" />
          <circle cx="56" cy="45" r="1.3" fill="#151922" />

          {/* Contemporary Clean Textured Crop & Fade with Gold Hard Part */}
          <path
            d="M33 40C33 30 38 21 50 20C62 20 67 30 67 40C64 35 60 33 54 33C48 33 40 35 33 40Z"
            fill="#151922"
          />
          {/* Etched Gold Part Line */}
          <path d="M41 24L59 28" stroke="url(#amitGold)" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M43 29L57 32" stroke="url(#amitGold)" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
        </svg>
      );
    }

    if (normalizedName.includes('imran')) {
      // Imran: Senior Artisan Master Barber (Full Beard, Precision Apron & Vintage Shears)
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-100 h-100">
          <defs>
            <radialGradient id="imranBg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#2A2420" />
              <stop offset="100%" stopColor="#100C0A" />
            </radialGradient>
            <linearGradient id="imranGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF8E8" />
              <stop offset="50%" stopColor="#E5C378" />
              <stop offset="100%" stopColor="#A37E3E" />
            </linearGradient>
            <linearGradient id="imranSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D9B796" />
              <stop offset="100%" stopColor="#B89472" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <rect width="100" height="100" rx="50" fill="url(#imranBg)" />

          {/* Artisan Denim / Leather Barber Apron */}
          <path d="M22 100C22 84 34 76 50 76C66 76 78 84 78 100H22Z" fill="#1C1816" />
          <path d="M40 76L50 86L60 76H40Z" fill="url(#imranSkin)" />
          {/* Apron Leather Straps */}
          <path d="M34 78L44 100" stroke="url(#imranGold)" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M66 78L56 100" stroke="url(#imranGold)" strokeWidth="1.4" strokeLinecap="round" />
          {/* Vintage Razor Motif Pin */}
          <path d="M48 92L53 88M48 88L53 92" stroke="url(#imranGold)" strokeWidth="1.1" strokeLinecap="round" />

          {/* Neck */}
          <rect x="44" y="60" width="12" height="18" rx="3" fill="url(#imranSkin)" />

          {/* Face */}
          <path d="M36 43C36 34 42 32 50 32C58 32 64 34 64 43C64 56 58 64 50 64C42 64 36 56 36 43Z" fill="url(#imranSkin)" />
          {/* Ears */}
          <circle cx="35" cy="46" r="3.5" fill="#B89472" />
          <circle cx="65" cy="46" r="3.5" fill="#B89472" />

          {/* Master Full Manicured Beard with Gold Contour */}
          <path
            d="M35 48C35 63 42 70 50 70C58 70 65 63 65 48C65 52 61 58 57 59C54 60 46 60 43 59C39 58 35 52 35 48Z"
            fill="#1B1513"
          />
          <path
            d="M40 54C44 56 56 56 60 54C62 57 57 67 50 67C43 67 38 57 40 54Z"
            fill="#14100E"
            stroke="url(#imranGold)"
            strokeWidth="0.6"
          />

          {/* Eyes & Brows */}
          <path d="M41 42C43 40 45 40 47 42" stroke="#1B1513" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M53 42C55 40 57 40 59 42" stroke="#1B1513" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="44" cy="45" r="1.3" fill="#1B1513" />
          <circle cx="56" cy="45" r="1.3" fill="#1B1513" />

          {/* Neat Textured Haircut */}
          <path
            d="M34 40C33 28 40 21 50 21C60 21 67 28 66 40C63 35 59 34 50 34C41 34 37 35 34 40Z"
            fill="#1B1513"
          />
          <path
            d="M41 26C47 23 53 23 59 26"
            stroke="url(#imranGold)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      );
    }

    // Default / "Any" Barber / Fastest Chair Crest
    return (
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-100 h-100">
        <defs>
          <radialGradient id="anyBg" cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#252420" />
            <stop offset="100%" stopColor="#0D0D0B" />
          </radialGradient>
          <linearGradient id="anyGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFF9E8" />
            <stop offset="50%" stopColor="#E5C378" />
            <stop offset="100%" stopColor="#A37E3E" />
          </linearGradient>
        </defs>

        {/* Background circle */}
        <rect width="100" height="100" rx="50" fill="url(#anyBg)" />

        {/* Inner concentric ring */}
        <circle cx="50" cy="50" r="42" stroke="url(#anyGold)" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />

        {/* Crown Peaks at Top */}
        <path
          d="M36 34L41 42L50 28L59 42L64 34L61 46H39L36 34Z"
          fill="url(#anyGold)"
          opacity="0.85"
        />

        {/* Crossed Precision Barber Scissors */}
        {/* Blade 1 */}
        <path d="M32 68L68 32" stroke="url(#anyGold)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Blade 2 */}
        <path d="M68 68L32 32" stroke="url(#anyGold)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Scissor Finger Loops */}
        <circle cx="30" cy="70" r="6" stroke="url(#anyGold)" strokeWidth="2" fill="none" />
        <circle cx="70" cy="70" r="6" stroke="url(#anyGold)" strokeWidth="2" fill="none" />

        {/* Pivot screw with sparkle */}
        <circle cx="50" cy="50" r="3" fill="#FFF9E8" />
        <circle cx="50" cy="50" r="1.5" fill="#111116" />
      </svg>
    );
  };

  return (
    <div
      className={`barber-avatar-container position-relative d-inline-flex align-items-center justify-content-center ${className}`}
      style={{
        width: `${pixelSize}px`,
        height: `${pixelSize}px`,
        minWidth: `${pixelSize}px`,
        minHeight: `${pixelSize}px`,
        maxWidth: `${pixelSize}px`,
        maxHeight: `${pixelSize}px`,
        aspectRatio: '1 / 1',
        borderRadius: '50%',
        border: `2px solid ${borderColor}`,
        boxShadow: glowShadow,
        backgroundColor: '#0D0D12',
        overflow: 'visible',
        flexShrink: 0,
        transition: 'all 0.25s ease',
        ...style,
      }}
    >
      <div
        className="w-100 h-100 rounded-circle overflow-hidden d-flex align-items-center justify-content-center"
        style={{ aspectRatio: '1 / 1' }}
      >
        {renderVectorIllustration()}
      </div>

      {/* Optional real-time status dot badge */}
      {showStatusDot && status && (
        <span
          className={`position-absolute rounded-circle border border-dark dot-${status === 'busy' || status === 'in-chair' ? 'busy' : status === 'break' ? 'break' : 'free'}`}
          style={{
            bottom: '0px',
            right: '0px',
            width: `${Math.max(8, Math.round(pixelSize * 0.22))}px`,
            height: `${Math.max(8, Math.round(pixelSize * 0.22))}px`,
            boxShadow: '0 0 6px rgba(0,0,0,0.8)',
          }}
          title={`Status: ${status}`}
        />
      )}
    </div>
  );
};
