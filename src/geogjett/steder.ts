import type { Polygon } from 'geojson';
import { getBygningAtPunkt, type Bygning } from '../api/getBygningAtPunkt';
import { getHoydeFromPunkt } from '../api/getHoydeFromPunkt';
import {
  getRosDataForBygning,
  type RosData,
} from '../api/getRosDataForBygning';
import { avstandKm } from '../geo';
import { lagHint, type Hint } from './hint';

export type Sted = {
  posisjon: [number, number]; // [lng, lat]
  bygning: Bygning;
  ros: RosData | undefined;
  hoyde: number | undefined;
  hint: Hint[];
};

// Området stedene trekkes fra: Trondheim by
const OMRADE = { minLng: 10.3, maxLng: 10.5, minLat: 63.38, maxLat: 63.45 };
const SOKERADIUS_METER = 150;
const MAKS_FORSOK = 25;
// Stedene i et spill skal ligge et stykke fra hverandre
const MIN_AVSTAND_KM = 0.8;

const tilfeldig = (min: number, max: number) =>
  min + Math.random() * (max - min);

// Midtpunktet i bygningsomrisset (snitt av hjørnene)
const midtpunkt = (omriss: Polygon): [number, number] => {
  const ring = omriss.coordinates[0].slice(0, -1);
  const lng = ring.reduce((sum, p) => sum + p[0], 0) / ring.length;
  const lat = ring.reduce((sum, p) => sum + p[1], 0) / ring.length;
  return [lng, lat];
};

export const finnTilfeldigSted = async (andreSteder: Sted[]): Promise<Sted> => {
  for (let forsok = 0; forsok < MAKS_FORSOK; forsok++) {
    const bygning = await getBygningAtPunkt(
      tilfeldig(OMRADE.minLng, OMRADE.maxLng),
      tilfeldig(OMRADE.minLat, OMRADE.maxLat),
      SOKERADIUS_METER
    );
    if (!bygning?.FkbData?.BygningsOmriss) continue;

    const posisjon = midtpunkt(JSON.parse(bygning.FkbData.BygningsOmriss));
    const forNaer = andreSteder.some(
      (sted) => avstandKm(sted.posisjon, posisjon) < MIN_AVSTAND_KM
    );
    if (forNaer) continue;

    const [ros, hoyder] = await Promise.all([
      getRosDataForBygning(bygning.Bygningsnummer),
      getHoydeFromPunkt(posisjon[0], posisjon[1]),
    ]);
    const hoyde: number | undefined = hoyder[0]?.Z;

    return {
      posisjon,
      bygning,
      ros,
      hoyde,
      hint: lagHint(bygning, ros, hoyde),
    };
  }
  throw new Error('Fant ikke noe sted etter mange forsøk');
};
