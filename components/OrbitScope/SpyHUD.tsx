import React, { useState, useEffect } from 'react';
import { Globe, BrainCircuit, Settings, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DataLayersPanel } from './DataLayersPanel';
import { ControlsPanel } from './ControlsPanel';
import { StylePresets } from './StylePresets';
import { VignetteOverlay } from './VignetteOverlay';
import { AddressSearch } from './AddressSearch';
import type { MapMode } from '../../pages/OrbitScopePage';
import type { VisualStyle } from './StylePresets';
import type { FlightDataSource } from '../../hooks/useFlightData';

const SATELLITE_DESIGNATIONS = ['KH11-4084 OPS-4114', 'KH11-4094 OPS-4168'];

interface FlyToPreset {
  id: string;
  label: string;
}

interface SpyHUDProps {
  mapReady: boolean;
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  visualStyle: VisualStyle;
  onVisualStyleChange: (style: VisualStyle) => void;
  showAircraft: boolean;
  onToggleAircraft: () => void;
  aircraftCount: number;
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
  center: { lat: number; lng: number };
  flyToPresets: FlyToPreset[];
  flyToId: string;
  onFlyToChange: (id: string) => void;
  sharpenLevel: number;
  onSharpenChange: (v: number) => void;
  layout: string;
  onLayoutChange: (v: string) => void;
  onOpenSettings: () => void;
  flightSource: FlightDataSource;
  flightLoading: boolean;
  flightError: string | null;
  onFlightSourceChange: (source: FlightDataSource) => void;
  onSearchSelect: (lat: number, lng: number, label: string) => void;
}

export const SpyHUD: React.FC<SpyHUDProps> = ({
  mapReady,
  mode,
  onModeChange,
  visualStyle,
  onVisualStyleChange,
  showAircraft,
  onToggleAircraft,
  aircraftCount,
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
  center,
  flyToPresets,
  flyToId,
  onFlyToChange,
  sharpenLevel,
  onSharpenChange,
  layout,
  onLayoutChange,
  onOpenSettings,
  flightSource,
  flightLoading,
  flightError,
  onFlightSourceChange,
  onSearchSelect,
}) => {
  const navigate = useNavigate();
  const [recTime, setRecTime] = useState('');
  const [hudVisible, setHudVisible] = useState(true);
  const [cleanUI, setCleanUI] = useState(false);

  useEffect(() => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const update = () => {
      const d = new Date();
      setRecTime(
        `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}Z`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  const formatCoord = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? 'N' : 'S';
    const lngDir = lng >= 0 ? 'E' : 'W';
    const latAbs = Math.abs(lat);
    const lngAbs = Math.abs(lng);
    const latD = Math.floor(latAbs);
    const latM = Math.floor((latAbs - latD) * 60);
    const latS = ((latAbs - latD) * 60 - latM) * 60;
    const lngD = Math.floor(lngAbs);
    const lngM = Math.floor((lngAbs - lngD) * 60);
    const lngS = ((lngAbs - lngD) * 60 - lngM) * 60;
    return `${latD}°${latM}'${latS.toFixed(2)}"${latDir} ${lngD}°${lngM}'${lngS.toFixed(2)}"${lngDir}`;
  };

  const showHUD = hudVisible && !cleanUI;
  const satelliteStatusLabel = satelliteLoading
    ? 'SAT LOADING'
    : satelliteError
      ? 'SAT ERROR'
      : satelliteLastUpdated
        ? 'SAT LIVE'
        : 'SAT IDLE';
  const satelliteStatusClassName = satelliteLoading
    ? 'text-amber-400 bg-amber-500/10 border-amber-500/40'
    : satelliteError
      ? 'text-red-400 bg-red-500/10 border-red-500/40'
      : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/40';

  return (
    <>
      {/* Vignette + crosshair - always on when map is ready */}
      {mapReady && <VignetteOverlay />}

      {!showHUD ? (
        /* Minimal bar when Clean UI - just back + settings */
        <div className="absolute top-4 left-4 right-4 z-50 flex justify-between pointer-events-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-cyber-accent transition-colors"
          >
            <BrainCircuit size={14} /> Neural Dive
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setCleanUI(false)}
              className="text-[10px] font-mono text-cyber-accent/70 hover:text-cyber-accent border border-cyber-accent/40 px-2 py-1 rounded"
            >
              SHOW HUD
            </button>
            <button onClick={onOpenSettings} className="text-gray-500 hover:text-white p-1">
              <Settings size={18} />
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none px-4 pt-4">
            <div className="pointer-events-auto flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-bold font-mono text-white flex items-center gap-2">
                    <Globe size={20} className="text-cyber-accent" />
                    WORLDVIEW
                  </h1>
                  <span className="text-[9px] font-mono text-gray-500">NO PLACE LEFT BEHIND</span>
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="text-[10px] font-mono text-gray-500 hover:text-cyber-accent transition-colors flex items-center gap-1 -mt-0.5"
                >
                  <BrainCircuit size={10} /> Neural Dive
                </button>
              </div>
              <div className="flex items-center gap-4">
                <AddressSearch onSelect={onSearchSelect} />
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-mono px-2 py-1 rounded border ${satelliteStatusClassName}`}>
                    {satelliteStatusLabel}
                  </span>
                  <button
                    onClick={() => onFlightSourceChange(flightSource === 'ai' ? 'api' : 'ai')}
                    className={`flex items-center gap-2 text-[10px] font-mono px-2 py-1 rounded border transition-colors ${
                      flightSource === 'ai'
                        ? 'border-cyber-accent/60 bg-cyber-accent/10 text-cyber-accent'
                        : 'border-emerald-500/60 bg-emerald-500/10 text-emerald-400'
                    }`}
                    title="Click to switch flight data source"
                  >
                    {flightSource === 'ai' ? 'AI SEARCH' : 'LIVE API'}
                  </button>
                  {flightLoading && (
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/40 px-2 py-1 rounded animate-pulse">
                      <Loader2 size={12} className="animate-spin" />
                      {flightSource === 'ai' ? 'SEARCHING…' : 'POLLING…'}
                    </span>
                  )}
                  {!flightLoading && flightError && (
                    <span className="flex items-center gap-1.5 text-[10px] font-mono text-red-400 bg-red-500/10 border border-red-500/40 px-2 py-1 rounded">
                      <AlertCircle size={12} />
                      ERROR
                    </span>
                  )}
                  {!flightLoading && !flightError && aircraftCount > 0 && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/40 px-2 py-1 rounded">
                      {aircraftCount} TRACKED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-mono">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-red-400/90">REC</span>
                  <span className="text-gray-400">{recTime}</span>
                </div>
                <div className="text-[9px] font-mono text-gray-500">
                  ORB: 47916 PASS: DESC-192
                </div>
                <button
                  onClick={onOpenSettings}
                  className="p-1.5 text-gray-500 hover:text-white rounded border border-transparent hover:border-cyber-border transition-colors pointer-events-auto"
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>
          </div>

          {/* Left panel */}
          <div className="absolute top-20 left-0 bottom-16 z-40 pointer-events-auto">
            <DataLayersPanel
              classification="TOP SECRET // SI-TK // NOFORN"
              satelliteDesignation={SATELLITE_DESIGNATIONS[0]}
              activeStyle={visualStyle}
              summary={`${visualStyle.toUpperCase()} — ${flyToPresets.find((p) => p.id === flyToId)?.label ?? flyToId}`}
              mode={mode}
              onModeChange={onModeChange}
              showAircraft={showAircraft}
              onToggleAircraft={onToggleAircraft}
              aircraftCount={aircraftCount}
              flightSource={flightSource}
              onFlightSourceChange={onFlightSourceChange}
              showSatellites={showSatellites}
              onToggleSatellites={onToggleSatellites}
              satelliteCount={satelliteCount}
              satelliteLoading={satelliteLoading}
              satelliteError={satelliteError}
              satelliteLastUpdated={satelliteLastUpdated}
              showCCTV={showCCTV}
              onToggleCCTV={onToggleCCTV}
              cctvCount={cctvCount}
              hasGoogleKey={hasGoogleKey}
              hasCesiumToken={hasCesiumToken}
            />
          </div>

          {/* Right panel */}
          <div className="absolute top-20 right-0 bottom-16 z-40 pointer-events-auto">
            <ControlsPanel
              activeStyle={visualStyle}
              sharpenLevel={sharpenLevel}
              onSharpenChange={onSharpenChange}
              hudVisible={hudVisible}
              onHudToggle={() => setHudVisible(!hudVisible)}
              layout={layout}
              onLayoutChange={onLayoutChange}
              onCleanUI={() => setCleanUI(true)}
            />
          </div>

          {/* Bottom bar */}
          <div className="absolute bottom-0 left-0 right-0 z-40 pointer-events-auto flex items-end justify-between px-4 pb-4 gap-4">
            <div className="flex flex-col gap-1">
              <div className="text-[9px] font-mono text-gray-500">
                MGRS: 14R PU 2897 4912
              </div>
              <div className="text-[10px] font-mono text-cyber-accent/80">
                {formatCoord(center.lat, center.lng)}
              </div>
              <div className="text-[8px] font-mono text-gray-600 mt-1">
                STYLE PRESETS — Visual Modes
              </div>
            </div>
            <StylePresets value={visualStyle} onChange={onVisualStyleChange} />
            <div className="flex flex-col items-end gap-0.5 bg-black/60 border border-cyber-border/40 rounded px-3 py-2 min-w-[140px]">
              <div className="text-[9px] font-mono text-gray-500">LOCATION</div>
              <select
                value={flyToId}
                onChange={(e) => onFlyToChange(e.target.value)}
                className="text-[10px] font-mono text-white bg-transparent border-none p-0 focus:outline-none cursor-pointer appearance-none"
              >
                {flyToPresets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
              <div className="text-[9px] font-mono text-gray-500">Landmark</div>
              <div className="text-[9px] font-mono text-gray-600">--</div>
            </div>
          </div>
        </>
      )}
    </>
  );
};
