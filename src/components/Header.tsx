import type { CSSProperties } from 'react';
import { Tab, Tabs } from '@mui/material';
import NorkartLogo from '../assets/norkart_logo.svg';

export type Side = 'kart' | 'geogjett';

const styles: CSSProperties = {
  height: 'var(--header-height)',
  boxSizing: 'border-box',
  width: '100vw',
  padding: '10px 30px',
  textAlign: 'center',
  fontSize: '30px',
  position: 'sticky',
  display: 'flex',
  alignItems: 'center',
  boxShadow: 'rgba(0, 0, 0, 0.24) 0px 3px 4px',
  zIndex: 1200,
};

const Header = ({
  side,
  setSide,
}: {
  side: Side;
  setSide: (side: Side) => void;
}) => {
  return (
    <header style={styles}>
      <img height="50px" src={NorkartLogo} />
      <h1 style={{ fontSize: '1.5rem' }}>Norkart Workshop</h1>
      <Tabs
        value={side}
        onChange={(_, nySide: Side) => setSide(nySide)}
        sx={{ ml: 'auto' }}
      >
        <Tab value="kart" label="Kart" />
        <Tab value="geogjett" label="GeoGjett" />
      </Tabs>
    </header>
  );
};

export default Header;
