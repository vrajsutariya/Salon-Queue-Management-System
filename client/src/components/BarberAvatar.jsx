import React from 'react';

/**
 * Crown & Blade - Luxury Vector Avatar System
 * Clean, minimalist SVG vector illustrations with champagne-gold (#E8DCC8 / #E5C378)
 * and deep noir accents. Replaces inconsistent photos with polished geometric styling.
 */

export const BARBER_AVATAR_PRESETS = [
  { id: 'Ravi', name: 'Ravi', style: 'Classic Pompadour', tag: 'Master Stylist' },
  { id: 'Amit', name: 'Amit', style: 'Textured Fade Crop', tag: 'Trend Specialist' },
  { id: 'Imran', name: 'Imran', style: 'Artisan Full Beard', tag: 'Master Barber' },
  { id: 'Sameer', name: 'Sameer', style: 'Slick Modern & Glasses', tag: 'Chic Stylist' },
  { id: 'Vikram', name: 'Vikram', style: 'Imperial Mustache', tag: 'Royal Grooming' },
  { id: 'Kabir', name: 'Kabir', style: 'Curly Fade & Earring', tag: 'Urban Stylist' },
  { id: 'Arjun', name: 'Arjun', style: 'Gentleman Side Part', tag: 'Executive Cut' },
  { id: 'Dev', name: 'Dev', style: 'Buzzcut & Razor Lines', tag: 'Precision Artist' },
  { id: 'Rohan', name: 'Rohan', style: 'Samurai Top-Knot', tag: 'Bohemian Artisan' },
  { id: 'Any', name: 'Any', style: 'Royal Scissors Crest', tag: 'Fastest Chair' },
];

export const BarberAvatar = ({
  name = '',
  avatar = '',
  photo = '',
  size = 'md',
  status = null,
  active = false,
  showStatusDot = false,
  className = '',
  style = {},
}) => {
  // Standardize sizes: xs: 32px, sm: 40px, md: 48px, lg/card: 64px, xl/tv: 80px
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

  const cleanPhoto = (photo && typeof photo === 'string' && !photo.startsWith('http')) ? photo : '';
  const cleanAvatar = (avatar && typeof avatar === 'string' && !avatar.startsWith('http')) ? avatar : '';
  const avatarKey = String(cleanAvatar || cleanPhoto || name || '').trim().toLowerCase();

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

  // Render SVG illustration per barber avatar preset
  const renderVectorIllustration = () => {
    // 1. Ravi: Classic Suave Master Stylist (Pompadour, Groomed Mustache, Tuxedo Shears)
    if (avatarKey.includes('ravi')) {
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
          <path d="M38 24C44 19 54 19 63 25" stroke="url(#raviGold)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M42 29C48 25 56 26 62 31" stroke="url(#raviGold)" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
        </svg>
      );
    }

    // 2. Amit: Contemporary High-Fade Stylist with Razor Comb Accents
    if (avatarKey.includes('amit')) {
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

    // 3. Imran: Senior Artisan Master Barber (Full Beard, Precision Apron & Vintage Shears)
    if (avatarKey.includes('imran')) {
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
          <path d="M41 26C47 23 53 23 59 26" stroke="url(#imranGold)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      );
    }

    // 4. Sameer: Modern Chic Stylist (Slicked Back, Gold Designer Eyewear, Black Turtleneck & Gold Pendant)
    if (avatarKey.includes('sameer')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-100 h-100">
          <defs>
            <radialGradient id="sameerBg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#1E2A27" />
              <stop offset="100%" stopColor="#0B1211" />
            </radialGradient>
            <linearGradient id="sameerGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF2D6" />
              <stop offset="50%" stopColor="#E5C378" />
              <stop offset="100%" stopColor="#B38B3F" />
            </linearGradient>
            <linearGradient id="sameerSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#E0C7A8" />
              <stop offset="100%" stopColor="#C2A483" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <rect width="100" height="100" rx="50" fill="url(#sameerBg)" />

          {/* Black Turtleneck Torso */}
          <path d="M22 100C22 84 34 76 50 76C66 76 78 84 78 100H22Z" fill="#141918" />
          {/* Turtleneck Collar */}
          <rect x="41" y="66" width="18" height="13" rx="4" fill="#1C2322" stroke="url(#sameerGold)" strokeWidth="0.8" />
          {/* Gold Chain & Pendant */}
          <path d="M43 78C46 86 54 86 57 78" stroke="url(#sameerGold)" strokeWidth="1" strokeLinecap="round" />
          <polygon points="50,85 52,89 48,89" fill="url(#sameerGold)" />

          {/* Neck */}
          <rect x="44" y="58" width="12" height="14" rx="2" fill="url(#sameerSkin)" />

          {/* Face */}
          <path d="M35 43C35 33 42 31 50 31C58 31 65 33 65 43C65 55 58 63 50 63C42 63 35 55 35 43Z" fill="url(#sameerSkin)" />
          <circle cx="34" cy="45" r="3.2" fill="#C2A483" />
          <circle cx="66" cy="45" r="3.2" fill="#C2A483" />

          {/* Designer Round Gold Eyewear */}
          <circle cx="43" cy="45" r="5" stroke="url(#sameerGold)" strokeWidth="1.2" fill="rgba(0,0,0,0.15)" />
          <circle cx="57" cy="45" r="5" stroke="url(#sameerGold)" strokeWidth="1.2" fill="rgba(0,0,0,0.15)" />
          <path d="M48 44H52" stroke="url(#sameerGold)" strokeWidth="1.2" />
          <path d="M38 44L34 43" stroke="url(#sameerGold)" strokeWidth="0.9" />
          <path d="M62 44L66 43" stroke="url(#sameerGold)" strokeWidth="0.9" />
          <circle cx="43" cy="45" r="1.3" fill="#141918" />
          <circle cx="57" cy="45" r="1.3" fill="#141918" />
          <circle cx="44" cy="44" r="0.5" fill="#FFF2D6" />
          <circle cx="58" cy="44" r="0.5" fill="#FFF2D6" />

          {/* Brows */}
          <path d="M39 39C42 38 45 38 47 39" stroke="#141918" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M53 39C55 38 58 38 61 39" stroke="#141918" strokeWidth="1.3" strokeLinecap="round" />

          {/* Light Shadow / Stubble */}
          <path d="M47 54C49 55 51 55 53 54" stroke="#8C7456" strokeWidth="0.8" strokeLinecap="round" />
          <circle cx="50" cy="58" r="0.8" fill="#8C7456" />

          {/* Slicked Back Undercut Hair with Gold Sheen Lines */}
          <path d="M33 39C32 27 38 18 50 18C62 18 68 27 67 39C63 35 58 32 50 32C42 32 37 35 33 39Z" fill="#141918" />
          <path d="M39 24C44 21 56 21 61 24" stroke="url(#sameerGold)" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M42 28C47 25 53 25 58 28" stroke="url(#sameerGold)" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
        </svg>
      );
    }

    // 5. Vikram: Imperial Royal Stylist (Handlebar Mustache, Royal Beard, Mandarin Jacket & Crest Brooch)
    if (avatarKey.includes('vikram')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-100 h-100">
          <defs>
            <radialGradient id="vikramBg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#2E1C24" />
              <stop offset="100%" stopColor="#12090E" />
            </radialGradient>
            <linearGradient id="vikramGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF4DC" />
              <stop offset="50%" stopColor="#E5C378" />
              <stop offset="100%" stopColor="#A88238" />
            </linearGradient>
            <linearGradient id="vikramSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#DBB693" />
              <stop offset="100%" stopColor="#BC926D" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <rect width="100" height="100" rx="50" fill="url(#vikramBg)" />

          {/* Mandarin Collar Royal Tunic */}
          <path d="M22 100C22 84 34 76 50 76C66 76 78 84 78 100H22Z" fill="#1C1016" />
          <path d="M50 76V100" stroke="url(#vikramGold)" strokeWidth="1.2" strokeLinecap="round" />

          {/* Gold Frog Fasteners on Tunic */}
          <circle cx="50" cy="82" r="1.5" fill="url(#vikramGold)" />
          <circle cx="50" cy="90" r="1.5" fill="url(#vikramGold)" />
          <circle cx="50" cy="98" r="1.5" fill="url(#vikramGold)" />
          <path d="M46 82H54M46 90H54M46 98H54" stroke="url(#vikramGold)" strokeWidth="0.8" strokeLinecap="round" />
          {/* Royal Scissor Crest Brooch */}
          <polygon points="34,84 37,81 37,87" fill="url(#vikramGold)" />

          {/* Neck */}
          <rect x="44" y="60" width="12" height="18" rx="3" fill="url(#vikramSkin)" />
          {/* Mandarin Collar Band */}
          <rect x="42" y="72" width="16" height="6" rx="2" fill="#24141D" stroke="url(#vikramGold)" strokeWidth="0.8" />

          {/* Face */}
          <path d="M35 43C35 34 42 32 50 32C58 32 65 34 65 43C65 56 58 64 50 64C42 64 35 56 35 43Z" fill="url(#vikramSkin)" />
          <circle cx="34" cy="46" r="3.5" fill="#BC926D" />
          <circle cx="66" cy="46" r="3.5" fill="#BC926D" />

          {/* Royal Handlebar Mustache (curling upward) */}
          <path
            d="M32 49C36 49 42 51 50 54C58 51 64 49 68 49C70 47 69 44 66 45C61 47 55 52 50 56C45 52 39 47 34 45C31 44 30 47 32 49Z"
            fill="#180F14"
            stroke="url(#vikramGold)"
            strokeWidth="0.8"
          />
          {/* Sharp Sculpted Imperial Goatee */}
          <polygon points="46,59 54,59 50,67" fill="#180F14" stroke="url(#vikramGold)" strokeWidth="0.5" />

          {/* Eyes & Brows */}
          <path d="M40 41C42 39 45 40 47 41" stroke="#180F14" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M53 41C55 40 58 39 60 41" stroke="#180F14" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="44" cy="44" r="1.3" fill="#180F14" />
          <circle cx="56" cy="44" r="1.3" fill="#180F14" />

          {/* Regal Taper Quiff Hair */}
          <path d="M33 39C32 27 38 19 50 19C62 19 68 27 67 39C63 35 59 33 50 33C41 33 37 35 33 39Z" fill="#180F14" />
          <path d="M38 25C44 21 54 21 62 26" stroke="url(#vikramGold)" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M42 30C47 27 53 27 58 31" stroke="url(#vikramGold)" strokeWidth="0.8" strokeLinecap="round" opacity="0.8" />
        </svg>
      );
    }

    // 6. Kabir: Urban Street Stylist (Curly Fade, Gold Earring, Modern Bomber Jacket)
    if (avatarKey.includes('kabir')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-100 h-100">
          <defs>
            <radialGradient id="kabirBg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#2E241B" />
              <stop offset="100%" stopColor="#110C07" />
            </radialGradient>
            <linearGradient id="kabirGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF6DE" />
              <stop offset="50%" stopColor="#E5C378" />
              <stop offset="100%" stopColor="#9C7733" />
            </linearGradient>
            <linearGradient id="kabirSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D4A782" />
              <stop offset="100%" stopColor="#B38661" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <rect width="100" height="100" rx="50" fill="url(#kabirBg)" />

          {/* Bomber Jacket Torso */}
          <path d="M22 100C22 84 34 76 50 76C66 76 78 84 78 100H22Z" fill="#181410" />
          <path d="M42 76L50 86L58 76H42Z" fill="url(#kabirSkin)" />
          {/* Ribbed Bomber Collar */}
          <path d="M36 78L50 88L64 78" stroke="url(#kabirGold)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M50 88V100" stroke="url(#kabirGold)" strokeWidth="1.5" strokeLinecap="round" />

          {/* Neck */}
          <rect x="44" y="60" width="12" height="18" rx="3" fill="url(#kabirSkin)" />

          {/* Face */}
          <path d="M35 44C35 34 42 32 50 32C58 32 65 34 65 44C65 56 59 64 50 64C41 64 35 56 35 44Z" fill="url(#kabirSkin)" />
          {/* Left Ear with Gold Huggie Earring */}
          <circle cx="34" cy="46" r="3.5" fill="#B38661" />
          <circle cx="33" cy="49" r="1.6" stroke="url(#kabirGold)" strokeWidth="1" fill="none" />
          <circle cx="66" cy="46" r="3.5" fill="#B38661" />

          {/* Sharp Chin Strap & Trim Mustache */}
          <path d="M37 50C38 60 45 64 50 64C55 64 62 60 63 50C62 55 57 61 50 61C43 61 38 55 37 50Z" fill="#18130F" />
          <path d="M44 54C47 55 53 55 56 54C54 56 46 56 44 54Z" fill="#18130F" stroke="url(#kabirGold)" strokeWidth="0.5" />

          {/* Eyes & Brows */}
          <path d="M40 42C43 41 46 41 48 42" stroke="#18130F" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M52 42C54 41 57 41 60 42" stroke="#18130F" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="44" cy="45" r="1.3" fill="#18130F" />
          <circle cx="56" cy="45" r="1.3" fill="#18130F" />

          {/* Textured Curly High-Volume Hair with Gold Texture */}
          <path d="M32 40C30 32 32 23 40 18C44 15 56 15 60 18C68 23 70 32 68 40C65 36 60 34 50 34C40 34 35 36 32 40Z" fill="#18130F" />
          <path d="M38 23C40 20 44 22 47 20" stroke="url(#kabirGold)" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M49 19C52 17 56 18 58 21" stroke="url(#kabirGold)" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M42 27C45 25 48 26 51 24" stroke="url(#kabirGold)" strokeWidth="0.9" strokeLinecap="round" />
          <path d="M53 26C56 24 60 26 62 29" stroke="url(#kabirGold)" strokeWidth="0.9" strokeLinecap="round" />
        </svg>
      );
    }

    // 7. Arjun: Gentlemen's Executive Barber (Side Part Taper, Crisp Collared Shirt, Slim Tie & Gold Tie-Bar)
    if (avatarKey.includes('arjun')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-100 h-100">
          <defs>
            <radialGradient id="arjunBg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#1E242E" />
              <stop offset="100%" stopColor="#0B0F16" />
            </radialGradient>
            <linearGradient id="arjunGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF5DD" />
              <stop offset="50%" stopColor="#E5C378" />
              <stop offset="100%" stopColor="#9E7934" />
            </linearGradient>
            <linearGradient id="arjunSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ECCEB2" />
              <stop offset="100%" stopColor="#CEAC8E" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <rect width="100" height="100" rx="50" fill="url(#arjunBg)" />

          {/* Crisp Oxford Shirt & Suit Jacket */}
          <path d="M22 100C22 84 34 76 50 76C66 76 78 84 78 100H22Z" fill="#12161E" />
          {/* White Shirt Collar V */}
          <polygon points="40,76 50,88 60,76" fill="#EDEFEF" />
          {/* Slim Noir Necktie */}
          <polygon points="48,78 52,78 54,100 46,100" fill="#1C212B" />
          {/* Gold Tie-Bar Clip */}
          <line x1="47" y1="87" x2="53" y2="87" stroke="url(#arjunGold)" strokeWidth="1.6" strokeLinecap="round" />

          {/* Neck */}
          <rect x="44" y="60" width="12" height="18" rx="3" fill="url(#arjunSkin)" />

          {/* Face */}
          <path d="M35 43C35 34 42 32 50 32C58 32 65 34 65 43C65 56 59 64 50 64C41 64 35 56 35 43Z" fill="url(#arjunSkin)" />
          <circle cx="34" cy="46" r="3.5" fill="#CEAC8E" />
          <circle cx="66" cy="46" r="3.5" fill="#CEAC8E" />

          {/* Groomed Clean Mustache */}
          <path d="M43 54C46 56 54 56 57 54C56 56 44 56 43 54Z" fill="#131720" stroke="url(#arjunGold)" strokeWidth="0.5" />

          {/* Eyes & Brows */}
          <path d="M40 42C43 40 46 41 48 42" stroke="#131720" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M52 42C54 41 57 40 60 42" stroke="#131720" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="44" cy="45" r="1.3" fill="#131720" />
          <circle cx="56" cy="45" r="1.3" fill="#131720" />

          {/* Gentleman's Razor-Sharp Side Part */}
          <path d="M33 40C32 28 39 19 50 19C63 19 68 28 67 40C64 36 60 34 50 34C42 34 37 36 33 40Z" fill="#131720" />
          <line x1="39" y1="23" x2="44" y2="33" stroke="url(#arjunGold)" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M45 22C52 21 60 24 64 28" stroke="url(#arjunGold)" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M47 27C52 26 59 28 62 31" stroke="url(#arjunGold)" strokeWidth="0.75" strokeLinecap="round" opacity="0.8" />
        </svg>
      );
    }

    // 8. Dev: High-Precision Athletic Barber (Precision Buzz-Cut, Dual Etched Track Lines, Sport Stylist Jersey)
    if (avatarKey.includes('dev')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-100 h-100">
          <defs>
            <radialGradient id="devBg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#28241F" />
              <stop offset="100%" stopColor="#100D0A" />
            </radialGradient>
            <linearGradient id="devGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF8E0" />
              <stop offset="50%" stopColor="#E5C378" />
              <stop offset="100%" stopColor="#A37C32" />
            </linearGradient>
            <linearGradient id="devSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#DFBFA0" />
              <stop offset="100%" stopColor="#C09F7F" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <rect width="100" height="100" rx="50" fill="url(#devBg)" />

          {/* Athletic Performance Stylist Jersey */}
          <path d="M22 100C22 84 34 76 50 76C66 76 78 84 78 100H22Z" fill="#181512" />
          <path d="M42 76L50 86L58 76H42Z" fill="url(#devSkin)" />
          {/* Gold Athletic V-Stripe on Chest */}
          <path d="M30 84L50 96L70 84" stroke="url(#devGold)" strokeWidth="1.4" strokeLinecap="round" fill="none" />

          {/* Neck */}
          <rect x="44" y="60" width="12" height="18" rx="3" fill="url(#devSkin)" />

          {/* Strong Chiseled Jaw Face */}
          <path d="M35 44C35 34 42 32 50 32C58 32 65 34 65 44C65 56 59 64 50 64C41 64 35 56 35 44Z" fill="url(#devSkin)" />
          <circle cx="34" cy="46" r="3.5" fill="#C09F7F" />
          <circle cx="66" cy="46" r="3.5" fill="#C09F7F" />

          {/* Sharp Box Stubble / Geometric Beard */}
          <path d="M37 51C39 60 45 64 50 64C55 64 61 60 63 51C62 57 56 62 50 62C44 62 38 57 37 51Z" fill="#161310" stroke="url(#devGold)" strokeWidth="0.5" />

          {/* Eyes & Eyebrow Slit */}
          <path d="M40 42L44 42M45.5 42L48 42" stroke="#161310" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M52 42C54 41 57 41 60 42" stroke="#161310" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="44" cy="45" r="1.3" fill="#161310" />
          <circle cx="56" cy="45" r="1.3" fill="#161310" />

          {/* Ultra-Clean Military Buzz Cut */}
          <path d="M34 40C33 30 39 23 50 23C61 23 67 30 66 40C64 36 60 34 50 34C40 34 36 36 34 40Z" fill="#161310" />
          {/* Dual Razor Slash Hair Tattoos / Tracks on Temple */}
          <line x1="59" y1="28" x2="65" y2="34" stroke="url(#devGold)" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="56" y1="31" x2="62" y2="37" stroke="url(#devGold)" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      );
    }

    // 9. Rohan: Artisan Bohemian Stylist (Samurai Top-Knot Man-Bun, Gold Bun Ring, Sculpted Stubble, Wrap Apron)
    if (avatarKey.includes('rohan')) {
      return (
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-100 h-100">
          <defs>
            <radialGradient id="rohanBg" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#252720" />
              <stop offset="100%" stopColor="#0F100C" />
            </radialGradient>
            <linearGradient id="rohanGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFF9E2" />
              <stop offset="50%" stopColor="#E5C378" />
              <stop offset="100%" stopColor="#A88337" />
            </linearGradient>
            <linearGradient id="rohanSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#DFC3A4" />
              <stop offset="100%" stopColor="#BEA080" />
            </linearGradient>
          </defs>

          {/* Background circle */}
          <rect width="100" height="100" rx="50" fill="url(#rohanBg)" />

          {/* Cross-Wrap Linen Artisan Apron */}
          <path d="M22 100C22 84 34 76 50 76C66 76 78 84 78 100H22Z" fill="#171914" />
          <path d="M40 76L50 87L60 76H40Z" fill="url(#rohanSkin)" />
          {/* Wrap Straps with Gold Brass Rings */}
          <path d="M30 80L50 97L70 80" stroke="url(#rohanGold)" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <circle cx="50" cy="97" r="2.2" stroke="url(#rohanGold)" strokeWidth="1" fill="#252720" />

          {/* Neck */}
          <rect x="44" y="60" width="12" height="18" rx="3" fill="url(#rohanSkin)" />

          {/* Face */}
          <path d="M35 44C35 34 42 32 50 32C58 32 65 34 65 44C65 56 59 64 50 64C41 64 35 56 35 44Z" fill="url(#rohanSkin)" />
          <circle cx="34" cy="46" r="3.5" fill="#BEA080" />
          <circle cx="66" cy="46" r="3.5" fill="#BEA080" />

          {/* Natural Sculpted Stubble & Mustache */}
          <path d="M37 51C39 60 45 64 50 64C55 64 61 60 63 51C62 57 56 61 50 61C44 61 38 57 37 51Z" fill="#151712" />
          <path d="M44 54C47 55 53 55 56 54C54 56 46 56 44 54Z" fill="#151712" stroke="url(#rohanGold)" strokeWidth="0.5" />

          {/* Eyes & Brows */}
          <path d="M40 42C43 41 46 41 48 42" stroke="#151712" strokeWidth="1.4" strokeLinecap="round" />
          <path d="M52 42C54 41 57 41 60 42" stroke="#151712" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="44" cy="45" r="1.3" fill="#151712" />
          <circle cx="56" cy="45" r="1.3" fill="#151712" />

          {/* Samurai Man-Bun / Top-Knot with Gold Ring Tie */}
          <circle cx="50" cy="16" r="5" fill="#151712" />
          <rect x="47" y="19" width="6" height="2.5" rx="1" fill="url(#rohanGold)" />

          {/* Pulled-Back Hair with Sleek Flow Lines */}
          <path d="M33 40C32 29 38 21 50 21C62 21 68 29 67 40C64 35 59 33 50 33C41 33 36 35 33 40Z" fill="#151712" />
          <path d="M38 28L48 20" stroke="url(#rohanGold)" strokeWidth="1" strokeLinecap="round" />
          <path d="M62 28L52 20" stroke="url(#rohanGold)" strokeWidth="1" strokeLinecap="round" />
        </svg>
      );
    }

    // 10. Default / "Any" Barber / Fastest Chair Crest
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
        <path d="M32 68L68 32" stroke="url(#anyGold)" strokeWidth="2.5" strokeLinecap="round" />
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
