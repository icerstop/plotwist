# Polska — rezerwy złota / Poland — gold reserves

Zestaw przygotowany 1 października 2026. Stan złota monetarnego polskich władz monetarnych, także przechowywanego za granicą. Nie złoto znajdujące się geologicznie w Polsce ani prywatne zasoby Polaków.

## Serie do rolki

- Rezerwy złota w tonach: dokładne dostępne pomiary miesięczne 2000-01–2026-07. **Brak 2025-08–2026-05**, pozostawiony jako `null`.
- Zmiana zasobu w tonach m/m: tylko gdy istnieją dwa kolejne miesiące. Zmiana stanu nie jest automatycznie zakupem netto.
- Wartość złota w mld PLN i mld EUR, nominalnie, na koniec miesiąca.
- Oficjalne aktywa rezerwowe w mld PLN.
- Udział złota w wartości rezerw, w procentach: wspólna waluta PLN i ten sam miesiąc.

Wycena w EUR zaczyna się w styczniu 2000, a PLN oraz udział w styczniu 2013. W pobranym szeregu EBC brakuje stycznia–sierpnia 2014; te miesiące również oznaczono jako `null`.

## Źródła i pierwszeństwo

1. Ilość: [MFW IRFCL, publiczna kopia DBnomics](https://db.nomics.world/IMF/IRFCL/M.PL.RAFAGOLDV_OZT.S1X), snapshot DBnomics 31.08.2025, kończy się w lipcu 2025. Data pobrania tej kopii nie oznacza aktualizacji źródła. Wymiary: M / PL / RAFAGOLDV_OZT / S1X, mln uncji czystego złota. Dokładność źródła różni się między okresami.
2. Nieliczne początkowe miesiące 2000 r., których brakuje w tym szeregu: [UNSD Monthly Bulletin of Statistics, tabela 46, Polska](https://unstats.un.org/unsd/mbs/app/DataView.aspx?cid=616&p=A&tid=46&yearfrom=1997&yearto=2099). Pobieramy wyłącznie miesiące, nie dublujące je kwartały i lata.
3. Czerwiec i lipiec 2026: oryginalny formularz NBP/MFW udostępniony przez [GUS SDDS](https://stat.gov.pl/en/databases/sdds/). Arkusz `Mon. Auth & Ctr. Gov`, okres E12, ilość E26, wycena złota E25, całość rezerw E13. **Data w nazwie pliku to nie miesiąc pomiaru**: plik 21-08-2026 zawiera stan 2026M7.
4. Wycena i udział: EBC RAS, Polska, monthly / closing stocks / monetary gold (F11) oraz total reserves (F), mln PLN lub EUR, nie transakcje. Surowe klucze szeregu i status pomiaru zachowano przy obserwacji.

**Odrzucone źródło ilości:** EBC RAS XGO ma w nowszych latach wartości zaokrąglone do pełnych milionów uncji. W lipcu 2026 podaje 21 mln, podczas gdy formularz NBP podaje 20,583 mln. Nie używamy tego szeregu do ton ani zmian m/m. Dane z EBC o wartości pieniężnej pozostają osobnymi seriami.

## Przeliczenia i interpretacja

1 uncja trojańska = 31,1034768 g. Zatem 1 mln uncji = 31,1034768 t. Nie należy używać zwykłej uncji avoirdupois. Przeliczenie nie zwiększa dokładności źródła.

Lipiec 2026: 20,583 mln uncji = 640,203 t, około **640,2 t**. Czerwiec: 20,333 mln = około **632,4 t**. Różnica to około **7,8 t**. Nie przypisujemy lipcowego pomiaru do września lub października i nie dopisujemy aktualniejszego stanu bez potwierdzenia.

Wartość w walucie zmienia się z ilością, ceną złota i kursem walutowym. Wzrost wartości nie jest miarą zakupów. Stany nie sumują się po miesiącach. Udział złota zależy również od wartości pozostałych aktywów rezerwowych.

Datą obserwacji jest koniec miesiąca (`datePrecision=month`, `period=YYYY-MM`). Animacja nie tworzy dodatkowych codziennych pomiarów. Brak danych oznaczono pustą wartością w CSV i `null` w JSON; nie uzupełniamy luk zerami, przenoszeniem poprzedniego stanu ani interpolacją.

W `raw/` są pobrane pliki i metryki URL, czasu pobrania, SHA-256 oraz rozmiaru. `quality.json` zawiera luki i kontrolę formularzy NBP. Odtwarzanie: `python scripts/build-story-data.py`; odświeżanie istniejących adresów: `python scripts/refresh-gold-reserves.py`. Nowe formularze miesięczne wymagają sprawdzenia aktualnego katalogu GUS oraz okresu wewnątrz arkusza.

## English summary

Six series: gold tonnes, monthly change in tonnes, nominal PLN/EUR gold values, total official reserves in PLN, and gold's value share of reserves. Exact quantity data are missing from Aug 2025 through May 2026; they remain null, and month-on-month changes require both adjacent observations. The latest verified quantity is July 2026, about 640.2 tonnes. Quantity is primarily IMF IRFCL via the dated DBnomics snapshot, with early UNSD observations and June/July 2026 NBP forms hosted by Statistics Poland. Financial valuations use ECB RAS. Coarsely rounded ECB gold volumes are deliberately excluded. Calendar dates denote month-end stocks, not daily measurements or publication dates. Source terms and attribution requirements apply.
