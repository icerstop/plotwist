# Koszt postępu technologicznego — źródła i pomysły na rolki

Snapshot pobrany 29 września 2026. Dane są dostępne w Bibliotece danych, jako CSV/JSON oraz w ZIP całej biblioteki. Aktualność pomiarów zależy od źródła; data pobrania nie jest datą ostatniego pomiaru. Nie ma płatnego API ani automatycznego odświeżania.

## 1. Co tanieje najszybciej?

Odnaleziony raport: [Luke Emberson i David Roodman, The plunging price of thought, Epoch AI, 22.09.2026](https://epoch.ai/publications/the-plunging-price-of-thought). [Kod i dane autorów](https://github.com/droodman/inference-cost/tree/9163c17ee7217b9f09ac51bcc71ed64c18c04bc8), zapisane w konkretnej wersji, nie z ruchomego adresu main.

Figure 1 zawiera średnie składane spadki kosztów po korekcie inflacji:

| Technologia | Okres w CSV autorów | Spadek kwartalny |
|---|---|---:|
| Oświetlenie | 1800–2023 | 0,9% |
| Prąd | 1892–1973 | 1,2% |
| Baterie litowe | 1991–2024 | 3,6% |
| Obliczenia | 1940–2001 | 9,9% |
| Sekwencjonowanie DNA | 2001–2022 | 14,2% |
| Inferencja LLM | 2023–2026 | 47,0% |

To porównanie różnych okresów i różnych usług. AI oznacza koszt zadania przy ustalonej jakości, a nie samą cenę tokenów. Domyślnie pokazujemy ranking sześciu stóp, a okres jest częścią nazwy każdej serii. Wartości dodatnie oznaczają spadek, nie wzrost kosztu. Data punktów oznacza publikację porównania. Nie utworzono fikcyjnych corocznych cen na podstawie średnich stóp.

Dodatkowo można wybrać roczne odpowiedniki: `spadek roczny = 100 × [1 − (1 − q)^4]`, `mnożnik tanienia = (1 − q)^−4`, gdzie `q` jest kwartalną stopą jako ułamek. To przeliczenia z zaokrąglonych stóp, nie prognozy. Dla AI daje to około 92,1% rocznie, czyli 12,7-krotny spadek. Nie mnożymy 47% przez cztery. Pole „fastest 3-year decline” nie zostało użyte — brakujące i zerowe pozycje nie mają tu jednoznacznej interpretacji.

Rozbieżność źródłowa: prose raportu wspomina DNA 2001–2025, ale CSV Figure 1 podaje 2001–2022. Zachowano okres z tabeli danych. Korekta raportu z 23.09 podkreśla ograniczoną porównywalność technologii.

Pomysły: ranking tempa tanienia; dwie karty AI i DNA; roczny mnożnik tanienia sześciu usług. Przy pojedynczym punkcie użyj rankingu, słupków albo kart.

## 2. Ile kosztuje wynik AI?

Z Figure 2 opracowano 40 rekordów kosztowych w siedmiu seriach: AIME (OTIS Mock) 25%/75%, GPQA 25%/75%, FrontierMath tiers 1–3 25%/75% oraz szachy 25%. Jednostka to **USD za zadanie**, nie milion tokenów ani jedno poprawne rozwiązanie. Brak szachów 75% nie oznacza zerowego kosztu.

Próg wyniku jest skorygowany o zgadywanie. `wynik skorygowany = (wynik surowy − poziom zgadywania) / (1 − poziom zgadywania)`. Dla GPQA poziom zgadywania wynosi 25%, więc próg 75% na tym wykresie odpowiada **81,25% surowej trafności**, a próg 25% — 43,75%. Dla AIME poziom to 0,1%. CSV zachowuje oba progi, wynik, nazwę modelu, benchmark i formułę interpretacji.

Daty premier są przypisane przez autorów. To retrospektywna ocena modeli z pomiarami i cenami zebranymi później; nie dowód, że dokładnie taka oferta była dostępna w dniu premiery. Zachowano także przypisania dat wersjom Gemini użyte w źródle, bez samodzielnego „korygowania” ich na daty domniemane. Końce serii wyznaczają ostatnie rekordy w snapshotcie. Między rekordami stosujemy schodki; animacja nie dodaje pomiarów.

Pomysły: „Ile kosztowało uzyskanie tego samego wyniku?” na osi logarytmicznej; GPQA 25% vs 75%; AIME vs FrontierMath przy tym samym **skorygowanym** progu. Procenty różnych benchmarków nie są wspólną skalą inteligencji. W tabeli można sprawdzić model przy każdym rekordzie. Surowe krzywe budżetów tokenowych, rejestr modeli, uruchomienia i kod metodologii są zarchiwizowane jako materiał do dalszych analiz; nie traktujemy każdej z tych surowych pozycji jako osobno zweryfikowanego rekordu gotowego do rolki.

Starszy temat „AI tanieje” pozostaje oddzielny: jego jednostką jest USD za milion tokenów i kończy się w 2025 r. Tych dwóch miar nie sklejamy.

## 3. Ile mocy AI kupuje dolar?

[Venkat Somala, Epoch AI, 13.08.2026](https://epoch.ai/data-insights/chip-performance-per-dollar). Oficjalny CSV: 57 wierszy chip × kwartał, 2023 Q1–2025 Q4. Udostępniono osiem kategorii chipów, osobno ich wydajność za dolara i wydatki, oraz dwie serie obliczone dla wszystkich dostaw.

Wydajność oznacza teoretyczne TPP, znormalizowane do H100 po cenie z 2025 r. Koszty są w USD 2025. Dane dotyczą nowych dostaw w kwartale, nie całej działającej floty. Cena NVIDIA dla nabywcy i oszacowany koszt pozyskania TPU/Trainium mają różne podstawy. „Inne” jest zmiennym koszykiem. Brak osobnego wiersza pozostaje brakiem, nie zerem ani potwierdzeniem zakończenia dostaw.

`średnia wydajność/USD = Σ(wydajność/USD × wydatki) / Σ(wydatki)`. Obliczamy ją z opublikowanych, zaokrąglonych wierszy; nie dopasowujemy jej do wartości nagłówkowej raportu. Suma wydatków ma osobną jednostkę, więc nie trafia automatycznie na oś wydajności. Wydatek to estymacja wartości dostaw, nie przychód rozpoznany w sprawozdaniu firmy.

Pomysły: dolar kupuje coraz więcej mocy; wyścig generacji H100/GB200/GB300; porównanie inwestycji w kolejne generacje; zmiana średniej wynikająca z przechodzenia na nowe układy. Nie podpisuj TPP jako „tokenów na sekundę”.

## 4. Genom: od milionów do setek dolarów

[Wetterstrand KA, NHGRI, DNA Sequencing Costs](https://www.genome.gov/about-genomics/fact-sheets/DNA-Sequencing-Costs-Data), pierwotny arkusz `Sequencing_Cost_Data_Table_May2022.xls`, tabela „Data Table”. 78 miesięcy pomiaru, wrzesień 2001–maj 2022, dwa wskaźniki: USD za genom ludzkiej wielkości i USD za megabazę surowej sekwencji.

Nominalne USD, koszty produkcyjne w ośrodkach programu NHGRI. Estymacja genomu zakłada 3000 Mb i pokrycie zależne od technologii; nie obejmuje pełnej interpretacji klinicznej. Zmiana technologii w styczniu 2008 jest ważnym punktem historii. Nie dodano późniejszych reklamowanych cen komercyjnych. Miesięczne kotwice końca miesiąca porządkują dane, nie oznaczają dziennej wyceny.

Pomysły: linia logarytmiczna pełnej historii; zbliżenie na lata 2007–2009; karty pierwszego i ostatniego pomiaru. Dwie jednostki pokazuj osobno lub po jawnym przełączeniu na indeks 100. Wcześniejsze pobranie rocznej wersji OWID zachowano do kontroli, ale aplikacja korzysta z dokładniejszego oryginalnego arkusza, nie obu wersji naraz.

## Co można połączyć z dotychczasową biblioteką?

- **Baterie**: realny koszt ogniw USD/kWh; nie podpisuj jako ceny gotowego pakietu.
- **Energia słoneczna i wiatr**: LCOE nowych instalacji; nie cena detaliczna energii ani panelu.
- **Pamięć masowa**: HDD/SSD/RAM/flash, historyczne minima kosztu TB; nie średnie sklepowe.
- **Loty kosmiczne**: rekordy kosztu kilograma na LEO; data pierwszego udanego lotu, nie roczny cennik.
- **Tranzystory**: wzrost możliwości sprzętu; sama liczba tranzystorów nie dowodzi proporcjonalnego spadku kosztu.

Sensowne warianty to indeks 100 w jawnym wspólnym przedziale, osobne karty skali zmiany lub osobne rolki z jednego cyklu. Nie mieszamy nominalnych i realnych dolarów różnych lat bazowych na jednej osi ceny. Normalizacja do 100 usuwa jednostkę, lecz nie usuwa różnic metodologicznych.

## Kontrola jakości i odtwarzanie

Każdy plik źródłowy ma potwierdzenie URL, daty pobrania, liczby bajtów i SHA-256. Epoch Figure 1 jest kodowany w Windows-1252; pozostałe CSV w UTF-8. Odczyt arkusza używa rzeczywistych wartości liczbowych, nie zaokrągleń ze zdjęcia wykresu. `kind=estimate` oznacza estymację źródła, `kind=derived` własne jawne przeliczenie. Źródła pierwotne, autorzy i ich warunki użycia zachowują moc.

Odtworzenie: zależności `scripts/requirements-stories.txt`, następnie `python scripts/build-story-data.py`. Publiczne pliki wejściowe pobiera `python scripts/fetch-technology-costs.py`; istniejących snapshotów nie nadpisuje. Repozytorium autorów Epoch pozostaje przypięte do podanego commita.

Automatyczne kontrole: kolejność i unikalność dat, wartości skończone, rozdzielenie jednostek, ścisłe malejące rekordy kosztów AI, zgodność progów, składane stopy roczne, ważenie chipów wydatkami, liczba i granice dat NHGRI, zgodność SHA-256 oraz wyświetlanie bardzo małych dodatnich kosztów bez zamiany na zero. Ranking stóp ma jedną datę publikacji; nie udaje szeregu dziennego.
