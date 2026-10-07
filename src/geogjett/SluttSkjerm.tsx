import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { formatAvstand } from '../geo';
import { Resultatkart, type Resultat } from './Resultatkart';
import { GRONN, LILLA, knappStil, useOpptelling } from './stil';
import { ANTALL_RUNDER, MAKS_POENG, formatPoeng } from './poeng';

const vurdering = (andel: number) =>
  andel > 0.9
    ? 'Ekte trondhjemer! 🏆'
    : andel > 0.7
      ? 'Imponerende lokalkunnskap!'
      : andel > 0.45
        ? 'Godt jobbet!'
        : andel > 0.2
          ? 'Ikke verst - prøv igjen!'
          : 'På tide med en tur rundt i byen 😄';

export const SluttSkjerm = ({
  resultater,
  onSpillIgjen,
}: {
  resultater: Resultat[];
  onSpillIgjen: () => void;
}) => {
  const total = resultater.reduce((sum, r) => sum + r.poeng, 0);
  const maks = MAKS_POENG * ANTALL_RUNDER;
  const opptalt = useOpptelling(total, 1800);

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Resultatkart
        resultater={resultater}
        nummerert
        paddingVenstre={Math.min(500, window.innerWidth / 2)}
      />

      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          left: 24,
          top: 24,
          width: 'min(420px, calc(100% - 48px))',
          maxHeight: 'calc(100% - 48px)',
          overflowY: 'auto',
          p: 3,
          borderRadius: 3,
        }}
      >
        <Typography sx={{ fontWeight: 900, fontStyle: 'italic', color: LILLA }}>
          SPILLET ER FERDIG
        </Typography>
        <Typography variant="h3" sx={{ fontWeight: 900, color: LILLA }}>
          {formatPoeng(opptalt)}
        </Typography>
        <Typography color="text.secondary">
          av {formatPoeng(maks)} poeng · {vurdering(total / maks)}
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(opptalt / maks) * 100}
          sx={{
            height: 12,
            borderRadius: 6,
            my: 2,
            bgcolor: '#e6e0f3',
            '& .MuiLinearProgress-bar': { bgcolor: GRONN, borderRadius: 6 },
          }}
        />
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Runde</TableCell>
              <TableCell align="right">Avstand</TableCell>
              <TableCell align="right">Poeng</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resultater.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{i + 1}</TableCell>
                <TableCell align="right">
                  {formatAvstand(r.avstandKm)}
                </TableCell>
                <TableCell align="right">{formatPoeng(r.poeng)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Button onClick={onSpillIgjen} sx={knappStil}>
            SPILL IGJEN
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};
