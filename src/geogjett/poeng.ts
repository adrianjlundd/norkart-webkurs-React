export const MAKS_POENG = 5000;
export const ANTALL_RUNDER = 5;

// Som GeoGuessr: poengene faller eksponentielt med avstanden.
// Skalert for en by: 500 m gir ~3600, 1 km ~2600, 3 km ~700 poeng.
const SKALA_KM = 1.5;
const FULL_PLOTT_KM = 0.025;

export const beregnPoeng = (avstandKm: number, hintKostnad: number) => {
  const poeng =
    avstandKm <= FULL_PLOTT_KM
      ? MAKS_POENG
      : Math.round(MAKS_POENG * Math.exp(-avstandKm / SKALA_KM));
  return Math.max(0, poeng - hintKostnad);
};

export const formatPoeng = (poeng: number) => poeng.toLocaleString('nb-NO');
