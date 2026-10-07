import type { FeatureCollection } from 'geojson';
import { RLayer, RMap, RMarker, RSource } from 'maplibre-react-components';
import { basemapStyle, transformRequest } from '../kart';
import { FasitMarkor, GjettMarkor } from './markorer';

export type Resultat = {
  gjett: [number, number];
  fasit: [number, number];
  avstandKm: number;
  hintKostnad: number;
  poeng: number;
};

// Kart som viser gjett, fasit og en stiplet linje mellom dem
export const Resultatkart = ({
  resultater,
  nummerert = false,
  paddingBunn = 80,
  paddingVenstre = 80,
}: {
  resultater: Resultat[];
  nummerert?: boolean;
  // Plass til panelene som ligger oppå kartet
  paddingBunn?: number;
  paddingVenstre?: number;
}) => {
  const punkter = resultater.flatMap((r) => [r.gjett, r.fasit]);
  const lngs = punkter.map((p) => p[0]);
  const lats = punkter.map((p) => p[1]);

  const linjer: FeatureCollection = {
    type: 'FeatureCollection',
    features: resultater.map((r) => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: [r.gjett, r.fasit] },
    })),
  };

  return (
    <RMap
      mapStyle={basemapStyle('standard')}
      initialTransformRequest={transformRequest}
      initialBounds={[
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ]}
      initialFitBoundsOptions={{
        padding: {
          top: 80,
          left: paddingVenstre,
          right: 80,
          bottom: paddingBunn,
        },
        maxZoom: 16,
      }}
      style={{ height: '100%' }}
    >
      <RSource id="linjer" type="geojson" data={linjer} />
      <RLayer
        source="linjer"
        id="linjer"
        type="line"
        paint={{
          'line-color': '#222',
          'line-width': 3,
          'line-dasharray': [2, 2],
        }}
      />
      {resultater.map((r, i) => (
        <RMarker
          key={`gjett-${i}`}
          longitude={r.gjett[0]}
          latitude={r.gjett[1]}
        >
          <GjettMarkor tekst={nummerert ? `${i + 1}` : ''} />
        </RMarker>
      ))}
      {resultater.map((r, i) => (
        <RMarker
          key={`fasit-${i}`}
          longitude={r.fasit[0]}
          latitude={r.fasit[1]}
        >
          <FasitMarkor tekst={nummerert ? `${i + 1}` : '🏁'} />
        </RMarker>
      ))}
    </RMap>
  );
};
