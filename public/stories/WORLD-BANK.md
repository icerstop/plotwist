# Kraje i długa historia rozwoju — snapshot 30.09.2026

World Bank: 36 wskaźników WDI, 217 krajów i terytoriów oraz 10 jawnie oznaczonych agregatów (świat, UE, OECD i regiony). 346 983 niepuste obserwacje. Nie każdy kraj ma każdy wskaźnik i rok. Nie ograniczamy zapytań datą; pobieramy wszystkie strony odpowiedzi API. Archiwalne odpowiedzi z metadanymi są w plikach `*.json.gz`; `receipt.json` zawiera adresy, SHA-256, daty pobrania i zakres każdej pary kraj–wskaźnik.

## Dlaczego Polska czasem zaczyna się w 1990 r.?

To zależy od wskaźnika. W tym pobraniu Polska ma:

| Wskaźnik | Pierwszy–ostatni rok z wartością |
| --- | --- |
| PKB na mieszkańca, ceny stałe 2015 | 1990–2025 |
| PKB na mieszkańca, PPP 2021 | 1990–2025 |
| Ludność i udział osób 65+ | 1960–2025 |
| Długość życia, dzietność, umieralność niemowląt | 1960–2024 |
| Inflacja CPI | 1971–2025 |
| Gini | 1985–2023, z lukami |
| Internet | 1990–2024 |

Zakres pierwszego i ostatniego roku nie potwierdza kompletności lat pośrednich. Filtr „Z obserwacją w roku” sprawdza istnienie rzeczywistej wartości. Wartości 0 pozostają zerami; braków nie zastępujemy zerem ani interpolacją w zbiorze danych. Regiony World Bank są bieżącą klasyfikacją geograficzną, a zestawy porównawcze edytora nie są historyczną klasyfikacją ustrojów.

## Osobno: Maddison Project Database 2023

Źródło: Bolt, Jutta i Jan Luiten van Zanden (2024), *Maddison style estimates of the evolution of the world economy: A new 2023 update*, DOI [10.1111/joes.12618](https://doi.org/10.1111/joes.12618), przez [Our World in Data](https://ourworldindata.org/grapher/gdp-per-capita-maddison-project-database). [Dokumentacja autorów](https://www.rug.nl/ggdc/historicaldevelopment/maddison/releases/maddison-project-database-2023).

Zachowujemy całą dostępną historię, w tym wczesne pojedyncze estymacje. Domyślny widok tematu zaczyna się w 1950 r.; można wybrać wcześniejsze lata. Dane kończą się w 2022 r. i są oznaczone `kind=estimate`. PKB na osobę jest wyrażone w stałych dolarach międzynarodowych 2011, nie w World Bank PPP 2021 ani nominalnych USD. Nie doklejamy tych wartości do serii WDI; mieszanie różnych jednostek wymaga jawnego indeksowania, które nie usuwa różnic metodologicznych.

Źródło rekonstruuje także dawne państwa w ich ostatnich granicach. Wynik opisany „ZSRR” po 1991 r. nie oznacza istnienia ZSRR w tym roku. Serie dawnych państw i agregatów pozostają oddzielne. Historyczne granice i zmiany metod rachunków ograniczają porównywalność. Sam wykres przed/po transformacji nie pozwala przypisać całej zmiany ustrojowi.

Metadane OWID, adnotacje i oryginalne pliki są zachowane w `research/stories/raw/gdp-per-capita-maddison-project-database.*`. Licencja CC BY 4.0. Cytuj projekt, OWID i właściwe publikacje krajowe wskazane w [arkuszu źródeł autorów](https://dataverse.nl/api/access/datafile/421302), zwłaszcza przy publikowaniu wykresu.

## Odtwarzanie

1. `node scripts/refresh-world-bank.mjs` — WDI, kraje, metadane, kompletność, SHA-256; dopiero po poprawnym pobraniu całości zastępuje snapshoty.
2. `node scripts/fetch-story-sources.mjs gdp-per-capita-maddison-project-database` — CSV i metadane Maddison/OWID.
3. `python scripts/build-story-data.py` — chronologiczna biblioteka i CSV/JSON tematów.
4. `node scripts/build-story-country-labels.mjs` — nazwy PL/EN.
5. `python scripts/audit-world-bank.py` — wykonywalny notebook audytu.
6. `npm test` i `npm run build`.

Pełny `all-observations.csv` znajduje się w ZIP całej biblioteki. Poszczególne tematy można pobrać bezpośrednio jako CSV/JSON. Dane nie odświeżają się automatycznie. Zmiana zestawu danych nie zmienia wspólnego motywu rolki.

World Bank: [API](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581), [warunki wykorzystania](https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets).
