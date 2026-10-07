import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import type { Bygning } from '../api/getBygningAtPunkt';
import type { RosData } from '../api/getRosDataForBygning';

const jaNei = (verdi: boolean | undefined) =>
  verdi === undefined ? '–' : verdi ? 'Ja' : 'Nei';

export const BygningCard = ({
  bygning,
  ros,
}: {
  bygning: Bygning;
  ros: RosData | undefined;
}) => {
  const matrikkel = bygning.MatrikkelData;

  const bygningsRader: [string, string | number | undefined][] = [
    ['Bygningsnummer', bygning.Bygningsnummer],
    ['Type', matrikkel?.Bygningstype],
    ['Status', matrikkel?.Bygningstatus],
    ['Næringsgruppe', matrikkel?.Naringsgruppe],
    ['Byggeår', matrikkel?.AntattByggeaar || undefined],
    ['Kulturminne', jaNei(matrikkel?.HarKulturminne)],
  ];

  const rosRader: [string, string | number | undefined][] = ros
    ? [
        [
          'Nærmeste brannstasjon',
          ros.Brannstasjon &&
            `${ros.Brannstasjon} (${ros.AvstandBrannstasjon} km)`,
        ],
        ['Flom', ros.Flom],
        ['Kvikkleire', ros.Kvikkleire],
        ['Steinsprang', jaNei(ros.Steinsprang)],
        ['Snøskred', ros.SnoskredInfo],
        ['Stormflo', ros.FareForStormFlo],
        ['Kraftledning', ros.Kraftledning],
        ['Fredet bygg', jaNei(ros.FredaBygg)],
        ['Kulturmiljø', ros.KulturmiljoNavn],
        ['Nedbør per år', ros.NedborAar && `${ros.NedborAar} mm`],
      ]
    : [];

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Bygning</Typography>
        <InfoTabell rader={bygningsRader} />
        {ros && (
          <>
            <Typography variant="subtitle1" sx={{ mt: 2 }}>
              Risiko og sårbarhet (ROS)
            </Typography>
            <InfoTabell rader={rosRader} />
          </>
        )}
      </CardContent>
    </Card>
  );
};

const InfoTabell = ({
  rader,
}: {
  rader: [string, string | number | undefined][];
}) => (
  <Table size="small">
    <TableBody>
      {rader
        .filter(([, verdi]) => verdi !== undefined && verdi !== '')
        .map(([navn, verdi]) => (
          <TableRow key={navn}>
            <TableCell sx={{ fontWeight: 500 }}>{navn}</TableCell>
            <TableCell>{verdi}</TableCell>
          </TableRow>
        ))}
    </TableBody>
  </Table>
);
