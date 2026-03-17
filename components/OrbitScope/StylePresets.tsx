import React from 'react';
import { Circle, Monitor, Moon, Thermometer, Contrast } from 'lucide-react';

export type VisualStyle = 'normal' | 'crt' | 'nvg' | 'flir' | 'noir';

const PRESETS: { id: VisualStyle; label: string; icon: React.ReactNode }[] = [
  { id: 'normal', label: 'Normal', icon: <Circle size={16} /> },
  { id: 'crt', label: 'CRT', icon: <Monitor size={16} /> },
  { id: 'nvg', label: 'NVG', icon: <Moon size={16} /> },
  { id: 'flir', label: 'FLIR', icon: <Thermometer size={16} /> },
  { id: 'noir', label: 'Noir', icon: <Contrast size={16} /> },
];

interface StylePresetsProps {
  value: VisualStyle;
  onChange: (style: VisualStyle) => void;
}

export const StylePresets: React.FC<StylePresetsProps> = ({ value, onChange }) => {
  return (
    <div className="flex items-center gap-2 bg-black/70 border border-cyber-border/60 rounded-lg px-3 py-2 backdrop-blur-sm">
      <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mr-1">
        Style
      </span>
      <div className="flex items-center gap-1">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            className={`flex flex-col items-center gap-0.5 p-2 rounded transition-all border ${
              value === p.id
                ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent'
                : 'border-transparent text-gray-500 hover:text-white hover:border-cyber-border/50'
            }`}
            title={p.label}
          >
            {p.icon}
            <span className="text-[9px] font-mono uppercase">{p.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
