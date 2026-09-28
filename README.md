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
- Katalog 12 źródeł; źródła poza World Bank nie mają jeszcze konektorów.
- Dopasowanie własnego opisu do biblioteki słowami kluczowymi, losowanie tematu, prompt do skopiowania do ChatGPT.
- Zapis ustawień gotowego zbioru lokalnie w przeglądarce; własne zbiory eksportowane jako JSON. JSON jest kopią danych, obecnie bez funkcji ponownego otwarcia projektu.

## Dane i założenia

`public/data/*.json` przechowuje odpowiedź źródłową po normalizacji: kod wskaźnika, źródło, URL zapytania, datę pobrania, datę aktualizacji i obserwacje. Odświeżenie: `node scripts/fetch-data.mjs` (wymaga dostępu do internetu). Nie traktujemy `null` jako zera. Linie mają przerwy; animacja odsłania wykres, a wartości w legendzie odpowiadają obserwacjom. Indeks 100 startuje od pierwszej dostępnej wartości każdej serii.

World Bank: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392

Model inwestycji stosuje efektywną dzienną stopę `(1 + stopa_roczna)^(1/365) - 1`, wpłaty na koniec każdego dnia, 365 dni rocznie. Wykres pokazuje portfel, sumę wpłat i wydatki na kawę. Bez podatków, opłat, inflacji i ryzyka zmiennej stopy. Nie są to notowania konkretnego aktywa.

Eksport nagrywa canvas w czasie rzeczywistym. Kartę należy utrzymać aktywną. Wideo jest bez dźwięku; serwisy wymagające MP4 potrzebują konwersji WebM. Brak zależności od FFmpeg w przeglądarce.

## Rozwój projektu

1. Źródła: konektory SEC, NBP, Eurostat i OWID z cache, walidacją oraz metadanymi. SEC wymaga pośrednika serwerowego (brak CORS).
2. Notowania: dostawca z licencją na zamierzony sposób wykorzystania; splity, dywidendy, waluta, kalendarz sesyjny. Dopiero wtedy historyczne DCA i porównania spółek z produktami.
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
