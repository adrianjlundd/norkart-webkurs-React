import { useRef, useState } from 'react';
import type { Feature, Position } from 'geojson';
import { RLayer, RMarker, RSource, useMap } from 'maplibre-react-components';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import {
  FUN_FACTS,
  tilFeatureCollection,
  type FaktaResultat,
  type FunFact,
} from './fakta';

const MARKERINGSFARGE = '#e91e63';
// Plass til panelet til venstre og fun fact-kortet til høyre
const PANEL_BREDDE = 400;
const KORT_BREDDE = 360;

const stokk = <T,>(liste: T[]) =>
  [...liste]
    .map((verdi) => ({ verdi, tilfeldig: Math.random() }))
    .sort((a, b) => a.tilfeldig - b.tilfeldig)
    .map(({ verdi }) => verdi);

// Alle koordinater i en geometri, uansett type
const alleKoordinater = (features: Feature[]): Position[] =>
  features.flatMap((f) => {
    const g = f.geometry;
    switch (g.type) {
      case 'Point':
        return [g.coordinates];
      case 'LineString':
      case 'MultiPoint':
        return g.coordinates;
      case 'Polygon':
      case 'MultiLineString':
        return g.coordinates.flat();
      case 'MultiPolygon':
        return g.coordinates.flat(2);
      default:
        return [];
    }
  });

export const FunFactKnapp = () => {
  const map = useMap();
  const [fakta, setFakta] = useState<FunFact | undefined>();
  const [resultat, setResultat] = useState<FaktaResultat | undefined>();
  const [laster, setLaster] = useState(false);
  const [feil, setFeil] = useState(false);
  // Faktaene vises i tilfeldig rekkefølge uten gjentakelser
  const rekkefolge = useRef<FunFact[]>([]);

  const zoomTil = (res: FaktaResultat) => {
    const bredde = map.getContainer().clientWidth;
    const padding = {
      top: 60,
      bottom: 60,
      left: Math.min(PANEL_BREDDE, bredde * 0.3),
      right: Math.min(KORT_BREDDE + 40, bredde * 0.3),
    };
    const koordinater = alleKoordinater(res.markering ?? []);
    if (res.punkt) koordinater.push(res.punkt);

    const lngs = koordinater.map((k) => k[0]);
    const lats = koordinater.map((k) => k[1]);
    map.fitBounds(
      [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ],
      { padding, maxZoom: res.maksZoom, duration: 2500 }
    );
  };

  const visNeste = async () => {
    if (rekkefolge.current.length === 0) {
      rekkefolge.current = stokk(FUN_FACTS);
    }
    const neste = rekkefolge.current.shift()!;

    setFakta(neste);
    setResultat(undefined);
    setFeil(false);
    setLaster(true);
    try {
      const res = await neste.hent();
      setResultat(res);
      zoomTil(res);
    } catch (error) {
      console.error(error);
      setFeil(true);
    } finally {
      setLaster(false);
    }
  };

  const lukk = () => {
    setFakta(undefined);
    setResultat(undefined);
  };

  return (
    <>
      <RSource
        id="funfact"
        type="geojson"
        data={tilFeatureCollection(resultat?.markering)}
      />
      <RLayer
        source="funfact"
        id="funfact-fill"
        type="fill"
        filter={['==', ['geometry-type'], 'Polygon']}
        paint={{ 'fill-color': MARKERINGSFARGE, 'fill-opacity': 0.3 }}
      />
      <RLayer
        source="funfact"
        id="funfact-line"
        type="line"
        paint={{ 'line-color': MARKERINGSFARGE, 'line-width': 4 }}
      />
      {resultat?.punkt && (
        <RMarker longitude={resultat.punkt[0]} latitude={resultat.punkt[1]}>
          <div className="geogjett-puls" />
        </RMarker>
      )}

      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: KORT_BREDDE,
          maxWidth: 'calc(100vw - 40px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 1.5,
        }}
      >
        <Button
          variant="contained"
          onClick={visNeste}
          disabled={laster}
          sx={{
            borderRadius: 999,
            px: 2.5,
            fontWeight: 700,
            bgcolor: MARKERINGSFARGE,
            '&:hover': { bgcolor: '#c2185b' },
          }}
        >
          💡 {fakta ? 'Ny fun fact' : 'Fun fact'}
        </Button>

        {fakta && (
          <Card elevation={6} sx={{ width: '100%', borderRadius: 3 }}>
            <CardContent sx={{ position: 'relative', pr: 5 }}>
              <IconButton
                size="small"
                aria-label="Lukk"
                onClick={lukk}
                sx={{ position: 'absolute', top: 8, right: 8 }}
              >
                ×
              </IconButton>
              <Typography variant="h6" sx={{ lineHeight: 1.3, mb: 1 }}>
                {fakta.tittel}
              </Typography>
              {laster && (
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                  <CircularProgress size={20} />
                  <Typography color="text.secondary">
                    Henter data fra API-et…
                  </Typography>
                </Box>
              )}
              {feil && (
                <Typography color="error">
                  Klarte ikke å hente denne faktaen. Prøv en ny!
                </Typography>
              )}
              {resultat && (
                <>
                  <Typography>{resultat.tekst}</Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1.5 }}
                  >
                    Kilde: {fakta.kilde}
                  </Typography>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </>
  );
};
