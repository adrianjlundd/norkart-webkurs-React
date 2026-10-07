import { useCallback, useState } from 'react';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import {
  RMap,
  RMarker,
  RNavigationControl,
  useMap,
} from 'maplibre-react-components';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import { basemapStyle, transformRequest } from '../kart';
import { SPILLOMRADE, type Sted } from './steder';
import type { Hint } from './hint';
import { LILLA, knappStil, useTast } from './stil';
import { GjettMarkor, OppdaterStorrelse } from './markorer';
import { ANTALL_RUNDER, formatPoeng } from './poeng';

const START_ZOOM = 17.5;
// Hvor langt (i grader) man kan flytte seg bort fra stedet i flyfotoet
const BEVEGELSE_LNG = 0.01;
const BEVEGELSE_LAT = 0.0045;

export const RundeSkjerm = ({
  sted,
  runde,
  totalPoeng,
  onGjett,
}: {
  sted: Sted;
  runde: number;
  totalPoeng: number;
  onGjett: (gjett: [number, number], hintKostnad: number) => void;
}) => {
  const [gjett, setGjett] = useState<[number, number] | undefined>();
  const [avslorte, setAvslorte] = useState<string[]>([]);
  const [minikartStort, setMinikartStort] = useState(false);

  const hintKostnad = sted.hint
    .filter((hint) => avslorte.includes(hint.id))
    .reduce((sum, hint) => sum + hint.kostnad, 0);

  const sendGjett = useCallback(() => {
    if (gjett) onGjett(gjett, hintKostnad);
  }, [gjett, hintKostnad, onGjett]);
  useTast(gjett ? sendGjett : undefined);

  const [lng, lat] = sted.posisjon;

  return (
    <Box sx={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      {/* Flyfoto av stedet - "panoramaet" */}
      <RMap
        mapStyle={basemapStyle('ortofoto')}
        initialTransformRequest={transformRequest}
        initialCenter={sted.posisjon}
        initialZoom={START_ZOOM}
        minZoom={15.5}
        maxZoom={19.5}
        maxBounds={[
          [lng - BEVEGELSE_LNG, lat - BEVEGELSE_LAT],
          [lng + BEVEGELSE_LNG, lat + BEVEGELSE_LAT],
        ]}
        style={{ height: '100%' }}
      >
        <RMarker longitude={lng} latitude={lat}>
          <div className="geogjett-puls" />
        </RMarker>
        <TilbakeTilStart posisjon={sted.posisjon} />
      </RMap>

      {/* Runde og poeng øverst til høyre */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          display: 'flex',
          bgcolor: LILLA,
          color: 'white',
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: 3,
        }}
      >
        <HudFelt tittel="Runde" verdi={`${runde + 1} / ${ANTALL_RUNDER}`} />
        <HudFelt tittel="Poeng" verdi={formatPoeng(totalPoeng)} />
      </Box>

      {/* Hint */}
      <HintPanel
        hint={sted.hint}
        avslorte={avslorte}
        onAvslor={(id) => setAvslorte((forrige) => [...forrige, id])}
      />

      {/* Minikartet der man gjetter */}
      <Box
        onMouseEnter={() => setMinikartStort(true)}
        onMouseLeave={() => setMinikartStort(false)}
        sx={{
          position: 'absolute',
          right: 16,
          // Plass til kildehenvisningen (attribution) nederst i hjørnet
          bottom: 40,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          opacity: minikartStort ? 1 : 0.85,
          transition: 'opacity 0.2s',
        }}
      >
        <Box
          sx={{
            width: minikartStort ? 'min(560px, 70vw)' : 300,
            height: minikartStort ? 'min(420px, 55vh)' : 200,
            transition: 'width 0.25s, height 0.25s',
            borderRadius: 2,
            overflow: 'hidden',
            boxShadow: 6,
            border: '3px solid white',
            cursor: 'crosshair',
          }}
        >
          <RMap
            mapStyle={basemapStyle('standard')}
            initialTransformRequest={transformRequest}
            initialBounds={SPILLOMRADE}
            // Man kan ikke zoome eller flytte seg utenfor spilleområdet,
            // og dermed heller ikke gjette utenfor
            maxBounds={SPILLOMRADE}
            initialAttributionControl={false}
            style={{ height: '100%' }}
            onClick={(e: MapLayerMouseEvent) =>
              setGjett([e.lngLat.lng, e.lngLat.lat])
            }
          >
            <OppdaterStorrelse />
            {/* + og - for å zoome når man skal gjette */}
            <RNavigationControl position="top-left" showCompass={false} />
            {gjett && (
              <RMarker longitude={gjett[0]} latitude={gjett[1]}>
                <GjettMarkor />
              </RMarker>
            )}
          </RMap>
        </Box>
        <Button
          onClick={sendGjett}
          disabled={!gjett}
          sx={{ ...knappStil, width: '100%' }}
        >
          {gjett ? 'GJETT' : 'PLASSER MARKØREN PÅ KARTET'}
        </Button>
      </Box>
    </Box>
  );
};

const HudFelt = ({ tittel, verdi }: { tittel: string; verdi: string }) => (
  <Box
    sx={{
      px: 2.5,
      py: 0.75,
      textAlign: 'center',
      '& + &': { borderLeft: '1px solid rgba(255,255,255,0.2)' },
    }}
  >
    <Typography
      sx={{ fontSize: 11, opacity: 0.7, fontWeight: 700, letterSpacing: 1 }}
    >
      {tittel.toUpperCase()}
    </Typography>
    <Typography sx={{ fontWeight: 800, fontStyle: 'italic' }}>
      {verdi}
    </Typography>
  </Box>
);

const HintPanel = ({
  hint,
  avslorte,
  onAvslor,
}: {
  hint: Hint[];
  avslorte: string[];
  onAvslor: (id: string) => void;
}) => (
  <Box
    sx={{
      position: 'absolute',
      top: 16,
      left: 16,
      width: 300,
      // Plass til lydknappen nederst til venstre
      maxHeight: 'calc(100% - 80px)',
      overflowY: 'auto',
      bgcolor: 'rgba(26, 11, 61, 0.88)',
      color: 'white',
      borderRadius: 2,
      p: 2,
      boxShadow: 6,
      backdropFilter: 'blur(4px)',
    }}
  >
    <Typography sx={{ fontWeight: 900, fontStyle: 'italic', mb: 1 }}>
      HINT
    </Typography>
    {hint.map((h) => {
      const synlig = h.kostnad === 0 || avslorte.includes(h.id);
      return (
        <Box
          key={h.id}
          sx={{
            display: 'flex',
            gap: 1.5,
            py: 1,
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Box sx={{ fontSize: 20, lineHeight: 1.2 }}>{h.ikon}</Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontSize: 12, opacity: 0.7 }}>
              {h.tittel}
            </Typography>
            {synlig ? (
              <Typography sx={{ fontWeight: 600 }}>{h.tekst}</Typography>
            ) : (
              <Tooltip title="Avslør hintet" placement="right">
                <Button
                  size="small"
                  onClick={() => onAvslor(h.id)}
                  sx={{
                    mt: 0.5,
                    color: '#ffd54f',
                    border: '1px dashed rgba(255,213,79,0.6)',
                    borderRadius: 1,
                    textTransform: 'none',
                    py: 0,
                  }}
                >
                  Vis (−{formatPoeng(h.kostnad)} poeng)
                </Button>
              </Tooltip>
            )}
          </Box>
        </Box>
      );
    })}
  </Box>
);

// Knapp som flyr tilbake til startpunktet (som flagget i GeoGuessr)
const TilbakeTilStart = ({ posisjon }: { posisjon: [number, number] }) => {
  const map = useMap();

  return (
    <Tooltip title="Tilbake til start" placement="left">
      <Button
        onClick={() =>
          map.flyTo({ center: posisjon, zoom: START_ZOOM, bearing: 0 })
        }
        sx={{
          position: 'absolute',
          right: 0,
          top: 80,
          minWidth: 0,
          width: 44,
          height: 44,
          borderRadius: '50%',
          bgcolor: LILLA,
          color: 'white',
          fontSize: 20,
          boxShadow: 3,
          '&:hover': { bgcolor: '#5a2fb0' },
        }}
      >
        ⚑
      </Button>
    </Tooltip>
  );
};
