# Pobór a dzietność — UE-27, 2024

Zestaw opisowy do grafik. Jednostką obserwacji jest kraj w roku 2024, nie osoba, żołnierz ani kohorta. Wszystkie 27 państw UE mają obserwację dzietności z tego samego roku. Nie uzupełniano braków ani nie mieszano lat.

## Dwie zmienne

**Dzietność:** World Bank WDI, `SP.DYN.TFRT.IN`, dzieci na kobietę. Okresowy współczynnik dzietności opisuje hipotetyczną liczbę dzieci przy utrzymaniu cząstkowych współczynników danego roku. Nie jest liczbą urodzeń, faktyczną liczbą dzieci dzisiejszej przeciętnej kobiety ani prognozą. Źródła WDI obejmują ONZ, Eurostat i urzędy krajowe. Wartości mogą podlegać rewizjom. Snapshot: aktualizacja WDI 13.07.2026, pobranie zapisane w JSON.

**Pobór:** czynna obowiązkowa służba wojskowa w czasie pokoju, także systemy selektywne. Nie sam istniejący w ustawie obowiązek, rejestracja wojskowa, szkolenie dobrowolne ani mobilizacja wojenna. Grupa „bez czynnego poboru” zawiera też kraje, które zawiesiły pobór. Klasyfikacja dotyczy roku porównania, nie aktualnego prawa w 2026 r.

Klasyfikację odczytano z tabeli 1 oficjalnego opracowania EPRS z 19.03.2025, opisującego systemy państw UE i wykorzystującego dane za 2024. Czynny pobór: Austria, Cypr, Dania, Estonia, Finlandia, Grecja, Łotwa, Litwa, Szwecja. Pozostałe 18 państw UE: bez czynnego poboru. Polski nie przypisano do czynnego poboru na podstawie samej kwalifikacji wojskowej. Łotewskie ministerstwo obrony wskazuje wejście obowiązkowej służby od 1.01.2024; interfejs umożliwia sprawdzenie wyniku bez Łotwy. Późniejsza reforma w Chorwacji nie zmienia statusu za 2024.

## Obliczenia i wybór krajów

- Średnia: suma współczynników krajów / liczba wybranych krajów w grupie. Każdy kraj ma równą wagę.
- Mediana: środkowa wartość po sortowaniu; dla parzystej liczby krajów średnia dwóch środkowych.
- Nie jest to zagregowana dzietność populacji obu grup. Takiej wartości nie daje też zwykłe ważenie krajów ogólną liczbą mieszkańców; potrzeba danych o płodności według wieku i odpowiednich populacjach kobiet.
- Pełna próba: 9 krajów z poborem i 18 bez. Średnie: 1,29 i 1,373333…; mediany: 1,25 i 1,41. Zaokrąglenie następuje przy wyświetlaniu, po obliczeniach.
- Filtry przeliczają statystyki, pokazują n i oznaczają wybór części krajów. Pusta grupa ma brak statystyki, nie zero. Równe wartości sortowane są stabilnie.
- Wszystkie słupki rozpoczynają się od zera i mają wspólną skalę. Widok punktowy używa tej samej skali; przerywana pionowa linia oznacza wybraną średnią lub medianę.

## Co można powiedzieć

W tym przekroju średnia krajów z czynnym poborem jest niższa o około 0,08 dziecka na kobietę. **Nie dowodzi to, że pobór obniża dzietność.** Nie kontrolujemy dochodu, kosztów mieszkań, polityki rodzinnej, norm społecznych, migracji, struktury wieku, sytuacji bezpieczeństwa ani wieloletnich opóźnień. Grupa z poborem również nie jest jednorodna: różnią się czas służby, zasady zwolnień, udział faktycznie powołanych i płeć osób objętych obowiązkiem.

Do badania wpływu potrzebny byłby osobny projekt: historia reform i kohort, odpowiednia grupa kontrolna, wyniki przed i po reformie oraz ocena założeń identyfikacji przyczynowej. Ten zestaw nie zawiera oszacowania takiego efektu. Własna edycja tekstów na grafice nie zmienia danych źródłowych.

## Źródła i odtwarzanie

- [World Bank — definicja i metodologia](https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SP.DYN.TFRT.IN), dane CC BY 4.0.
- [World Bank — API, rok 2024](https://api.worldbank.org/v2/country/all/indicator/SP.DYN.TFRT.IN?date=2024&format=json&source=2&per_page=1000).
- [EPRS — Conscription as an element in European Union preparedness, tabela 1](https://www.europarl.europa.eu/thinktank/en/academic/EPRS_BRI%282025%29769541). Fakty klasyfikacyjne wyekstrahowano z indeksowanej wersji oficjalnej strony; bez kopiowania całego opracowania.
- [Ministerstwo Obrony Łotwy — wejście obowiązkowej służby](https://www.mod.gov.lv/en/news/saeima-adopts-state-defence-service-law).

Kod: `scripts/build-fertility-comparison.py`. Dane surowe API, metryka pobrania z SHA-256 i klasyfikacja: `research/conscription-fertility/`. Bez `--refresh` skrypt odtwarza zapisany snapshot. Odświeżenie danych nie uprawnia do zmiany roku klasyfikacji bez ponownego researchu.

## English summary

EU27 cross-section, 2024, all 27 countries observed. World Bank total fertility rates are joined to active peacetime conscription status based on EPRS Table 1 and Latvia's implementation date. Suspended conscription counts as inactive. Mean and median weight countries equally, not populations. Full-sample means: 1.29 (9 active) and 1.373333… (18 inactive); medians: 1.25 and 1.41. This descriptive difference is not a causal effect. Selection changes denominators and statistics. Later policy changes are not backdated into 2024. Raw evidence and the reproducible builder are retained in the repository.
