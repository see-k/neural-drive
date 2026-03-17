import React, { useEffect } from 'react';
import { Viewer, useCesium, Entity, BillboardGraphics, PolylineGraphics } from 'resium';
import * as Cesium from 'cesium';
import type { OpenSkyState } from '../../services/openskyService';
import type { SatelliteOrbit } from '../../services/celestrakService';
import type { AustinCamera } from '../../services/austinCCTVService';
import { createAircraftIcon, createSatelliteIcon, createCCTVPlaceholderIcon } from '../../utils/mapIcons';

import 'cesium/Build/Cesium/Widgets/widgets.css';

const DEFAULT_POSITION = Cesium.Cartesian3.fromDegrees(-97.7403, 30.2711, 15_000_000);

interface GlobeViewerProps {
  cesiumIonToken: string;
  aircraft?: OpenSkyState[];
  showAircraft?: boolean;
  satellites?: SatelliteOrbit[];
  showSatellites?: boolean;
  cameras?: AustinCamera[];
  showCCTV?: boolean;
  flyTo?: { lat: number; lng: number; alt?: number };
  onCCTVClick?: (camera: AustinCamera) => void;
}

const cctvPlaceholder = createCCTVPlaceholderIcon('#00f3ff');

const CCTVBillboard: React.FC<{ c: AustinCamera; onClick?: () => void }> = ({ c, onClick }) => (
  <Entity
    position={Cesium.Cartesian3.fromDegrees(c.location.coordinates[0], c.location.coordinates[1], 50)}
    name={c.location_name}
    onClick={onClick}
  >
    <BillboardGraphics image={cctvPlaceholder} width={28} height={20} />
  </Entity>
);

const InitialCamera: React.FC = () => {
  const { viewer } = useCesium();
  const initialized = React.useRef(false);
  useEffect(() => {
    if (!viewer || initialized.current) return;
    initialized.current = true;
    viewer.camera.setView({
      destination: DEFAULT_POSITION,
      orientation: { heading: 0, pitch: -Cesium.Math.PI_OVER_TWO, roll: 0 },
    });
  }, [viewer]);
  return null;
};

const FlyToEffect: React.FC<{ flyTo?: { lat: number; lng: number; alt?: number } }> = ({ flyTo }) => {
  const { viewer } = useCesium();
  const prevRef = React.useRef<string>('');
  useEffect(() => {
    if (!viewer || !flyTo) return;
    const key = `${flyTo.lat},${flyTo.lng},${flyTo.alt}`;
    if (key === prevRef.current) return;
    prevRef.current = key;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        flyTo.lng,
        flyTo.lat,
        (flyTo.alt ?? 500) * 1000
      ),
      duration: 1.5,
    });
  }, [viewer, flyTo?.lat, flyTo?.lng, flyTo?.alt]);
  return null;
};

const aircraftIconUrl = createAircraftIcon('#00f3ff');
const satelliteIconUrl = createSatelliteIcon('#ffdd00');

export const GlobeViewer: React.FC<GlobeViewerProps> = ({
  cesiumIonToken,
  aircraft = [],
  showAircraft = true,
  satellites = [],
  showSatellites = true,
  cameras = [],
  showCCTV = true,
  flyTo,
  onCCTVClick,
}) => {
  useEffect(() => {
    if (cesiumIonToken) Cesium.Ion.defaultAccessToken = cesiumIonToken;
  }, [cesiumIonToken]);

  const acList = showAircraft ? aircraft.filter((a) => a.latitude != null && a.longitude != null).slice(0, 2000) : [];
  const satList = showSatellites ? satellites.slice(0, 200) : [];
  const camList = showCCTV ? cameras.slice(0, 200) : [];

  return (
    <div className="w-full h-full min-h-[400px] relative">
      <Viewer
        full
        animation={false}
        baseLayerPicker={false}
        geocoder={false}
        homeButton={false}
        infoBox={false}
        sceneModePicker={false}
        timeline={false}
        navigationHelpButton={false}
        scene3DOnly={false}
      >
        <InitialCamera />
        {flyTo && <FlyToEffect flyTo={flyTo} />}

        {acList.map((a) => (
          <Entity
            key={a.icao24 + (a.last_contact ?? 0)}
            position={Cesium.Cartesian3.fromDegrees(a.longitude!, a.latitude!, (a.baro_altitude ?? 10000))}
            name={`${a.callsign || a.icao24} | ${a.origin_country} | ${a.baro_altitude ?? '-'}m`}
          >
            <BillboardGraphics
              image={aircraftIconUrl}
              width={28}
              height={28}
            />
          </Entity>
        ))}

        {satList.map((sat, idx) => (
          <Entity
            key={`${sat.noradId}-${idx}`}
            position={Cesium.Cartesian3.fromDegrees(sat.currentPos.lng, sat.currentPos.lat, sat.currentPos.alt * 1000)}
            name={`${sat.name} | ${Math.round(sat.currentPos.alt)}km`}
          >
            <BillboardGraphics
              image={satelliteIconUrl}
              width={20}
              height={20}
            />
            <PolylineGraphics
              positions={sat.orbitPath
                .filter((p) =>
                  isFinite(p.lat) && isFinite(p.lng) && isFinite(p.alt) &&
                  Math.abs(p.lat) <= 90 && p.alt > -100
                )
                .map((p) => Cesium.Cartesian3.fromDegrees(p.lng, p.lat, p.alt * 1000))
              }
              width={1}
              arcType={Cesium.ArcType.NONE}
              material={Cesium.Color.YELLOW.withAlpha(0.4)}
            />
          </Entity>
        ))}

        {camList.map((c) => (
          <CCTVBillboard key={c.camera_id} c={c} onClick={onCCTVClick ? () => onCCTVClick(c) : undefined} />
        ))}
      </Viewer>
    </div>
  );
};
