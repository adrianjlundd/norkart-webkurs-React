import {
  LngLat,
  type FillLayerSpecification,
  type MapLayerMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  RLayer,
  RMap,
  RMarker,
  RPopup,
  RSource,
  useMap,
} from 'maplibre-react-components';
import {
  Box,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import type { FeatureCollection, GeoJSON } from 'geojson';
import { getHoydeFromPunkt } from '../api/getHoydeFromPunkt';
import { getBygningAtPunkt, type Bygning } from '../api/getBygningAtPunkt';
import {
  getRosDataForBygning,
  type RosData,
} from '../api/getRosDataForBygning';
import {
  getTakflateDataForPunkt,
  type Takflate,
} from '../api/getTakflateDataForPunkt';
import { getTakflateDataForBygning } from '../api/getTakflateDataForBygning';
import { getRuteMellomPunkter, type Rute } from '../api/getRuteMellomPunkter';
import { useEffect, useMemo, useRef, useState } from 'react';
import { basemapStyle, transformRequest } from '../kart';
import { Overlay } from './Overlay';
import DrawComponent from './DrawComponent';
import { SearchBar, type Address } from './SearchBar';
import { BygningCard } from './BygningCard';
import { SolCard } from './SolCard';
import { RuteCard } from './RuteCard';
import { BefolkningLayer, BefolkningLegend } from './Befolkning';
import { FunFactKnapp } from '../funfacts/FunFactKnapp';

const TRONDHEIM_COORDS: [number, number] = [10.40565401, 63.4156575];

const NORKART_BASEMAP_STYLE = basemapStyle('standard');

type Modus = 'info' | 'rute';

const TOM_GEOJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [],
};

const polygonStyle = {
  'fill-outline-color': 'rgba(0,0,0,0.1)',
  'fill-color': 'rgba(18, 94, 45, 0.41)',
};

// Takflatene fargelegges etter solinnstråling (kWh/m² per år)
const takStyle: FillLayerSpecification['paint'] = {
  'fill-color': [
    'interpolate',
    ['linear'],
    ['get', 'Solinnstraaling'],
    300,
    '#3b4cc0',
    600,
    '#f7d03c',
    900,
    '#e8590c',
  ],
  'fill-opacity': 0.75,
};

const valgtTakStyle = {
  'line-color': '#000000',
  'line-width': 3,
};

const lineStyle = {
  'line-color': '#1a73e8',
  'line-width': 4,
};

export const MapLibreMap = () => {
  const [modus, setModus] = useState<Modus>('info');
  const [visBefolkning, setVisBefolkning] = useState(false);
  const [befolkningHover, setBefolkningHover] = useState<number | undefined>();

  // Oppgave 1: høyde
  const [pointHoyde, setPointHoydeAtPunkt] = useState<number | undefined>(
    undefined
  );
  const [clickPoint, setClickPoint] = useState<LngLat | undefined>(undefined);

  // Oppgave 2: adressesøk
  const [address, setAddress] = useState<Address | null>(null);

  // Oppgave 3: bygning og ROS
  const [bygning, setBygning] = useState<Bygning | undefined>(undefined);
  const [ros, setRos] = useState<RosData | undefined>(undefined);

  // Oppgave 4: takflater og solmengde
  const [takflate, setTakflate] = useState<Takflate | undefined>(undefined);
  const [takflaterForBygning, setTakflaterForBygning] = useState<Takflate[]>(
    []
  );

  // Oppgave 5: rute
  const [startPunkt, setStartPunkt] = useState<LngLat | undefined>(undefined);
  const [rute, setRute] = useState<Rute | undefined>(undefined);

  // Brukes for å se bort fra svar på gamle klikk hvis brukeren klikker raskt
  const sisteForesporsel = useRef(0);

  const hentInfoForPunkt = async (lng: number, lat: number) => {
    const foresporsel = ++sisteForesporsel.current;
    setClickPoint(new LngLat(lng, lat));

    const [hoyder, nyBygning, nyTakflate] = await Promise.all([
      getHoydeFromPunkt(lng, lat),
      getBygningAtPunkt(lng, lat),
      getTakflateDataForPunkt(lng, lat),
    ]);
    if (foresporsel !== sisteForesporsel.current) return;

    setPointHoydeAtPunkt(hoyder[0]?.Z);
    setBygning(nyBygning);
    setTakflate(nyTakflate);

    if (!nyBygning) {
      setRos(undefined);
      setTakflaterForBygning([]);
      return;
    }

    const [nyRos, nyeTakflater] = await Promise.all([
      getRosDataForBygning(nyBygning.Bygningsnummer),
      getTakflateDataForBygning(nyBygning.Bygningsnummer),
    ]);
    if (foresporsel !== sisteForesporsel.current) return;

    setRos(nyRos);
    setTakflaterForBygning(nyeTakflater);
  };

  const hentRute = async (stopp: LngLat) => {
    if (!startPunkt) {
      setStartPunkt(stopp);
      return;
    }

    const ruteRespons = await getRuteMellomPunkter(
      startPunkt.lng,
      startPunkt.lat,
      stopp.lng,
      stopp.lat
    );
    if (ruteRespons?.RouteGeometry) {
      setRute(ruteRespons);
    }
    setStartPunkt(undefined);
  };

  const onMapClick = async (e: MapLayerMouseEvent) => {
    if (modus === 'rute') {
      await hentRute(e.lngLat);
    } else {
      await hentInfoForPunkt(e.lngLat.lng, e.lngLat.lat);
    }
  };

  // Vis bygningen på adressen som er valgt i søket
  useEffect(() => {
    if (address) {
      hentInfoForPunkt(address.PayLoad.Posisjon.X, address.PayLoad.Posisjon.Y);
    }
  }, [address]);

  const bygningsOmriss: GeoJSON = useMemo(
    () =>
      bygning?.FkbData?.BygningsOmriss
        ? JSON.parse(bygning.FkbData.BygningsOmriss)
        : TOM_GEOJSON,
    [bygning]
  );

  const takflaterGeoJson: FeatureCollection = useMemo(
    () => ({
      type: 'FeatureCollection',
      features: takflaterForBygning.map((tak) => ({
        type: 'Feature',
        geometry: JSON.parse(tak.Geometri),
        properties: { Solinnstraaling: tak.Solinnstraaling },
      })),
    }),
    [takflaterForBygning]
  );

  const valgtTakGeoJson: GeoJSON = useMemo(
    () => (takflate ? JSON.parse(takflate.Geometri) : TOM_GEOJSON),
    [takflate]
  );

  const endreModus = (nyModus: Modus | null) => {
    if (!nyModus) return;
    setModus(nyModus);
    setStartPunkt(undefined);
  };

  return (
    <RMap
      minZoom={4}
      initialCenter={TRONDHEIM_COORDS}
      initialZoom={12}
      mapStyle={NORKART_BASEMAP_STYLE}
      initialTransformRequest={transformRequest}
      style={{
        height: `calc(100dvh - var(--header-height))`,
      }}
      onClick={onMapClick}
    >
      {address && (
        <MapFlyTo
          lng={address.PayLoad.Posisjon.X}
          lat={address.PayLoad.Posisjon.Y}
        />
      )}

      {/* Lagene er alltid montert (evt. tomme) så rekkefølgen i kartet holdes fast */}
      <RSource id="bygning" type="geojson" data={bygningsOmriss} />
      <RLayer
        source="bygning"
        id="bygning-fill"
        type="fill"
        paint={polygonStyle}
      />
      <RSource id="takflater" type="geojson" data={takflaterGeoJson} />
      <RLayer
        source="takflater"
        id="takflater-fill"
        type="fill"
        paint={takStyle}
      />
      <RSource id="valgt-tak" type="geojson" data={valgtTakGeoJson} />
      <RLayer
        source="valgt-tak"
        id="valgt-tak-line"
        type="line"
        paint={valgtTakStyle}
      />
      <RSource
        id="rute"
        type="geojson"
        data={rute?.RouteGeometry ?? TOM_GEOJSON}
      />
      <RLayer source="rute" id="rute-line" type="line" paint={lineStyle} />

      {visBefolkning && <BefolkningLayer onHover={setBefolkningHover} />}

      {modus === 'info' && clickPoint && pointHoyde !== undefined && (
        <RPopup longitude={clickPoint.lng} latitude={clickPoint.lat}>
          <Box sx={{ pr: 3, position: 'relative' }}>
            <IconButton
              size="small"
              aria-label="Lukk"
              onClick={() => setClickPoint(undefined)}
              sx={{ position: 'absolute', top: -8, right: -8 }}
            >
              ×
            </IconButton>
            <Typography variant="body2">
              <strong>Høyde:</strong> {pointHoyde.toFixed(1)} moh.
              <br />
              <strong>Lat:</strong> {clickPoint.lat.toFixed(5)}
              <br />
              <strong>Lng:</strong> {clickPoint.lng.toFixed(5)}
            </Typography>
          </Box>
        </RPopup>
      )}

      {modus === 'rute' && startPunkt && (
        <RMarker longitude={startPunkt.lng} latitude={startPunkt.lat} />
      )}

      <Overlay
        style={{
          width: 360,
          maxHeight: '100%',
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
        <Stack spacing={1.5}>
          <SearchBar setAddress={setAddress} />

          <ToggleButtonGroup
            value={modus}
            exclusive
            size="small"
            fullWidth
            onChange={(_, nyModus) => endreModus(nyModus)}
          >
            <ToggleButton value="info">Info om punkt</ToggleButton>
            <ToggleButton value="rute">Planlegg rute</ToggleButton>
          </ToggleButtonGroup>

          <FormControlLabel
            control={
              <Switch
                checked={visBefolkning}
                onChange={(e) => setVisBefolkning(e.target.checked)}
              />
            }
            label="Vis befolkning"
          />
          {visBefolkning && <BefolkningLegend hoverAntall={befolkningHover} />}

          {modus === 'info' ? (
            <>
              {!clickPoint && (
                <Typography variant="body2" color="text.secondary">
                  Klikk i kartet eller søk etter en adresse for å se høyde,
                  bygning, ROS-data og solmengde.
                </Typography>
              )}
              {bygning && <BygningCard bygning={bygning} ros={ros} />}
              {(takflate || takflaterForBygning.length > 0) && (
                <SolCard
                  takflate={takflate}
                  takflaterForBygning={takflaterForBygning}
                />
              )}
            </>
          ) : (
            <RuteCard rute={rute} harStartpunkt={!!startPunkt} />
          )}
        </Stack>
      </Overlay>
      <FunFactKnapp />
      <DrawComponent />
    </RMap>
  );
};

function MapFlyTo({ lng, lat }: { lng: number; lat: number }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo({ center: [lng, lat], zoom: 18, speed: 10 });
  }, [lng, lat, map]);

  return null;
}
