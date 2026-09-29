# Plotwist — biblioteka historii

Snapshot źródeł, nie bieżący feed. manifest.json opisuje serie, źródła i ograniczenia każdego tematu.
CSV ma format długi: jeden wiersz = seria × okres; pusta wartość oznacza brak danych, nigdy zero.
Daty są rosnące. date_precision i period zachowują dokładność źródła. Roczne daty 31 grudnia i kotwice fiskalne służą porządkowaniu, nie oznaczają pomiaru dziennego.
Nie sumuj stanów, procentów i przepływów. Nie mieszaj USD o różnych latach cenowych, MAU/WAU ani BEV/BEV+PHEV.
kind=derived oznacza obliczenie; lower-bound oznacza dolną granicę, nie dokładny wynik.
Punkty przejściowe animacji nie są nowymi obserwacjami.
Licencje oryginalnych dostawców zachowują moc; metadane OWID i bezpośrednie URL źródeł są w pakiecie.
Odtwarzanie: scripts/build-story-data.py; pobieranie: scripts/fetch-story-sources.mjs, fetch-story-files.mjs, fetch-story-filings.mjs.
