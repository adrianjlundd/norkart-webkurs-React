export type Bygning = {
  Id: number;
  Bygningsnummer: number;
  MatrikkelData?: {
    Bygningstatus?: string;
    Naringsgruppe?: string;
    Bygningstype?: string;
    HarSefrakminne?: boolean;
    HarKulturminne?: boolean;
    Antallbad?: number;
    AntattByggeaar?: number;
  };
  FkbData?: {
    BygningsOmriss?: string;
  };
};

export const getBygningAtPunkt = async (
  x: number,
  y: number
): Promise<Bygning | undefined> => {
  const apiKey = import.meta.env.VITE_API_KEY;
  const query = `https://bygning.api.norkart.no/bygninger/byposition?x=${x}&y=${y}&MaxRadius=1&GeometryTextFormat=GeoJson&IncludeFkbData=true`;

  try {
    const apiResult = await fetch(query, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-WAAPI-TOKEN': `${apiKey}`,
      },
    });

    // API-et svarer med 404 når det ikke finnes noen bygning på punktet
    if (apiResult.ok) {
      const data = await apiResult.json();
      return data.Bygninger?.[0];
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
