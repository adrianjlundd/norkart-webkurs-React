export const MANEDER = [
  'Januar',
  'Februar',
  'Mars',
  'April',
  'Mai',
  'Juni',
  'Juli',
  'August',
  'September',
  'Oktober',
  'November',
  'Desember',
] as const;

export type Maned = (typeof MANEDER)[number];

// Solmengde per måned er i kWh/m², Solinnstraaling er summen for året
export type Takflate = Record<Maned, number> & {
  Id: string;
  TakflateId: string;
  ByggId: string;
  Solinnstraaling: number;
  Helning: number;
  Retning: number;
  Areal3D: number;
  Geometri: string;
};

export const getTakflateDataForPunkt = async (
  x: number,
  y: number
): Promise<Takflate | undefined> => {
  const apiKey = import.meta.env.VITE_API_KEY;
  const query = `https://takflater.api.norkart.no/takflater/punkt/utvidet?x=${x}&y=${y}`;

  try {
    const apiResult = await fetch(query, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-WAAPI-TOKEN': `${apiKey}`,
      },
    });

    if (apiResult.ok) {
      const data: Takflate[] = await apiResult.json();
      return data[0];
    } else {
      if (apiResult.status !== 404) {
        console.error('API request failed with status:', apiResult.status);
      }
      return undefined;
    }
  } catch (error) {
    console.error('An error occurred while fetching data:', error);
    return undefined;
  }
};
