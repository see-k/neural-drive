import React, { useEffect, useRef } from 'react';
import type { OpenSkyState } from '../../services/openskyService';
import type { AustinCamera } from '../../services/austinCCTVService';
import type { SatelliteOrbit } from '../../services/celestrakService';
import { createAircraftIcon, createCCTVPlaceholderIcon, createSatelliteIcon } from '../../utils/mapIcons';

const AUSTIN_CENTER = { lat: 30.2711, lng: -97.7403 };
const DEFAULT_ZOOM = 5;

declare const google: {
  maps: {
    Map: new (el: HTMLElement, opts?: object) => {
      setTilt: (n: number) => void;
      setZoom: (n: number) => void;
      getZoom: () => number;
      setCenter: (c: { lat: number; lng: number }) => void;
    };
    MapTypeId: { SATELLITE: string };
    ControlPosition: { LEFT_BOTTOM: number };
    Marker: new (opts: {
      position: object;
      map: object;
      icon: { url: string; scaledSize?: { width: number; height: number } };
      title?: string;
      cursor?: string;
    }) => { setMap: (m: object | null) => void; setIcon: (i: { url: string; scaledSize?: { width: number; height: number } }) => void; addListener: (ev: string, fn: () => void) => { remove: () => void } };
    LatLng: new (lat: number, lng: number) => object;
  };
};

interface Map2DViewerProps {
  aircraft?: OpenSkyState[];
  showAircraft?: boolean;
  satellites?: SatelliteOrbit[];
  showSatellites?: boolean;
  cameras?: AustinCamera[];
  showCCTV?: boolean;
  center?: { lat: number; lng: number };
  onCCTVClick?: (camera: AustinCamera) => void;
}

export const Map2DViewer: React.FC<Map2DViewerProps> = ({
  aircraft = [],
  showAircraft = true,
  satellites = [],
  showSatellites = true,
  cameras = [],
  showCCTV = true,
  center,
  onCCTVClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<InstanceType<typeof google.maps.Map> | null>(null);
  const markersRef = useRef<InstanceType<typeof google.maps.Marker>[]>([]);
  const satMarkersRef = useRef<InstanceType<typeof google.maps.Marker>[]>([]);
  const cctvMarkersRef = useRef<InstanceType<typeof google.maps.Marker>[]>([]);

  useEffect(() => {
    if (!containerRef.current || typeof google === 'undefined') return;

    const initialCenter = center || AUSTIN_CENTER;
    const map = new google.maps.Map(containerRef.current, {
      center: initialCenter,
      zoom: DEFAULT_ZOOM,
      mapTypeId: google.maps.MapTypeId.SATELLITE,
      disableDefaultUI: true,
      zoomControl: true,
      zoomControlOptions: { position: google.maps.ControlPosition.LEFT_BOTTOM },
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      gestureHandling: 'greedy',
      clickableIcons: false,
    });

    map.setTilt(0);
    map.setZoom(DEFAULT_ZOOM);
    mapRef.current = map;
    return () => { mapRef.current = null; };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !center) return;
    map.setCenter({ lat: center.lat, lng: center.lng });
  }, [center]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof google === 'undefined') return;
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
    if (!showAircraft || !aircraft.length) return;
    const icon = createAircraftIcon('#00f3ff');
    const list = aircraft.filter((a) => a.latitude != null && a.longitude != null).slice(0, 8000);
    const newMarkers = list.map((a) =>
      new google.maps.Marker({
        position: new google.maps.LatLng(a.latitude!, a.longitude!),
        map,
        icon: { url: icon, scaledSize: { width: 28, height: 28 } },
        title: `${a.callsign || a.icao24} | ${a.baro_altitude ?? '-'}m`,
      })
    );
    markersRef.current = newMarkers;
    return () => { newMarkers.forEach((m) => m.setMap(null)); };
  }, [aircraft, showAircraft]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof google === 'undefined') return;
    satMarkersRef.current.forEach((m) => m.setMap(null));
    satMarkersRef.current = [];
    if (!showSatellites || !satellites.length) return;
    const icon = createSatelliteIcon('#00f3ff');
    const size = { width: 24, height: 24 };
    const list = satellites.slice(0, 200);
    const newMarkers = list.map((s) =>
      new google.maps.Marker({
        position: new google.maps.LatLng(s.currentPos.lat, s.currentPos.lng),
        map,
        icon: { url: icon, scaledSize: size },
        title: `${s.name} | ${Math.round(s.currentPos.alt)}km`,
      })
    );
    satMarkersRef.current = newMarkers;
    return () => newMarkers.forEach((m) => m.setMap(null));
  }, [satellites, showSatellites]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || typeof google === 'undefined') return;
    cctvMarkersRef.current.forEach((m) => m.setMap(null));
    cctvMarkersRef.current = [];
    if (!showCCTV || !cameras.length) return;
    const placeholder = createCCTVPlaceholderIcon('#00f3ff');
    const size = { width: 32, height: 24 };
    const list = cameras.slice(0, 200);
    const newMarkers = list.map((c) => {
      const m = new google.maps.Marker({
        position: new google.maps.LatLng(c.location.coordinates[1], c.location.coordinates[0]),
        map,
        icon: { url: placeholder, scaledSize: size },
        title: c.location_name + ' — Click to view',
        cursor: onCCTVClick ? 'pointer' : undefined,
      });
      const img = new Image();
      img.onload = () => m.setIcon({ url: c.screenshot_address, scaledSize: size });
      img.onerror = () => {};
      img.src = c.screenshot_address;
      if (onCCTVClick) {
        const listener = m.addListener('click', () => onCCTVClick(c));
        return { m, listener };
      }
      return { m, listener: null };
    });
    cctvMarkersRef.current = newMarkers.map((x) => x.m);
    return () => {
      newMarkers.forEach((x) => {
        x.m.setMap(null);
        x.listener?.remove();
      });
    };
  }, [cameras, showCCTV, onCCTVClick]);

  return <div ref={containerRef} className="w-full h-full min-h-[400px]" />;
};
