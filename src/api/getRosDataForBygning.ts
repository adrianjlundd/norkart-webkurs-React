export type RosData = {
  Bygningsnummer: number;
  Postnummer?: string;
  Poststed?: string;
  Grunnkretsnavn?: string;
  Kyst?: string;
  AarsDognTrafikk?: string;
  EnkeltminneNavn?: string;
  Brannstasjon?: string;
  AvstandBrannstasjon?: number;
  OyUtenBrannstasjon?: boolean;
  Flom?: string;
  Kvikkleire?: string;
  Steinsprang?: boolean;
  SnoskredInfo?: string;
  Kraftledning?: string;
  FareForStormFlo?: string;
  FredaBygg?: boolean;
  KulturmiljoNavn?: string;
  NedborAar?: number;
};

export const getRosDataForBygning = async (
  bygningsNr: number
): Promise<RosData | undefined> => {
  const apiKey = import.meta.env.VITE_API_KEY;
  const query = `https://ros.api.norkart.no/v2/ros/bygning/${bygningsNr}`;

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
      console.error('API request failed with status:', apiResult.status);
      return undefined;
    }
  } catch (error) {
    console.error('An error occurred while fetching data:', error);
    return undefined;
  }
};
