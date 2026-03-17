import React from 'react';
import { ZoomIn, Layout, Scan, Minus } from 'lucide-react';

interface ControlsPanelProps {
  activeStyle: string;
  sharpenLevel: number;
  onSharpenChange: (v: number) => void;
  hudVisible: boolean;
  onHudToggle: () => void;
  layout: string;
  onLayoutChange: (v: string) => void;
  onCleanUI: () => void;
}

const LAYOUT_OPTIONS = ['Tactical', 'Minimal', 'Full'];

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  activeStyle,
  sharpenLevel,
  onSharpenChange,
  hudVisible,
  onHudToggle,
  layout,
  onLayoutChange,
  onCleanUI,
}) => {
  return (
    <div className="flex flex-col w-56 bg-black/80 border-l border-cyber-border/60 backdrop-blur-md overflow-hidden">
      <div className="p-3 border-b border-cyber-border/40">
        <div className="text-[10px] font-mono text-cyber-accent uppercase">
          Active Style {activeStyle.toUpperCase()}
        </div>
      </div>

      <div className="flex-1 p-3 space-y-4">
        {/* Sharpen */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ZoomIn size={12} className="text-cyber-accent" />
            <span className="text-[10px] font-mono text-gray-400">SHARPEN</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0"
              max="100"
              value={sharpenLevel}
              onChange={(e) => onSharpenChange(Number(e.target.value))}
              className="flex-1 h-1.5 bg-cyber-border/50 rounded accent-cyber-accent"
            />
            <span className="text-[9px] font-mono text-cyber-accent w-8">{sharpenLevel}%</span>
          </div>
        </div>

        {/* HUD toggle */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono text-gray-400">HUD</span>
          <button
            onClick={onHudToggle}
            className={`w-10 h-5 rounded-full p-0.5 transition-all border flex ${
              hudVisible ? 'bg-cyber-accent/30 border-cyber-accent justify-end' : 'bg-black/50 border-cyber-border/50 justify-start'
            }`}
          >
            <div className="w-3.5 h-3.5 rounded-full bg-cyber-accent shrink-0" />
          </button>
        </div>

        {/* Layout dropdown */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Layout size={12} className="text-cyber-accent" />
            <span className="text-[10px] font-mono text-gray-400">LAYOUT</span>
          </div>
          <select
            value={layout}
            onChange={(e) => onLayoutChange(e.target.value)}
            className="w-full bg-black/60 border border-cyber-border/50 text-[10px] font-mono text-white py-1.5 px-2 rounded focus:outline-none focus:border-cyber-accent"
          >
            {LAYOUT_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>

        {/* Detect button */}
        <div>
          <button className="w-full flex items-center gap-2 py-2 px-3 border border-cyber-border/50 rounded text-[10px] font-mono text-gray-400 hover:border-cyber-accent hover:text-cyber-accent transition-colors">
            <Scan size={12} />
            DETECT
          </button>
        </div>

        {/* Clean UI */}
        <div className="pt-2 border-t border-cyber-border/30">
          <button
            onClick={onCleanUI}
            className="w-full flex items-center gap-2 py-2 px-3 border border-cyber-border/50 rounded text-[10px] font-mono text-gray-500 hover:border-cyber-accent/50 hover:text-cyber-accent transition-colors"
          >
            <Minus size={12} />
            CLEAN UI
          </button>
        </div>
      </div>

      <div className="p-2 border-t border-cyber-border/40 text-[8px] font-mono text-gray-600">
        BAND: PAN BITS: 11 LVL: 1A
      </div>
    </div>
  );
};
