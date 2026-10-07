import { useState } from 'react';
import Header, { type Side } from './components/Header';
import { MapLibreMap } from './components/MapLibreMap';
import { GeoGjett } from './geogjett/GeoGjett';
import './index.css';

function App() {
  const [side, setSide] = useState<Side>('kart');

  return (
    <>
      <Header side={side} setSide={setSide} />
      {side === 'kart' ? <MapLibreMap /> : <GeoGjett />}
    </>
  );
}

export default App;
