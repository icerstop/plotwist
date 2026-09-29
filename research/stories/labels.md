# Nazwy serii i wspólny wskaźnik

Nazwy do wyświetlania są oddzielone od źródłowych danych. `src/story-labels.js` opisuje podmiot, wskaźnik i jego tożsamość; nie zmienia liczb, dat, identyfikatorów, surowych CSV ani definicji źródłowych. Słownik krajów `src/story-countries.json` powstaje lokalnie przez `node scripts/build-story-country-labels.mjs` z CLDR / Intl.DisplayNames oraz identyfikatorów pobranego World Bank. Wyjątki i regiony zbiorcze są jawne. Nie ma wywołań modelu ani płatnego tłumaczenia.

- Lista serii i tabela używają języka menu. Etykiety zapisane na rolce używają niezależnie języka rolki.
- Nazwy własne modeli i produktów pozostają nazwami własnymi. Nazwy ręcznie wpisane przez użytkownika i etykiety importowanych CSV nie są automatycznie przepisywane.
- Tryb automatyczny przy co najmniej dwóch seriach sprawdza identyfikator wskaźnika i oryginalną jednostkę, nie podobieństwo tekstu. Jeśli są zgodne, a skrócone etykiety rozróżniają serie, nazwa wskaźnika pojawia się raz nad wykresem. W legendzie pozostaje podmiot wraz z potrzebnymi kwalifikatorami, np. rynek pierwotny/wtórny albo okres historyczny.
- Różne wskaźniki, wersje benchmarku, progi lub jednostki zachowują pełne opisy. Indeks 100 nie usuwa tej kontroli oryginalnych jednostek. Nieznane metadane nie uruchamiają grupowania.
- `Opisy w legendzie` pozwala przywrócić pełne nazwy. Wspólny podpis jest osobnym elementem edytora: ma czcionkę, kolor, rozmiar, położenie i obrót. Własny tekst zapisywany jest dla konkretnego klucza wskaźnika oraz języka; nie przechodzi na inny temat.
- Styl, przełącznik i własne podpisy zapisują się w dotychczasowym szkicu wyglądu w przeglądarce. Puste pole przywraca nazwę automatyczną. Reset wybranego podpisu przywraca też jego styl i pozycję.

Podgląd, PNG i wideo korzystają z tej samej funkcji lokalizacji i tego samego renderera canvas. Podpis nie należy do warstwy kontrolek edytora, więc znajduje się w eksporcie.
