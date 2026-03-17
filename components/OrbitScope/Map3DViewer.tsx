import React, { useEffect, useRef } from 'react';
import type { OpenSkyState } from '../../services/openskyService';
import type { AustinCamera } from '../../services/austinCCTVService';
import type { SatelliteOrbit } from '../../services/celestrakService';
import { createAircraftIcon, createCCTVPlaceholderIcon, createSatelliteIcon } from '../../utils/mapIcons';

const AUSTIN_CENTER = { lat: 30.2711, lng: -97.7403 };
const DEFAULT_ALTITUDE = 100;

export const Map3DViewer: React.FC<{
  aircraft?: OpenSkyState[];
  showAircraft?: boolean;
  satellites?: SatelliteOrbit[];
  showSatellites?: boolean;
  cameras?: AustinCamera[];
  showCCTV?: boolean;
  center?: { lat: number; lng: number; alt?: number };
  onCCTVClick?: (camera: AustinCamera) => void;
}> = ({ aircraft = [], showAircraft = true, satellites = [], showSatellites = true, cameras = [], showCCTV = true, center, onCCTVClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const map3dRef = useRef<HTMLElement | null>(null);
  const markersRef = useRef<HTMLElement[]>([]);
  const satMarkersRef = useRef<HTMLElement[]>([]);
  const cctvMarkersRef = useRef<HTMLElement[]>([]);

  useEffect(() => {
    if (!containerRef.current || typeof google === 'undefined') return;

    const init = async () => {
      try {
        await (google.maps as { importLibrary?: (name: string) => Promise<{ Marker3DElement: new (o: object) => HTMLElement }> }).importLibrary?.('maps3d');
      } catch (err) {
        console.warn('[Map3DViewer] Failed to load maps3d:', err);
        return;
      }

      const c = center || AUSTIN_CENTER;
      const map3d = document.createElement('gmp-map-3d');
      map3d.setAttribute('center', `${c.lat},${c.lng},${c.alt ?? DEFAULT_ALTITUDE}`);
      map3d.setAttribute('tilt', '67');
      map3d.setAttribute('range', '1500');
      map3d.setAttribute('heading', '0');
      map3d.setAttribute('mode', 'HYBRID');
      map3d.setAttribute('maxAltitude', '1500000');
      map3d.style.width = '100%';
      map3d.style.height = '100%';

      containerRef.current.appendChild(map3d);
      map3dRef.current = map3d;
    };

    init();
    return () => {
      map3dRef.current?.remove();
      map3dRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map3d = map3dRef.current;
    if (!map3d || !center) return;
    map3d.setAttribute('center', `${center.lat},${center.lng},${center.alt ?? DEFAULT_ALTITUDE}`);
  }, [center]);

  useEffect(() => {
    const map3d = map3dRef.current;
    if (!map3d || typeof google === 'undefined') return;
    const maps3d = (google.maps as { maps3d?: { Marker3DElement: new (o: object) => HTMLElement } }).maps3d;
    if (!maps3d) return;
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
    if (!showAircraft || !aircraft.length) return;
    const icon = createAircraftIcon('#00f3ff');
    const list = aircraft.filter((a) => a.latitude != null && a.longitude != null).slice(0, 2000);
    list.forEach((a) => {
      const marker = new maps3d.Marker3DElement({
        position: { lat: a.latitude!, lng: a.longitude!, altitude: a.baro_altitude ?? 0 },
        altitudeMode: 'ABSOLUTE',
        extruded: true,
        sizePreserved: true,
        collisionBehavior: 'REQUIRED',
      });
      const template = document.createElement('template');
      try {
        const svgText = decodeURIComponent(icon.split(',')[1]);
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgEl = svgDoc.documentElement;
        svgEl.style.width = '32px';
        svgEl.style.height = '32px';
        template.content.append(svgEl);
      } catch {
        const img = document.createElement('img');
        img.src = icon;
        img.style.width = '32px';
        img.style.height = '32px';
        template.content.append(img);
      }
      marker.append(template);
      map3d.appendChild(marker);
      markersRef.current.push(marker);
    });
    return () => markersRef.current.forEach((m) => m.remove());
  }, [aircraft, showAircraft]);

  useEffect(() => {
    const map3d = map3dRef.current;
    if (!map3d || typeof google === 'undefined') return;
    const maps3d = (google.maps as { maps3d?: { Marker3DElement: new (o: object) => HTMLElement } }).maps3d;
    if (!maps3d) return;
    satMarkersRef.current.forEach((m) => m.remove());
    satMarkersRef.current = [];
    if (!showSatellites || !satellites.length) return;
    const icon = createSatelliteIcon('#00f3ff');
    satellites.slice(0, 200).forEach((s) => {
      const marker = new maps3d.Marker3DElement({
        position: { lat: s.currentPos.lat, lng: s.currentPos.lng, altitude: s.currentPos.alt * 1000 },
        altitudeMode: 'ABSOLUTE',
        extruded: false,
        sizePreserved: true,
      });
      const template = document.createElement('template');
      try {
        const svgText = decodeURIComponent(icon.split(',')[1]);
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
        const svgEl = svgDoc.documentElement;
        svgEl.style.width = '24px';
        svgEl.style.height = '24px';
        template.content.append(svgEl);
      } catch {
        const img = document.createElement('img');
        img.src = icon;
        img.style.width = '24px';
        img.style.height = '24px';
        template.content.append(img);
      }
      marker.append(template);
      map3d.appendChild(marker);
      satMarkersRef.current.push(marker);
    });
    return () => satMarkersRef.current.forEach((m) => m.remove());
  }, [satellites, showSatellites]);

  useEffect(() => {
    const map3d = map3dRef.current;
    if (!map3d || typeof google === 'undefined') return;
    const maps3d = (google.maps as { maps3d?: { Marker3DElement: new (o: object) => HTMLElement } }).maps3d;
    if (!maps3d) return;
    cctvMarkersRef.current.forEach((m) => m.remove());
    cctvMarkersRef.current = [];
    if (!showCCTV || !cameras.length) return;
    const placeholder = createCCTVPlaceholderIcon('#00f3ff');
    cameras.slice(0, 200).forEach((c) => {
      const marker = new maps3d.Marker3DElement({
        position: { lat: c.location.coordinates[1], lng: c.location.coordinates[0], altitude: 0 },
        altitudeMode: 'RELATIVE_TO_GROUND',
        extruded: false,
        sizePreserved: true,
      });
      const img = document.createElement('img');
      img.alt = c.location_name;
      img.style.width = '32px';
      img.style.height = '24px';
      img.style.objectFit = 'cover';
      img.style.border = '1px solid #333';
      img.onerror = () => {
        img.src = placeholder;
        img.onerror = null;
      };
      img.src = c.screenshot_address;
      marker.append(img);
      if (onCCTVClick) {
        marker.style.cursor = 'pointer';
        marker.addEventListener('click', () => onCCTVClick(c));
      }
      map3d.appendChild(marker);
      cctvMarkersRef.current.push(marker);
    });
    return () => cctvMarkersRef.current.forEach((m) => m.remove());
  }, [cameras, showCCTV, onCCTVClick]);

  return <div ref={containerRef} className="w-full h-full min-h-[400px]" />;
};
