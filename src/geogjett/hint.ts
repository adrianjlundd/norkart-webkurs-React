import type { Bygning } from '../api/getBygningAtPunkt';
import type { RosData } from '../api/getRosDataForBygning';

export type Hint = {
  id: string;
  ikon: string;
  tittel: string;
  tekst: string;
  // Poeng som trekkes fra hvis hintet avsløres. 0 = alltid synlig
  kostnad: number;
};

const formatTall = (tall: number) => tall.toLocaleString('nb-NO');

// Lager hintene for en bygning. Hint uten data blir ikke med.
export const lagHint = (
  bygning: Bygning,
  ros: RosData | undefined,
  hoyde: number | undefined
): Hint[] => {
  const matrikkel = bygning.MatrikkelData;
  const hint: (Hint | false | undefined)[] = [
    // Gratis hint
    !!matrikkel?.Bygningstype && {
      id: 'type',
      ikon: '🏠',
      tittel: 'Bygningstype',
      tekst: matrikkel.Bygningstype,
      kostnad: 0,
    },
    !!matrikkel?.AntattByggeaar && {
      id: 'byggeaar',
      ikon: '📅',
      tittel: 'Byggeår',
      tekst: `${matrikkel.AntattByggeaar}`,
      kostnad: 0,
    },
    hoyde !== undefined && {
      id: 'hoyde',
      ikon: '⛰️',
      tittel: 'Høyde over havet',
      tekst: `${Math.round(hoyde)} moh.`,
      kostnad: 0,
    },

    // Hint som koster poeng, sortert fra svakest til sterkest
    !!matrikkel?.Naringsgruppe && {
      id: 'naring',
      ikon: '💼',
      tittel: 'Næringsgruppe',
      tekst: matrikkel.Naringsgruppe,
      kostnad: 200,
    },
    !!ros?.Kyst && {
      id: 'kyst',
      ikon: '🌊',
      tittel: 'Avstand til sjøen',
      tekst: ros.Kyst === 'Nei' ? 'Langt fra sjøen' : `Innenfor ${ros.Kyst}`,
      kostnad: 300,
    },
    (!!ros?.Kvikkleire || !!ros?.Flom) && {
      id: 'grunn',
      ikon: '⚠️',
      tittel: 'Grunnforhold',
      tekst: `Kvikkleire: ${ros?.Kvikkleire ?? 'ukjent'}. Flom: ${ros?.Flom ?? 'ukjent'}.`,
      kostnad: 300,
    },
    !!ros?.AarsDognTrafikk && {
      id: 'trafikk',
      ikon: '🚗',
      tittel: 'Trafikk på nærmeste vei',
      tekst: `${formatTall(Number(ros.AarsDognTrafikk))} biler i døgnet`,
      kostnad: 300,
    },
    !!ros?.Brannstasjon && {
      id: 'brann',
      ikon: '🚒',
      tittel: 'Nærmeste brannstasjon',
      tekst: `${ros.Brannstasjon}, ${ros.AvstandBrannstasjon} km unna`,
      kostnad: 500,
    },
    !!(ros?.KulturmiljoNavn || ros?.EnkeltminneNavn) && {
      id: 'kultur',
      ikon: '🏛️',
      tittel: 'Kulturminne i nærheten',
      tekst: [ros?.EnkeltminneNavn, ros?.KulturmiljoNavn]
        .filter(Boolean)
        .join(' · '),
      kostnad: 600,
    },
    !!ros?.Postnummer && {
      id: 'postnr',
      ikon: '📮',
      tittel: 'Postnummer',
      tekst: ros.Postnummer,
      kostnad: 1000,
    },
    !!ros?.Grunnkretsnavn && {
      id: 'grunnkrets',
      ikon: '📍',
      tittel: 'Nabolag (grunnkrets)',
      tekst: ros.Grunnkretsnavn,
      kostnad: 1500,
    },
  ];
  return hint.filter((h): h is Hint => !!h);
};
