import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { getAdresserFromSearchText } from '../api/getAdresserFromSearchText';

export type Address = {
  PayLoad: {
    Posisjon: {
      X: number;
      Y: number;
    };
    Text: string;
  };
};

export const SearchBar = ({
  setAddress,
}: {
  setAddress: React.Dispatch<React.SetStateAction<Address | null>>;
}) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  // Når en adresse velges fylles feltet med adresseteksten - da skal vi ikke søke på nytt
  // (vi søker bare når brukeren selv skriver, dvs. reason === 'input')
  const ignorerNesteSok = useRef(false);

  useEffect(() => {
    if (ignorerNesteSok.current) {
      ignorerNesteSok.current = false;
      return;
    }

    if (!searchText) {
      setOptions([]);
      setOpen(false);
      return;
    }

    const identifier = setTimeout(async () => {
      setLoading(true);
      const adresser: Address[] = await getAdresserFromSearchText(searchText);
      setOptions(adresser);
      setLoading(false);
      setOpen(true);
    }, 500);

    return () => {
      clearTimeout(identifier);
    };
  }, [searchText]);

  const handleClose = () => {
    setOpen(false);
    setOptions([]);
  };

  return (
    <Autocomplete
      sx={{ width: 300, py: 2 }}
      open={open}
      onClose={handleClose}
      getOptionLabel={(option) => option.PayLoad.Text}
      // Forslagene er allerede filtrert av API-et
      filterOptions={(x) => x}
      options={options}
      loading={loading}
      inputValue={searchText}
      onInputChange={(_, newInputValue, reason) => {
        ignorerNesteSok.current =
          reason !== 'input' && newInputValue !== searchText;
        setSearchText(newInputValue);
      }}
      onChange={(_, selectedOption) => {
        if (selectedOption) {
          setAddress(selectedOption);
          setOpen(false);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Adressesøk"
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
};
