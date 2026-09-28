# plotwist

Polskojęzyczne studio animowanych wykresów do rolek. React + Vite, Canvas 2D i MediaRecorder. Aplikacja nie potrzebuje płatnego API ani serwera AI.

## Uruchomienie

```sh
npm install
npm run dev
```

Produkcja: `npm run build` (katalog `dist`). Weryfikacja obliczeń i CSV: `npm test`.

## Co działa

- 8 udokumentowanych wskaźników World Bank: 11 państw + agregat Świat, lata 2000–2023, 2291 niepustych obserwacji. Snapshoty są dołączone do strony i działają bez połączenia z API.
- Pobieranie dodatkowego wskaźnika World Bank po kodzie, dla tych samych państw i zakresu lat. Zależne od dostępności API/CORS.
- Do 3 serii, zakres lat, skala oryginalna lub indeks 100, wykres liniowy lub słupkowy, motywy jasny i ciemny.
- Symulacja codziennych wpłat oraz wydatków na kawę, z jawnymi założeniami.
- Import CSV, walidacja wartości i lat, obsługa polskich przecinków dziesiętnych przy separatorze średnikowym, zachowanie brakujących obserwacji.
- Animacja, przewijanie, eksport 1080p WebM (MP4 tylko jeśli brak WebM i przeglądarka obsługuje MP4), eksport PNG i JSON z danymi/metodologią.
- 27 pomysłów redakcyjnych, w tym 9 działających zestawów/modeli. Pozostałe są jasno oznaczone jako pomysły wymagające zebrania danych.
- Katalog 13 źródeł; podłączone World Bank, Yahoo Finance i NBP, pozostałe opisane jako propozycje.
- Dopasowanie własnego opisu do biblioteki słowami kluczowymi, losowanie tematu, prompt do skopiowania do ChatGPT.
- Zapis ustawień gotowego zbioru lokalnie w przeglądarce; własne zbiory eksportowane jako JSON. JSON jest kopią danych, obecnie bez funkcji ponownego otwarcia projektu.

## Dane i założenia

`public/data/*.json` przechowuje odpowiedź źródłową po normalizacji: kod wskaźnika, źródło, URL zapytania, datę pobrania, datę aktualizacji i obserwacje. Odświeżenie: `node scripts/fetch-data.mjs` (wymaga dostępu do internetu). Nie traktujemy `null` jako zera. Linie mają przerwy; animacja odsłania wykres, a wartości w legendzie odpowiadają obserwacjom. Indeks 100 startuje od pierwszej dostępnej wartości każdej serii.

World Bank: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392

Model inwestycji stosuje efektywną dzienną stopę `(1 + stopa_roczna)^(1/365) - 1`, wpłaty na koniec każdego dnia, 365 dni rocznie. Wykres pokazuje portfel, sumę wpłat i wydatki na kawę. Bez podatków, opłat, inflacji i ryzyka zmiennej stopy. Nie są to notowania konkretnego aktywa.

Eksport nagrywa canvas w czasie rzeczywistym. Kartę należy utrzymać aktywną. Wideo jest bez dźwięku; serwisy wymagające MP4 potrzebują konwersji WebM. Brak zależności od FFmpeg w przeglądarce.

## Rozwój projektu

1. Źródła: konektory SEC, NBP, Eurostat i OWID z cache, walidacją oraz metadanymi. SEC wymaga pośrednika serwerowego (brak CORS).
2. Notowania: moduł Giełda opisany poniżej obsługuje już historyczne DCA z cen i FX. Dalszy etap to licencjonowany dostawca na potrzeby komercyjnej redystrybucji, dywidendy oraz pełne pokrycie giełd.
3. Adopcja: katalog kamieni milowych z definicją MAU/WAU/DAU, datą startu i źródłem każdego punktu. Nie interpolować z dwóch komunikatów prasowych pełnej historii.
4. MP4/H.264: kolejka renderowania po stronie serwera lub lokalny FFmpeg. Deterministyczny renderer, muzyka/lektoring i bezpieczne marginesy platform.
5. AI opcjonalnie: najpierw retrieval po katalogu metryk, potem propozycja relacji i scenariusza. Model nie generuje liczb. Przechowywać źródła i wymagać weryfikacji metryk. Alternatywa bez API: research w ChatGPT, import CSV, render w studiu.

## Pliki

- `src/catalog.js` — zbiory, pomysły i źródła.
- `src/data.js` — dane, CSV, model wpłat, World Bank.
- `src/render.js` — wspólny renderer podglądu i eksportu.
- `src/components.jsx` — podgląd, biblioteki i okna dialogowe.
- `src/App.jsx` — stan i edytor.

Hosting Sites jest prywatny. Manifest `.openai/hosting.json` wskazuje istniejący projekt; nie należy rejestrować go ponownie.

## Giełda — dzienne ceny i inwestycja vs nawyk

Zakładka **Giełda** zawiera 39 wybranych spółek z USA, Niemiec, Holandii, Francji, Wielkiej Brytanii, Szwajcarii, Danii, Włoch, Hiszpanii, Polski, Szwecji i Norwegii. Snapshot pobrany 28.09.2026 zawiera 204 131 cen sesyjnych; ostatnia sesja 25.09.2026. Historia zaczyna się w 2005 r. albo przy debiucie/dostępności danego symbolu. Brak pokrycia całego rynku; brak indeksu spółek wycofanych. Jednego planowanego symbolu (ROG.SW) dostawca nie udostępnił — nie jest pokazywany jako dostępny.

Źródło notowań: publicznie dostępne dane wykresów Yahoo Finance. Nie jest to stabilne, gwarantowane API z umową SLA. Każdy plik zachowuje ticker, giełdę, strefę czasową, walutę, datę pobrania, link do historii i zgłoszone splity. Nie wykonujemy wywołań Yahoo w przeglądarce: użytkownik odczytuje snapshoty z hostingu. Świeżo pobrane pliki nie trafiają automatycznie na stronę online — wymagają ponownego zbudowania i publikacji.

`npm run data:markets` odświeża notowania i tabele NBP. Wymaga sieci, nie klucza. Kod spółek znajduje się w `src/market-universe.js`. Dostawca może ograniczyć dostęp lub zmienić format. Skrypt raportuje symbole niedostępne i wpisuje do manifestu wyłącznie te pobrane poprawnie. Pliki JSON mają około 11 MB łącznie, ale przeglądarka pobiera tylko wybraną spółkę (~250 KB) i wspólny plik FX (~700 KB).

Ceny w wierszu: `[data, Close skorygowane o splity, cena nominalna odtworzona, Adj Close]`. Yahoo Close uwzględnia splity; cena nominalna jest odtwarzana przez iloczyn późniejszych współczynników splitów i nie jest niezależnie zweryfikowanym oficjalnym kursem aukcji. Adj Close (także z korektami dywidendowymi) nie jest używany w DCA. Źródło definicji: https://help.yahoo.com/kb/SLN28256.html i opisy kolumn historii Yahoo Finance. Wartości są zachowane z precyzją danych dostawcy, nie są gwarancją rzeczywistej ceny wykonania.

Symulacja:

- Uwzględnia każdy dzień kalendarzowy, obie daty wliczone; dzienna wpłata i dzienny koszt napoju to dwa niezależne budżety.
- Zakup ułamkowych akcji po Close wyłącznie w dniu dostępnym w notowaniach. Weekendowe i świąteczne wpłaty oczekują w PLN do najbliższej sesji. Jeśli zakres kończy się w weekend, gotówka pozostaje składnikiem portfela.
- Baza cen skorygowana wyłącznie o splity; jednostki w tej samej bazie. Nie naliczamy dywidend.
- NBP tabela A: poprzednia dostępna data publikacji, ściśle wcześniejsza od dnia wyceny; nie korzystamy z przyszłych kursów. W dni bez sesji ostatnia cena jest wyceniana po dostępnym FX, a gotówka zwiększa się o wpłatę.
- PLN ma przelicznik 1. GBp/GBX dzielimy przez 100 do GBP. NBP zapewnia siedem walut: USD, EUR, GBP, CHF, DKK, SEK, NOK.
- Brak opłat, spreadów, podatków i inflacji. Kwota na napój jest stała przez cały okres.
- Ponad 10 dni bez notowania albo kursu FX przerywa obliczenia, zamiast wyceniać portfel po nieaktualnej wartości.
- Wynik ponad wpłaty = wartość portfela wraz z gotówką minus suma wpłat, a nie minus wydatki na konsumpcję.

Dostępne eksporty: pełny spis sesji CSV dla zakresu, dziennik symulacji CSV z datą użytego kursu i ceny, założenia JSON, pionowa rolka WebM i PNG. Tryb Kurs akcji działa na dziennej osi czasu. Bieżąca, potencjalnie niezakończona sesja jest zawsze pomijana.

Publiczny dostęp nie nadaje automatycznie prawa do komercyjnej redystrybucji danych. Przed takim zastosowaniem należy zapewnić odpowiednie warunki dostawcy.

## AI / LLM — historia wyników i nowe formaty rolek

Moduł zawiera 5886 obserwacji w 19 zestawach i wersjach testów (snapshot 28.09.2026): ECI, GPQA Diamond, MATH Level 5, OTIS Mock AIME, SWE-bench Verified v1/v2, cztery zestawy FrontierMath, MMLU 5-shot, ARC-AGI-1/2, HLE, cztery kombinacje quizów TrackingAI (Offline/Mensa × tekst/Vision) i Codeforces 2024. Zakres każdego źródła jest niezależny; nie każdy benchmark ma najnowsze modele.

Cztery formy: karty na osi czasu (do 8 wybranych rekordów), zmieniający się ranking, mapa punktowa postępu, porównanie AI z opisanym punktem odniesienia dla GPQA i Codeforces. Dostępny eksport 1080×1920 WebM/PNG, CSV wszystkich przefiltrowanych danych i JSON z metodologią oraz identyfikatorami scen. Renderer podglądu i eksportu jest wspólny.

Rozdzielamy datę premiery od daty pomiaru / publikacji. Oś premier to retrospektywa, a nie dowód dostępności wyniku w tamtym czasie. ECI nie jest IQ. TrackingAI to eksperymentalny quiz, nie psychometryczna miara człowieka. Wartości, daty, źródła i ograniczenia pozostają w filmach i eksportach. Niedatowane raporty zewnętrzne pozostają odrębnymi obserwacjami. Szczegóły i źródła: `research/ai/README.md`.

`npm run data:ai` odtwarza pliki aplikacji z pobranych CSV. `pwsh -File scripts/refresh-ai-sources.ps1` odświeża publiczne źródła bez płatnego API; przed publikacją należy sprawdzić zmiany metodologii. Surowe archiwum Epoch zachowano do dalszej rozbudowy, aplikacja pobiera tylko wybrany zestaw.
