declare global {
  interface Window {
    google?: {
      maps: {
        Map: new (el: HTMLElement, options?: object) => google.maps.Map;
        MapTypeId: { SATELLITE: string; ROADMAP: string; HYBRID: string; TERRAIN: string };
        ControlPosition: { LEFT_BOTTOM: number };
        event: { trigger: (obj: object, event: string) => void };
        importLibrary?: (name: string) => Promise<{ Marker3DElement: unknown; Polyline3DElement: unknown }>;
      };
    };
  }
  namespace google {
    namespace maps {
      interface Map {
        setCenter(center: { lat: number; lng: number }): void;
        setZoom(z: number): void;
        getZoom(): number;
        setTilt(t: number): void;
        setHeading(h: number): void;
      }
    }
  }
}

export {};
