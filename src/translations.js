import {extraPairs} from './translations-extra.js';
// Audited, local translations. No paid API and no automatic rewriting of user input.
const pairs = `
Język menu|Menu language
Język rolki|Reel language
Ustawienia języka|Language settings
Rolka|Reel
Polski|Polski
Studio|Studio
Giełda|Markets
Pomysły|Ideas
Źródła danych|Data sources
Twoje lokalne studio|Your local studio
Twórz bez płatnego API.|Create without a paid API.
Nowa rolka|New reel
Ceny i codzienne wpłaty|Prices and daily contributions
Benchmarki i historia modeli|Benchmarks and model history
Biblioteka|Library
Dane|Data
Źródła i metodologia|Sources and methodology
Zapisz projekt|Save project
Eksportuj wideo|Export video
Eksportuj rolkę|Export reel
Eksportuj porównanie|Export comparison
Opowiedz to danymi.|Tell the story with data.
Zamień liczby w historię, którą chce się obejrzeć.|Turn numbers into a story worth watching.
Ustawienia rolki|Reel settings
Wygląd|Appearance
Własne dane|Custom data
Sposób prezentacji danych|Data presentation settings
Sposób prezentacji|Presentation
Przejścia między danymi|Data transitions
Płynne · 0,65 s|Smooth · 0.65 s
Spokojne · 1,1 s|Gentle · 1.1 s
Dynamiczne · 0,3 s|Fast · 0.3 s
Bez przejść|No transitions
Tempo przejść jest wspólne dla modułów. Liczby pozostają pomiarami ze źródła; wygładzamy ruch i przenikanie. Gęste dane mają krótsze przejścia.|Transition speed is shared across modules. Numbers remain source measurements; motion and fades are smoothed. Dense data uses shorter transitions.
Linie|Lines
Linie z wypełnieniem|Filled lines
Kolumny|Columns
Wyścig słupków|Bar chart race
Karty liczbowe|Number cards
Historia wartości w czasie. Luki przerywają linię.|Values over time. Missing data breaks the line.
Linie z wypełnieniem do zera; serie nie są sumowane.|Lines filled to zero; series are not stacked or added together.
Porównanie wartości w kolejnych momentach.|Compare values at successive points in time.
Poziome słupki zmieniają kolejność wraz z wartościami.|Horizontal bars change position as values change.
Duże wartości i nazwy serii, bez osi wykresu.|Large values and series labels without chart axes.
Zestaw danych|Dataset
AI · benchmarki i modele|AI · benchmarks and models
Akcje · inwestycja vs nawyk|Stocks · investing vs a daily habit
Model hipotetyczny, nie notowania|Hypothetical model, not market prices
Inwestujesz / dzień|Invested per day
Kawa / dzień|Coffee per day
Stopa roczna (%)|Annual return (%)
Liczba lat|Number of years
Różne budżety? Wykres pokazuje także sumę wpłat. Wydatki na kawę nie są wartością aktywa.|Different budgets? The chart also shows total contributions. Coffee spending is not an asset value.
Serie danych|Data series
Dodaj serię|Add series
Zakres lat|Year range
Rok początkowy|Start year
Rok końcowy|End year
Cała dostępna historia|Full available history
Luki pozostają puste.|Missing values remain blank.
Tytuł|Title
Tytuł rolki|Reel title
Format wideo|Video format
Długość|Duration
Długość rolki|Reel duration
Motyw|Theme
Motyw rolki|Reel theme
Po zmroku|After dark
Jasna strona|Light side
Skala danych|Data scale
Oryginalne wartości|Original values
Indeks 100 od pierwszej obserwacji|Index 100 from the first observation
Indeks 100 porównuje tempo zmian, a nie wielkość. Każda seria zaczyna od swojej pierwszej niepustej obserwacji.|Index 100 compares growth rates, not size. Each series starts at its first non-missing observation.
Źródło danych pozostaje na każdej klatce. Luki w danych przerywają linię; animacja nie tworzy nowych obserwacji.|The data source stays on every frame. Missing data breaks the line; the animation creates no new observations.
Wklej dane z arkusza lub researchu w ChatGPT.|Paste data from a spreadsheet or your research in ChatGPT.
Dane CSV|CSV data
Kolumna rok + 1–3 serie. Separator: średnik lub przecinek. Pusta komórka = brak danych.|Year column + 1–3 series. Separator: semicolon or comma. Empty cell = missing data.
Źródło / link|Source / link
Np. raport roczny Apple, tabela…|E.g. Apple annual report, table…
Jednostka wszystkich serii|Unit for all series
Np. mln USD, %, mln osób|E.g. USD millions, %, million people
Użyj danych CSV|Use CSV data
Więcej danych World Bank|More World Bank data
Wpisz kod dowolnego wskaźnika. Pobierz całą dostępną historię dla 12 krajów i agregatów, do najnowszych opublikowanych wartości.|Enter an indicator code. Load all available history for 12 countries and aggregates, through the latest published values.
Kod wskaźnika|Indicator code
Np. SP.POP.TOTL|E.g. SP.POP.TOTL
Pobieranie…|Downloading…
Pobierz z World Bank|Load from World Bank
Wczytywanie danych…|Loading data…
Za mało obserwacji. Zmień serię lub poszerz zakres lat.|Not enough observations. Change the series or extend the year range.
O danych i metodologii|Data and methodology
Opis wskaźnika|Indicator description
Pobierz dane i metodologię|Download data and methodology
Własne dane CSV|Custom CSV data
Twoja historia.|Your story.
Dane wprowadzone przez użytkownika. Sprawdź jednostki, źródło i metodę pomiaru.|User-provided data. Check the units, source and measurement method.
Nie udało się wczytać zbioru. Spróbuj ponownie.|Could not load the dataset. Please try again.
Pobrano projekt jako JSON.|Project downloaded as JSON.
Projekt zapisany w tej przeglądarce.|Project saved in this browser.
Przeglądarka nie pozwoliła zapisać projektu.|The browser could not save the project.
Podaj źródło i jednostkę danych.|Enter the source and unit.
wartość wskaźnika|indicator value
Opis i jednostkę zweryfikuj na stronie wskaźnika World Bank.|Check the description and unit on the World Bank indicator page.
Pobrano wskaźnik World Bank.|World Bank indicator loaded.
Czcionka rolki|Reel font
Arial · prosta|Arial · clean
Georgia · redakcyjna|Georgia · editorial
Verdana · czytelna|Verdana · readable
Trebuchet MS · miękka|Trebuchet MS · soft
Impact · wyrazista|Impact · bold
Courier New · maszynowa|Courier New · typewriter
Twoja historia. 0123456789|Your story. 0123456789
Zamknij|Close
Podgląd rolki|Reel preview
PODGLĄD ROLKI|REEL PREVIEW
Przywracanie tła i dodatków…|Restoring background and overlays…
Wybierz dane, aby zobaczyć rolkę.|Choose data to preview the reel.
Zatrzymaj animację|Pause animation
Odtwórz animację|Play animation
Pozycja animacji|Animation position
Twoja historia. Gotowa na mały ekran.|Your story. Ready for the small screen.
Następna historia|Your next story
Dobry wykres zaczyna się od pytania.|A good chart starts with a question.
Małe wybory, wielkie różnice.|Small choices, big differences.
Kto podbił świat najszybciej?|Who reached the world fastest?
Dane, które pokazują większy obraz.|Data that shows the bigger picture.
Masz własny pomysł?|Have an idea of your own?
Opisz temat. Dobierzemy pasujące historie z biblioteki.|Describe your topic. We will match it to stories in the library.
Twój pomysł|Your idea
Np. jak AI zmienia gospodarkę…|E.g. how AI is changing the economy…
Znajdź inspiracje|Find inspiration
Bez API. Dopasowanie do katalogu tematów.|No API. Matches topics in the catalogue.
Znajdź swoją następną historię.|Find your next story.
Tematy, źródła i pytania, które warto pokazać na wykresie.|Topics, sources and questions worth charting.
Zaskocz mnie|Surprise me
Opisz pomysł lub szukaj: AI, Apple, energia…|Describe an idea or search: AI, Apple, energy…
Szukaj pomysłów|Search ideas
Wyczyść wyszukiwanie|Clear search
Wszystkie|All
Technologia|Technology
Gospodarka|Economy
Finanse|Finance
Społeczeństwo|Society
Gotowe dane|Data ready
Pomysł do opracowania|Research idea
Jeszcze nie mamy takiej historii.|We do not have that story yet.
Spróbuj „technologia”, „przychody” lub „inflacja”. W studiu możesz też wkleić własne dane CSV.|Try “technology”, “revenue” or “inflation”. You can also paste your own CSV data in the studio.
Pokaż wszystkie pomysły|Show all ideas
Duże historie. Dobre źródła.|Big stories. Good sources.
Otwarty świat danych — z jasnym rozróżnieniem, co jest już podłączone.|Explore open data, with clear labels showing what is already connected.
8 wskaźników × 12 krajów i agregatów|8 indicators × 12 countries and aggregates
Pełna dostępna historia World Bank. Zakres zależy od wskaźnika i kraju. Luki nie są uzupełniane sztucznymi wartościami.|Full available World Bank history. Coverage depends on indicator and country. Gaps are not filled with artificial values.
Publicznie dostępne dane nie zawsze oznaczają dowolną redystrybucję. Zachowaj oznaczenie źródła i sprawdź warunki konkretnego zbioru.|Public access does not always permit unrestricted redistribution. Keep source attribution and check the terms for each dataset.
Skąd wziąć dane|Where to find the data
Ten temat ma gotowe dane lub działający model w studiu.|This topic has data or a working model in the studio.
To propozycja redakcyjna. Dane nie są jeszcze podłączone. Możesz zebrać je w ChatGPT i wkleić jako CSV.|This is an editorial idea. Data is not connected yet. Research it in ChatGPT and paste it as CSV.
Prompt do researchu w ChatGPT|Research prompt for ChatGPT
Skopiowano|Copied
Kopiuj prompt|Copy prompt
Otwórz w studiu|Open in studio
Przejdź do importu|Go to import
Twoja historia jest gotowa.|Your story is ready.
format|format
rozdzielczość|resolution
długość|duration
Wideo bez dźwięku, ze źródłem danych. Eksport WebM (lub MP4, jeśli obsługuje go przeglądarka). Do platform wymagających MP4 może być potrzebna konwersja.|Silent video with data attribution. Exports as WebM (or MP4 if your browser supports it). Platforms requiring MP4 may need a conversion.
Podczas eksportu zostaw tę kartę na wierzchu — animacja nagrywa się w czasie rzeczywistym.|Keep this tab in the foreground during export: the animation records in real time.
Przygotowywanie dodatków do eksportu…|Preparing overlays for export…
Wideo gotowe. Pobieranie rozpoczęte.|Video ready. Download started.
Klatka PNG|PNG frame
Eksportowanie…|Exporting…
Pobierz ponownie|Download again
Pobierz wideo|Download video
ARCHIWUM MOŻLIWOŚCI AI|AI CAPABILITY ARCHIVE
Każdy model ma swój moment.|Every model has its moment.
Znajdź przełom. Wybierz formę. Opowiedz historię.|Find a breakthrough. Choose a format. Tell the story.
Ustawienia benchmarków AI|AI benchmark settings
Co oznacza data?|What does the date mean?
Premiera modelu · retrospektywa|Model release · retrospective
Data testu / publikacji wyniku|Test / result publication date
Od dnia|From date
Do dnia|To date
Początek historii AI|AI history start
Koniec historii AI|AI history end
Puste daty = cała dostępna historia.|Empty dates = full available history.
Protokół / źródło|Protocol / source
Wszystkie · porównanie orientacyjne|All · indicative comparison
Organizacja|Organisation
Wszystkie organizacje|All organisations
Filtr modeli AI|AI model filter
Filtruj, np. GPT, Claude, Gemini…|Filter, e.g. GPT, Claude, Gemini…
Długość rolki AI|AI reel duration
Motyw AI|AI theme
Brak pomiarów dla tego filtra. Zmień daty, nazwę lub protokół.|No measurements match this filter. Change the dates, name or protocol.
Wczytywanie wyników…|Loading results…
O wybranej historii|About this story
Model do porównania|Model to compare
Ranking bierze ostatni odnotowany wynik wariantu, nie jego najlepszy wynik. Model pozostaje w rankingu do kolejnego pomiaru.|The ranking uses each variant’s latest recorded score, not its best score. A model stays in the ranking until its next measurement.
Schody pokazują najwyższy dotąd wynik w tym filtrze. Pomiary różnych modeli nie tworzą ciągłej trajektorii jednego modelu.|Steps show the highest score so far in this filter. Measurements of different models are not a continuous trajectory of one model.
Porównanie ostatniego wyniku wybranego modelu z opisanym punktem odniesienia.|The selected model’s latest score compared with the documented reference point.
Punkty pojawiają się zgodnie z wybraną osią dat. Puste okresy nie są uzupełniane.|Points appear along the selected date axis. Empty periods are not filled in.
To retrospektywa wg premier. Wynik mógł zostać zmierzony później; nie pokazujemy stanu wiedzy z dnia premiery.|This is a retrospective by release date. Scores may have been measured later; this is not the state of knowledge at release.
To daty testów lub publikacji podane przez źródło. Brak daty pomiaru nie jest zastępowany datą premiery.|These are test or publication dates supplied by the source. Missing measurement dates are not replaced by release dates.
„IQ” w cudzysłowie.|“IQ” in quotation marks.
ECI to umowny indeks możliwości.|ECI is a constructed capability index.
Warunki testu mają znaczenie.|Test conditions matter.
Punkt odniesienia:|Reference point:
Źródło|Source
Tabela wyników benchmarków|Benchmark results table
Wyniki, które stoją za rolką.|The results behind your reel.
Każdy wynik ma odsyłacz do źródła.|Every result links to its source.
Dane i metodologia|Data and methodology
Model / konfiguracja|Model / configuration
Wynik|Score
Premiera|Release
Test / publikacja|Test / publication
Źródło i warunki|Source and conditions
Nie podano|Not provided
Otwórz źródło|Open source
Notatka źródła|Source note
Poprzednia|Previous
Następna|Next
Pochodzenie danych, aktualizacja i ograniczenia|Provenance, updates and limitations
Karty na osi czasu|Timeline cards
Wyścig rankingu|Ranking race
Mapa pomiarów|Measurement map
Schody rekordów|Record steps
AI vs punkt odniesienia|AI vs reference
brak punktu odniesienia|no reference available
Kolejne rekordy jako sceny z łagodnymi przejściami.|Successive records as scenes with gentle transitions.
Sześć najwyższych ostatnio odnotowanych wyników; płynne zmiany pozycji.|The six highest latest scores, with smooth position changes.
Punkty z datami i niepewnością. Bez łączenia różnych modeli linią.|Points with dates and uncertainty. Different models are not connected by a line.
Najwyższy dotąd wynik w wybranym zbiorze. Zmiana tylko w dniu pomiaru.|The highest score so far in the selected data. Changes only on measurement dates.
Wynik modelu i udokumentowany punkt odniesienia.|A model score and a documented reference point.
Jak szybko rozwija się AI?|How fast is AI advancing?
Jak modele rozwiązują test „IQ”?|How do models perform on an “IQ” quiz?
AI na zawodach programistycznych.|AI in programming competitions.
Wynik odnotowany w źródle|Score recorded by the source
bez interpolacji|no interpolation
bez interpolacji cen|no price interpolation
ostatni dostępny pomiar każdego wariantu|latest available measurement of each variant
najwyższy dotąd wynik w filtrze|highest score so far in the filter
Wg premier · retrospektywa, pomiary mogły być późniejsze|By release · retrospective; measurements may be later
Wg dat testu / publikacji · bez interpolacji|By test / publication date · no interpolation
Quiz TrackingAI ≠ psychometryczne IQ człowieka|TrackingAI quiz ≠ human psychometric IQ
ECI ≠ IQ · aktualne przeliczenie historii|ECI ≠ IQ · history recalculated with the current index
Percentyl wśród uczestników · 10 zgłoszeń|Percentile among contestants · 10 submissions
Wynik systemu z narzędziami; wersje środowiska rozdzielone|System score with tools; environment versions kept separate
Eksperci dziedzinowi; różne protokoły ewaluacji|Domain experts; different evaluation protocols
Od 13.11.2025 budżet tokenów 10× większy; porównanie orientacyjne|Token budget increased 10× on 13 Nov 2025; indicative comparison
Przekrojowe|Cross-domain
Rozumowanie|Reasoning
Programowanie|Programming
Matematyka|Mathematics
Wiedza|Knowledge
Quizy „IQ”|“IQ” quizzes
Metodologia źródła|Source methodology
Tryb giełdowy|Market mode
Wiele serii|Multiple series
Inwestycja vs nawyk|Investing vs a habit
Kurs akcji|Stock price
Mały nawyk. Prawdziwa historia.|A small habit. A real history.
Codzienne wpłaty spotykają historyczne ceny akcji.|Daily contributions meet historical stock prices.
Wczytywanie katalogu…|Loading catalogue…
Ustawienia inwestowania|Investment settings
Europa|Europe
Szukaj spółki|Search stocks
NVIDIA, Apple, ASML, Polska…|NVIDIA, Apple, ASML, Poland…
Spółka i rynek|Company and market
Data początkowa inwestycji|Investment start date
Data końcowa inwestycji|Investment end date
Dzienna inwestycja w zł|Daily investment in PLN
Wydajesz / dzień|Spent per day
Dzienny wydatek w zł|Daily spending in PLN
zł, każdy dzień kalendarzowy|PLN, every calendar day
zł, stała cena przez cały okres|PLN, fixed price for the full period
Wyrównaj kwoty|Match the amounts
Twój codzienny zakup|Your daily purchase
Np. Coca-Cola, kawa, przekąska|E.g. Coca-Cola, coffee, a snack
Rodzaj ceny|Price type
Close — po korekcie o splity|Close — split-adjusted
Cena nominalna — odtworzona|Nominal price — reconstructed
Korekta o splity zapewnia ciągłość wykresu. Cena nominalna może gwałtownie spaść w dniu splitu.|Split adjustment keeps the chart continuous. The nominal price can fall sharply on a split date.
Wczytywanie notowań…|Loading prices…
Na końcu historii|At the end of the story
Założenia są częścią historii|Assumptions are part of the story
Akcje ułamkowe. Zakup po zamknięciu sesji. Wpłaty z dni bez notowań czekają w gotówce. Kurs NBP z poprzedniej dostępnej tabeli.|Fractional shares. Purchases at the session close. Contributions on non-trading days wait in cash. NBP exchange rate from the previous available table.
Bez dywidend, prowizji, spreadu, podatku i inflacji. To model historyczny.|Excludes dividends, commissions, spreads, tax and inflation. This is a historical model.
Dzienne ceny zamknięcia|Daily closing prices
Ceny zamknięcia, dzień po dniu|Closing prices, day by day
Pobierz wszystkie ceny CSV|Download all prices as CSV
Data sesji|Trading date
Close po korekcie splitów|Split-adjusted close
Cena nominalna (odtworzona)|Nominal price (reconstructed)
Waluta|Currency
Brak sesji w wybranym zakresie.|No trading sessions in the selected range.
Źródła, korekty i sposób obliczania|Sources, adjustments and calculation method
Wybierz poprawny zakres, aby policzyć porównanie.|Choose a valid range to calculate the comparison.
Dwie ceny:|Two prices:
Waluty:|Currencies:
Zakres:|Coverage:
Dostęp i wykorzystanie:|Access and use:
NBP — tabela A|NBP — table A
Pobierz założenia JSON|Download assumptions as JSON
Jedna historia. Wiele serii.|One story. Multiple series.
Do 6 serii, różne formy prezentacji, własne kolory i logotypy.|Up to 6 series, multiple formats, custom colours and logos.
Ustawienia porównania wielu serii|Multi-series comparison settings
Co porównujesz?|What are you comparing?
Inwestycje w PLN|Investments in PLN
Ceny i zmiany cen|Prices and price changes
Wpłata na każdy portfel / dzień|Daily contribution to each portfolio
Wpłata na każdy portfel|Contribution to each portfolio
zł dziennie na każdą spółkę lub fundusz. To osobne scenariusze.|PLN per day for each stock or fund. These are separate scenarios.
Skala porównania|Comparison scale
Indeks 100 · wspólny start|Index 100 · shared starting point
Zmiana procentowa od startu|Percentage change from the start
Cena · zgodne waluty i jednostki|Price · matching currencies and units
Szukaj instrumentu|Search instruments
Spółka, symbol, złoto, ropa…|Company, symbol, gold, oil…
Serie porównania|Comparison series
cel|goal
wydatek|expense
spółka|stock
fundusz|fund
Spółki|Stocks
Fundusze surowcowe|Commodity funds
Surowce · kontrakty futures|Commodities · futures contracts
Cel w zł|Goal in PLN
Wydatek w zł / dzień|Daily expense in PLN
Logo niedostępne|Logo unavailable
Surowiec|Commodity
oznaczenie kolorem|identified by colour
Rodzaj nowej serii|New series type
Spółka / surowiec|Stock / commodity
Codzienny wydatek|Daily expense
Cel w złotych|Goal in PLN
Indeks i % pozwalają porównać różne jednostki.|Index and % let you compare different units.
Wydatki i cele porównujemy z wartością osobnych portfeli.|Expenses and goals are compared with separate portfolios.
Logotypy firm na rolce|Company logos on the reel
Początek porównania|Comparison start date
Koniec porównania|Comparison end date
Cały wspólny zakres|Full shared range
Tytuł porównania|Comparison title
Dane porównania CSV|Comparison data as CSV
Jak czytać porównanie|How to read the comparison
Wybierz serie i wspólny zakres dat.|Choose series and a shared date range.
Fundusze GLD i SLV odwzorowują metale z uwzględnieniem kosztów. USO korzysta z kontraktów na ropę; jego wynik może różnić się od ceny ropy spot.|GLD and SLV track metals with costs included. USO uses oil futures; its return may differ from spot oil prices.
Źródła danych i biblioteka logotypów|Data sources and logo library
Logotypy są przechowywane lokalnie według symbolu giełdowego. Domyślne kolory można zmienić; jasność wybranych kolorów dostosowano do czytelności na ciemnej rolce. Znaki należą do ich właścicieli.|Logos are stored locally by ticker. Default colours can be changed; some are adjusted for readability on dark reels. Trademarks belong to their owners.
Spis logotypów i źródeł|Logo and source catalogue
Domyślny|Default
Mój cel|My goal
Codzienny zakup|Daily purchase
Coca-Cola · wydatki|Coca-Cola · spending
Jak zmieniały się ceny?|How did prices change?
Ten sam start. Różne historie.|Same start. Different stories.
Ceny na wspólnym wykresie.|Prices on one chart.
Indeks 100|Index 100
Zmiana procentowa|Percentage change
Ceny zamknięcia|Closing prices
Yahoo Finance + NBP · bez dywidend, opłat i podatków|Yahoo Finance + NBP · excludes dividends, fees and taxes
Yahoo Finance · waluty instrumentów · bez dywidend|Yahoo Finance · instrument currencies · excludes dividends
Cena zamknięcia · korekta o splity|Closing price · split-adjusted
Cena nominalna · odtworzona z korekt splitowych|Nominal price · reconstructed from split adjustments
Yahoo Finance · historia dzienna · bez bieżącej sesji|Yahoo Finance · daily history · current session excluded
Tło i dodatki|Background and overlays
Obrazy · GIF-y|Images · GIFs
Wspólny wygląd rolek. Wgrane pliki pozostają w tej przeglądarce.|Shared reel styling. Uploaded files stay in this browser.
Rodzaj tła|Background type
Z motywu rolki|Use reel theme
Własny kolor|Custom colour
Gradient|Gradient
Obraz lub GIF|Image or GIF
Atrament|Ink
Zorza|Aurora
Bordo|Burgundy
Papier|Paper
Kolor początkowy|Start colour
Kolor końcowy|End colour
Kąt gradientu|Gradient angle
Delikatny ruch gradientu|Gentle gradient motion
Kolor tła|Background colour
Zmień obraz / GIF tła|Change background image / GIF
Wgraj obraz / GIF tła|Upload background image / GIF
Podgląd tła|Background preview
Animowane tło GIF|Animated GIF background
Własne tło|Custom background
Usuń obraz tła|Remove background image
Dopasowanie tła|Background fit
Wypełnij · przytnij krawędzie|Fill · crop edges
Pokaż cały obraz|Show entire image
Widoczność tła|Background opacity
Tempo GIF-a w tle|Background GIF speed
Plik tła|Background file
Wzór w tle|Background pattern
Bez wzoru|No pattern
Delikatna siatka|Subtle grid
Drobne punkty|Small dots
Osłona pod tekst i wykres|Text and chart readability veil
Osłona przyciemnia tło w ciemnym motywie, a rozjaśnia w jasnym. Kolor tekstu zmienisz motywem rolki.|The veil darkens the background in the dark theme and lightens it in the light theme. Change the reel theme to change text colour.
Obrazki i GIF-y|Images and GIFs
Animowany GIF|Animated GIF
Obraz|Image
widoczny|visible
ukryty|hidden
Pokaż dodatek|Show overlay
Lewy górny|Top left
Środek u góry|Top centre
Prawy górny|Top right
Ruch dodatku|Overlay motion
Bez dodatkowego ruchu|No additional motion
Lekkie unoszenie|Gentle float
Pulsowanie|Pulse
Łagodne pojawienie|Fade in
Warstwa|Layer
Nad wykresem|Above chart
Pod tekstem i wykresem|Below text and chart
Cień pod dodatkiem|Overlay shadow
Niżej|Move back
Wyżej|Move forward
Dodaj obrazek lub GIF|Add image or GIF
Plik dodatku|Overlay file
PNG, JPG, WebP lub GIF do 12 MB. Do 3 dodatków. GIF-y odtwarzają się w pętli razem z rolką; PNG zachowuje jedną klatkę. Podpis i źródła mają chroniony obszar.|PNG, JPG, WebP or GIF up to 12 MB. Up to 3 overlays. GIFs loop with the reel; PNG captures one frame. The signature and sources have a protected area.
Przywróć proste tło i usuń dodatki|Reset background and remove overlays
Przygotowywanie klatek obrazu…|Preparing image frames…
Wczytywanie dodatków…|Loading overlays…
Nie udało się przywrócić jednego z plików. Wgraj go ponownie.|One file could not be restored. Upload it again.
Zapis lokalny niedostępny. Dodatki działają w tej sesji.|Local storage unavailable. Overlays work in this session.
Zapisywanie w przeglądarce…|Saving in browser…
Zapisano w tej przeglądarce|Saved in this browser
Brak miejsca na zapis. Dodatki działają w tej sesji.|Not enough storage. Overlays work in this session.
Możesz dodać maksymalnie 3 obrazki lub GIF-y.|You can add up to 3 images or GIFs.
Polska|Poland
Świat|World
Chiny|China
Niemcy|Germany
Indie|India
Korea Płd.|South Korea
Japonia|Japan
Wielka Brytania|United Kingdom
Francja|France
Brazylia|Brazil
Holandia|Netherlands
Szwajcaria|Switzerland
Dania|Denmark
Włochy|Italy
Hiszpania|Spain
Szwecja|Sweden
Norwegia|Norway
Świat coraz bardziej online|The world goes online
Internet zmienił wszystko.|The internet changed everything.
% populacji|% of population
Osoby korzystające z internetu|People using the internet
Jak bogaci się świat?|How is the world getting richer?
Dwie gospodarki. Dwa tempa.|Two economies. Two speeds.
USD z 2015 r.|2015 USD
PKB na mieszkańca, ceny stałe|GDP per capita, constant prices
Żyjemy coraz dłużej?|Are we living longer?
Ile lat daje nam postęp?|How many years does progress add?
lata|years
Oczekiwana długość życia przy urodzeniu|Life expectancy at birth
Telefon w każdej kieszeni|A phone in every pocket
Więcej kart SIM niż ludzi.|More SIM cards than people.
na 100 osób|per 100 people
Abonamenty telefonii komórkowej|Mobile cellular subscriptions
Kto inwestuje w przyszłość?|Who invests in the future?
Kto stawia na badania?|Who invests in research?
% PKB|% of GDP
Wydatki na badania i rozwój|Research and development spending
Światło zmienia życie|Electricity changes lives
Prąd nie był oczywistością.|Electricity was not a given.
Dostęp do energii elektrycznej|Access to electricity
Przeprowadzka do miast|Moving to cities
Świat przenosi się do miast.|The world is moving to cities.
Ludność miejska|Urban population
Gospodarka bez granic|An economy without borders
Jak bardzo żyjemy z eksportu?|How much do we depend on exports?
Eksport towarów i usług|Exports of goods and services
Kawa czy inwestycja?|Coffee or investing?
Mały nawyk. Duża różnica.|A small habit. A big difference.
Wpłaty i hipotetyczna wartość portfela|Contributions and hypothetical portfolio value
Portfel (symulacja)|Portfolio (simulation)
Wydatki na kawę|Coffee spending
Wpłaty|Contributions
Suma wpłat|Total contributions
zł|PLN
indeks|index
pkt|pts
percentyl|percentile
brak danych|no data
Źródło:|Source:
Model matematyczny|Mathematical model
Symulacja · stała stopa zwrotu · bez opłat, podatków i inflacji|Simulation · constant return · excludes fees, taxes and inflation
dane własne — niezweryfikowane|custom data — unverified
Podłączone|Connected
Źródło do importu|Source for import
Złoto · fundusz GLD|Gold · GLD fund
Srebro · fundusz SLV|Silver · SLV fund
Ropa WTI · fundusz USO|WTI oil · USO fund
Złoto · futures|Gold · futures
Srebro · futures|Silver · futures
Ropa WTI · futures|WTI oil · futures
Udział osób korzystających z internetu. Źródło pierwotne: ITU, przez World Bank.|Share of people using the internet. Primary source: ITU, via the World Bank.
Ceny stałe usuwają wpływ inflacji USD. To nie jest PKB według parytetu siły nabywczej ani miara zarobków.|Constant prices remove USD inflation. This is not purchasing-power-parity GDP or a measure of earnings.
Oczekiwana długość życia, nie średni wiek zmarłych. Różnice nie dowodzą wpływu jednej przyczyny.|Life expectancy, not average age at death. Differences do not establish a single cause.
Aktywne abonamenty i karty prepaid, nie unikalni użytkownicy. Wartość może przekroczyć 100.|Active subscriptions and prepaid SIMs, not unique users. Values can exceed 100.
Nakłady B+R w relacji do PKB. Dane nie obejmują wszystkich lat; luki pozostają widoczne.|R&D spending relative to GDP. Not all years are available; gaps remain visible.
Dostęp do prądu nie oznacza niezawodnej dostawy ani jej przystępnej ceny.|Access to electricity does not imply reliable or affordable supply.
Definicje obszarów miejskich różnią się między krajami.|Definitions of urban areas differ across countries.
Eksport brutto względem PKB; może przekraczać 100%. Nie jest to udział krajowej wartości dodanej.|Gross exports relative to GDP; can exceed 100%. This is not the share of domestic value added.
Symulacja przy stałej rocznej stopie zwrotu. Wpłaty na koniec każdego dnia, 365 dni w roku. Bez podatków, opłat i inflacji. To nie są historyczne wyniki inwestycji.|Simulation at a constant annual return. Contributions at the end of each day, 365 days per year. Excludes taxes, fees and inflation. These are not historical investment returns.
Tytuły automatyczne i etykiety zmieniają język. Własne teksty edytujesz ręcznie.|Automatic titles and labels follow the reel language. Edit your own text manually.
Przywróć tytuł automatyczny|Restore automatic title
`;
export const english=Object.fromEntries(pairs.trim().split('\n').map(line=>{const at=line.indexOf('|');return [line.slice(0,at),line.slice(at+1)];}));
const intervalEn={'dziennie':'a day','co tydzień':'a week','co miesiąc':'a month','co kwartał':'a quarter'};
const unitEn={'dzień':'day','tydz.':'week','mies.':'month','kw.':'quarter'};
const amountEn=n=>Number(n.replace(/\s/g,'').replace(',','.')).toLocaleString('en-GB',{maximumFractionDigits:2});
const templates=[
 [/^Częstotliwość zakupów serii (\d+)$/,n=>`Series ${n} purchase frequency`],
 [/^(.+) zł (dziennie|co tydzień|co miesiąc|co kwartał) w (.+)\.$/,(n,f,name)=>`PLN ${amountEn(n)} ${intervalEn[f]} in ${name}.`],
 [/^(.+) zł (dziennie|co tydzień|co miesiąc|co kwartał)\. Kilka możliwości\.$/,(n,f)=>`PLN ${amountEn(n)} ${intervalEn[f]}. Several possibilities.`],
 [/^Osobne portfele · (.+) zł (dziennie|co tydzień|co miesiąc|co kwartał) na każdy$/,(n,f)=>`Separate portfolios · PLN ${amountEn(n)} ${intervalEn[f]} each`],
 [/^(.+): (.+) zł\/(dzień|tydz\.|mies\.|kw\.) vs (.+): (.+) zł\/(dzień|tydz\.|mies\.|kw\.)$/,(a,b,c,d,e,f)=>`${a}: PLN ${amountEn(b)}/${unitEn[c]} vs ${d}: PLN ${amountEn(e)}/${unitEn[f]}`],

 [/^(Polska|Świat|Chiny|Niemcy|Indie|Korea Płd\.|Japonia|Wielka Brytania|Francja|Brazylia|Estonia): (.+)$/,(name,value)=>`${translate(name,'en')}: ${value}`],
 [/^Prompt przed (.+)$/,s=>`Prompt before ${s}`],
 [/^(\d+) rekordów bez wybranego rodzaju daty pominięto\.$/,n=>`${n} records without the selected date type were omitted.`],
 [/^Wiersz (\d+): (.+)$/,(n,s)=>`Row ${n}: ${translate(s,'en')}`],
 [/^Nie udało się pobrać wskaźnika: (.+)$/,s=>`Unable to fetch indicator: ${s}`],

 [/^Seria (\d+)$/,n=>`Series ${n}`],
 [/^Usuń serię (\d+)$/,n=>`Remove series ${n}`],
 [/^Instrument serii (\d+)$/,n=>`Series ${n} instrument`],
 [/^Nazwa serii (\d+)$/,n=>`Series ${n} name`],
 [/^Kwota serii (\d+)$/,n=>`Series ${n} amount`],
 [/^Kolor serii (\d+)$/,n=>`Series ${n} colour`],
 [/^Kolor HEX serii (\d+)$/,n=>`Series ${n} HEX colour`],
 [/^Przywróć kolor serii (\d+)$/,n=>`Reset series ${n} colour`],
 [/^(.+) zł dziennie w (.+)\.$/,(n,name)=>`PLN ${n.replace(',','.')} a day in ${name}.`],
 [/^(.+) zł dziennie\. Kilka możliwości\.$/,n=>`PLN ${n.replace(',','.')} a day. Several possibilities.`],
 [/^Osobne portfele · (.+) zł dziennie na każdy$/,n=>`Separate portfolios · PLN ${n} per day each`],
 [/^(.+)\. Dzień po dniu\.$/,name=>`${name}. Day by day.`],
 [/^(.+)\. Kolejne modele\.$/,name=>`${translate(name,'en')}. Successive models.`],
 [/^(.+) · (portfel|wydatki|cena odtworzona|Close \(splity\))$/,(name,type)=>`${name} · ${{portfel:'portfolio',wydatki:'spending','cena odtworzona':'reconstructed price','Close (splity)':'Close (split-adjusted)'}[type]}`],
 [/^(.+): (.+) zł\/dzień vs (.+): (.+) zł\/dzień$/,(a,b,c,d)=>`${a}: PLN ${b}/day vs ${c}: PLN ${d}/day`],
 [/^Obserwacja (\d+) \/ (\d+)$/,(a,b)=>`Observation ${a} / ${b}`],
 [/^Surowy wynik: (.+)$/,s=>`Raw score: ${s}`],
 [/^Błąd standardowy: (.+)$/,s=>`Standard error: ${s}`],
 [/^Ostatnio: (.+)$/,s=>`Latest: ${s}`],
 [/^Punkt odniesienia: (.+)$/,s=>`Reference: ${s}`],
 [/^(.+) · rekord z (.+)$/,(a,b)=>`${a} · record on ${b}`],
 [/^(.+) · różnica (.+)$/,(a,b)=>`${a} · difference ${b.replace('punktów percentylowych','percentile points')}`],
 [/^(.+) · dane (.+)$/,(a,b)=>`${a} · data ${b}`],
 [/^(\d+) pomiarów · (.+)$/,(a,b)=>`${a} measurements · ${translate(b,'en')}`],
 [/^wąsy: (.+)$/,s=>`whiskers: ${s}`],
 [/^(\d+) kart wybranych z kolejnych rekordów w filtrze \(maks\. 8\)\. Każda karta ma rzeczywistą datę i wartość\.$/,n=>`${n} cards selected from successive records in the filter (max. 8). Each has a real date and value.`],
 [/^Podgląd: (.+)$/,s=>`Preview: ${s}`],
 [/^Otwórz (.+)$/,s=>`Open ${s}`],
 [/^Tło (.+)$/,s=>`${translate(s,'en')} background`],
 [/^(.+) HEX$/,s=>`${translate(s,'en')} HEX`],
 [/^(Usuń dodatek|Pozycja dodatku|Ruch dodatku|Warstwa dodatku) (\d+)$/,(s,n)=>`${{'Usuń dodatek':'Remove overlay','Pozycja dodatku':'Overlay position','Ruch dodatku':'Overlay motion','Warstwa dodatku':'Overlay layer'}[s]} ${n}`],
 [/^(Poziomo|Pionowo|Rozmiar|Obrót|Widoczność|Tempo GIF-a) · dodatek (\d+)$/,(s,n)=>`${{Poziomo:'Horizontal',Pionowo:'Vertical',Rozmiar:'Size','Obrót':'Rotation','Widoczność':'Opacity','Tempo GIF-a':'GIF speed'}[s]} · overlay ${n}`],
 [/^Wczytano (\d+) serie danych\.$/,n=>`Loaded ${n} data series.`],
 [/^Nagrywanie… (.+)$/,n=>`Recording… ${n}`],
 [/^Wspólna historia: (.+)$/,s=>`Shared history: ${s}`],
 [/^Filtr: (.+)$/,s=>`Filter: ${s}`],
 [/^Prompt od (.+)$/,s=>`Prompt since ${s}`],
];
// Fragments join variable numbers and names in React. These are complete phrase
// translations, not a word-by-word translator; unknown authored text stays intact.
const fragments={
 'zestawów i wersji testów':'datasets and test versions','pomiarów':'measurements','Dane pobrane:':'Data retrieved:',
 'pomiarów w filtrze':'measurements in this filter','obserwacji':'observations','brakujących wartości':'missing values',
 'Pobrano:':'Retrieved:','aktualizacja źródła:':'source updated:','Zobacz wszystkie':'View all','pomysłów':'ideas',
 'historii · propozycje z katalogu, bez generowania AI':'stories · catalogue suggestions, no AI generation',
 'Strona':'Page','z':'of','· najnowsze daty najpierw':'· newest dates first','Surowe:':'Raw:',
 'Notowania:':'Price history:','spółek':'stocks','cen zamknięcia · USA i Europa':'closing prices · USA and Europe',
 'pasujących spółek · wybrana:':'matching stocks · selected:','(wybrana)':'(selected)','(wybrany)':'(selected)',
 'serii.':'series.','Wpłaty:':'Contributions:','· wynik:':'· profit:', '· sesja':'· session',
 'Pobrano ceny:':'Prices retrieved:','· Pobrano NBP:':'· NBP retrieved:',
 'Najnowsze sesje najpierw · strona':'Newest sessions first · page','· historia':'· history',
 '· dokumentacja':'· documentation','— dokumentacja':'— documentation',
};
Object.assign(english,fragments,Object.fromEntries(extraPairs.trim().split('\n').map(line=>line.split('|'))));
export function translate(value,language='pl'){
 if(language!=='en'||typeof value!=='string'||!value)return value;
 const text=value.trim(),leading=value.match(/^\s*/)[0],trailing=value.match(/\s*$/)[0];
 let result=Object.hasOwn(english,text)?english[text]:undefined;
 if(result===undefined){for(const [pattern,render] of templates){const match=text.match(pattern);if(match){result=render(...match.slice(1));break;}}}
 if(result===undefined&&text.includes(' · ')){const parts=text.split(' · ');const translated=parts.map(part=>translate(part,'en'));if(translated.some((p,i)=>p!==parts[i]))result=translated.join(' · ');}
 if(result===undefined&&text.startsWith('Źródło: '))result=`Source: ${translate(text.slice(8),'en')}`;
 if(result===undefined&&text.startsWith('wspólna baza '))result=`shared base ${text.slice(13)}`;
 return result===undefined?value:leading+result+trailing;
}
