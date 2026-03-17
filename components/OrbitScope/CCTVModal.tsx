import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import type { AustinCamera } from '../../services/austinCCTVService';

interface CCTVModalProps {
  camera: AustinCamera | null;
  onClose: () => void;
}

export const CCTVModal: React.FC<CCTVModalProps> = ({ camera, onClose }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!camera) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl max-h-[90vh] mx-4 border-2 border-cyber-accent/50 bg-black/95 shadow-[0_0_60px_rgba(0,243,255,0.2)] overflow-hidden hud-panel"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HUD corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-cyber-accent" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-cyber-accent" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-cyber-accent" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-cyber-accent" />

        <div className="flex items-center justify-between px-4 py-2 bg-black/60 border-b border-cyber-accent/30">
          <span className="text-cyber-accent font-mono text-sm uppercase tracking-widest">
            {camera.location_name}
          </span>
          <span className="text-[10px] font-mono text-cyber-accent/70 uppercase">LIVE FEED</span>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-cyber-accent hover:bg-cyber-accent/10 rounded transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative aspect-video bg-black flex items-center justify-center">
          <img
            src={camera.screenshot_address}
            alt={camera.location_name}
            className="w-full h-full object-contain"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="120" viewBox="0 0 200 120"><rect fill="#111" width="200" height="120"/><text x="100" y="60" text-anchor="middle" fill="#00f3ff" font-family="monospace" font-size="12">FEED UNAVAILABLE</text></svg>'
              );
            }}
          />
        </div>

        <div className="px-4 py-2 bg-black/40 border-t border-cyber-accent/20 text-[10px] font-mono text-gray-500">
          Click outside or press ESC to close
        </div>
      </div>
    </div>
  );
};
