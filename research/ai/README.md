# Dane do rolek o możliwościach AI

Zaktualizowano 30.09.2026. To historyczne obserwacje zawarte w obecnym snapshotcie źródeł, nie zbiór dawnych zrzutów leaderboardów.

## Audyt TrackingAI — 30.09.2026

Kontrola o 14:57 UTC potwierdziła identyczność publicznego CSV z kopią pobraną rano: SHA-256 `273594b522f71174ae88c7934a76d3974bc14432f573243a9723f2cbe262169a`. Najnowszy test w pliku: `2026-09-29T23:39:25` (strefa czasu źródła niepodana). Źródło było aktualne. Naprawiono jednak parser dat: 33 starsze próby z jednocyfrowym miesiącem lub godziną były pomijane. Teraz wszystkie 3824 indywidualne próby obu quizów są uwzględnione; `Overall` nadal jest wyłączone.

Ranking na stronie TrackingAI oblicza IQ każdej próby, zaokrągla je, bierze ostatnie maks. 7 prób danego aliasu i quizu, a następnie zaokrągla średnią. To liczba prób, nie liczba dni; Fable ma tylko 2 próby Mensa. Konfiguracja źródła dopuszcza indywidualne okna (`aiMaxLengths`), ale w tym snapshotcie lista wyjątków jest pusta. Ranking wyłącza aliasy historyczne, usunięte i planowane zgodnie z `config.js`. Tekst i Vision mają odrębne wyniki.

Nowe zbiory `tracking-mensa-ranking` (25 pozycji) i `tracking-offline-ranking` (29) odwzorowują tę metodę i zachowują składowe średnich, daty, ostatni wynik oraz rekord całej historii aliasu. Wszystkie 25 wartości Mensa zgadza się z dostarczonym zrzutem. GPT 6.1 Sol Ultra: średnia 145, ostatnia próba 139, rekord aliasu 151. Claude-5.1 Fable: średnia 147, ostatnia próba i rekord 151.

Nazwy rankingu są aktualnymi nazwami z `renameAI`, np. `GPT-Sol-Ultra` → `GPT 6.1 Sol Ultra`. Takie aliasy mogą obejmować wcześniejsze wersje modeli. **Nie przypisujemy im dat premier ani nie zmieniamy wstecz nazw w historii pojedynczych prób.** Snapshot nie dowodzi, że każda próba była wykonana na obecnej wersji. Wiersze rankingu mają datę pobrania; faktyczne daty prób są w `runs` i `lastRunAt`.

Odtwarzanie: `node scripts/refresh-tracking-iq.mjs`, `npm run data:ai`, `node scripts/audit-ai-brands.mjs`. Reguły i odciski źródeł: `tracking-receipt.json`; niezależne obliczenie w `tracking-audit.ipynb`. Automatyczne testy porównują pełny import i wszystkie pozycje ze zrzutu. Przy aktualizacji snapshotu trzeba ponownie zweryfikować zgodność formuł i konfiguracji źródła.

## ARC-AGI-3 — 30.09.2026

Dodano 69 konfiguracji z oficjalnego [pliku ARC Prize](https://arcprize.org/media/data/leaderboard/v3.json), wygenerowanego 29.09.2026. Zbiór Semi-Private rozdzielono na **Standard (48)** i **Provider Adapter (21)**. Różnice środowisk opisuje [ARC Prize](https://arcprize.org/blog/astra). Nie dołączamy Developer Preview, Public Demo ani wyników konkursu Kaggle. Sonnet 5.5, Opus 5.5 i GPT-6.1 Sol nie mają w tym pliku wyników ARC-AGI-3; braków nie uzupełniamy zerami ani innymi testami.

Skala to 100 × źródłowy RHAE (0–1), a nie procent ukończonych zadań. [Raport techniczny, sekcja 4](https://arcprize.org/media/ARC_AGI_3_Technical_Report.pdf) definiuje odniesienie do liczby działań człowieka na każdym poziomie, z agregacją na środowiska. Punkt odniesienia 100% nie jest średnim wynikiem populacji ani pomiarem IQ. UI i film pokazują do dwóch miejsc po przecinku; eksport zachowuje pełną precyzję. Pole `cost` zapisujemy jako `evaluationCostUsd` (koszt ewaluacji), nie cenę za pojedyncze zadanie.

Domyślny widok to ranking **na dzień pobrania**. Źródło nie podaje dat testów, a `generatedAt` jest datą wygenerowania pliku, nie publikacji każdego wyniku. Oś premier pozostaje opcjonalną retrospektywą; nie odtwarza historycznych stanów wiedzy. Skorygowano daty Opus 4.6 i Gemini 3.1 Pro według ogłoszeń producentów. Niejednoznaczna data Grok 4.20 beta pozostaje pusta (rekord jest dostępny w rankingu snapshotu). Oryginalne daty i źródła korekt zachowano w eksporcie oraz `arc-agi-3-receipt.json`.

Plik źródłowy pozostaje bez zmian w `arc-agi-3-2026-09-30.json`. `scripts/arc3-datasets.mjs` sprawdza zakres wyników, identyfikatory i daty; `npm run data:ai` zapisuje dane aplikacji i SHA-256 wejść. Aktualizacja: `node scripts/fetch-arc3-data.mjs`, następnie `npm run data:ai` i `node scripts/audit-ai-brands.mjs`. Przed publikacją sprawdź zmiany źródła oraz korekty dat. Pobieranie nie uruchamia benchmarków ani płatnego API.

## Źródła

- [Epoch AI, Capabilities & benchmarking](https://epoch.ai/benchmarks/use-this-data) — oficjalny ZIP `benchmark_data.zip`. Archiwum pobrane w całości; w aplikacji wybrane 13 zestawów / wersji benchmarków oraz ECI. CSV pozostają tutaj do audytu. `benchmark_metadata.csv` dokumentuje skale; nie traktujemy `score_ceiling` jako maksymalnej liczby możliwych procentów. Dla wewnętrznych testów używamy `mean_score`, nie `Best score (across scorers)`.
- [TrackingAI, Maxim Lott](https://www.trackingai.org/home) — publiczny `app/database/proj_IQ/score_logs/iq/daily_logs.csv`. Osobno dwa quizy oraz tekst / Vision (według nazwy źródłowej). Nie używamy `Overall`. Formuła w aktualnym publicznym `assets/js/charts/charts_IQ.js` została odczytana, nie wykonana. Zachowujemy osobne przebiegi, surowy wynik, valid score, mianownik i odmowy. Archiwa `iq-*` zachowują pojedyncze próby; zbiory `tracking-*-ranking` odtwarzają średnie z ostatnich maks. 7 prób. Daty: MM/DD/YYYY, czas lokalny źródła o niepodanej strefie. Alias modelu w TrackingAI nie gwarantuje niezmiennej wersji API przez całą historię.
- [OpenAI, Learning to reason with LLMs, 12.09.2024](https://openai.com/index/learning-to-reason-with-llms/) — ręcznie przepisano tabelę Appendix A i akapit Coding: GPT-4o 11/808, o1-preview 62/1258, o1 89/1673, specjalistyczny wariant IOI 93/1807 (percentyl/rating). To cztery wyniki opublikowane tego samego dnia. Data nie jest datą premiery. Baseline 50 oznacza medianę uczestników konkursów z definicji percentyla.
- [GPQA Diamond, Epoch](https://epoch.ai/benchmarks/gpqa-diamond) — punkt odniesienia 69,7% dla ekspertów dziedzinowych z doktoratem z ewaluacji OpenAI. Nie jest średnią dla całej populacji ludzi. Protokoły ludzkiego odniesienia i pomiarów Epoch różnią się. Changelog wskazuje zmianę promptu 20.02.2026; domyślnie filtrujemy pomiary od tej zmiany.
- [SWE-bench Verified, Epoch](https://epoch.ai/benchmarks/swe-bench-verified) — istotna zmiana środowiska 12.02.2026. Oddzielne zbiory v1 i v2 wg daty `Started at`. Epoch aktualnie ocenia 484 zadania, nie pełne 500. Rozdzielenie datą nie zastępuje pełnej identyfikacji harnessu z logów; konfiguracje są w źródle.
- [ECI methodology](https://epoch.ai/data/eci-documentation/methodology) — ECI nie jest IQ, skala umowna. Przedziały bootstrap 90%. Historia zostaje przeliczona w ramach bieżącego wydania.

## Transformacje

`npm run data:ai` buduje `public/ai` z lokalnych CSV i daty w `source-receipt.json`. `scripts/refresh-ai-sources.ps1` pobiera aktualne CSV; nie uruchamia benchmarków i nie używa płatnego API. Po aktualizacji konieczny jest przegląd changelogów oraz test i build. Źródła ręczne i wzory TrackingAI wymagają osobnej weryfikacji przy zmianie metodologii.

W osi premier dla każdego wariantu z datowanymi pomiarami wybieramy ostatni pomiar w snapshotcie, nie maksymalny. Dlatego oś zawsze nosi etykietę retrospektywy. Przy osi pomiarów brakujące daty nie są zastępowane premierą. Niedatowane raporty zewnętrzne pozostają odrębnymi obserwacjami: nie znamy ich chronologii. MMLU ograniczono do jawnych 5-shot, z filtrem źródła. ARC-AGI-1/2 i cztery wersje FrontierMath nie są mieszane.

Ranking pokazuje ostatnią znaną obserwację każdego wariantu do danego dnia w wybranej osi; datę rekordu widać obok. Oś kart wybiera do 8 istniejących rekordowych obserwacji w filtrze, z równym rozłożeniem indeksów rekordów przy większej liczbie. To montaż wybranych scen, nie liniowa animacja upływu czasu. Mapa postępu wyświetla wszystkie punkty w filtrze, bez interpolacji. SE nie jest CI: na mapie pokazujemy ±1 SE, a dla ECI — podany 90% CI.

Zakres pokrycia zależy od źródła. Np. MMLU z tego archiwum kończy się w 2024 r.; nowsze modele są w trudniejszych benchmarkach. Pola puste pozostają brakami. Snapshot nie dowodzi braku postępu po ostatniej dacie obserwacji.

## Licencje

Wewnętrzne pomiary Epoch oraz ECI: CC BY 4.0, przypisanie autorstwa Epoch AI. Dane zewnętrzne zachowują licencje źródłowe. TrackingAI nie deklaruje otwartej licencji w pobranym CSV. Raporty producentów są cytowanymi źródłami faktów; nie redystrybuujemy pytań, odpowiedzi ani logów benchmarków. Strona pozostaje prywatna.


## Aktualizacja Sonnet 5.5 — 29.09.2026

Odświeżono pełne archiwum Epoch i dziennik TrackingAI; formuły punktowe TrackingAI pozostają takie same. W tej wersji: 29 zestawów, 5939 obserwacji (wcześniej 19 / 5886). W pobranym ECI i czterech quizach IQ nadal brak wyników Sonnet 5.5. Nie dopisujemy im punktów z innych testów.

Dodano osiem osobnych zestawów z [raportu premierowego Anthropic](https://www.anthropic.com/claude-sonnet-5-5): Terminal-Bench 4.0, FrontierCode 1.1 Main, CursorBench 4.0, GDPval-AA v2.1, AA-Briefcase v1.1, HLE z narzędziami, OSWorld 2.1 partial oraz Chartography bez narzędzi. Dane i konfiguracje sprawdzono w [System Card](https://www.anthropic.com/claude-sonnet-5-5-system-card), strony 109, 111, 113, 115, 118, 125, 129, 133–134. Zapisano publikację 28.09.2026 oddzielnie od premier modeli; nie znamy dni wykonania pomiarów. Retrospektywa premier nie jest historią stanu wiedzy.

`sonnet-5-5-report.json` zachowuje oryginalne komórki tabeli i SHA-256 pobranych źródeł. `scripts/extract-sonnet55-report.py` odtwarza ekstrakcję z lokalnego HTML i jawnie opisanych uzupełnień z System Card. HTML jest pomijany przez Git; źródła można pobrać z trzech adresów w tym dokumencie. PDF jest zachowany lokalnie i w repozytorium. Ta ekstrakcja jest przypisana do snapshotu 29.09.2026, a skrypt odświeżający Epoch nie zmienia jej daty.

Osobno dodano dwa zestawy z [niezależnego raportu Artificial Analysis](https://artificialanalysis.ai/articles/claude-sonnet-5-5): Intelligence Index i Terminal-Bench 4.0. To mały zestaw porównań z tego raportu, nie pełne historyczne leaderboardy. 64% w AA i 70,6% w raporcie Anthropic pochodzą z różnych konfiguracji. Elo i punkty indeksu nie są procentami ani IQ. Sonnet 5.5 był testowany przez AA przed premierą z błędem structured outputs; raport zapowiada ponowne pomiary. Domyślny fallback może angażować starszy model.

FrontierCode: Sonnet 5.5 max = 46,2%, xhigh = 52,1%. To dwa oddzielne warianty. OSWorld pokazuje partial score, nie ścisły pass rate. HLE i Chartography z narzędziami oraz bez narzędzi nie są łączone.
