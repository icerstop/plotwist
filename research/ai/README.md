# Dane do rolek o możliwościach AI

Pobrano 28.09.2026. To historyczne obserwacje zawarte w obecnym snapshotcie źródeł, nie zbiór dawnych zrzutów leaderboardów.

## Źródła

- [Epoch AI, Capabilities & benchmarking](https://epoch.ai/benchmarks/use-this-data) — oficjalny ZIP `benchmark_data.zip`. Archiwum pobrane w całości; w aplikacji wybrane 13 zestawów / wersji benchmarków oraz ECI. CSV pozostają tutaj do audytu. `benchmark_metadata.csv` dokumentuje skale; nie traktujemy `score_ceiling` jako maksymalnej liczby możliwych procentów. Dla wewnętrznych testów używamy `mean_score`, nie `Best score (across scorers)`.
- [TrackingAI, Maxim Lott](https://www.trackingai.org/home) — publiczny `app/database/proj_IQ/score_logs/iq/daily_logs.csv`. Osobno dwa quizy oraz tekst / Vision (według nazwy źródłowej). Nie używamy `Overall`. Formuła w aktualnym publicznym `assets/js/charts/charts_IQ.js` została odczytana, nie wykonana. Zachowujemy osobne przebiegi, surowy wynik, valid score, mianownik i odmowy. Nie odtwarzamy średniej z ostatnich 7 testów. Daty: MM/DD/YYYY, czas lokalny źródła o niepodanej strefie. Alias modelu w TrackingAI nie gwarantuje niezmiennej wersji API przez całą historię.
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
