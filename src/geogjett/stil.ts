import { useEffect, useState, type CSSProperties } from 'react';

export const LILLA = '#3b1e78';
export const GRONN = '#6cb928';

// Bakgrunn i GeoGuessr-stil
export const bakgrunn: CSSProperties = {
  background: `radial-gradient(circle at 30% 20%, #5a2fb0 0%, ${LILLA} 45%, #1a0b3d 100%)`,
};

export const knappStil = {
  bgcolor: GRONN,
  color: 'white',
  fontWeight: 800,
  fontStyle: 'italic',
  letterSpacing: 1,
  borderRadius: 999,
  px: 5,
  py: 1.2,
  fontSize: '1.05rem',
  boxShadow: '0 4px 0 #4a8a17',
  '&:hover': { bgcolor: '#7fd133' },
  '&.Mui-disabled': { bgcolor: '#9e9e9e', color: '#eee', boxShadow: 'none' },
};

// Teller opp fra 0 til målverdien, for en animert poengsum
export const useOpptelling = (maal: number, varighetMs = 1200) => {
  const [verdi, setVerdi] = useState(0);

  useEffect(() => {
    let animasjon: number;
    const start = performance.now();
    const steg = (naa: number) => {
      const andel = Math.min(1, (naa - start) / varighetMs);
      setVerdi(Math.round(maal * (1 - (1 - andel) ** 3)));
      if (andel < 1) animasjon = requestAnimationFrame(steg);
    };
    animasjon = requestAnimationFrame(steg);
    return () => cancelAnimationFrame(animasjon);
  }, [maal, varighetMs]);

  return verdi;
};

// Kaller funksjonen når brukeren trykker mellomrom eller Enter
export const useTast = (handling: (() => void) | undefined) => {
  useEffect(() => {
    if (!handling) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handling();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handling]);
};
