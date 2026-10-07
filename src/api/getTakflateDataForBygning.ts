import type { Takflate } from './getTakflateDataForPunkt';

export const getTakflateDataForBygning = async (
  bygningsNr: number
): Promise<Takflate[]> => {
  const apiKey = import.meta.env.VITE_API_KEY;
  const query = `https://takflater.api.norkart.no/takflater/bygning/${bygningsNr}/utvidet`;

  try {
    const apiResult = await fetch(query, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-WAAPI-TOKEN': `${apiKey}`,
      },
    });

    if (apiResult.ok) {
      return await apiResult.json();
    } else {
      if (apiResult.status !== 404) {
        console.error('API request failed with status:', apiResult.status);
      }
      return [];
    }
  } catch (error) {
    console.error('An error occurred while fetching data:', error);
    return [];
  }
};
