import { Box, Typography } from '@mui/material';
import type { ExpressionSpecification } from 'maplibre-gl';
import { RLayer, RSource } from 'maplibre-react-components';
// ?url gjør at Vite serverer fila separat i stedet for å legge 4 MB inn i JS-koden
import befolkningUrl from '../sample_data/befolkning_5km.json?url';

// Antall innbyggere i en 5x5 km-rute -> farge (gul til mørk rød)
const TRINN: [number, string][] = [
  [0, '#ffffcc'],
  [10, '#ffeda0'],
  [100, '#fed976'],
  [500, '#feb24c'],
  [1000, '#fd8d3c'],
  [5000, '#fc4e2a'],
  [20000, '#e31a1c'],
  [50000, '#b10026'],
];

const fargeUttrykk: ExpressionSpecification = [
  'step',
  ['get', 'pop_tot'],
  TRINN[0][1],
  ...TRINN.slice(1).flat(),
];

export const BefolkningLayer = ({
  onHover,
}: {
  onHover: (antall: number | undefined) => void;
}) => (
  <>
    <RSource id="befolkning" type="geojson" data={befolkningUrl} />
    <RLayer
      source="befolkning"
      id="befolkning-fill"
      type="fill"
      // Legg befolkningslaget under bygninger, tak og rute
      beforeId="bygning-fill"
      paint={{
        'fill-color': fargeUttrykk,
        'fill-opacity': 0.6,
        'fill-outline-color': 'rgba(0,0,0,0.05)',
      }}
      onMouseMove={(e) => onHover(e.features?.[0]?.properties?.pop_tot)}
      onMouseLeave={() => onHover(undefined)}
    />
  </>
);

export const BefolkningLegend = ({
  hoverAntall,
}: {
  hoverAntall: number | undefined;
}) => (
  <Box>
    <Typography variant="subtitle2">Innbyggere per 5x5 km</Typography>
    {TRINN.map(([grense, farge], i) => {
      const neste = TRINN[i + 1]?.[0];
      return (
        <Box
          key={grense}
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <Box sx={{ width: 16, height: 12, bgcolor: farge, opacity: 0.8 }} />
          <Typography variant="caption">
            {neste
              ? `${grense.toLocaleString('nb-NO')}–${(neste - 1).toLocaleString('nb-NO')}`
              : `${grense.toLocaleString('nb-NO')}+`}
          </Typography>
        </Box>
      );
    })}
    <Typography variant="caption" color="text.secondary">
      {hoverAntall !== undefined
        ? `Rute under musepekeren: ${hoverAntall.toLocaleString('nb-NO')} innbyggere`
        : 'Hold musepekeren over en rute for å se antall.'}
    </Typography>
  </Box>
);
