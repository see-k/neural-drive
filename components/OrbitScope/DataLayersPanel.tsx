import React from 'react';
import { Plane, Satellite, Video, Map, Layers, Globe } from 'lucide-react';
import type { MapMode } from '../../pages/OrbitScopePage';
import type { VisualStyle } from './StylePresets';
import type { FlightDataSource } from '../../hooks/useFlightData';

interface DataLayerRow {
  id: string;
  label: string;
  icon: React.ReactNode;
  source: string;
  count: number;
  on: boolean;
  onToggle: () => void;
}

interface DataLayersPanelProps {
  classification: string;
  satelliteDesignation: string;
  activeStyle: VisualStyle;
  summary: string;
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  showAircraft: boolean;
  onToggleAircraft: () => void;
  aircraftCount: number;
  flightSource: FlightDataSource;
  onFlightSourceChange: (source: FlightDataSource) => void;
  showSatellites: boolean;
  onToggleSatellites: () => void;
  satelliteCount: number;
  satelliteLoading: boolean;
  satelliteError: string | null;
  satelliteLastUpdated: string | null;
  showCCTV: boolean;
  onToggleCCTV: () => void;
  cctvCount: number;
  hasGoogleKey: boolean;
  hasCesiumToken: boolean;
}

const MODE_OPTIONS: { id: MapMode; label: string; icon: React.ReactNode }[] = [
  { id: 'classic', label: 'Classic', icon: <Map size={12} /> },
  { id: 'photorealistic', label: 'Photo', icon: <Layers size={12} /> },
  { id: 'globe', label: 'Globe', icon: <Globe size={12} /> },
];

export const DataLayersPanel: React.FC<DataLayersPanelProps> = ({
  classification,
  satelliteDesignation,
  activeStyle,
  summary,
  mode,
  onModeChange,
  showAircraft,
  onToggleAircraft,
  aircraftCount,
  flightSource,
  onFlightSourceChange,
  showSatellites,
  onToggleSatellites,
  satelliteCount,
  satelliteLoading,
  satelliteError,
  satelliteLastUpdated,
  showCCTV,
  onToggleCCTV,
  cctvCount,
  hasGoogleKey,
  hasCesiumToken,
}) => {
  const satelliteStatus = satelliteLoading
    ? 'Loading orbit feed...'
    : satelliteError
      ? `Failed: ${satelliteError}`
      : satelliteLastUpdated
        ? `Last sync ${new Date(satelliteLastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
        : 'Awaiting first sync';

  const layers: DataLayerRow[] = [
    {
      id: 'aircraft',
      label: 'Live Flights',
      icon: <Plane size={14} />,
      source: flightSource === 'ai' ? 'AI Search' : 'OpenSky Network',
      count: aircraftCount,
      on: showAircraft,
      onToggle: onToggleAircraft,
    },
    {
      id: 'satellites',
      label: 'Satellites',
      icon: <Satellite size={14} />,
      source: 'CelesTrak',
      count: satelliteCount,
      on: showSatellites,
      onToggle: onToggleSatellites,
    },
    {
      id: 'cctv',
      label: 'CCTV Mesh',
      icon: <Video size={14} />,
      source: 'Austin CCTV',
      count: cctvCount,
      on: showCCTV,
      onToggle: onToggleCCTV,
    },
  ];

  return (
    <div className="flex flex-col w-64 bg-black/80 border-r border-cyber-border/60 backdrop-blur-md overflow-hidden">
      {/* Classification banner */}
      <div className="p-3 border-b border-cyber-border/40">
        <div className="text-[10px] font-mono text-white uppercase tracking-widest">
          {classification}
        </div>
        <div className="text-[10px] font-mono text-cyber-accent mt-1">{satelliteDesignation}</div>
        <div className="text-[9px] font-mono text-gray-500 mt-0.5 uppercase">
          Style: {activeStyle.toUpperCase()}
        </div>
        <div className="text-[9px] font-mono text-gray-600 mt-1 truncate" title={summary}>
          {summary}
        </div>
      </div>

      {/* Map mode selector */}
      <div className="p-2 border-b border-cyber-border/40">
        <div className="text-[9px] font-mono text-gray-500 uppercase mb-1.5">View Mode</div>
        <div className="flex gap-1">
          {MODE_OPTIONS.map((m) => {
            const disabled =
              (m.id !== 'globe' && !hasGoogleKey) || (m.id === 'globe' && !hasCesiumToken);
            return (
              <button
                key={m.id}
                onClick={() => !disabled && onModeChange(m.id)}
                disabled={disabled}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-mono rounded border transition-colors ${
                  mode === m.id
                    ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent'
                    : 'border-cyber-border/50 text-gray-500 hover:text-white hover:border-cyber-border'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {m.icon}
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data layers */}
      <div className="flex-1 p-2 overflow-y-auto">
        <div className="text-[9px] font-mono text-gray-500 uppercase mb-2">Data Layers</div>
        <div className="space-y-1.5">
          {layers.map((layer) => (
            <div
              key={layer.id}
              className="flex items-center justify-between gap-2 py-2 px-2 rounded border border-transparent hover:border-cyber-border/30 transition-colors"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-cyber-accent/80 shrink-0">{layer.icon}</span>
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-white truncate">{layer.label}</div>
                  {layer.id === 'aircraft' ? (
                    <button
                      onClick={() => onFlightSourceChange(flightSource === 'ai' ? 'api' : 'ai')}
                      className="text-[8px] font-mono text-gray-500 hover:text-cyber-accent truncate text-left"
                      title={flightSource === 'ai' ? 'Click to switch to Live API' : 'Click to switch to AI Search'}
                    >
                      {layer.source}
                    </button>
                  ) : (
                    <div>
                      <div className="text-[8px] font-mono text-gray-500 truncate">{layer.source}</div>
                      {layer.id === 'satellites' && (
                        <div
                          className={`text-[8px] font-mono truncate ${
                            satelliteLoading
                              ? 'text-amber-400'
                              : satelliteError
                                ? 'text-red-400'
                                : 'text-emerald-400'
                          }`}
                          title={satelliteStatus}
                        >
                          {satelliteStatus}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {layer.on && (
                  <span className="text-[9px] font-mono text-cyber-accent">{layer.count}</span>
                )}
                <button
                  onClick={layer.onToggle}
                  className={`w-11 h-5 rounded-full p-0.5 transition-all border flex ${
                    layer.on
                      ? 'bg-cyber-accent/30 border-cyber-accent justify-end'
                      : 'bg-black/50 border-cyber-border/50 justify-start'
                  }`}
                >
                  <div className="w-3.5 h-3.5 rounded-full bg-cyber-accent shrink-0" />
                </button>
                <span
                  className={`text-[8px] font-mono w-6 ${
                    layer.on ? 'text-cyber-accent' : 'text-gray-600'
                  }`}
                >
                  {layer.on ? 'ON' : 'OFF'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
