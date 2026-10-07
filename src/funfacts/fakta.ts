import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { getRuteMellomPunkter } from '../api/getRuteMellomPunkter';
import { avstandKm } from '../geo';
import {
  finnStedsnavn,
  finnToppunkt,
  formatTall,
  formatTid,
  hentBefolkning,
  hentBygningsdata,
  hentHoyde,
  midtpunkt,
  snittalder,
} from './hjelpere';

export type FaktaResultat = {
  tekst: string;
  // Det som markeres i kartet. Kartet zoomer slik at alt vises.
  markering?: Feature[];
  // Et punkt som markeres med en pulserende ring
  punkt?: [number, number];
  maksZoom: number;
};

export type FunFact = {
  id: string;
  tittel: string;
  kilde: string;
  hent: () => Promise<FaktaResultat>;
};

const TORVET: [number, number] = [10.3951, 63.4305];
// Gjennomsnittlig strømforbruk i en norsk husstand (kWh per år)
const STROM_HUSSTAND_KWH = 16000;
// Typisk andel av solenergien som solceller gjør om til strøm
const SOLCELLE_VIRKNINGSGRAD = 0.2;

const feature = (geometry: Geometry): Feature => ({
  type: 'Feature',
  properties: {},
  geometry,
});

const ruteFakta = async (
  fra: [number, number],
  til: [number, number],
  lagTekst: (tid: string, km: string, minutter: number) => string
): Promise<FaktaResultat> => {
  const rute = await getRuteMellomPunkter(fra[0], fra[1], til[0], til[1]);
  if (!rute) throw new Error('Fant ingen rute');
  const minutter = rute.CostList.find((k) => k.Name === 'time')?.Cost ?? 0;
  const km = rute.RouteGeometry.coordinates.reduce(
    (sum, linje) =>
      sum + linje.slice(1).reduce((s, p, i) => s + avstandKm(linje[i], p), 0),
    0
  );
  return {
    tekst: lagTekst(formatTid(minutter), formatTall(km), minutter),
    markering: [feature(rute.RouteGeometry)],
    maksZoom: 12,
  };
};

export const FUN_FACTS: FunFact[] = [
  {
    id: 'galdhopiggen',
    tittel: 'Norges tak',
    kilde: 'Høyde-API',
    hent: async () => {
      const topp = await finnToppunkt(8.3125, 61.6364, 0.02, 0.01);
      return {
        tekst: `Det høyeste punktet høyde-API-et finner på Galdhøpiggen er ${formatTall(topp.Z)} moh. Det er Norges (og Nord-Europas) høyeste fjell – like høyt som ${formatTall(topp.Z / 124)} Tyholttårn stablet oppå hverandre.`,
        punkt: [topp.X, topp.Y],
        maksZoom: 13,
      };
    },
  },
  {
    id: 'graakallen',
    tittel: 'Utsikt over hele byen',
    kilde: 'Høyde-API',
    hent: async () => {
      const [topp, torvet] = await Promise.all([
        finnToppunkt(10.2546, 63.4207, 0.012, 0.006),
        hentHoyde(...TORVET),
      ]);
      return {
        tekst: `Toppen av Gråkallen ligger ${formatTall(topp.Z)} moh. – hele ${formatTall(topp.Z - torvet)} meter høyere enn Torvet i sentrum, som bare ligger ${formatTall(torvet, 1)} moh. Likevel er det bare ${formatTall(avstandKm([topp.X, topp.Y], TORVET), 1)} km mellom dem i luftlinje!`,
        punkt: [topp.X, topp.Y],
        maksZoom: 14,
      };
    },
  },
  {
    id: 'nidarosdomen',
    tittel: 'Nidarosdomen strekker seg mot himmelen',
    kilde: 'Bygning-, takflate- og høyde-API',
    hent: async () => {
      const d = await hentBygningsdata(10.3969, 63.4269, 40);
      const tak = d.hoyesteTak ?? 0;
      return {
        tekst: `Nidarosdomen har hele ${formatTall(d.takflater.length)} takflater! Den høyeste ligger ${formatTall(tak)} moh. – omtrent ${formatTall(tak - d.bakkehoyde)} meter over bakken.`,
        markering: [d.omriss],
        maksZoom: 17,
      };
    },
  },
  {
    id: 'kvikkleire',
    tittel: 'Hva skjuler seg under domkirken?',
    kilde: 'ROS-API',
    hent: async () => {
      const d = await hentBygningsdata(10.3969, 63.4269, 40);
      return {
        tekst: `ROS-dataene sier «${d.ros?.Kvikkleire?.toLowerCase()}» for kvikkleire under Nidarosdomen. Trondheim er kjent for kvikkleire – leire som kan bli flytende som vann. Domkirken er ${d.ros?.FredaBygg ? 'fredet' : 'ikke fredet'} og ligger i kulturmiljøet «${d.ros?.KulturmiljoNavn}».`,
        markering: [d.omriss],
        maksZoom: 17,
      };
    },
  },
  {
    id: 'tyholt',
    tittel: 'Tyholttårnet ruver',
    kilde: 'Bygning-, takflate- og høyde-API',
    hent: async () => {
      const [d, torvet] = await Promise.all([
        hentBygningsdata(10.4313, 63.4223, 40),
        hentHoyde(...TORVET),
      ]);
      const tak = d.hoyesteTak ?? 0;
      return {
        tekst: `Tyholttårnet står på en kolle ${formatTall(d.bakkehoyde)} moh. Den høyeste takflaten i bygningen ligger ${formatTall(tak)} moh. – ${formatTall(tak - torvet)} meter høyere enn Torvet. Restauranten på toppen roterer, så du får hele byen rundt deg mens du spiser.`,
        markering: [d.omriss],
        maksZoom: 17,
      };
    },
  },
  {
    id: 'munkholmen',
    tittel: 'Øya uten brannstasjon',
    kilde: 'Bygning- og ROS-API',
    hent: async () => {
      const d = await hentBygningsdata(10.3836, 63.4511, 40);
      const ros = d.ros;
      return {
        tekst: `Munkholmen er ${ros?.OyUtenBrannstasjon ? 'en øy uten brannstasjon' : 'en øy'}${ros?.Brannstasjon ? '' : ', og ROS-dataene har ingen nærmeste brannstasjon å vise til'}. Øya er ${ros?.FredaBygg ? 'fredet' : 'ikke fredet'} og har kulturminnet «${ros?.EnkeltminneNavn}». Her lå det et kloster allerede på 1100-tallet!`,
        markering: [d.omriss],
        maksZoom: 16,
      };
    },
  },
  {
    id: 'spektrum',
    tittel: 'Et gigantisk solkraftverk?',
    kilde: 'Bygning- og takflate-API',
    hent: async () => {
      const d = await hentBygningsdata(10.377, 63.4269, 40);
      const areal = d.takflater.reduce((sum, t) => sum + t.Areal3D, 0);
      const solKwh = d.takflater.reduce(
        (sum, t) => sum + t.Solinnstraaling * t.Areal3D,
        0
      );
      const stromKwh = solKwh * SOLCELLE_VIRKNINGSGRAD;
      return {
        tekst: `Takene på Trondheim Spektrum er ${formatTall(areal)} m² – like stort som ${formatTall(areal / 7140, 1)} fotballbaner. De får ${formatTall(solKwh / 1000)} MWh sol i året. Med solceller kunne det blitt ca. ${formatTall(stromKwh / 1000)} MWh strøm – nok til ${formatTall(stromKwh / STROM_HUSSTAND_KWH)} husstander!`,
        markering: [d.omriss],
        maksZoom: 16,
      };
    },
  },
  {
    id: 'tettest',
    tittel: 'Norges tetteste 25 km²',
    kilde: 'Befolkningsdata (SSB, 5x5 km-ruter)',
    hent: async () => {
      const befolkning = await hentBefolkning();
      const total = befolkning.features.reduce(
        (sum, f) => sum + f.properties.pop_tot,
        0
      );
      const tettest = befolkning.features.reduce((a, b) =>
        b.properties.pop_tot > a.properties.pop_tot ? b : a
      );
      const [lng, lat] = midtpunkt(tettest.geometry);
      const sted = await finnStedsnavn(lng, lat);
      return {
        tekst: `Hele ${formatTall(tettest.properties.pop_tot)} mennesker bor i denne ene 5x5 km-ruta${sted ? ` i ${sted}` : ''}. Det er ${formatTall((tettest.properties.pop_tot / total) * 100, 1)} % av Norges befolkning på et område du kan gå over på en time.`,
        markering: [tettest],
        maksZoom: 12,
      };
    },
  },
  {
    id: 'topp10',
    tittel: 'Trangt om plassen',
    kilde: 'Befolkningsdata (SSB, 5x5 km-ruter)',
    hent: async () => {
      const befolkning = await hentBefolkning();
      const alle = befolkning.features;
      const total = alle.reduce((sum, f) => sum + f.properties.pop_tot, 0);
      const topp10 = [...alle]
        .sort((a, b) => b.properties.pop_tot - a.properties.pop_tot)
        .slice(0, 10);
      const sum = topp10.reduce((s, f) => s + f.properties.pop_tot, 0);
      return {
        tekst: `De 10 tettest befolkede rutene i Norge dekker bare 250 km², men ${formatTall(sum)} mennesker bor der – ${formatTall((sum / total) * 100, 1)} % av befolkningen. Til sammen finnes det ${formatTall(alle.length)} bebodde ruter i landet.`,
        markering: topp10,
        maksZoom: 10,
      };
    },
  },
  {
    id: 'eldst',
    tittel: 'Norges eldste nabolag',
    kilde: 'Befolkningsdata (SSB) og ROS-API',
    hent: async () => {
      const befolkning = await hentBefolkning();
      const store = befolkning.features.filter(
        (f) => f.properties.pop_tot >= 500 && !isNaN(snittalder(f.properties))
      );
      const eldst = store.reduce((a, b) =>
        snittalder(b.properties) > snittalder(a.properties) ? b : a
      );
      const [lng, lat] = midtpunkt(eldst.geometry);
      const sted = await finnStedsnavn(lng, lat);
      return {
        tekst: `Av rutene med minst 500 innbyggere har denne${sted ? ` ved ${sted}` : ''} høyest snittalder: ${formatTall(snittalder(eldst.properties), 1)} år. Her bor ${formatTall(eldst.properties.pop_tot)} personer.`,
        markering: [eldst],
        maksZoom: 11,
      };
    },
  },
  {
    id: 'yngst',
    tittel: 'Norges yngste nabolag',
    kilde: 'Befolkningsdata (SSB) og ROS-API',
    hent: async () => {
      const befolkning = await hentBefolkning();
      const store = befolkning.features.filter(
        (f) => f.properties.pop_tot >= 500 && !isNaN(snittalder(f.properties))
      );
      const yngst = store.reduce((a, b) =>
        snittalder(b.properties) < snittalder(a.properties) ? b : a
      );
      const [lng, lat] = midtpunkt(yngst.geometry);
      const sted = await finnStedsnavn(lng, lat);
      return {
        tekst: `Av rutene med minst 500 innbyggere har denne${sted ? ` ved ${sted}` : ''} lavest snittalder: bare ${formatTall(snittalder(yngst.properties), 1)} år. Her bor ${formatTall(yngst.properties.pop_tot)} personer.`,
        markering: [yngst],
        maksZoom: 11,
      };
    },
  },
  {
    id: 'nordligst',
    tittel: 'Lengst nord av alle',
    kilde: 'Befolkningsdata (SSB) og ROS-API',
    hent: async () => {
      const befolkning = await hentBefolkning();
      const nordligst = befolkning.features.reduce((a, b) =>
        midtpunkt(b.geometry)[1] > midtpunkt(a.geometry)[1] ? b : a
      );
      const [lng, lat] = midtpunkt(nordligst.geometry);
      const sted = await finnStedsnavn(lng, lat);
      return {
        tekst: `Norges nordligste befolkede 5x5 km-rute ligger på ${formatTall(lat, 2)}° nord${sted ? `, ved ${sted}` : ''}. Her bor ${formatTall(nordligst.properties.pop_tot)} personer – og om sommeren går ikke sola ned på over to måneder.`,
        markering: [nordligst],
        maksZoom: 10,
      };
    },
  },
  {
    id: 'ensom',
    tittel: 'Helt alene på 25 km²',
    kilde: 'Befolkningsdata (SSB) og ROS-API',
    hent: async () => {
      const befolkning = await hentBefolkning();
      const ensomme = befolkning.features.filter(
        (f) => f.properties.pop_tot === 1
      );
      const valgt = ensomme[Math.floor(Math.random() * ensomme.length)];
      const [lng, lat] = midtpunkt(valgt.geometry);
      const sted = await finnStedsnavn(lng, lat);
      return {
        tekst: `${formatTall(ensomme.length)} av Norges 5x5 km-ruter har nøyaktig én innbygger. Her er en av dem${sted ? `, ved ${sted}` : ''} – 25 km² helt for seg selv!`,
        markering: [valgt],
        maksZoom: 11,
      };
    },
  },
  {
    id: 'oslo',
    tittel: 'Trondheim – Oslo',
    kilde: 'Rute-API',
    hent: () =>
      ruteFakta(
        TORVET,
        [10.7522, 59.9139],
        (tid, km) =>
          `Kjøreturen fra Torvet i Trondheim til Oslo sentrum er ${km} km og tar ${tid} – uten pauser.`
      ),
  },
  {
    id: 'langs',
    tittel: 'Norge på langs',
    kilde: 'Rute-API',
    hent: () =>
      ruteFakta(
        [7.0475, 57.9826],
        [25.7836, 71.171],
        (tid, km, minutter) =>
          `Fra Lindesnes fyr i sør til Nordkapp i nord er det ${km} km å kjøre, og det tar ${tid} uten stopp. Med 8 timers kjøring om dagen tar turen ca. ${Math.ceil(minutter / 60 / 8)} dager.`
      ),
  },
];

export const tilFeatureCollection = (
  features: Feature[] = []
): FeatureCollection => ({ type: 'FeatureCollection', features });
