# Biblioteka historii — snapshot 29.09.2026

Opracowano 31 kart z „Znajdź swoją następną historię”: 30 tematów ma dane, karta kawy pozostaje modelem hipotetycznym. Katalog zawiera **1111 serii, 42 001 niepustych obserwacji i 15 802 jawne braki**. Historia sięga 1870 r.; ostatni okres zależy od źródła. Porównanie średnich temp tanienia odwołuje się dodatkowo do okresów od 1800 r., lecz nie zawiera corocznych cen od tego roku. To snapshot, nie bieżący feed.

## Pliki

- `raw/`: pobrane CSV, JSON, XLSX, PDF i raporty HTML. Pliki `.receipt.json` zawierają URL, datę pobrania, rozmiar i SHA-256. Normalizacja nie zmienia surowych plików.
- `extracted-financial-tables.json`: wiersze tabel raportów spółek i stwierdzenia o MAU Facebooka użyte przez normalizer.
- `story-notes.json`: propozycje historii i wariantów prezentacji.
- `technology-costs.md`: opracowanie czterech nowych tematów Epoch AI / NHGRI, formuły i ograniczenia.
- `../../public/stories/manifest.json`: serie, źródła, jednostki, częstotliwości, zakresy i ograniczenia.
- `../../public/stories/<id>.json` i `.csv`: obserwacje jednego tematu.
- `../../public/stories/all-observations.csv`: wszystko w formacie długim, chronologicznie po dacie i ID serii.
- `../../public/stories/plotwist-story-datasets.zip`: dane, przewodnik, metadane OWID i wyekstrahowane tabele.
- `../../public/stories/quality-report.json`: liczebności, braki, zakresy, status `ready` / `partial` / `simulation`.
- `../../public/stories/STORY-GUIDE.md`: opracowanie zagadnień i propozycje wizualizacji.

## Interpretacja

`date` służy sortowaniu; `period`, `datePrecision`, `periodStart` i atrybuty fiskalne zachowują sens źródła. Roczne daty 31 grudnia nie oznaczają pomiarów dziennych. Apple: rzeczywiste końce lat fiskalnych (ostatnia sobota września), kurs roczny z ostatniej wcześniejszej sesji zapisanej w `tradingDate`. Daty okresów nie są datami dostępności raportów — to retrospektywa.

Rozdzielamy MAU/WAU, stany/przepływy, USD o różnych latach cenowych, przepływy kwartalne/roczne, BEV/BEV+PHEV i ogniwa/pakiety. Brak pomiaru to `null`. Animacja nie dopisuje obserwacji. Indeks 100 zaczyna od pierwszej niepustej obserwacji w zakresie; panel pokazuje każdą bazę. Dolne granice nie służą obliczaniu dokładnego indeksu wzrostu.

`kind=derived` ma opis formuły. CPI: iloczyn indeksów. Mieszkania: średnia czterech kwartałów NBP / miesięczna płaca GUS w tym samym mieście i roku. Patenty na milion osób mają oba źródła w `sourceIds`. Godziny pracy przed 1950 r. dotyczą innej populacji niż PWT i są oddzielnymi seriami. Skumulowane dostawy Nintendo tworzymy tylko od premiery. Pomijamy wieloletnie kolumny `2015~`/`2024~`; techniczne wartości ±0,1 wyświetlane przez arkusz jako 0/-0 zachowujemy w metadanych, a prezentujemy jako ≈0 zgodnie z dokładnością tabeli.

## Ograniczenia

Częściowy zakres: brak spójnego wyścigu aplikacji do 100 mln; baterie to ogniwa; LCOE obejmuje OZE; tranzystory są trendem OWID bez katalogu modeli; EV obejmuje BEV+PHEV; NVIDIA poza Data Center to połączone pozostałe segmenty; Azure ma tylko ujawnione progi; konsole obejmują Nintendo; prędkość internetu zawiera dwa porównywalne pomiary Ofcom. Patenty w snapshotcie kończą się w 2021 r., a starszy zbiór cen tokenów Epoch w lutym 2025 r.; nowy zbiór kosztów zadania AI zawiera rekordy do lipca 2026 r. Nie dopisujemy późniejszych lat ani szacunków.

## Odtwarzanie

Python 3 z `beautifulsoup4`, `lxml`, `openpyxl`, `xlrd` (scripts/requirements-stories.txt): z katalogu projektu uruchom `python scripts/build-story-data.py`. Dane są odtwarzane z lokalnych źródeł, bez sieci i API modeli. Normalizer kontroluje daty, unikalność, skończone wartości, źródła, paginację GUS/World Bank i struktury tabel. `npm test` dodatkowo sprawdza wartości referencyjne, obliczenia, jednostki, progi, indeksowanie, chronologię i zapis wariantów.

Pobieranie: `scripts/fetch-story-sources.mjs` dla OWID (argumenty: slugi); `scripts/fetch-story-files.mjs` dla URL (pary nazwa pliku, URL); `scripts/fetch-story-filings.mjs` dla wybranych raportów SEC. Nowe wydanie źródła wymaga ponownej kontroli definicji i ekstrakcji. Dane OpenAI, TikTok i Ofcom częściowo przepisano z jawnie wskazanych stron/stron PDF; dokładność dat i opis ekstrakcji pozostają w metadanych. Publiczna dostępność nie zastępuje warunków oryginalnego dostawcy.
