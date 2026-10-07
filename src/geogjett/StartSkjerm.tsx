import { Box, Button, Typography } from '@mui/material';
import { bakgrunn, knappStil, useTast } from './stil';
import { ANTALL_RUNDER, MAKS_POENG, formatPoeng } from './poeng';

export const StartSkjerm = ({
  onStart,
  feil,
}: {
  onStart: () => void;
  feil: string | undefined;
}) => {
  useTast(onStart);

  return (
    <Box
      sx={{
        ...bakgrunn,
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        color: 'white',
        textAlign: 'center',
        p: 2,
      }}
    >
      <Box sx={{ maxWidth: 560 }}>
        <Typography
          variant="h2"
          sx={{ fontWeight: 900, fontStyle: 'italic', letterSpacing: 2 }}
        >
          GEOGJETT
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.85, mb: 4 }}>
          Trondheim-utgaven
        </Typography>
        <Typography sx={{ opacity: 0.85, mb: 1 }}>
          Du havner et tilfeldig sted i Trondheim, sett ovenfra fra et fly. Bruk
          flyfotoet og hintene til å finne ut hvor du er, og plasser gjettet
          ditt på kartet.
        </Typography>
        <Typography sx={{ opacity: 0.65, mb: 5 }}>
          {ANTALL_RUNDER} runder · opptil {formatPoeng(MAKS_POENG)} poeng per
          runde · ekstra hint koster poeng
        </Typography>
        <Button onClick={onStart} sx={knappStil} size="large">
          SPILL
        </Button>
        {feil && (
          <Typography sx={{ mt: 3, color: '#ffb4b4' }}>{feil}</Typography>
        )}
      </Box>
    </Box>
  );
};
