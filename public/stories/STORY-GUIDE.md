# Plotwist — biblioteka historii

Snapshot źródeł, nie bieżący feed. manifest.json opisuje serie, źródła i ograniczenia każdego tematu.
CSV ma format długi: jeden wiersz = seria × okres; pusta wartość oznacza brak danych, nigdy zero.
Daty są rosnące. date_precision i period zachowują dokładność źródła. Roczne daty 31 grudnia i kotwice fiskalne służą porządkowaniu, nie oznaczają pomiaru dziennego.
Nie sumuj stanów, procentów i przepływów. Nie mieszaj USD o różnych latach cenowych, MAU/WAU ani BEV/BEV+PHEV.
kind=derived oznacza obliczenie; lower-bound oznacza dolną granicę, nie dokładny wynik.
Punkty przejściowe animacji nie są nowymi obserwacjami.
Licencje oryginalnych dostawców zachowują moc; metadane OWID i bezpośrednie URL źródeł są w pakiecie.
Odtwarzanie: scripts/build-story-data.py; pobieranie: scripts/fetch-story-sources.mjs, fetch-story-files.mjs, fetch-story-filings.mjs.

## Tematy i dostępna historia

### Internet zmienił wszystko

12 serii; 404 obserwacji; 1990-12-31 → 2025-12-31. Status: ready.

Pełna historia dostępna w istniejącym snapshotcie World Bank; puste lata zachowano.

- Porównanie wybranych krajów w czasie: linie, karty lub wyścig słupków. Zakres i luki sprawdź dla każdej serii.

### Jak bogaci się świat?

12 serii; 732 obserwacji; 1960-12-31 → 2025-12-31. Status: ready.

Pełna historia dostępna w istniejącym snapshotcie World Bank; puste lata zachowano.

- Porównanie wybranych krajów w czasie: linie, karty lub wyścig słupków. Zakres i luki sprawdź dla każdej serii.

### Żyjemy coraz dłużej?

12 serii; 780 obserwacji; 1960-12-31 → 2024-12-31. Status: ready.

Pełna historia dostępna w istniejącym snapshotcie World Bank; puste lata zachowano.

- Porównanie wybranych krajów w czasie: linie, karty lub wyścig słupków. Zakres i luki sprawdź dla każdej serii.

### Telefon w każdej kieszeni

12 serii; 625 obserwacji; 1960-12-31 → 2025-12-31. Status: ready.

Pełna historia dostępna w istniejącym snapshotcie World Bank; puste lata zachowano.

- Porównanie wybranych krajów w czasie: linie, karty lub wyścig słupków. Zakres i luki sprawdź dla każdej serii.

### Kto inwestuje w przyszłość?

12 serii; 327 obserwacji; 1996-12-31 → 2023-12-31. Status: ready.

Pełna historia dostępna w istniejącym snapshotcie World Bank; puste lata zachowano.

- Porównanie wybranych krajów w czasie: linie, karty lub wyścig słupków. Zakres i luki sprawdź dla każdej serii.

### Światło zmienia życie

12 serii; 399 obserwacji; 1990-12-31 → 2024-12-31. Status: ready.

Pełna historia dostępna w istniejącym snapshotcie World Bank; puste lata zachowano.

- Porównanie wybranych krajów w czasie: linie, karty lub wyścig słupków. Zakres i luki sprawdź dla każdej serii.

### Przeprowadzka do miast

12 serii; 792 obserwacji; 1960-12-31 → 2025-12-31. Status: ready.

Pełna historia dostępna w istniejącym snapshotcie World Bank; puste lata zachowano.

- Porównanie wybranych krajów w czasie: linie, karty lub wyścig słupków. Zakres i luki sprawdź dla każdej serii.

### Gospodarka bez granic

12 serii; 672 obserwacji; 1960-12-31 → 2025-12-31. Status: ready.

Pełna historia dostępna w istniejącym snapshotcie World Bank; puste lata zachowano.

- Porównanie wybranych krajów w czasie: linie, karty lub wyścig słupków. Zakres i luki sprawdź dla każdej serii.

### Kawa czy inwestycja?

0 serii; 0 obserwacji; — → —. Status: simulation.

Model matematyczny w dotychczasowym studiu. Nie istnieje źródłowy historyczny dataset dla hipotetycznej stałej stopy zwrotu.

- Model hipotetyczny w module Studio; historyczne symulacje wpłat w module Giełda.

### Baterie coraz tańsze

1 serii; 34 obserwacji; 1991-12-31 → 2024-12-31. Status: partial.

Pobrano historię ogniw, nie całych pakietów. Brak porównywalnej historii pakietów z tego źródła.

- Spadek realnej ceny ogniwa litowo-jonowego na liniowej lub logarytmicznej osi.
- Karty: ile kosztowała jedna kWh ogniw w dwóch wybranych latach. Nie podpisuj danych jako ceny pakietu.

### Słońce i inne źródła odnawialne

82 serii; 1284 obserwacji; 1984-12-31 → 2025-12-31. Status: partial.

LCOE nowych elektrowni, ceny stałe 2025. Ten zbiór nie obejmuje paliw kopalnych ani cen energii dla gospodarstw domowych.

- Fotowoltaika vs wiatr na lądzie: światowy LCOE w cenach stałych 2025.
- Ranking dostępnych krajów dla tej samej technologii. Nie zastępuj brakującego kraju średnią światową.

### Terabajt za grosze

4 serii; 136 obserwacji; 1956-12-31 → 2023-12-31. Status: ready.

Najniższa historyczna cena odnotowana do danego roku; nie średnia cena rynkowa. Serie HDD, SSD, RAM i flash są rozdzielone.

- HDD vs SSD od pierwszego wspólnego roku: realny koszt terabajta.
- RAM, flash i dyski w długiej historii: skala logarytmiczna. Wartości to najniższe dotąd ceny ze źródła, nie średnie sklepowe.

### Moore w liczbach

1 serii; 39 obserwacji; 1971-12-31 → 2021-12-31. Status: partial.

Zestaw OWID/Rupp pokazuje historyczny trend mikroprocesorów; nie identyfikuje pojedynczych chipów ani GPU. Ułamkowe liczby pozostawiono tak, jak publikuje źródło. Linia łączy nieregularne obserwacje; odcinki pomiędzy nimi są interpolacją wizualną, nie dodatkowymi pomiarami.

- Historyczny trend liczby tranzystorów, najlepiej ze skalą logarytmiczną.
- Karty pokazujące rzędy wielkości. Zbiór nie pozwala podpisać każdego punktu konkretnym modelem procesora.

### Elektryczna zmiana warty

64 serii; 817 obserwacji; 2010-12-31 → 2025-12-31. Status: partial.

Dostępny udział BEV + PHEV łącznie. To nie jest udział samych BEV; brak prognoz. Metadane źródła mają niespójne oznaczenie edycji 2025/2026, zachowane w pakiecie.

- Chiny, USA i Polska: udział BEV + PHEV w sprzedaży nowych samochodów.
- Ranking krajów lub linie udziałów. Nie utożsamiaj sprzedaży z udziałem elektryków w całej flocie.

### Mniej godzin, więcej wartości?

274 serii; 10028 obserwacji; 1870-12-31 → 2023-12-31. Status: ready.

Produktywność PPP i godziny pochodzą z Penn World Table 11.0. Godziny przed 1950 r. z Huberman/Minns dotyczą innej populacji, dlatego zachowano je jako osobne serie.

- PKB na godzinę pracy PPP: Polska, Niemcy i inne kraje w porównywalnych cenach 2021.
- Roczne godziny pracy od 1950 r. lub oddzielny historyczny zbiór pracowników produkcyjnych sprzed 1950 r. Nie sklejaj tych populacji.

### NVIDIA przed i po AI

3 serii; 150 obserwacji; 2014-04-27 → 2026-07-26. Status: partial.

Daty końca kwartałów fiskalnych. Druga seria obejmuje wszystkie obszary poza Data Center, a nie samo Gaming. W FY2027 NVIDIA połączyła pozostałe segmenty jako Edge Computing; zmianę raportowania opisano w metadanych.

- Przychody kwartalne Data Center i pozostałych segmentów na wspólnej osi USD.
- Wyścig słupków lub karty: zmiana skali biznesu przed i po boomie AI. Daty są końcami kwartałów fiskalnych.

### Tańszy dostęp do kosmosu

65 serii; 80 obserwacji; 1962-12-31 → 2019-12-31. Status: ready.

Koszt USD 2021/kg na LEO przypisany do roku pierwszego udanego startu rakiety, nie historia cennika każdego roku. Dostępne rekordy minimalnego kosztu i pojedyncze rakiety.

- Schody historycznych rekordów kosztu na kilogram LEO wśród rakiet w zbiorze CSIS.
- Karty pojedynczych rakiet lub rankingi klas ładowności. Rok oznacza pierwszy udany lot rakiety, nie coroczną ofertę cenową.

### Akcje Apple vs iPhone

4 serii; 11586 obserwacji; 1980-12-12 → 2026-09-25. Status: ready.

Roczne przychody iPhone 2008–2025 oraz sprzedaż sztuk 2008–2018. Apple zakończyło raportowanie sztuk; nie uzupełniono ich szacunkami. Przychody i ceny akcji mają inne jednostki. Wczesna kategoria obejmuje też produkty i usługi powiązane.

- Indeks 100: kurs Apple na koniec roku fiskalnego vs roczne przychody iPhone (2008–2025).
- Karty lub linie: sprzedane iPhone’y do FY2018. Późniejsze lata pozostają bez danych o sztukach.

### Streaming zmienił muzykę

4 serii; 36 obserwacji; 2017-12-31 → 2025-12-31. Status: ready.

Roczne obserwacje 2017–2025: MAU, Premium oraz miesięczne ARPU uśrednione za rok. Nie należy dzielić rocznych przychodów przez stan subskrybentów na koniec roku i nazywać wyniku ARPU.

- MAU lub subskrybenci Premium w kolejnych latach; karty lub słupki.
- Indeks 100: roczne przychody vs Premium. Osobno historia miesięcznego ARPU, uśrednionego za cały rok.

### Wyścig chmurowych gigantów

3 serii; 23 obserwacji; 2014-12-31 → 2026-06-30. Status: partial.

AWS i Google Cloud: przychody roczne. Azure: tylko oficjalnie ujawnione progi >75 i >100 mld USD dla FY2025/26, jako oddzielna seria dolnych granic. Brak wymyślonej historii Azure.

- AWS vs Google Cloud: roczne przychody na jednej osi USD.
- Azure jako osobne karty progów >75 i >100 mld USD. Inne końce roku fiskalnego i dolne granice wykluczają dokładny indeks wzrostu.

### Ile kosztuje odpowiedź AI?

21 serii; 119 obserwacji; 2021-11-20 → 2025-02-05. Status: ready.

Historyczny minimalny koszt osiągnięcia danego progu benchmarku, według Epoch AI. Cena mieszana 3:1 wejście:wyjście; nie koszt całego zadania ani aktualny cennik. Różne progi benchmarków pozostają osobnymi seriami.

- Schodki minimalnej ceny osiągnięcia ustalonego progu MMLU, GPQA lub innego testu.
- Kilka progów tego samego benchmarku: jak taniała porównywalna zdolność? W tabeli zachowano model będący rekordzistą.

### Mapa wynalazków

332 serii; 8360 obserwacji; 1980-12-31 → 2021-12-31. Status: ready.

Wnioski patentowe rezydentów (WIPO przez World Bank), liczby bezwzględne i na milion mieszkańców. To nie liczba udzielonych patentów. Można łączyć z już dostępnymi nakładami B+R.

- Polska vs USA, Chiny lub inne kraje: zgłoszenia rezydentów na milion mieszkańców.
- Liczba zgłoszeń vs udział B+R w PKB, po świadomym przełączeniu na indeks 100. Korelacja nie dowodzi przyczynowości.

### Co kupi dzisiejsze 100 zł?

3 serii; 178 obserwacji; 1950-12-31 → 2025-12-31. Status: ready.

Roczne CPI GUS od 1950 r. Łańcuch cen obliczono mnożąc indeksy rok do roku; nie sumując inflacji. Kwota 100 zł oznacza siłę nabywczą współczesnej jednostki pieniężnej w cenach roku bazowego, nie historyczny banknot sprzed denominacji.

- Siła nabywcza stałych 100 zł od 2000 r.: malejąca karta albo linia.
- Długi indeks poziomu cen 1950 = 100: oś logarytmiczna. To iloczyn indeksów, nie suma stóp inflacji.

### Pensja vs metr mieszkania

85 serii; 3772 obserwacji; 2002-12-31 → 2026-06-30. Status: ready.

17 miast. Ceny transakcyjne NBP, rynek pierwotny i wtórny. Płace GUS BDL: brutto, podmioty 10+ i sfera budżetowa. Wskaźnik dostępności: średnia z 4 kwartałów cen / średnia miesięczna płaca w tym samym mieście i roku. Nie jest czasem oszczędzania po kosztach życia.

- Ile miesięcznych płac brutto kosztował metr mieszkania w Warszawie, Krakowie i innych miastach?
- Rynek pierwotny vs wtórny: ceny kwartalne. Wskaźnik płacowy używa wyłącznie pełnych lat z czterema kwartałami.

### Konsole na przestrzeni lat

18 serii; 249 obserwacji; 1998-03-31 → 2026-03-31. Status: partial.

Oficjalne roczne dostawy sprzętu Nintendo w latach fiskalnych kończących się 31 marca. Nie sell-through. Starsze konsole nie mają kompletnej historii od premiery; skumulowane serie tworzone tylko od pierwszego roku sprzedaży. Kolumny zbiorcze „2015~” i „2024~” pominięto, bo nie oznaczają jednego roku. Brak kompletnej historii Sony/Microsoft.

- Nintendo Switch, Wii, DS i 3DS: skumulowane dostawy w czasie kalendarzowym.
- Roczne dostawy sprzętu: premiera, szczyt i wygaszanie generacji. Pełnych krzywych od premiery nie ma dla wszystkich starszych konsol.

### Adopcja aplikacji · udokumentowane punkty

4 serii; 23 obserwacji; 2011-12-31 → 2025-07-31. Status: partial.

Oddzielono MAU, WAU i regiony. Facebook: roczne MAU 2011–2023, później firma zakończyła raportowanie tej miary. Instagram, ChatGPT i TikTok: komunikaty o kamieniach milowych, nie ciągłe pomiary. Brak wspólnej definicji pozwalającej na uczciwy wyścig wszystkich aplikacji do 100 mln.

- Karty kamieni milowych Instagrama i Facebooka w MAU; ChatGPT osobno w WAU.
- Linie schodkowe komunikatów. Nie wyliczaj czasu do 100 mln bez daty startu i jednolitej definicji użytkownika.

### Ile trwa pobranie filmu?

2 serii; 4 obserwacji; 2019-11-30 → 2023-03-31. Status: partial.

Archiwalne pomiary Ofcom dla Wielkiej Brytanii: mediana realnej przepustowości domowego łącza do routera, 2019 i 2023. To nie historia reklamowanych prędkości ani modemów od lat 90.

- Dwie karty Ofcom: rzeczywista mediana prędkości w UK w 2019 i 2023 r.
- Idealny czas pobrania pliku 1 GB z tych pomiarów. Zbiór nie stanowi pełnej historii modemów ani internetu na świecie.

### Co tanieje najszybciej?

18 serii; 18 obserwacji; 2026-09-22 → 2026-09-22. Status: ready.

Epoch AI, „The plunging price of thought”, 22.09.2026, Figure 1. Średnie składane spadki realnych kosztów w RÓŻNYCH okresach historycznych. Data 22.09.2026 oznacza publikację porównania, nie dzień pomiaru cen. AI: koszt zadania przy ustalonym wyniku, nie cena tokenów ani koszt treningu. Roczne odpowiedniki obliczono ze stóp kwartalnych; nie są prognozą. Dla DNA zachowano zakres 2001–2022 z CSV autorów (tekst raportu podaje też 2001–2025).

- Ranking sześciu historycznych temp spadku kosztów. Okresy porównania są różne i pozostają w nazwach serii.
- Karty lub słupki: wybierz spadek kwartalny, roczny albo roczny mnożnik tanienia. Roczne wartości są przeliczeniem ze średnich stóp, nie prognozą.

### Ile kosztuje wynik AI?

7 serii; 40 obserwacji; 2023-11-06 → 2026-07-27. Status: ready.

Epoch AI, Figure 2, 22.09.2026: rekordowo niski koszt zadania osiągającego ustalony próg wyniku. 7 krzywych, daty premier przypisane przez autorów, retrospektywny pomiar kosztów. Progi 25% i 75% są skorygowane o zgadywanie: w GPQA odpowiadają surowym wynikom 43,75% i 81,25%. To koszt zadania przy dobranym budżecie tokenów, nie cena miliona tokenów i nie koszt jednego poprawnego rozwiązania. AIME to OTIS Mock; FrontierMath to tiers 1–3. Brak punktu oznacza brak rekordu w tym zestawie, nie zerowy koszt. Schodki nie interpolują niezmierzonych spadków. Końce serii różnią się, ostatni rekord nie jest aktualnym cennikiem API.

- GPQA: koszt zadania dla progów 25% i 75% po korekcie zgadywania. Użyj skali logarytmicznej, aby zobaczyć kolejne rzędy wielkości.
- Porównaj AIME, FrontierMath i szachy przy tym samym progu skorygowanego wyniku. Procenty różnych testów nie są wspólną miarą inteligencji; model każdego rekordu jest w tabeli danych.

### Ile mocy AI kupuje dolar?

18 serii; 138 obserwacji; 2023-03-31 → 2025-12-31. Status: ready.

Epoch AI, Venkat Somala, 13.08.2026: teoretyczna wydajność TPP za dolara dla chipów dostarczanych w kwartale. H100 w cenie z 2025 r. = 1; kwoty w cenach stałych 2025. To estymacje dostaw i cen, nie pomiary szybkości LLM. NVIDIA: cena dla nabywcy; TPU/Trainium: oszacowany koszt pozyskania — podstawy wyceny są różne. „Inne” to zmienny koszyk chipów. Średnia wszystkich dostaw jest ważona wydatkami, nie liczbą chipów. Brak chipu w kwartale oznacza brak oddzielnego wiersza w źródle, nie zerową wydajność ani brak dostaw. Zestaw zawiera tylko 2023 Q1–2025 Q4; nie dopisano danych z 2026.

- H100/H200 vs GB200/GB300: teoretyczna wydajność za dolara w kolejnych kwartałach. Zachowaj informację o estymacjach i cenach 2025.
- Wydatki na kolejne generacje chipów lub średnia wydajność ważona wydatkami. Układy TPU i Trainium mają inną podstawę wyceny niż ceny zakupu NVIDIA.

### Genom: od milionów do setek dolarów

2 serii; 156 obserwacji; 2001-09-30 → 2022-05-31. Status: ready.

NHGRI, Wetterstrand, tabela z maja 2022: 78 pomiarów od września 2001 do maja 2022. Nominalne USD, bez korekty inflacji; koszt produkcyjnego sekwencjonowania w ośrodkach programu NHGRI, nie cena konsumenckiego testu DNA ani pełny koszt interpretacji medycznej. Genom: oszacowanie dla 3000 Mb z pokryciem zależnym od technologii. Megabaza: surowa sekwencja. Od stycznia 2008 zmiana technologii na NGS i założeń porównania. Brak dopisanych późniejszych cen. Źródło podaje miesiące, nie ciągłe pomiary dzienne; linie łączą tylko dostępne obserwacje.

- Pełna historia kosztu genomu na osi logarytmicznej: wrzesień 2001 – maj 2022.
- Zbliżenie na przełom 2007–2009, gdy NHGRI przechodziło na sekwencjonowanie nowej generacji.
- Karty pierwszego i ostatniego pomiaru albo koszt jednej megabazy. Nie opisuj tych kosztów jako ceny konsumenckiego testu DNA.

