import { Card, CardContent, Typography } from '@mui/material';
import type { Rute } from '../api/getRuteMellomPunkter';

// Avstand i km mellom to punkter (haversine-formelen)
const avstandKm = ([lng1, lat1]: number[], [lng2, lat2]: number[]) => {
  const rad = (grader: number) => (grader * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

const rutelengdeKm = (rute: Rute) =>
  rute.RouteGeometry.coordinates.reduce(
    (sum, linje) =>
      sum +
      linje
        .slice(1)
        .reduce((delsum, punkt, i) => delsum + avstandKm(linje[i], punkt), 0),
    0
  );

const formatTid = (minutter: number) => {
  const timer = Math.floor(minutter / 60);
  const rest = Math.round(minutter % 60);
  return timer > 0 ? `${timer} t ${rest} min` : `${rest} min`;
};

export const RuteCard = ({
  rute,
  harStartpunkt,
}: {
  rute: Rute | undefined;
  harStartpunkt: boolean;
}) => {
  const reisetid = rute?.CostList.find((kost) => kost.Name === 'time')?.Cost;

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Rute</Typography>
        <Typography variant="body2" color="text.secondary">
          {harStartpunkt
            ? 'Klikk i kartet for å velge sluttpunkt.'
            : 'Klikk i kartet for å velge startpunkt.'}
        </Typography>
        {rute && (
          <Typography variant="body1" sx={{ mt: 1 }}>
            Kjøretid:{' '}
            <strong>
              {reisetid !== undefined ? formatTid(reisetid) : '–'}
            </strong>
            <br />
            Lengde:{' '}
            <strong>
              {rutelengdeKm(rute).toLocaleString('nb-NO', {
                maximumFractionDigits: 1,
              })}{' '}
              km
            </strong>
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
