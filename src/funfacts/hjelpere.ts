import type { Feature, FeatureCollection, Polygon, Position } from 'geojson';
import { getBygningAtPunkt, type Bygning } from '../api/getBygningAtPunkt';
import { getHoydeFromPunkt } from '../api/getHoydeFromPunkt';
import {
  getRosDataForBygning,
  type RosData,
} from '../api/getRosDataForBygning';
import { getTakflateDataForBygning } from '../api/getTakflateDataForBygning';
import type { Takflate } from '../api/getTakflateDataForPunkt';
import befolkningUrl from '../sample_data/befolkning_5km.json?url';

export const formatTall = (tall: number, desimaler = 0) =>
  tall.toLocaleString('nb-NO', { maximumFractionDigits: desimaler });

export const formatTid = (minutter: number) => {
  const timer = Math.floor(minutter / 60);
  const rest = Math.round(minutter % 60);
  return timer > 0 ? `${timer} t ${rest} min` : `${rest} min`;
};

export const hentHoyde = async (lng: number, lat: number) => {
  const hoyder = await getHoydeFromPunkt(lng, lat);
  return hoyder[0]?.Z as number;
};

// Finner høyeste punkt i et område ved å hente høyder i et rutenett, og så
// gjenta søket i et mindre rutenett rundt det høyeste punktet.
// Høyde-API-et tar rundt 100 punkter per kall.
export const finnToppunkt = async (
  lng: number,
  lat: number,
  radiusLng: number,
  radiusLat: number,
  runder = 4
) => {
  const N = 10;
  let senter = { X: lng, Y: lat, Z: -Infinity };

  for (let runde = 0; runde < runder; runde++) {
    const punkter = [];
    for (let i = 0; i < N; i++) {
      for (let j = 0; j < N; j++) {
        punkter.push({
          X: senter.X - radiusLng + (2 * radiusLng * i) / (N - 1),
          Y: senter.Y - radiusLat + (2 * radiusLat * j) / (N - 1),
        });
      }
    }
    const svar = await fetch('https://hoyde.api.norkart.no/hoyde', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WAAPI-TOKEN': `${import.meta.env.VITE_API_KEY}`,
      },
      body: JSON.stringify({ Punkter: punkter }),
    });
    const data: { PunktHoyder: { X: number; Y: number; Z: number }[] } =
      await svar.json();
    const hoyest = data.PunktHoyder.reduce((a, b) => (b.Z > a.Z ? b : a));
    if (hoyest.Z > senter.Z) senter = hoyest;

    radiusLng /= 4;
    radiusLat /= 4;
  }
  return senter;
};

export type Bygningsdata = {
  bygning: Bygning;
  ros: RosData | undefined;
  takflater: Takflate[];
  bakkehoyde: number;
  hoyesteTak: number | undefined;
  omriss: Feature<Polygon>;
};

// Henter bygning, ROS, takflater og bakkehøyde for en bygning
export const hentBygningsdata = async (
  lng: number,
  lat: number,
  radius: number
): Promise<Bygningsdata> => {
  const bygning = await getBygningAtPunkt(lng, lat, radius);
  if (!bygning?.FkbData?.BygningsOmriss) {
    throw new Error('Fant ikke bygningen');
  }
  const [ros, takflater, bakkehoyde] = await Promise.all([
    getRosDataForBygning(bygning.Bygningsnummer),
    getTakflateDataForBygning(bygning.Bygningsnummer),
    hentHoyde(lng, lat),
  ]);

  // Takgeometriene har høyde (Z) i hvert hjørne
  const zVerdier = takflater.flatMap((tak) =>
    (JSON.parse(tak.Geometri) as Polygon).coordinates[0]
      .map((punkt) => punkt[2])
      .filter((z): z is number => z !== undefined)
  );

  return {
    bygning,
    ros,
    takflater,
    bakkehoyde,
    hoyesteTak: zVerdier.length ? Math.max(...zVerdier) : undefined,
    omriss: {
      type: 'Feature',
      properties: {},
      geometry: JSON.parse(bygning.FkbData.BygningsOmriss),
    },
  };
};

// Finner et stedsnavn (poststed) ved å slå opp en bygning i nærheten og
// lese poststedet fra ROS-dataene
export const finnStedsnavn = async (lng: number, lat: number) => {
  for (const radius of [500, 2500]) {
    const bygning = await getBygningAtPunkt(lng, lat, radius);
    if (bygning) {
      const ros = await getRosDataForBygning(bygning.Bygningsnummer);
      if (ros?.Poststed) return formaterStedsnavn(ros.Poststed);
    }
  }
  return undefined;
};

const formaterStedsnavn = (navn: string) =>
  navn
    .toLowerCase()
    .replace(/(^|[\s-])\p{L}/gu, (bokstav) => bokstav.toUpperCase());

type BefolkningEgenskaper = {
  pop_tot: number;
  pop_ave?: string;
};

let befolkningCache: Promise<FeatureCollection<Polygon, BefolkningEgenskaper>>;

export const hentBefolkning = () => {
  befolkningCache ??= fetch(befolkningUrl).then((svar) => svar.json());
  return befolkningCache;
};

export const midtpunkt = (polygon: Polygon): Position => {
  const ring = polygon.coordinates[0].slice(0, -1);
  return [
    ring.reduce((sum, p) => sum + p[0], 0) / ring.length,
    ring.reduce((sum, p) => sum + p[1], 0) / ring.length,
  ];
};

export const snittalder = (egenskaper: BefolkningEgenskaper) =>
  egenskaper.pop_ave ? Number(egenskaper.pop_ave.replace(',', '.')) : NaN;
