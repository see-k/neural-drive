/**
 * Austin Traffic Cameras - Open Data
 * https://data.austintexas.gov/resource/b4k4-adkb.json
 */

export interface AustinCamera {
  camera_id: string;
  location_name: string;
  camera_status: string;
  screenshot_address: string;
  location: {
    type: string;
    coordinates: [number, number]; // [longitude, latitude]
  };
}

const AUSTIN_CCTV_URL = 'https://data.austintexas.gov/resource/b4k4-adkb.json';

/**
 * Fetch Austin traffic cameras (TURNED_ON only).
 */
export async function fetchAustinCameras(): Promise<AustinCamera[]> {
  const params = new URLSearchParams({
    camera_status: 'TURNED_ON',
    $limit: '200',
  });
  const res = await fetch(`${AUSTIN_CCTV_URL}?${params}`);
  if (!res.ok) throw new Error(`Austin CCTV API error: ${res.status}`);
  const data = (await res.json()) as AustinCamera[];
  return data.filter((c) => c.location?.coordinates?.length >= 2);
}
