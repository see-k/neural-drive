import React, { useState, useEffect } from 'react';
import { useAPIKeys } from '../contexts/APIKeysContext';
import { loadGoogleMaps } from '../services/mapsLoader';
import { useFlightData, type FlightDataSource } from '../hooks/useFlightData';
import { useCelesTrakOrbits } from '../hooks/useCelesTrakOrbits';
import { useAustinCCTV } from '../hooks/useAustinCCTV';
import type { AustinCamera } from '../services/austinCCTVService';
import { Map2DViewer } from '../components/OrbitScope/Map2DViewer';
import { Map3DViewer } from '../components/OrbitScope/Map3DViewer';
import { GlobeViewer } from '../components/OrbitScope/GlobeViewer';
import { CCTVModal } from '../components/OrbitScope/CCTVModal';
import { SpyHUD } from '../components/OrbitScope/SpyHUD';
import type { VisualStyle } from '../components/OrbitScope/StylePresets';

const FLY_TO_PRESETS: { id: string; label: string; lat: number; lng: number; alt?: number }[] = [
  { id: 'austin', label: 'Austin', lat: 30.2711, lng: -97.7403, alt: 500 },
  { id: 'london', label: 'London', lat: 51.5074, lng: -0.1278, alt: 1000 },
  { id: 'sf', label: 'San Francisco', lat: 37.7749, lng: -122.4194, alt: 800 },
  { id: 'nyc', label: 'New York', lat: 40.7128, lng: -74.006, alt: 600 },
];

export type MapMode = 'classic' | 'photorealistic' | 'globe';

const STYLE_CLASS_MAP: Record<VisualStyle, string> = {
  normal: 'orbit-scope-style-normal',
  crt: 'orbit-scope-style-crt',
  nvg: 'orbit-scope-style-nvg',
  flir: 'orbit-scope-style-flir',
  noir: 'orbit-scope-style-noir',
};

interface OrbitScopePageProps {
  onOpenSettings: () => void;
}

export const OrbitScopePage: React.FC<OrbitScopePageProps> = ({ onOpenSettings }) => {
  const { keys } = useAPIKeys();
  const [mode, setMode] = useState<MapMode>('classic');
  const [mapsReady, setMapsReady] = useState(false);
  const [mapsLoadError, setMapsLoadError] = useState<string | null>(null);
  const [showAircraft, setShowAircraft] = useState(true);
  const [showSatellites, setShowSatellites] = useState(true);
  const [showCCTV, setShowCCTV] = useState(true);
  const [flyToPreset, setFlyToPreset] = useState(FLY_TO_PRESETS[0]);
  const [selectedCCTV, setSelectedCCTV] = useState<AustinCamera | null>(null);
  const [visualStyle, setVisualStyle] = useState<VisualStyle>('normal');
  const [sharpenLevel, setSharpenLevel] = useState(49);
  const [layout, setLayout] = useState('Tactical');
  const [customLocation, setCustomLocation] = useState<{ id: string; label: string; lat: number; lng: number; alt?: number } | null>(null);
  const [flightSource, setFlightSource] = useState<FlightDataSource>('ai');

  const { states: aircraft, loading: flightLoading, error: flightError } = useFlightData(
    { lat: flyToPreset.lat, lng: flyToPreset.lng },
    flightSource,
    true
  );
  const {
    orbits: satellites,
    loading: satelliteLoading,
    error: satelliteError,
    lastUpdated: satelliteLastUpdated,
  } = useCelesTrakOrbits('active', true);
  const { cameras } = useAustinCCTV(true);
  const hasGoogleKey = Boolean(keys.googleMapsApiKey);
  const hasCesiumToken = Boolean(keys.cesiumIonToken);

  const mapReady = mode === 'globe' ? hasCesiumToken : mapsReady;

  // Load Google Maps when in Classic or Photorealistic mode
  useEffect(() => {
    if (mode === 'globe') {
      setMapsReady(false);
      setMapsLoadError(null);
      return;
    }
    if (!hasGoogleKey) {
      setMapsReady(false);
      setMapsLoadError('Configure Google Maps API key in Settings.');
      return;
    }
    let cancelled = false;
    loadGoogleMaps(keys.googleMapsApiKey).then((ok) => {
      if (cancelled) return;
      setMapsReady(ok);
      setMapsLoadError(ok ? null : 'Failed to load Google Maps.');
    });
    return () => { cancelled = true; };
  }, [mode, hasGoogleKey, keys.googleMapsApiKey]);

  return (
    <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden bg-black">
      {/* Map viewport - filter applied ONLY to the map, not the HUD */}
      <div
        className={`absolute inset-0 ${mapReady ? STYLE_CLASS_MAP[visualStyle] : ''}`}
      >
        {mode === 'globe' ? (
          hasCesiumToken ? (
            <GlobeViewer
              cesiumIonToken={keys.cesiumIonToken}
              aircraft={aircraft}
              showAircraft={showAircraft}
              satellites={satellites}
              showSatellites={showSatellites}
              cameras={cameras}
              showCCTV={showCCTV}
              flyTo={flyToPreset}
              onCCTVClick={setSelectedCCTV}
            />
          ) : (
            <Placeholder message="Configure Cesium Ion token in Settings for Globe mode." />
          )
        ) : mapsLoadError ? (
          <Placeholder message={mapsLoadError} />
        ) : mapsReady ? (
          mode === 'classic' ? (
            <Map2DViewer
              aircraft={aircraft}
              showAircraft={showAircraft}
              satellites={satellites}
              showSatellites={showSatellites}
              cameras={cameras}
              showCCTV={showCCTV}
              center={flyToPreset}
              onCCTVClick={setSelectedCCTV}
            />
          ) : (
            <Map3DViewer
              aircraft={aircraft}
              showAircraft={showAircraft}
              satellites={satellites}
              showSatellites={showSatellites}
              cameras={cameras}
              showCCTV={showCCTV}
              center={flyToPreset}
              onCCTVClick={setSelectedCCTV}
            />
          )
        ) : (
          <Placeholder message="Loading map..." />
        )}
      </div>

      {/* Spy HUD overlay - separate from filtered map */}
      <div className="absolute inset-0 pointer-events-none">
        <SpyHUD
          mapReady={!!mapReady}
          mode={mode}
          onModeChange={setMode}
          visualStyle={visualStyle}
          onVisualStyleChange={setVisualStyle}
          showAircraft={showAircraft}
          onToggleAircraft={() => setShowAircraft(!showAircraft)}
          aircraftCount={aircraft.length}
          showSatellites={showSatellites}
          onToggleSatellites={() => setShowSatellites(!showSatellites)}
          satelliteCount={satellites.length}
          satelliteLoading={satelliteLoading}
          satelliteError={satelliteError}
          satelliteLastUpdated={satelliteLastUpdated}
          showCCTV={showCCTV}
          onToggleCCTV={() => setShowCCTV(!showCCTV)}
          cctvCount={cameras.length}
          hasGoogleKey={hasGoogleKey}
          hasCesiumToken={hasCesiumToken}
          center={{ lat: flyToPreset.lat, lng: flyToPreset.lng }}
          flyToPresets={customLocation ? [...FLY_TO_PRESETS, { id: customLocation.id, label: customLocation.label }] : FLY_TO_PRESETS}
          flyToId={flyToPreset.id}
          onFlyToChange={(id) => {
            if (customLocation && id === customLocation.id) {
              setFlyToPreset(customLocation);
            } else {
              const p = FLY_TO_PRESETS.find((x) => x.id === id);
              if (p) setFlyToPreset(p);
            }
          }}
          sharpenLevel={sharpenLevel}
          onSharpenChange={setSharpenLevel}
          layout={layout}
          onLayoutChange={setLayout}
          onOpenSettings={onOpenSettings}
          flightSource={flightSource}
          flightLoading={flightLoading}
          flightError={flightError}
          onFlightSourceChange={setFlightSource}
          onSearchSelect={(lat, lng, label) => {
            const loc = { id: 'search', label, lat, lng, alt: 500 };
            setCustomLocation(loc);
            setFlyToPreset(loc);
          }}
        />
      </div>

      <CCTVModal camera={selectedCCTV} onClose={() => setSelectedCCTV(null)} />
    </div>
  );
};

const Placeholder: React.FC<{ message: string }> = ({ message }) => (
  <div className="absolute inset-0 flex items-center justify-center bg-cyber-dark border border-cyber-border">
    <p className="text-cyber-text font-mono text-sm">{message}</p>
  </div>
);
