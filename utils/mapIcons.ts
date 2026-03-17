/**
 * Map marker icon generators - ported from helios-app maps.js
 * Used for 3D markers (aircraft, satellites, etc.)
 */

export function createAircraftIcon(color = '#00f3ff'): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <defs>
        <filter id="acGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="2" flood-color="${color}99"/>
        </filter>
      </defs>
      <g transform="translate(16,16)" filter="url(#acGlow)">
        <path d="M0,-12 L2,-8 L2,-2 L10,4 L10,6 L2,2 L2,8 L5,10 L5,12 L0,10 L-5,12 L-5,10 L-2,8 L-2,2 L-10,6 L-10,4 L-2,-2 L-2,-8 Z" fill="${color}" stroke="${color}" stroke-width="0.5" opacity="0.95"/>
      </g>
    </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

export function createSatelliteIcon(color = '#00f3ff'): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
      <defs>
        <filter id="satGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="${color}99"/>
        </filter>
      </defs>
      <circle cx="16" cy="16" r="10" fill="rgba(10,10,15,0.9)" stroke="${color}" stroke-width="2" filter="url(#satGlow)"/>
      <rect x="14" y="6" width="4" height="6" fill="${color}" opacity="0.9"/>
      <rect x="14" y="20" width="4" height="6" fill="${color}" opacity="0.9"/>
      <rect x="6" y="14" width="6" height="4" fill="${color}" opacity="0.9"/>
      <rect x="20" y="14" width="6" height="4" fill="${color}" opacity="0.9"/>
      <circle cx="16" cy="16" r="3" fill="#fff"/>
    </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

export function createCCTVPlaceholderIcon(color = '#00f3ff'): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="36" viewBox="0 0 48 36">
      <rect x="2" y="8" width="36" height="20" rx="2" fill="rgba(10,10,15,0.9)" stroke="${color}" stroke-width="1.5"/>
      <circle cx="20" cy="18" r="6" fill="${color}" opacity="0.3"/>
      <circle cx="20" cy="18" r="3" fill="${color}"/>
      <rect x="38" y="12" width="8" height="6" rx="1" fill="rgba(10,10,15,0.9)" stroke="${color}" stroke-width="1"/>
      <rect x="40" y="4" width="4" height="6" fill="rgba(10,10,15,0.9)" stroke="${color}" stroke-width="1"/>
    </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}

export function createDroneOrb3D(color = '#22c55e'): string {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
      <defs>
        <radialGradient id="orbGrad" cx="40%" cy="35%" r="50%">
          <stop offset="0%" stop-color="#fff" stop-opacity="0.9"/>
          <stop offset="40%" stop-color="${color}" stop-opacity="1"/>
          <stop offset="100%" stop-color="${color}" stop-opacity="0.6"/>
        </radialGradient>
        <filter id="orbGlow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur"/>
          <feComposite in="SourceGraphic" in2="blur" operator="over"/>
        </filter>
      </defs>
      <circle cx="24" cy="24" r="20" fill="none" stroke="${color}" stroke-width="1.5" opacity="0.3"/>
      <circle cx="24" cy="24" r="12" fill="${color}" opacity="0.15" filter="url(#orbGlow)"/>
      <circle cx="24" cy="24" r="10" fill="url(#orbGrad)" stroke="${color}" stroke-width="1.5" stroke-opacity="0.6"/>
      <ellipse cx="21" cy="21" rx="4" ry="3" fill="#fff" opacity="0.45"/>
    </svg>`;
  return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
}
