import React from 'react';

/**
 * Circular vignette overlay simulating a spy satellite lens viewport.
 * Radial gradient: transparent center, dark edges. Thin teal crosshair at center.
 */
export const VignetteOverlay: React.FC = () => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <radialGradient id="vignette-gradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset="50%" stopColor="transparent" />
            <stop offset="75%" stopColor="rgba(0,0,0,0.5)" />
            <stop offset="100%" stopColor="black" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#vignette-gradient)" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg width="20" height="20" viewBox="0 0 20 20" className="text-cyber-accent/70">
          <line x1="10" y1="0" x2="10" y2="6" stroke="currentColor" strokeWidth="1" />
          <line x1="10" y1="14" x2="10" y2="20" stroke="currentColor" strokeWidth="1" />
          <line x1="0" y1="10" x2="6" y2="10" stroke="currentColor" strokeWidth="1" />
          <line x1="14" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="1" />
          <circle cx="10" cy="10" r="1.5" fill="currentColor" opacity="0.6" />
        </svg>
      </div>
    </div>
  );
};
