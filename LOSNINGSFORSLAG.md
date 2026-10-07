# Løsningsforslag – Norkart webkurs

Dette dokumentet beskriver løsningen av oppgavene i [README.md](README.md), og
spillet **GeoGjett**, som er laget som det kreative kartet (oppgave 6+).

## Innhold

- [Oppsett](#oppsett)
- [Brancher](#brancher)
- [Oversikt over appen](#oversikt-over-appen)
- [Oppgave 1: Høyde i kartet](#oppgave-1-høyde-i-kartet)
- [Oppgave 2: Adressesøk](#oppgave-2-adressesøk)
- [Oppgave 3: Bygninger og ROS-data](#oppgave-3-bygninger-og-ros-data)
- [Oppgave 4: Solmengde på tak](#oppgave-4-solmengde-på-tak)
- [Oppgave 5: Ruteplanlegging](#oppgave-5-ruteplanlegging)
- [Oppgave 6: Befolkningskart](#oppgave-6-befolkningskart)
- [Det kreative kartet: GeoGjett](#det-kreative-kartet-geogjett)
- [Filstruktur](#filstruktur)
- [Hva API-ene returnerer](#hva-api-ene-returnerer)
- [Kjente begrensninger](#kjente-begrensninger)
- [Ideer til videre arbeid](#ideer-til-videre-arbeid)

## Oppsett

1. Opprett `.env` i rotmappa med API-nøkkelen:

   ```
   VITE_API_KEY=<din API-nøkkel>
   ```

   `.env` er ignorert av Git og skal aldri committes.

2. Installer og start:

   ```
   npm install
   npm run dev
   ```

Sjekker som skal gå gjennom: `npx tsc -b`, `npm run lint`, `npx prettier --check src`
og `npm run build`. Byggingen gir en advarsel om at JavaScript-fila er over 500 kB.
Det kommer av bibliotekene og stopper ikke appen.

## Brancher

| Branch              | Innhold                                                       |
| ------------------- | ------------------------------------------------------------- |
| `main`              | Det opprinnelige kursoppsettet, uten løsninger                |
| `erlendCook`        | Løsning av oppgave 1–6 med ekstraoppgaver (pushet til GitHub) |
| `erlendCook-videre` | Bygger på `erlendCook`, og legger til GeoGjett                |

## Oversikt over appen

Toppmenyen har to faner:

- **Kart**: kursoppgavene 1–6 samlet i ett kart.
- **GeoGjett**: et GeoGuessr-inspirert spill om Trondheim.

I **Kart** har panelet til venstre en bryter med to moduser. Det trengs fordi oppgave
1–4 og oppgave 5 begge bruker klikk i kartet:

- **Info om punkt**: et klikk henter høyde, bygning, ROS-data og solmengde.
- **Planlegg rute**: første klikk setter startpunkt, andre klikk henter ruten.

## Oppgave 1: Høyde i kartet

- `getHoydeFromPunkt` (ferdig fra før) hentes ved klikk.
- En `RPopup` viser høyde (moh.), latitude og longitude ved klikkpunktet.
- `RPopup` har ingen innebygd lukkeknapp, så popupen har sin egen ×-knapp.

## Oppgave 2: Adressesøk

- `SearchBar` bruker `getAdresserFromSearchText` i `useEffect`, med 500 ms forsinkelse
  mens man skriver.
- Søketeksten URL-kodes med `encodeURIComponent`.
- `filterOptions={(x) => x}`: API-et filtrerer allerede forslagene, så MUI skal ikke
  filtrere dem på nytt.
- Når en adresse velges, flyr kartet dit med `MapFlyTo` (zoom 18).
- **Fiks:** Når man velger en adresse, fylles feltet med adresseteksten. Det startet et
  nytt søk, og lista med forslag åpnet seg igjen. Nå søkes det bare når brukeren selv
  skriver (`reason === 'input'`). MUI v7 bruker `selectOption`, ikke `reset`, som
  reason ved valg.

## Oppgave 3: Bygninger og ROS-data

**API-funksjoner:**

- `getBygningAtPunkt(x, y, maxRadius = 1)` returnerer første bygning i `Bygninger`,
  eller `undefined`. `maxRadius` ble lagt til for GeoGjett.
- `getRosDataForBygning(bygningsNr)` returnerer ROS-dataene.

**Visning:**

- Bygningsomrisset (`FkbData.BygningsOmriss`, en GeoJSON-streng) parses og tegnes som
  et grønt polygon.
- `BygningCard` viser bygningsnummer, type, status, næringsgruppe, byggeår og
  kulturminne.
- Under kommer ROS: nærmeste brannstasjon og avstand, flom, kvikkleire, steinsprang,
  snøskred, stormflo, kraftledning, fredet bygg, kulturmiljø og nedbør per år.

**Ekstraoppgaver:**

- Alle bygningsdata vises i et MUI-kort.
- Når en adresse velges i søket, hentes og vises bygningen på adressen.
- ROS-data er implementert og vises.

## Oppgave 4: Solmengde på tak

**API-funksjoner:**

- `getTakflateDataForPunkt(x, y)` returnerer takflaten på punktet.
- `getTakflateDataForBygning(bygningsNr)` returnerer alle takflatene på bygningen.

**Visning:**

- Alle takflatene på bygningen tegnes og fargelegges etter solinnstråling: blå er lite
  sol, gul middels og oransje mye.
- Taket man klikket på får svart kant.
- `SolCard` viser en MUI-tabell med kWh/m² per måned og totalt per år for det valgte
  taket.

**Ekstraoppgave:** Kortet viser totalen for hele bygningen: antall takflater, samlet
areal og MWh per år, regnet ut som Σ(solinnstråling × areal).

## Oppgave 5: Ruteplanlegging

- `getRuteMellomPunkter` sender en POST til ruteberegneren.
- Første klikk setter en startmarkør (`RMarker`), og andre klikk tegner ruten som en
  blå linje.
- **Ekstraoppgave:** `RuteCard` viser kjøretid fra `CostList` (`time` er i minutter)
  og rutelengde. Lengden regnes ut fra rutegeometrien med haversine-formelen.

## Oppgave 6: Befolkningskart

Bryteren «Vis befolkning» slår på et koroplettkart fra `befolkning_5km.json`:

- Rutene fargelegges etter `pop_tot` i åtte trinn, fra 0 til over 50 000 innbyggere.
- Fargeforklaringen vises i panelet.
- Hold musepekeren over en rute for å se antall innbyggere.
- Fila (4 MB) importeres med `?url`. Da serverer Vite den separat, og den lastes først
  når laget slås på.
- Laget ligger under bygnings-, tak- og rutelagene (`beforeId="bygning-fill"`).

**Kartlagene:** Bygnings-, tak- og rutelagene ligger alltid i kartet, med en tom
`FeatureCollection` når det ikke er data. Da blir rekkefølgen av lagene stabil.

**Raske klikk:** En teller (`sisteForesporsel`) gjør at svar fra et gammelt klikk blir
ignorert hvis brukeren klikker raskt flere ganger.

## Det kreative kartet: GeoGjett

Et spill i GeoGuessr-stil. Du ser et tilfeldig sted i Trondheim som flyfoto, og skal
gjette hvor det er.

### Flyten

1. **Start:** Lilla startskjerm med regler og en «Spill»-knapp.
2. **Runde:**
   - Flyfoto av stedet. Man kan zoome og flytte seg omtrent 450 m ut (`maxBounds`).
   - En pulserende ring markerer bygningen.
   - Flagg-knappen (⚑) flyr tilbake til start.
   - Øverst til høyre vises runde og poeng.
   - Til venstre ligger hintpanelet.
   - Nede til høyre ligger minikartet. Det blir større når musen er over det, og man
     klikker for å plassere markøren.
   - «Gjett»-knappen er grå til markøren er plassert. Mellomrom eller Enter gjetter.
3. **Resultat:**
   - Kartet viser gjettet ditt (blå), fasiten (🏁) og en stiplet linje mellom dem.
   - Poengsummen teller opp med en fremdriftslinje.
   - Avstand og hintkostnad vises, og fasiten avsløres: bygningstype, nabolag og
     postnummer.
4. **Slutt:**
   - Kartet viser alle fem gjett og fasiter, nummerert.
   - Totalpoeng av 25 000, en vurdering og en tabell per runde.
   - «Spill igjen».

### Satellittvisning

Norkarts `ortofoto`-variant består bare av rasterlag (flyfoto), uten tekst- eller
veilag. Den avslører derfor ikke stedsnavn. Minikartet og resultatkartene bruker
`standard`-varianten med navn.

### Hint

Hintene lages i `hint.ts`. Hint uten data blir ikke med.

| Hint                                | Kilde                   | Kostnad |
| ----------------------------------- | ----------------------- | ------- |
| 🏠 Bygningstype                     | Bygning-API             | Gratis  |
| 📅 Byggeår (hvis kjent)             | Bygning-API             | Gratis  |
| ⛰️ Høyde over havet                 | Høyde-API               | Gratis  |
| 💼 Næringsgruppe                    | Bygning-API             | 200     |
| 🌊 Avstand til sjøen                | ROS (`Kyst`)            | 300     |
| ⚠️ Grunnforhold (kvikkleire, flom)  | ROS                     | 300     |
| 🚗 Trafikk på nærmeste vei          | ROS (`AarsDognTrafikk`) | 300     |
| 🚒 Nærmeste brannstasjon og avstand | ROS                     | 500     |
| 🏛️ Kulturminne/kulturmiljø          | ROS                     | 600     |
| 📮 Postnummer                       | ROS                     | 1 000   |
| 📍 Nabolag (grunnkrets)             | ROS                     | 1 500   |

### Poeng

Poengene regnes ut i `poeng.ts`, eksponentielt som i GeoGuessr, men skalert for en by:

```
poeng = 5000                         hvis avstand ≤ 25 m
poeng = round(5000 · e^(−avstand / 1,5 km))  ellers
poeng = max(0, poeng − hintkostnad)
```

| Avstand | Ca. poeng |
| ------- | --------- |
| 500 m   | 3 600     |
| 1 km    | 2 600     |
| 3 km    | 700       |

### Hvordan stedene velges

Logikken ligger i `steder.ts`:

1. Trekk et tilfeldig punkt i Trondheim (lng 10,30–10,50, lat 63,38–63,45).
2. Søk etter en bygning innenfor 150 m. Omtrent 60 % av forsøkene treffer, og det
   gjøres opptil 25 forsøk.
3. Avvis bygningen hvis den ligger nærmere enn 800 m et sted som allerede er valgt.
4. Bruk midtpunktet i bygningsomrisset som fasit.
5. Hent ROS-data og høyde, og lag hintene.

Spillet starter så snart det første stedet er klart. De neste lastes mens man spiller,
og «Neste runde» venter hvis neste sted ikke er ferdig ennå.

### Tilstand

`GeoGjett.tsx` styrer fasene `start → runde → resultat → … → slutt`. En `spillId`-ref
stopper lasting fra et gammelt spill hvis man starter et nytt.

## Filstruktur

Nye og endrede filer:

```
LOSNINGSFORSLAG.md            ← dette dokumentet
src/
├── App.tsx                   Fanevalg: Kart / GeoGjett
├── kart.ts                   Felles kartoppsett: basemapStyle(), transformRequest
├── geo.ts                    avstandKm() (haversine), formatAvstand()
├── index.css                 + pulserende ring for GeoGjett
├── api/
│   ├── getAdresserFromSearchText.ts   URL-koding av søketekst
│   ├── getBygningAtPunkt.ts           Implementert, valgfri maxRadius
│   ├── getRosDataForBygning.ts        Implementert
│   ├── getRuteMellomPunkter.ts        Implementert, typen Rute
│   ├── getTakflateDataForBygning.ts   Implementert
│   └── getTakflateDataForPunkt.ts     Implementert, typen Takflate, MANEDER
├── components/
│   ├── Header.tsx            + faner
│   ├── MapLibreMap.tsx       Oppgave 1–6 samlet
│   ├── SearchBar.tsx         Adresseforslag fra API-et
│   ├── BygningCard.tsx       Bygnings- og ROS-data
│   ├── SolCard.tsx           Solmengde per måned og for hele bygningen
│   ├── RuteCard.tsx          Kjøretid og lengde
│   └── Befolkning.tsx        Koroplettlag og fargeforklaring
└── geogjett/
    ├── GeoGjett.tsx          Spillflyt og tilstand
    ├── StartSkjerm.tsx
    ├── RundeSkjerm.tsx       Flyfoto, hint, poengtavle, minikart
    ├── ResultatSkjerm.tsx
    ├── SluttSkjerm.tsx
    ├── Resultatkart.tsx      Kart med gjett, fasit og linjer
    ├── markorer.tsx          Markører, OppdaterStorrelse
    ├── steder.ts             Tilfeldige steder
    ├── hint.ts               Hint og kostnader
    ├── poeng.ts              Poengberegning
    └── stil.ts               Farger, knappestil, hooks (useOpptelling, useTast)
```

ESLint (`react-refresh/only-export-components`) krever at filer som eksporterer
komponenter ikke også eksporterer konstanter eller hooks. Derfor er `stil.ts` og
`markorer.tsx` delt i to filer.

## Hva API-ene returnerer

Dette fant vi ut underveis, og det er nyttig å vite:

**Bygning** (`bygning.api.norkart.no/bygninger/byposition`)

- Svarer `{ Bygninger: [...] }`.
- Gir **404** når det ikke finnes noen bygning, ikke en tom liste.
- `FkbData.BygningsOmriss` er en GeoJSON-streng som må parses med `JSON.parse`.
- `AntattByggeaar` er `0` når byggeåret er ukjent.

**Takflater** (`takflater.api.norkart.no`)

- Svarer med en liste.
- Hver takflate har månedene `Januar` … `Desember` (kWh/m²), `Solinnstraaling`
  (summen for året), `Areal3D`, `Helning`, `Retning` og `Geometri` (en GeoJSON-streng
  med Z-koordinater).

**ROS** (`ros.api.norkart.no/v2/ros/bygning/{nr}`)

- Én flat struktur med blant annet `Postnummer`, `Poststed`, `Grunnkretsnavn`,
  `Brannstasjon`, `AvstandBrannstasjon`, `Flom`, `Kvikkleire`, `Kyst`,
  `AarsDognTrafikk`, `KulturmiljoNavn` og `EnkeltminneNavn`.

**Rute** (`ruteberegner.api.norkart.no/Route/Expanded`)

- `RouteGeometry` er en GeoJSON `MultiLineString`.
- `CostList` inneholder `{ Name: 'time', Cost }`, der kostnaden er i minutter.

**Høyde** (`hoyde.api.norkart.no/hoyde`)

- Tar imot en liste med punkter.
- Svarer `PunktHoyder: [{ X, Y, Z }]`.

**Basiskart** (`kvp.maps.norkart.no`)

- API-nøkkelen legges på som `api_key` i `transformRequest` (se `kart.ts`).

## Kjente begrensninger

- Kartbildene laster av og til tregt, så kartet kan være tomt i et par sekunder.
- Noen bygningstyper kommer avkuttet fra API-et, for eksempel «Andre småhus m/3
  boliger el fl».
- Når «Vis befolkning» er på, utløser et klikk på en befolkningsrute også et oppslag
  av bygning og tak på punktet.
- GeoGjett er laget for skjermer med mus. Minikartet utvides når musen er over det, så
  det fungerer dårligere på mobil.

## Ideer til videre arbeid

- Tidsfrist per runde i GeoGjett.
- Vanskelighetsgrader, der «Lett» bare bruker sentrum og «Vanskelig» hele kommunen.
- Toppliste over beste resultater.
- Hele Norge som spillområde, med steder vektet etter befolkning fra
  `befolkning_5km.json`.
- Andre ideer fra idémyldringen:
  - «Solbyen»: 3D-bygninger med solmengde gjennom året.
  - Havnivåsimulator: hvilke områder havner under vann.
  - Høydeprofil langs ruter.
  - Reisetidskart: hvor langt rekker man på 5, 10 og 15 minutter.
