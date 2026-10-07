import type { MultiLineString } from 'geojson';

export type Rute = {
  RouteGeometry: MultiLineString;
  // Kostnaden for 'time' er reisetid i minutter
  CostList: { Name: string; Cost: number }[];
};

export const getRuteMellomPunkter = async (
  startX: number,
  startY: number,
  stoppX: number,
  stoppY: number
): Promise<Rute | undefined> => {
  const apiKey = import.meta.env.VITE_API_KEY;
  const query = `https://ruteberegner.api.norkart.no/Route/Expanded`;

  const postData = {
    Start: {
      X: startX,
      Y: startY,
      FeatureSnapRestriction: ['Road', 'Motorway'],
    },
    Stop: {
      X: stoppX,
      Y: stoppY,
      FeatureSnapRestriction: ['Road', 'Motorway'],
    },
    ViaPoints: [],
    SrsId: 4326,
    GraphName: 'ta-norden-dynamic',
    CostFunction: 'time',
    RouteFeatures: [
      'TerminalInfo',
      'JunctionInfo',
      'RoundaboutInfo',
      'RoadInfo',
      'UTurnInfo',
      'FerryInfo',
      'TollInfo',
    ],
    ZoomLevel: 14,
  };

  try {
    const apiResult = await fetch(query, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-WAAPI-TOKEN': `${apiKey}`,
      },
      body: JSON.stringify(postData),
    });

    if (apiResult.ok) {
      return await apiResult.json();
    } else {
      console.error('API request failed with status:', apiResult.status);
      return undefined;
    }
  } catch (error) {
    console.error('An error occurred while fetching data:', error);
    return undefined;
  }
};
