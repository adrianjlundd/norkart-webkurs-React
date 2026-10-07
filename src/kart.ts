import type { RequestTransformFunction } from 'maplibre-gl';

export const KVP_BASE_URL = 'https://kvp.maps.norkart.no/mvt/';

export type NorkartBasemapVariant =
  | 'standard'
  | 'standard-without-text'
  | 'greyscale'
  | 'greyscale-without-text'
  | 'darkmode'
  | 'transparent'
  | 'hybrid'
  | 'ortofoto';

export const basemapStyle = (variant: NorkartBasemapVariant) =>
  `${KVP_BASE_URL}norkart-basemap/${variant}/style.json`;

export const transformRequest: RequestTransformFunction = (url) => {
  if (!url.startsWith(KVP_BASE_URL)) {
    return { url };
  }

  const apiKey = import.meta.env.VITE_API_KEY;
  const separator = url.includes('?') ? '&' : '?';
  return { url: `${url}${separator}api_key=${encodeURIComponent(apiKey)}` };
};
