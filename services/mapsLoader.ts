/**
 * Google Maps Loader - Load Maps JS API with maps3d for OrbitScope.
 * Adapted from helios-app maps-loader.js.
 */

declare global {
  interface Window {
    __neuralMapInit?: () => void;
  }
}

let _loadPromise: Promise<boolean> | null = null;

export function isMapsLoaded(): boolean {
  return typeof window !== 'undefined' && typeof (window as unknown as { google?: { maps?: unknown } }).google !== 'undefined' && (window as unknown as { google: { maps: unknown } }).google.maps !== undefined;
}

export async function loadGoogleMaps(apiKey: string): Promise<boolean> {
  if (isMapsLoaded()) return true;
  if (_loadPromise) return _loadPromise;

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    return false;
  }

  _loadPromise = new Promise<boolean>((resolve) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=alpha&callback=__neuralMapInit`;
    script.async = true;
    script.defer = true;

    (window as Window & { __neuralMapInit: () => void }).__neuralMapInit = () => {
      delete (window as Window & { __neuralMapInit?: () => void }).__neuralMapInit;
      resolve(true);
    };

    script.onerror = () => {
      _loadPromise = null;
      resolve(false);
    };

    document.head.appendChild(script);
  });

  return _loadPromise;
}
