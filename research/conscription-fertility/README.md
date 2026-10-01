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


## Rozszerzenie światowe / World extension (2026-10-01)

Dane: `fertility-conscription-world.json` i `.csv`. 173 kraje w analizie, 19 jawnie pominiętych przypadków. To próba wieloregionalna, a nie kompletny ani losowy spis świata. Nie używamy agregatów Banku Światowego jako państw. Tajwan nie ma obserwacji w użytym zbiorze WDI; brakujące lub niedopasowane państwa i terytoria nie są automatycznie oznaczane jako „bez poboru”.

Statusy spoza UE zakodowano ręcznie na podstawie opisów **CIA World Factbook w lustrzanym repozytorium factbook.json, commit b8538d78e87c1572f19740e49b6ad62c21e11c7f z 26.12.2024**. To archiwum opisów dostępnych pod koniec 2024, a nie jednoczesny pomiar we wszystkich krajach. Wiele wpisów ma datę 2023; niektóre 2021 lub brak daty. Data archiwum nie aktualizuje automatycznie daty wpisu. Pola `evidenceYear` i `statusEvidence` pozwalają zobaczyć tę niepewność. Zapisano pełne fragmenty dotyczące rekrutacji oraz SHA-256 pobranego archiwum w `research/conscription-fertility/factbook-2024.json`. Rebuild: `python scripts/build-world-fertility.py`.

Lista aktywnych i nieaktywnych systemów jest jawna w skrypcie. Brak poboru obejmuje dobrowolną służbę, zawieszone/niewykonywane przepisy oraz państwa bez armii; nie oznacza braku obronności. Aktywny obejmuje także pobór selektywny i loterie, nie służbę wszystkich obywateli. Nie mierzymy długości, płci objętych obowiązkiem ani faktycznego udziału powołanych. Przykładowo USA wymagają rejestracji, lecz nie wykonują poboru, a Brazylia pobiera jedynie część rocznika.

Pominięcia wraz z uzasadnieniami i źródłami są w `excluded` i w interfejsie. Chiny: nie utożsamiamy mechanizmu kwot/rejestracji z potwierdzonym przymusowym poborem w 2024. Kambodża: opis archiwalny jest sprzeczny z komunikatem państwowej AKP o wdrożeniu od 2026, więc nie rozstrzygamy. Ukraina: mobilizacja wojenna. Syria: zmiana systemu pod koniec roku. Mjanma: wprowadzenie w trakcie roku i wojna. Wykluczenie tych przypadków NIE oczyszcza całej próby z wpływu konfliktów: pozostają np. Rosja i Izrael ze zwykłym systemem poboru. Nie należy przedstawiać wyniku jako efektu poboru w warunkach pokoju.

Regiony to szerokie kategorie geograficzne oparte na katalogach archiwum; Rosja w Europie, Turcja i Kaukaz w Azji, Cypr w Europie (UE), Papua-Nowa Gwinea w Oceanii. Obie Ameryki razem. Są to jawne konwencje, nie współczesne regiony operacyjne WDI.

Średnia i mediana mają równe wagi krajów. Widok regionalny pokazuje te same miary w obrębie regionów, z oddzielnym n dla każdej grupy. W Oceanii próba nie zawiera czynnego poboru: wynik oznaczamy kreską, nigdy zerem. Histogram używa wspólnych granic przedziałów i udziału krajów we własnej grupie (różne liczebności grup), a nie liczby ludności. Listy powyżej 36 krajów dzielimy na strony; na każdej stronie podsumowanie dotyczy CAŁEGO wybranego zestawu. CSV również zawiera cały wybór, nie tylko bieżącą stronę.

### Interpretation / interpretacja

This is a descriptive, non-random cross-section. Status freshness and selective exclusions limit comparability. Regional stratification is not a causal design and does not control income, religion, family policy, conflict, migration or delayed effects. An annual fertility rate describes births in that year, not the completed fertility of conscripts. No hypothesis test or claim of a military-service effect is warranted by these two averages alone.

Interfejs udostępnia pełną próbę, UE i regiony oraz ręczny wybór krajów; wynik aktualizuje się wraz z filtrem. Światowa różnica nie jest jednolita: w Afryce i obu Amerykach średnia w grupie z poborem jest wyższa, a w Europie i Azji niższa. Dobór regionów może więc zmieniać interpretację surowej średniej.
