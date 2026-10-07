import {
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { MANEDER, type Takflate } from '../api/getTakflateDataForPunkt';

const formatTall = (tall: number, desimaler = 0) =>
  tall.toLocaleString('nb-NO', { maximumFractionDigits: desimaler });

export const SolCard = ({
  takflate,
  takflaterForBygning,
}: {
  takflate: Takflate | undefined;
  takflaterForBygning: Takflate[];
}) => {
  // Solinnstråling (kWh/m² per år) ganget med areal gir kWh per år for hver takflate
  const totalSolmengde = takflaterForBygning.reduce(
    (sum, tak) => sum + tak.Solinnstraaling * tak.Areal3D,
    0
  );
  const totaltAreal = takflaterForBygning.reduce(
    (sum, tak) => sum + tak.Areal3D,
    0
  );

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6">Solmengde</Typography>

        {takflaterForBygning.length > 0 && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            Hele bygningen ({takflaterForBygning.length} takflater,{' '}
            {formatTall(totaltAreal)} m²):{' '}
            <strong>{formatTall(totalSolmengde / 1000, 1)} MWh per år</strong>
          </Typography>
        )}

        {takflate ? (
          <>
            <Typography variant="body2">
              Valgt takflate: {formatTall(takflate.Areal3D)} m², helning{' '}
              {formatTall(takflate.Helning)}°, retning{' '}
              {formatTall(takflate.Retning)}°
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Måned</TableCell>
                  <TableCell align="right">kWh/m²</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {MANEDER.map((maned) => (
                  <TableRow key={maned}>
                    <TableCell>{maned}</TableCell>
                    <TableCell align="right">{takflate[maned]}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Totalt per år</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {takflate.Solinnstraaling}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Klikk på et tak for å se solmengde per måned.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
