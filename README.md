# plotwist

Studio animowanych wykresów do rolek z niezależnym wyborem języka menu i rolki (PL/EN). React + Vite, Canvas 2D i MediaRecorder. Aplikacja nie potrzebuje płatnego API ani serwera AI.

## Uruchomienie

```sh
npm install
npm run dev
```

Produkcja: `npm run build` (katalog `dist`). Weryfikacja obliczeń i CSV: `npm test`.

## Repozytorium i rozwój

Prywatne repozytorium GitHub: https://github.com/icerstop/plotwist. Zawiera kod, lokalne zasoby, snapshoty danych i dotychczasową historię zmian. Katalogi `node_modules`, `dist`, pliki `.env*` oraz dane robocze Sites są ignorowane.

Remote `origin` obsługuje istniejący hosting Sites, a `github` kopię projektu na GitHubie. Po kolejnych commitach `git push github main` aktualizuje tę kopię; sam push do GitHuba nie publikuje strony.

## Waluta prezentacji cen

W zakładce **Giełda → Kurs akcji** oraz **Wiele serii → Ceny i zmiany cen** można wybrać oryginalną walutę, USD lub PLN. Wykres, podsumowanie, tabela i eksport korzystają z tego samego przeliczenia. Indeks 100 i zmianę procentową liczymy po przeliczeniu cen na wybraną walutę.

Spółki notowane w USD zachowują oryginalne ceny i pełną historię bez ograniczeń wynikających z dostępności FX. Pozostałe waluty korzystają z ostatniej tabeli A NBP opublikowanej ściśle przed dniem sesji; konwersja między dwiema walutami używa ich kursów względem PLN z tej samej tabeli. Snapshot NBP zaczyna się w 2002 r., więc wcześniejsze ceny są dostępne w walucie oryginalnej. Brakujący lub starszy niż 10 dni kurs wywołuje błąd zamiast przybliżonej ceny.

CSV zachowuje cenę i walutę źródłową, cenę przeliczoną, przelicznik oraz datę tabeli NBP. Wspólna waluta nie znosi różnic jednostek surowców. Symulacje wpłat i zakupów pozostają w PLN.

## Co działa

- 8 udokumentowanych wskaźników World Bank: 11 państw + agregat Świat, pełna dostępna historia (łącznie 1960–2025), 4731 niepustych obserwacji. Snapshoty są dołączone do strony i działają bez połączenia z API.
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

Zakładka **Giełda** zawiera 39 wybranych spółek z USA, Niemiec, Holandii, Francji, Wielkiej Brytanii, Szwajcarii, Danii, Włoch, Hiszpanii, Polski, Szwecji i Norwegii. Snapshot pobrany 28.09.2026 zawiera 295 870 cen sesyjnych; ostatnia sesja 25.09.2026. Historia obejmuje wszystkie dzienne obserwacje dostępne u dostawcy: m.in. Coca-Cola od 1962-01-02, Apple od 1980-12-12 i NVIDIA od 1999-01-22. Kursy NBP od 2002-01-02; symulacje walutowe w PLN od następnego dnia, bo wymagają wcześniejszej tabeli. Sam wykres ceny nie ma ograniczenia do 30 lat. Brak pokrycia całego rynku; brak indeksu spółek wycofanych. Jednego planowanego symbolu (ROG.SW) dostawca nie udostępnił — nie jest pokazywany jako dostępny.

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

## Pełna historia danych

`node scripts/fetch-data.mjs` pobiera wszystkie strony World Bank bez filtra dat. Import własnego wskaźnika działa tak samo. Selektory lat wynikają z niepustych obserwacji wybranych krajów; puste wartości pozostają lukami. Przycisk „Cała dostępna historia” przywraca pełny zakres, a zmiana wskaźnika automatycznie wybiera jego historię. Najnowszy rok może być inny dla każdego wskaźnika i kraju. Dane przyszłe nie są dopisywane.

Pobieranie akcji używa pierwszej daty handlu podanej przez Yahoo oraz jawnego `interval=1d`. Nie używa `range=max`, ponieważ Yahoo potrafi wtedy zwrócić interwał kwartalny. Skrypt sprawdza otrzymaną częstotliwość. Ceny i kursy walut mają niezależne zakresy. Moduł AI już wcześniej korzystał z pełnej historii źródeł i nie miał limitu roku 2000.

## Czcionki i podpis rolek

W zakładce Wygląd w Studiu oraz w ustawieniach Giełdy i AI/LLM można wybrać Arial, Georgia, Verdana, Trebuchet MS, Impact lub Courier New. Są to czcionki systemowe z określonymi zamiennikami. Wybór jest wspólny dla trybów i zapisywany razem z projektem w przeglądarce. Ten sam renderer obsługuje podgląd, PNG i wideo. Pod każdą rolką znajduje się wyśrodkowany podpis Jakub Bilski oraz X: @jakub_bilski · IG: jakub__bilski. Źródła i metodologia mają osobne miejsce nad podpisem.

## Wiele serii, surowce i logotypy

**Giełda → Wiele serii** porównuje do 6 linii. Każdą można dodać, usunąć, pokolorować pickerem lub kodem HEX i przywrócić jej kolor domyślny. W trybie inwestycji każda spółka/fundusz otrzymuje pełną wskazaną wpłatę dzienną — to osobne scenariusze, nie jeden dzielony portfel. Dodatkowe serie to narastający codzienny wydatek i stały cel kwotowy (linia przerywana). W trybie cen dostępne są indeks 100, zmiana procentowa lub ceny nominalne o zgodnych walutach i jednostkach. Wydatki i cele wymagają trybu PLN.

Porównanie cen używa przecięcia rzeczywistych dni notowań wszystkich instrumentów i jednej wspólnej daty bazowej. Nie dopisuje cen z przyszłych sesji. Zakres jest ograniczony rzeczywistą wspólną historią; przycisk przywraca cały dostępny zakres. Ceny pozostają w walutach instrumentów i są korygowane o splity, nie dywidendy. CSV przechowuje wartości wykresu, jednostkę, symbol oraz źródłową cenę w trybie cen.

`public/commodities` zawiera 35 418 obserwacji: GC=F (złoto), SI=F (srebro), CL=F (ropa WTI) oraz GLD, SLV, USO. Snapshot z 28.09.2026, ostatnia sesja 25.09.2026, najstarsze kontrakty od 2000 roku; fundusze od 2004/2006. Kontrakty służą wyłącznie do porównań cen: to historia futures dostawcy, nie spot ani stopa zwrotu inwestycji, a zmiany kontraktów mogą wpływać na serię. Zachowujemy ujemne ceny WTI. Symulacja wpłat używa funduszy, których koszty są już zawarte w cenach. USO korzysta z kontraktów i może znacznie odbiegać od ropy spot. Odświeżanie: `npm run data:commodities`; pliki z `=` w symbolach mają bezpieczne nazwy z `-` (np. `GC-F.json`) wskazane w manifeście.

`public/logos/companies` zawiera 39 lokalnych logotypów (24 SVG, 15 PNG). `public/logos/manifest.json` mapuje symbole na pliki, URL źródłowe, SHA-256, licencje/zastrzeżenia znaków, oryginalny kolor marki i kolory wykresu dostosowane do obu teł. Źródła: Simple Icons, SVGL, CompaniesMarketCap, Wikimedia. Geometria znaków nie jest generowana. Włączenie logotypów pokazuje je w legendzie. Eksport czeka na załadowanie lokalnych obrazów, więc nie zależy od zewnętrznych serwerów ani CORS. Brak logo dla surowca oznacza zwykły kolorowy znacznik. Prywatna strona nie zmienia praw do marek ani licencji danych.

## Tła, obrazki i animowane GIF-y

Panel **Tło i dodatki** jest dostępny w zakładce Wygląd w Studiu i obok wyboru czcionki w Giełdzie oraz AI/LLM. Ustawienia są wspólne dla trybów. Tło: z motywu, własny kolor, dwukolorowy gradient (4 presety, kąt i opcjonalny ruch) albo lokalny obraz/GIF; dodatkowo siatka/punkty i regulowana osłona poprawiająca czytelność. Obraz tła można przycinać do kadru lub mieścić w całości i regulować jego widoczność.

Do 3 obrazków/GIF-ów ma niezależną pozycję, rozmiar, obrót, przezroczystość, cień, warstwę i kolejność. Dostępne ruchy: unoszenie, pulsowanie, pojawienie się. GIF-y mają tempo 0,25–2× i zapętlają się zgodnie z czasem rolki. Dodatki nad wykresem są przycinane przed obszarem źródeł i podpisu; te informacje rysowane są na końcu.

Pliki PNG/JPG/WebP/GIF do 12 MB są dekodowane w przeglądarce i zapisywane razem z ustawieniami w IndexedDB (`plotwist-visuals`). Nie są wysyłane na serwer. To wspólny, automatyczny szkic wyglądu, niezależny od zapisywanego projektu danych. Po wyczyszczeniu danych przeglądarki lub zmianie urządzenia trzeba wgrać pliki ponownie. Błąd/brak miejsca w IndexedDB nie wyłącza edycji w bieżącej sesji. Widoczny komunikat potwierdza zakończenie zapisu.

`gifuct-js` jest ładowany dopiero dla GIF-a. Dekoder składa klatki z obsługą przezroczystości, przesunięć oraz disposal 2/3. Jednocześnie rozpakowuje jedną łatkę i skaluje wynik do budżetu pamięci (20 mln pikseli na GIF, 40 mln łącznie); duże GIF-y mogą mieć mniejszą rozdzielczość. Limit wejściowy: 400 klatek i 8 mln pikseli na klatkę. Obrazy statyczne mają maks. 1920 px dłuższego boku. WebP/PNG są traktowane jako obrazy statyczne; animacje obsługiwane są w GIF.

Podgląd, przewijanie i MediaRecorder używają tego samego deterministycznego zegara. Wideo zachowuje ruch GIF-ów; PNG pokazuje końcową klatkę rolki. Eksport blokowany jest podczas wczytywania/dekodowania dodatków. `src/media-timeline.js` odpowiada za czas i geometrię, `src/reel-media.js` za pliki i zapis, `src/visual-render.js` za wspólną kompozycję, a `src/VisualSettings.jsx` za edytor i stan.


### Formy prezentacji i płynność

W każdym module panel „Sposób prezentacji” jest dostępny przy ustawieniach danych. Studio, ceny akcji, inwestycja vs nawyk i porównania wielu serii obsługują linie, linie z wypełnieniem (bez sumowania), kolumny, wyścig poziomych słupków oraz karty liczbowe. AI ma karty na osi czasu, wyścig rankingu, mapę pomiarów, schody rekordów oraz porównanie z opisanym punktem odniesienia, jeśli zbiór go zawiera. Wspólny katalog w `src/presentation.js` i komponent `PresentationPicker` pozwalają rozszerzać kolejne moduły bez osobnych selektorów.

Przejścia: płynne 0,65 s, spokojne 1,1 s, dynamiczne 0,3 s lub wyłączone. Ustawienie jest wspólne dla modułów w bieżącej sesji. AI zmienia całą kartę (model, rzeczywisty wynik, datę i niepewność) łagodnym wygaszeniem i pojawieniem. Nie wylicza fikcyjnego wyniku między różnymi modelami. Ranking animuje pozycję i długość słupka; podpisy pokazują wyłącznie rzeczywiste wartości. Gęste daty skracają przejście przed kolejnym pomiarem. Dłuższa rolka lub węższy zakres zwiększa czas na odczyt.

Schody rekordów to historyczne maksimum w wybranym filtrze, nie wynik jednego modelu ani interpolacja między pomiarami. Zwykły ranking nadal używa ostatniego wyniku wariantu, więc późniejszy gorszy wynik obniża pozycję. Puste wartości nie stają się zerami; brak przyszłych danych w klatkach. PNG, podgląd i wideo używają tego samego renderera i czasu. Ostatnie 10% filmu domyka przejście do końcowych wyników. Przewijanie i ponowne odtworzenie dają ten sam stan dla tego samego czasu.
