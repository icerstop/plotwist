# plotwist

World Bank rozszerzono 30.09.2026 do 36 wskaźników, 217 krajów/terytoriów i 10 agregatów (346 983 obserwacje). Biblioteka pozwala filtrować regiony, zestawy krajów i faktyczną dostępność danego roku. Osobny Maddison Project obejmuje historyczne estymacje PKB do 2022 r., także Polskę przed 1990 r. [Zakres i metodologia](research/world-bank/README.md), [wykonany audyt](research/world-bank/audit.ipynb). Pełny CSV jest w ZIP, a tematy mają osobne CSV/JSON.

Studio animowanych wykresów do rolek z niezależnym wyborem języka menu i rolki (PL/EN). React + Vite, Canvas 2D, WebCodecs i Mediabunny. Aplikacja nie potrzebuje płatnego API ani serwera AI.

## Uruchomienie

```sh
npm install
npm run dev
```

Produkcja: `npm run build` (frontend `dist/client`, Worker `dist/server/index.js`). Weryfikacja: `npm test`, w tym testy kont i plików w lokalnym środowisku D1/R2 (Miniflare).

## Własne motywy na koncie

**Wygląd rolki → Styl → Moje motywy** zapisuje nazwany wygląd na koncie zalogowanym przez ChatGPT na opublikowanej stronie. Lista wczytuje się przy wejściu do panelu i powrocie do karty; można ją też odświeżyć ręcznie. Można zastosować motyw, zaktualizować go z obecnego wyglądu, zmienić nazwę, usunąć albo wyeksportować/importować kopię JSON. Zapis i aktualizacja są jawne — suwaki nie nadpisują automatycznie zapisanych motywów.

Motyw obejmuje globalną czcionkę, ustawienia tekstów i ich efekty, tło (także GIF), logo, ręczne transformacje, układ, paletę/wygląd wykresu i animacje. Zachowuje dane, tytuł, opis, źródła, podpis autora, własne podpisy wskaźników i dodatkowe obrazki rolki. Typ wykresu, skala, format, czas filmu i kolory pojedynczych serii pozostają ustawieniami konkretnej rolki. Tło i logo pobierane są przed zmianą wyglądu; błąd pobierania lub dekodowania pozostawia dotychczasową kompozycję.

Ustawienia i metadane są w D1 (`DB`), pliki w R2 (`BUCKET`). Każde zapytanie filtruje po zaufanym identyfikatorze `oai-authenticated-user-id` dostarczonym przez Sites. Brak tożsamości daje 401; nie przyjmujemy konta z formularza. Zapisy korzystają z numeru rewizji, więc nie nadpisują zmian z innego urządzenia. Limit: 100 motywów na konto, do 12 MB na tło/logo. JSON kopii zawiera te pliki. Lokalny szkic rolki pozostaje w IndexedDB, niezależnie od motywów na koncie.

`npm run dev` obsługuje edytor lokalnie; panel motywów pokazuje odnośnik do opublikowanej strony, ponieważ lokalny Vite nie ma sesji konta Sites. Nie podszywa się pod konto produkcyjne. Testy używają oddzielnych lokalnych kont i tymczasowej bazy, bez dostępu do zapisanych motywów użytkownika.

Schemat jest w `db/schema.ts`; `npm run db:generate` generuje migracje w `drizzle`. Hosting stosuje migracje przed publikacją. Nie zmieniaj już opublikowanych migracji — dodawaj nowe. Logiczne powiązania przechowuje `.openai/hosting.json`; fizycznymi zasobami i uwierzytelnianiem zarządza Sites. Frontend, Canvas i eksport filmów pozostają w dotychczasowym stacku.

## Wspólny panel wyglądu

Na desktopie dane są po lewej, podgląd pośrodku, a **Wygląd rolki** po prawej. Na małych ekranach panele układają się pionowo. Zakładki wyglądu:

- **Styl:** 8 kompletnych designów z miniaturami (Dziennik, Terminal, Notatnik, Po zmroku, Plakat, Esencja, Lawenda, Serwis), 10 motywów, czcionka i opisy legendy. Można cofnąć ostatni wybór designu. Design resetuje ręczne transformacje elementów; nie podmienia danych, treści ani dodanych plików.
- **Układ:** 6 kompozycji, niezależna szerokość i wysokość pola osi, pozycje sekcji i wyrównanie podpisu.
- **Wykres:** 7 palet z wariantami dla jasnego i ciemnego tła; grubość, kreskowanie, widoczność i poświata linii; wypełnienie obszarów; szerokość i zaokrąglenia słupków/kart; siatka, podziałka, opisy osi, tło pola wykresu i legenda. Kontrolki zależą od typu prezentacji. Paleta „Kolory z danych i motywu” przywraca kolory własne i kolory marek. Typ wykresu i skala wartości zostają w panelu danych.
- **Tło i GIF-y:** logo, tło i media.
- **Elementy:** edycja na podglądzie, transformacje, czcionki, kolor, rozmiar, zawijanie, ręczne podziały wierszy, wyrównanie, szerokość tekstu, interlinia, cień, obrys i tło tekstu. Rozszerzone efekty dotyczą tytułu, opisu, wspólnego wskaźnika, daty, źródeł i podpisu; etykiety i wartości zachowują własne ustawienia czcionki, koloru i rozmiaru.

Podgląd, PNG i wszystkie klatki filmu korzystają z tego samego renderera. Efekty nie zmieniają pomiarów, braków danych ani skokowego przebiegu rekordów AI. Ustawienia starych projektów dostają zgodne wartości domyślne.

**Grubość czcionki:** zakładka Styl ustawia wspólną grubość, a Elementy pozwala ją nadpisać dla konkretnego tekstu, także podpisu autora, etykiet/osi i wartości liczbowych. Lista wynika z lokalnych plików fontu (np. Inter 100–900, Libre Baskerville 400–700, kroje statyczne tylko dostarczone warianty). „Automatyczna” zachowuje hierarchię designu. Jeśli po zmianie kroju zapisana grubość nie występuje w nowej czcionce, podgląd i lista używają najbliższej dostępnej, a ustawienie pozostaje zapamiętane. Grubości zapisują się w szkicu i własnych motywach na koncie. Pomiar tekstu, dopasowanie wierszy, podgląd i eksport stosują te same wartości.

Wygląd i pliki mają wspólny szkic IndexedDB, niezależny od wybranego zbioru oraz modułu. Czcionka całej rolki również zapisuje się w tym szkicu; stare projekty zachowują dotychczasową czcionkę jako wartość początkową. Zapis głównego projektu nadal zawiera aktualną czcionkę. Zmiany danych i wariantów nie resetują wyglądu. Wyrównanie i skalowanie całych sekcji zachowuje wcześniejsze zakresy i jest odrębne od transformacji pojedynczych elementów.

## GIF-y z wyszukiwarki

**Wygląd rolki → Tło i GIF-y → Wyszukaj GIF-y online** korzysta z publicznego [API GifSnap](https://gifsnap.com/docs), bez konta, klucza i opłat za zapytania. Wyniki można wstawiać jako dodatek (maks. 3) lub tło. Wyszukiwanie ma paginację, anulowanie poprzednich zapytań i krótką pamięć podręczną. Dostępność wyników zależy od zewnętrznej usługi; ręczny upload nadal działa.

Adapter `src/gif-search.js` używa proxy mediów GifSnap z CORS, ponieważ bezpośredni CDN nie udostępniał CORS podczas weryfikacji 2026-09-29. Przyjmujemy pliki GIF, sprawdzamy sygnaturę i limit 12 MB także podczas pobierania. Wyniki WebP/wideo są pomijane, aby nie wstawiać nieruchomej klatki zamiast animacji. Dotychczasowy dekoder ogranicza liczbę klatek i pamięć obrazu.

Wybrany plik oraz identyfikator, tytuł i dostawca zapisują się w lokalnym szkicu IndexedDB. Po wstawieniu eksport korzysta z przygotowanych klatek, bez zapytań do usługi. Oryginalne opóźnienia klatek GIF-a są zachowane: GIF 12,5 fps w filmie 60 fps powtarza klatki, nie spowalniając wykresu. PNG pozostaje pojedynczym kadrem. Położenie, rozmiar, obrót i tempo są regulowane istniejącymi narzędziami edytora.

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
- Animacja, przewijanie, eksport 1080p z wyborem stałych 30/60 fps: MP4/H.264, a przy braku obsługi kodera H.264 — WebM/VP9 lub VP8. Eksport PNG i JSON z danymi/metodologią.
- 27 pomysłów redakcyjnych, w tym 9 działających zestawów/modeli. Pozostałe są jasno oznaczone jako pomysły wymagające zebrania danych.
- Katalog 13 źródeł; podłączone World Bank, Yahoo Finance i NBP, pozostałe opisane jako propozycje.
- Dopasowanie własnego opisu do biblioteki słowami kluczowymi, losowanie tematu, prompt do skopiowania do ChatGPT.
- Zapis ustawień gotowego zbioru lokalnie w przeglądarce; własne zbiory eksportowane jako JSON. JSON jest kopią danych, obecnie bez funkcji ponownego otwarcia projektu.

## Dane i założenia

`public/data/*.json` przechowuje odpowiedź źródłową po normalizacji: kod wskaźnika, źródło, URL zapytania, datę pobrania, datę aktualizacji i obserwacje. Odświeżenie: `node scripts/fetch-data.mjs` (wymaga dostępu do internetu). Nie traktujemy `null` jako zera. Linie mają przerwy; animacja odsłania wykres, a wartości w legendzie odpowiadają obserwacjom. Indeks 100 startuje od pierwszej dostępnej wartości każdej serii.

World Bank: https://datahelpdesk.worldbank.org/knowledgebase/articles/889392

Model inwestycji stosuje efektywną dzienną stopę `(1 + stopa_roczna)^(1/365) - 1`, wpłaty na koniec każdego dnia, 365 dni rocznie. Wykres pokazuje portfel, sumę wpłat i wydatki na kawę. Bez podatków, opłat, inflacji i ryzyka zmiennej stopy. Nie są to notowania konkretnego aktywa.

Eksport renderuje każdą klatkę oddzielnie: film 12 s przy 60 fps zawiera 720 klatek. Czas animacji i GIF-ów wynika z indeksu klatki, a nie czasu pracy komputera. Zapis czeka na koder zamiast opuszczać klatki; liczba zakodowanych klatek jest sprawdzana przed pobraniem. Domyślnie 60 fps, opcjonalnie 30 fps. Eksport może trwać dłużej niż film. Kartę trzeba pozostawić otwartą; wstrzymanie karty w tle może wydłużyć pracę, lecz nie tworzy przerw w pliku. Anulowanie zwalnia zasoby kodera i nie pobiera niepełnego filmu.

MP4/H.264 jest wybierany, jeśli przeglądarka obsługuje kodowanie w danym rozmiarze i klatkażu; w przeciwnym razie używany jest WebM. Wideo jest bez dźwięku. Kodowanie odbywa się lokalnie, bez płatnego API i bez wysyłania klatek na serwer. Biblioteka kodera jest ładowana dopiero po rozpoczęciu eksportu. Wymagane WebCodecs/VideoEncoder (np. aktualny Chrome lub Edge); brak obsługi pokazuje komunikat, bez powrotu do zawodnego nagrywania w czasie rzeczywistym. Brak zależności od FFmpeg w przeglądarce.

## Rozwój projektu

1. Źródła: konektory SEC, NBP, Eurostat i OWID z cache, walidacją oraz metadanymi. SEC wymaga pośrednika serwerowego (brak CORS).
2. Notowania: moduł Giełda opisany poniżej obsługuje już historyczne DCA z cen i FX. Dalszy etap to licencjonowany dostawca na potrzeby komercyjnej redystrybucji, dywidendy oraz pełne pokrycie giełd.
3. Adopcja: katalog kamieni milowych z definicją MAU/WAU/DAU, datą startu i źródłem każdego punktu. Nie interpolować z dwóch komunikatów prasowych pełnej historii.
4. MP4/H.264: kolejka renderowania po stronie serwera lub lokalny FFmpeg. Deterministyczny renderer, muzyka/lektoring i bezpieczne marginesy platform.
5. AI opcjonalnie: najpierw retrieval po katalogu metryk, potem propozycja relacji i scenariusza. Model nie generuje liczb. Przechowywać źródła i wymagać weryfikacji metryk. Alternatywa bez API: research w ChatGPT, import CSV, render w studiu.

## Sekwencje animacji elementów

W prawym panelu **Wygląd rolki → Animacje** jest 19 gotowych sekwencji: pisany tytuł, cztery warianty maszyny do pisania, przenikanie, wjazdy, zbliżenie i oddalenie, sprężyna, odbicie, kurtyny, odsłona od środka, słowa, wiersze, obrót kartki i historia z podpisem na końcu. „Rysowanie liter” to płynne odsłanianie wybranej czcionki, nie odtwarzanie rzeczywistych ruchów pióra.

Maszyna do pisania ma wariant klasyczny, naturalny z pauzami, terminalowy i retro. Opcja **Cały tekst po kolei** wpisuje tytuł, opis, wspólny wskaźnik, etykiety i wartości początkowe wykresu, datę, źródło oraz podpis — jedną kolejką, także między wierszami. Kursor może być kreską, blokiem, podkreśleniem albo wyłączony; opcjonalnie miga w pauzach. Suwak reguluje czas pisania przed wykresem (20–60% filmu). Dane ruszają po wpisaniu wszystkich tekstów; późniejsze zmiany liczb i modeli korzystają ze zwykłych przejść i nie uruchamiają pisania od nowa. Źródło jest kompletne przed startem danych. Edycja kursorem oraz końcowy PNG pokazują całość.

`src/reel-typing.js` mierzy rzeczywiste wywołania tekstowe pierwszej klatki danych, a kolejność odtwarza według czasu filmu. Dotyczy także osi, legend i kart AI rysowanych bez pomocnika tekstowego. Zachowuje pełne szerokości i zawijanie, rozróżnia grafemy (polskie znaki, emoji, znaki łączone), nie używa losowości ani czasu zegarowego. Cache jest unieważniany przy zmianie danych, języka i wyglądu. Włączenie innego presetu zachowuje dotychczasowy mechanizm animacji poszczególnych elementów.

Domyślny rozmiar podtytułu wzrósł z 29 do 38 px na płótnie 1080 px (AI: 33 → 40 px). Rozmiar i zawijanie nadal podlegają edytorowi. Podtytuły z metadanymi zapisują jednostkę w nawiasach, np. „Osoby korzystające z internetu (% populacji)”; własne teksty i jednostki nie są zgadywane ani przepisywane na podstawie kropek.

Każdy element ma osobny efekt wejścia, początek i długość; obrazki/GIF-y mogą mieć wspólne lub indywidualne wejścia. Można przejść do animacji po wybraniu elementu na podglądzie. Oś czasu pozwala podejrzeć środek etapu, a przycisk odtwarza całą sekwencję od początku. Animacje są domyślnie wyłączone w istniejących szkicach.

Wykres zaczyna rozwijać dane po zakończeniu swojego wejścia. Ostatnie 10% filmu zostaje na końcowy wynik. Czasy dopasowują się proporcjonalnie do długości rolki. Poza sekwencyjnym pisaniem źródła pozostają widoczne przez cały film. Edycja kursorem tymczasowo pokazuje elementy w ich docelowej pozycji. GIF-y zachowują własną liczbę klatek i globalny zegar filmu.

Sekwencje są wspólne dla wszystkich modułów, niezależne od designu i danych oraz zapisywane lokalnie z wyglądem. Podgląd, przewijanie i eksport 30/60 fps korzystają z tego samego zegara, bez zależności od szybkości renderowania. PNG zachowuje końcowy widok. Logika: `src/reel-motion.js`, panel: `src/MotionEditor.jsx`.

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

Dostępne eksporty: pełny spis sesji CSV dla zakresu, dziennik symulacji CSV z datą użytego kursu i ceny, założenia JSON, pionowa rolka MP4/WebM i PNG. Tryb Kurs akcji działa na dziennej osi czasu. Bieżąca, potencjalnie niezakończona sesja jest zawsze pomijana.

Publiczny dostęp nie nadaje automatycznie prawa do komercyjnej redystrybucji danych. Przed takim zastosowaniem należy zapewnić odpowiednie warunki dostawcy.

## AI / LLM — historia wyników i nowe formaty rolek

Moduł zawiera 7943 obserwacje w 42 zestawach i wersjach testów (snapshot 30.09.2026): benchmarki Epoch i ECI, eksperymentalne quizy TrackingAI, Codeforces 2024, raport Sonnet 5.5, zestawy Artificial Analysis oraz ARC-AGI-3. Zakres każdego źródła jest niezależny; nie każdy benchmark ma najnowsze modele.

ARC-AGI-3: 69 konfiguracji z oficjalnego rankingu ARC Prize, rozdzielonych na Standard (48) i Provider Adapter (21). Domyślnie ranking na dzień pobrania, opcjonalnie retrospektywa premier, grupowanie według producentów i porównanie z ludzkim punktem odniesienia 100% RHAE. Małe wyniki pokazujemy do dwóch miejsc po przecinku. ARC-AGI-1/2, Public Demo, Developer Preview i konkurs Kaggle pozostają odrębne. Źródła, korekty dat i odtwarzalny import: `research/ai/README.md`.

Cztery formy: karty na osi czasu (do 8 wybranych rekordów), zmieniający się ranking, mapa punktowa postępu, porównanie AI z opisanym punktem odniesienia dla GPQA i Codeforces. Dostępny eksport 1080×1920 MP4/WebM/PNG, CSV wszystkich przefiltrowanych danych i JSON z metodologią oraz identyfikatorami scen. Renderer podglądu i eksportu jest wspólny.

Rozdzielamy datę premiery od daty pomiaru / publikacji. Oś premier to retrospektywa, a nie dowód dostępności wyniku w tamtym czasie. ECI nie jest IQ. TrackingAI to eksperymentalny quiz, nie psychometryczna miara człowieka. Wartości, daty, źródła i ograniczenia pozostają w filmach i eksportach. Niedatowane raporty zewnętrzne pozostają odrębnymi obserwacjami. Szczegóły i źródła: `research/ai/README.md`.

`npm run data:ai` odtwarza pliki aplikacji z pobranych CSV. `pwsh -File scripts/refresh-ai-sources.ps1` odświeża publiczne źródła bez płatnego API; przed publikacją należy sprawdzić zmiany metodologii. Surowe archiwum Epoch zachowano do dalszej rozbudowy, aplikacja pobiera tylko wybrany zestaw.

## Pełna historia danych

`node scripts/fetch-data.mjs` pobiera wszystkie strony World Bank bez filtra dat. Import własnego wskaźnika działa tak samo. Selektory lat wynikają z niepustych obserwacji wybranych krajów; puste wartości pozostają lukami. Przycisk „Cała dostępna historia” przywraca pełny zakres, a zmiana wskaźnika automatycznie wybiera jego historię. Najnowszy rok może być inny dla każdego wskaźnika i kraju. Dane przyszłe nie są dopisywane.

Pobieranie akcji używa pierwszej daty handlu podanej przez Yahoo oraz jawnego `interval=1d`. Nie używa `range=max`, ponieważ Yahoo potrafi wtedy zwrócić interwał kwartalny. Skrypt sprawdza otrzymaną częstotliwość. Ceny i kursy walut mają niezależne zakresy. Moduł AI już wcześniej korzystał z pełnej historii źródeł i nie miał limitu roku 2000.

## Czcionki i podpis rolek

W panelu Wygląd rolki, w sekcji Styl, dostępnych jest 61 czcionek: 55 dołączonych do aplikacji oraz 6 systemowych. Są pogrupowane na bezszeryfowe, redakcyjne, tytułowe, odręczne i techniczne. Tę samą listę udostępnia wybór czcionki pojedynczego elementu. Nowe kroje obejmują m.in. Fraunces, Bodoni Moda, DM Serif Display, Sora, Onest, Bebas Neue, Caveat i IBM Plex Mono. Pliki oraz licencje znajdują się w `public/fonts`; polskie znaki sprawdzono w mapach znaków fontów. Wybór otwiera przeglądarkę z wyszukiwaniem, kategoriami i próbką polskich znaków oraz cyfr dla każdego kroju. Lokalne fonty wczytują się przed pokazaniem próbki, w miarę przewijania listy; błąd ma stan i przycisk ponowienia zamiast mylącego fontu zastępczego. Ten sam wybór jest dostępny dla całej rolki i pojedynczego elementu, z zachowaniem dziedziczenia, cofania i grubości czcionki. Poza listą wczytywane są wybrane rodziny przed podglądem i eksportem. Wybór jest wspólny dla trybów i zapisywany razem z projektem w przeglądarce. Ten sam renderer obsługuje podgląd, PNG i wideo. Pod każdą rolką znajduje się wyśrodkowany podpis Jakub Bilski oraz X: @jakub_bilski · IG: jakub__bilski. Źródła i metodologia mają osobne miejsce nad podpisem.

## Wiele serii, surowce i logotypy

**Wygląd rolki → Wykres → Liczby na osi** steruje zapisem podziałki: automatycznym, pełnym (w jednostce danych), tysiącami, milionami, miliardami, bilionami lub jawnym zapisem naukowym. Domyślnie liczby nie przechodzą w notację naukową, nawet gdy opis jest długi. Można wybrać liczbę miejsc po przecinku, separatory tysięcy, jednostkę nad wykresem albo skróty przy liczbach i własny podpis osi. Ustawienia zapisują się we wspólnym wyglądzie oraz motywach i działają w zwykłych wykresach oraz osiach AI.

Konwersja uwzględnia rozpoznany przedrostek jednostki źródłowej: 16 000 mln USD = 16 mld USD. Mianowniki, np. USD / mln tokenów, nie są przeliczane jako miliony dolarów. Tryb automatyczny dobiera jeden przedrostek dla całej wybranej historii, także przy animowanej skali rosnącej. Dane, geometria wykresu, legenda i wartości przy liniach pozostają w jednostce źródłowej. Automatyczne opisy zmieniają język wraz z rolką; własny podpis pozostaje dosłowny.

**Wygląd rolki → Wykres → Wartości przy liniach** włącza etykiety bieżącej wartości z flagą kraju lub lokalnym logotypem firmy. Działają dla linii, wypełnienia oraz porównania rekordów marek AI, niezależnie od legendy. Są domyślnie wyłączone; można zmienić rozmiar, włączyć nazwy i wyłączyć ikony. Brak lub powtórzona ikona automatycznie wymaga nazwy. Identyfikacja korzysta z metadanych serii, nie z tekstu edytowanej etykiety.

Etykiety rezerwują miejsce po prawej, układają się według wysokości linii, mają odstępy i kolorowe łączniki. Niski wykres może użyć kilku kolumn. Wartości interpolowane w punkcie animacji są oznaczone `≈`; można przełączyć je na ostatni pomiar. Interpolacja uwzględnia skalę logarytmiczną i serie schodkowe. Luki nie otrzymują wartości, zakończona seria pokazuje datę ostatniego pomiaru. Wyniki AI pozostają dokładnymi wynikami źródłowymi. Podgląd, PNG i eksport klatka po klatce korzystają z tego samego układu. Ustawienia zapisują się również we własnych motywach.

166 lokalnych flag z flag-icons 7.3.2 znajduje się w `public/logos/flags` razem z licencją MIT i informacją o pochodzeniu. Flagi identyfikują obecne kraje, nie odtwarzają historycznych wzorów. Zbiorcze regiony nie otrzymują flag krajów. Odświeżenie plików i map symboli firm: `node scripts/fetch-series-flags.mjs`.

**Giełda → Wiele serii** porównuje do 6 linii. Każdą można dodać, usunąć, pokolorować pickerem lub kodem HEX i przywrócić jej kolor domyślny. W trybie inwestycji każda spółka/fundusz otrzymuje pełną wskazaną wpłatę dzienną — to osobne scenariusze, nie jeden dzielony portfel. Dodatkowe serie to narastający codzienny wydatek i stały cel kwotowy (linia przerywana). W trybie cen dostępne są indeks 100, zmiana procentowa lub ceny nominalne o zgodnych walutach i jednostkach. Wydatki i cele wymagają trybu PLN.

Porównanie cen używa przecięcia rzeczywistych dni notowań wszystkich instrumentów i jednej wspólnej daty bazowej. Nie dopisuje cen z przyszłych sesji. Zakres jest ograniczony rzeczywistą wspólną historią; przycisk przywraca cały dostępny zakres. Ceny pozostają w walutach instrumentów i są korygowane o splity, nie dywidendy. CSV przechowuje wartości wykresu, jednostkę, symbol oraz źródłową cenę w trybie cen.

`public/commodities` zawiera 35 418 obserwacji: GC=F (złoto), SI=F (srebro), CL=F (ropa WTI) oraz GLD, SLV, USO. Snapshot z 28.09.2026, ostatnia sesja 25.09.2026, najstarsze kontrakty od 2000 roku; fundusze od 2004/2006. Kontrakty służą wyłącznie do porównań cen: to historia futures dostawcy, nie spot ani stopa zwrotu inwestycji, a zmiany kontraktów mogą wpływać na serię. Zachowujemy ujemne ceny WTI. Symulacja wpłat używa funduszy, których koszty są już zawarte w cenach. USO korzysta z kontraktów i może znacznie odbiegać od ropy spot. Odświeżanie: `npm run data:commodities`; pliki z `=` w symbolach mają bezpieczne nazwy z `-` (np. `GC-F.json`) wskazane w manifeście.

`public/logos/companies` zawiera 39 lokalnych logotypów (24 SVG, 15 PNG). `public/logos/manifest.json` mapuje symbole na pliki, URL źródłowe, SHA-256, licencje/zastrzeżenia znaków, oryginalny kolor marki i kolory wykresu dostosowane do obu teł. Źródła: Simple Icons, SVGL, CompaniesMarketCap, Wikimedia. Geometria znaków nie jest generowana. Włączenie logotypów pokazuje je w legendzie. Eksport czeka na załadowanie lokalnych obrazów, więc nie zależy od zewnętrznych serwerów ani CORS. Brak logo dla surowca oznacza zwykły kolorowy znacznik. Prywatna strona nie zmienia praw do marek ani licencji danych.

## Tła, obrazki i animowane GIF-y

Sekcja **Tło i GIF-y** jest częścią wspólnego panelu Wygląd rolki pod podglądem we wszystkich modułach. Ustawienia są wspólne dla trybów. Tło: z motywu, własny kolor, dwukolorowy gradient (4 presety, kąt i opcjonalny ruch) albo lokalny obraz/GIF; dodatkowo siatka/punkty i regulowana osłona poprawiająca czytelność. Obraz tła można przycinać do kadru lub mieścić w całości i regulować jego widoczność.

Do 3 obrazków/GIF-ów ma niezależną pozycję, rozmiar, obrót, przezroczystość, cień, warstwę i kolejność. Dostępne ruchy: unoszenie, pulsowanie, pojawienie się. GIF-y mają tempo 0,25–2× i zapętlają się zgodnie z czasem rolki. Dodatki nad wykresem są przycinane przed obszarem źródeł i podpisu; te informacje rysowane są na końcu.

Pliki PNG/JPG/WebP/GIF do 12 MB są dekodowane w przeglądarce i zapisywane razem z ustawieniami w IndexedDB (`plotwist-visuals`). Nie są wysyłane na serwer. To wspólny, automatyczny szkic wyglądu, niezależny od zapisywanego projektu danych. Po wyczyszczeniu danych przeglądarki lub zmianie urządzenia trzeba wgrać pliki ponownie. Błąd/brak miejsca w IndexedDB nie wyłącza edycji w bieżącej sesji. Widoczny komunikat potwierdza zakończenie zapisu.

`gifuct-js` jest ładowany dopiero dla GIF-a. Dekoder składa klatki z obsługą przezroczystości, przesunięć oraz disposal 2/3. Jednocześnie rozpakowuje jedną łatkę i skaluje wynik do budżetu pamięci (20 mln pikseli na GIF, 40 mln łącznie); duże GIF-y mogą mieć mniejszą rozdzielczość. Limit wejściowy: 400 klatek i 8 mln pikseli na klatkę. Obrazy statyczne mają maks. 1920 px dłuższego boku. WebP/PNG są traktowane jako obrazy statyczne; animacje obsługiwane są w GIF.

Podgląd, przewijanie i eksport klatka po klatce używają tego samego deterministycznego zegara. Wideo zachowuje ruch GIF-ów; PNG pokazuje końcową klatkę rolki. Eksport blokowany jest podczas wczytywania/dekodowania dodatków. `src/media-timeline.js` odpowiada za czas i geometrię, `src/reel-media.js` za pliki i zapis, `src/visual-render.js` za wspólną kompozycję, a `src/VisualSettings.jsx` za edytor i stan.


### Formy prezentacji i płynność

W każdym module panel „Sposób prezentacji” jest dostępny przy ustawieniach danych. Studio, ceny akcji, inwestycja vs nawyk i porównania wielu serii obsługują linie, linie z wypełnieniem (bez sumowania), kolumny, wyścig poziomych słupków oraz karty liczbowe. AI ma karty na osi czasu, wyścig rankingu, mapę pomiarów, schody rekordów oraz porównanie z opisanym punktem odniesienia, jeśli zbiór go zawiera. Wspólny katalog w `src/presentation.js` i komponent `PresentationPicker` pozwalają rozszerzać kolejne moduły bez osobnych selektorów.

Przejścia: płynne 0,65 s, spokojne 1,1 s, dynamiczne 0,3 s lub wyłączone. Ustawienie jest wspólne dla modułów w bieżącej sesji. AI zmienia całą kartę (model, rzeczywisty wynik, datę i niepewność) łagodnym wygaszeniem i pojawieniem. Nie wylicza fikcyjnego wyniku między różnymi modelami. Ranking animuje pozycję i długość słupka; podpisy pokazują wyłącznie rzeczywiste wartości. Gęste daty skracają przejście przed kolejnym pomiarem. Dłuższa rolka lub węższy zakres zwiększa czas na odczyt.

Schody rekordów to historyczne maksimum w wybranym filtrze, nie wynik jednego modelu ani interpolacja między pomiarami. Zwykły ranking nadal używa ostatniego wyniku wariantu, więc późniejszy gorszy wynik obniża pozycję. Puste wartości nie stają się zerami; brak przyszłych danych w klatkach. PNG, podgląd i wideo używają tego samego renderera i czasu. Ostatnie 10% filmu domyka przejście do końcowych wyników. Przewijanie i ponowne odtworzenie dają ten sam stan dla tego samego czasu.


## Biblioteka historii

„Pomysły” prowadzą teraz do 26 opracowanych tematów z danymi (1066 serii, 41 649 obserwacji); 27. karta jest symulacją. Nowa **Biblioteka danych** pozwala wybierać do 6 serii z różnych tematów, ustawiać zakres, etykiety i kolory, porównywać zgodne jednostki albo indeks 100 oraz korzystać z pięciu form prezentacji i wspólnego eksportu wideo. Dane są chronologiczne, ze źródłem, jednostką i dokładnością okresu. Częściowe opracowania mają jawne ograniczenia.

Eksporty CSV/JSON wybranych obserwacji, osobne pliki każdego tematu i ZIP całej biblioteki są dostępne z panelu. Szkic zapisuje się lokalnie; wariant ustawień można pobrać i ponownie wczytać. Źródła, metodologia, ograniczenia i odtwarzanie: [research/stories/README.md](research/stories/README.md). Przewodnik po pomysłach: [public/stories/STORY-GUIDE.md](public/stories/STORY-GUIDE.md). `npm run data:stories` wymaga Pythona 3 z beautifulsoup4, lxml i openpyxl; nie używa sieci ani płatnego API.
