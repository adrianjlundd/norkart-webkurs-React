import { Box, Button, LinearProgress, Paper, Typography } from '@mui/material';
import { formatAvstand } from '../geo';
import type { Sted } from './steder';
import { Resultatkart, type Resultat } from './Resultatkart';
import { GRONN, LILLA, knappStil, useOpptelling, useTast } from './stil';
import { MAKS_POENG, formatPoeng } from './poeng';

export const ResultatSkjerm = ({
  resultat,
  sted,
  erSisteRunde,
  nesteErKlar,
  onNeste,
}: {
  resultat: Resultat;
  sted: Sted;
  erSisteRunde: boolean;
  nesteErKlar: boolean;
  onNeste: () => void;
}) => {
  const poeng = useOpptelling(resultat.poeng);
  useTast(nesteErKlar ? onNeste : undefined);

  const matrikkel = sted.bygning.MatrikkelData;
  const fasitTekst = [
    matrikkel?.Bygningstype,
    sted.ros?.Grunnkretsnavn,
    sted.ros?.Postnummer &&
      `${sted.ros.Postnummer} ${sted.ros.Poststed ?? ''}`.trim(),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <Resultatkart resultater={[resultat]} paddingBunn={300} />

      <Paper
        elevation={8}
        sx={{
          position: 'absolute',
          left: '50%',
          bottom: 24,
          transform: 'translateX(-50%)',
          width: 'min(640px, calc(100% - 32px))',
          p: 3,
          borderRadius: 3,
          textAlign: 'center',
        }}
      >
        <Typography
          variant="h4"
          sx={{ fontWeight: 900, fontStyle: 'italic', color: LILLA }}
        >
          {formatPoeng(poeng)} poeng
        </Typography>
        <LinearProgress
          variant="determinate"
          value={(poeng / MAKS_POENG) * 100}
          sx={{
            height: 12,
            borderRadius: 6,
            my: 1.5,
            bgcolor: '#e6e0f3',
            '& .MuiLinearProgress-bar': { bgcolor: GRONN, borderRadius: 6 },
          }}
        />
        <Typography>
          Gjettet ditt var <strong>{formatAvstand(resultat.avstandKm)}</strong>{' '}
          fra riktig sted.
          {resultat.hintKostnad > 0 &&
            ` Hint kostet deg ${formatPoeng(resultat.hintKostnad)} poeng.`}
        </Typography>
        {fasitTekst && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            🏁 {fasitTekst}
          </Typography>
        )}
        <Button
          onClick={onNeste}
          disabled={!nesteErKlar}
          sx={{ ...knappStil, mt: 2.5 }}
        >
          {!nesteErKlar
            ? 'LASTER NESTE STED…'
            : erSisteRunde
              ? 'SE RESULTATET'
              : 'NESTE RUNDE'}
        </Button>
      </Paper>
    </Box>
  );
};
