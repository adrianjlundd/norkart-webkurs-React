import { useCallback, useRef, useState } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import { avstandKm } from '../geo';
import { finnTilfeldigSted, type Sted } from './steder';
import { ANTALL_RUNDER, beregnPoeng } from './poeng';
import { bakgrunn, useBakgrunnsmusikk } from './stil';
import { StartSkjerm } from './StartSkjerm';
import { RundeSkjerm } from './RundeSkjerm';
import { ResultatSkjerm } from './ResultatSkjerm';
import { SluttSkjerm } from './SluttSkjerm';
import type { Resultat } from './Resultatkart';

type Fase = 'start' | 'runde' | 'resultat' | 'slutt';

const MUSIKK_URL = `${import.meta.env.BASE_URL}lyd/geogjett-tema.wav`;

export const GeoGjett = () => {
  const [fase, setFase] = useState<Fase>('start');
  const [steder, setSteder] = useState<Sted[]>([]);
  const [runde, setRunde] = useState(0);
  const [resultater, setResultater] = useState<Resultat[]>([]);
  const [feil, setFeil] = useState<string | undefined>();
  // Øker for hvert nytt spill, så lasting fra et gammelt spill kan stoppes
  const spillId = useRef(0);
  const musikk = useBakgrunnsmusikk(MUSIKK_URL);

  // Henter stedene ett og ett. Spillet starter så snart det første er klart,
  // og resten lastes mens man spiller.
  const startSpill = async () => {
    const id = ++spillId.current;
    musikk.start();
    setSteder([]);
    setResultater([]);
    setRunde(0);
    setFeil(undefined);
    setFase('runde');

    const nyeSteder: Sted[] = [];
    try {
      for (let i = 0; i < ANTALL_RUNDER; i++) {
        const sted = await finnTilfeldigSted(nyeSteder);
        if (id !== spillId.current) return;
        nyeSteder.push(sted);
        setSteder([...nyeSteder]);
      }
    } catch (error) {
      console.error(error);
      if (id !== spillId.current) return;
      setFeil('Klarte ikke å finne steder. Sjekk API-nøkkelen og prøv igjen.');
      setFase('start');
    }
  };

  const gjett = useCallback(
    (gjettPosisjon: [number, number], hintKostnad: number) => {
      const fasit = steder[runde].posisjon;
      const avstand = avstandKm(gjettPosisjon, fasit);
      setResultater((forrige) => [
        ...forrige,
        {
          gjett: gjettPosisjon,
          fasit,
          avstandKm: avstand,
          hintKostnad,
          poeng: beregnPoeng(avstand, hintKostnad),
        },
      ]);
      setFase('resultat');
    },
    [steder, runde]
  );

  const neste = useCallback(() => {
    if (runde + 1 >= ANTALL_RUNDER) {
      setFase('slutt');
    } else {
      setRunde(runde + 1);
      setFase('runde');
    }
  }, [runde]);

  const totalPoeng = resultater.reduce((sum, r) => sum + r.poeng, 0);
  const sted = steder[runde];

  return (
    <Box
      sx={{
        height: 'calc(100dvh - var(--header-height))',
        position: 'relative',
      }}
    >
      {fase !== 'start' && (
        <Button
          size="small"
          onClick={musikk.byttDemping}
          sx={{
            position: 'absolute',
            left: 16,
            bottom: 16,
            zIndex: 10,
            bgcolor: 'rgba(26, 11, 61, 0.85)',
            color: 'white',
            borderRadius: 999,
            px: 2,
            fontWeight: 700,
            '&:hover': { bgcolor: 'rgba(26, 11, 61, 1)' },
          }}
        >
          {musikk.dempet ? 'Lyd: av' : 'Lyd: på'}
        </Button>
      )}
      {fase === 'start' && <StartSkjerm onStart={startSpill} feil={feil} />}

      {fase === 'runde' &&
        (sted ? (
          <RundeSkjerm
            key={runde}
            sted={sted}
            runde={runde}
            totalPoeng={totalPoeng}
            onGjett={gjett}
          />
        ) : (
          <Laster />
        ))}

      {fase === 'resultat' && sted && resultater[runde] && (
        <ResultatSkjerm
          resultat={resultater[runde]}
          sted={sted}
          erSisteRunde={runde + 1 >= ANTALL_RUNDER}
          nesteErKlar={runde + 1 >= ANTALL_RUNDER || !!steder[runde + 1]}
          onNeste={neste}
        />
      )}

      {fase === 'slutt' && (
        <SluttSkjerm resultater={resultater} onSpillIgjen={startSpill} />
      )}
    </Box>
  );
};

const Laster = () => (
  <Box
    sx={{
      ...bakgrunn,
      height: '100%',
      display: 'grid',
      placeItems: 'center',
      color: 'white',
      textAlign: 'center',
    }}
  >
    <Box>
      <CircularProgress sx={{ color: 'white', mb: 2 }} />
      <Typography sx={{ fontWeight: 700, fontStyle: 'italic' }}>
        Finner et tilfeldig sted i Trondheim…
      </Typography>
    </Box>
  </Box>
);
