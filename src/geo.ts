// Avstand i km mellom to punkter [lng, lat] (haversine-formelen)
export const avstandKm = ([lng1, lat1]: number[], [lng2, lat2]: number[]) => {
  const rad = (grader: number) => (grader * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(a));
};

export const formatAvstand = (km: number) =>
  km < 1
    ? `${Math.round(km * 1000)} m`
    : `${km.toLocaleString('nb-NO', { maximumFractionDigits: 1 })} km`;
