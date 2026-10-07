import { useEffect } from 'react';
import { useMap } from 'maplibre-react-components';
import { LILLA } from './stil';

// Sørger for at kartet tegnes riktig når beholderen endrer størrelse
export const OppdaterStorrelse = () => {
  const map = useMap();

  useEffect(() => {
    const observer = new ResizeObserver(() => map.resize());
    observer.observe(map.getContainer());
    return () => observer.disconnect();
  }, [map]);

  return null;
};

export const FasitMarkor = ({ tekst = '🏁' }: { tekst?: string }) => (
  <div
    style={{
      width: 34,
      height: 34,
      borderRadius: '50%',
      background: 'white',
      border: `3px solid ${LILLA}`,
      display: 'grid',
      placeItems: 'center',
      fontSize: 16,
      fontWeight: 800,
      color: LILLA,
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
    }}
  >
    {tekst}
  </div>
);

export const GjettMarkor = ({ tekst = '' }: { tekst?: string }) => (
  <div
    style={{
      width: 26,
      height: 26,
      borderRadius: '50%',
      background: '#1a73e8',
      border: '3px solid white',
      display: 'grid',
      placeItems: 'center',
      fontSize: 12,
      fontWeight: 800,
      color: 'white',
      boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
    }}
  >
    {tekst}
  </div>
);
