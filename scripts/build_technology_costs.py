"""Source-backed cost stories. Invoked by build-story-data.py; no network calls."""
import csv
from collections import defaultdict
import xlrd

REPORT = 'https://epoch.ai/publications/the-plunging-price-of-thought'
PUBLICATION = '2026-09-22'


def add_cost_topics(raw, topic, series, point, source, topics, sources):
    def rows(name, encoding='utf-8-sig'):
        with (raw / name).open(encoding=encoding, newline='') as f:
            return list(csv.DictReader(f))

    def attributed_source(file, name, report, note=''):
        sid = source(file, name, note=note)
        sources[sid]['reportUrl'] = report
        return sid

    def presentation(id, defaults, note_pl, note_en, chart='line', **extra):
        topics[id].update(defaults=defaults, defaultChart=chart,
                          defaultAxisScale='log' if id in ['ai-task-cost', 'dna-cost'] else 'linear',
                          reelNote={'pl': note_pl, 'en': note_en}, methodologyPath='/stories/TECHNOLOGY-COSTS.md', **extra)

    # Figure 1 is a comparison of average rates over DIFFERENT periods, not a
    # calendar timeline. The only date assigned to each estimate is publication.
    tid = 'technology-costs'
    note = ('Epoch AI, „The plunging price of thought”, 22.09.2026, Figure 1. '
            'Średnie składane spadki realnych kosztów w RÓŻNYCH okresach historycznych. '
            'Data 22.09.2026 oznacza publikację porównania, nie dzień pomiaru cen. '
            'AI: koszt zadania przy ustalonym wyniku, nie cena tokenów ani koszt treningu. '
            'Roczne odpowiedniki obliczono ze stóp kwartalnych; nie są prognozą. '
            'Dla DNA zachowano zakres 2001–2022 z CSV autorów (tekst raportu podaje też 2001–2025).')
    topic(tid, 'Co tanieje najszybciej?', note)
    sid = attributed_source('epoch-thought-figure1.csv', 'Epoch AI · Emberson & Roodman · Figure 1', REPORT, note)
    names = {'Electricity': ('electricity', 'Prąd'), 'Lithium batteries': ('batteries', 'Baterie litowe'),
             'Illumination': ('lighting', 'Oświetlenie'), 'Compute': ('compute', 'Obliczenia'),
             'DNA sequencing': ('dna', 'Sekwencjonowanie DNA'), 'LLM inference': ('ai', 'AI · inferencja')}
    defaults = []
    for r in rows('epoch-thought-figure1.csv', 'cp1252'):
        if r['Technology'] not in names:
            continue
        key, name = names[r['Technology']]
        q = float(r['Compounded average/quarter'].strip('%')) / 100
        period = r['Date range']
        definitions = [('quarterly', q * 100, '% / kwartał', 'cost-decline-percent-quarter', 'estimate', 'Spadek kwartalny', 'reported compounded quarterly rate'),
                       ('annual', (1 - (1 - q) ** 4) * 100, '% / rok', 'cost-decline-percent-year', 'derived', 'Spadek roczny', '100 * (1 - (1 - quarterlyRate)^4)'),
                       ('factor', (1 - q) ** -4, '× / rok', 'cost-reduction-factor-year', 'derived', 'Roczny mnożnik tanienia', '(1 - quarterlyRate)^(-4)')]
        for metric, value, unit, unit_key, kind, label, formula in definitions:
            s = series(tid, f'{key}-{metric}', f'{name} · {period}', unit, unit_key, 'summary',
                       notes=f'{label}. {note} Jednostka kosztu w źródle: {r["Unit"]}.',
                       kind=kind, entity=r['Technology'], metric=label, interpolation='step')
            s['dateMeaning'] = 'publication'
            point(s, PUBLICATION, value, sid, 'day', comparisonPeriod=period, quarterlyRate=q,
                  originalCostUnit=r['Unit'], inflationAdjusted=True, formula=formula,
                  dateMeaning='publication', sourceRowTechnology=r['Technology'])
            if metric == 'quarterly':
                defaults.append(s['id'])
    presentation(tid, defaults, 'średni spadek realnego kosztu · różne okresy',
                 'average real cost decline · different periods', 'ranking', dateMeaning='publication')

    tid = 'ai-task-cost'
    note = ('Epoch AI, Figure 2, 22.09.2026: rekordowo niski koszt zadania osiągającego ustalony próg wyniku. '
            '7 krzywych, daty premier przypisane przez autorów, retrospektywny pomiar kosztów. '
            'Progi 25% i 75% są skorygowane o zgadywanie: w GPQA odpowiadają surowym wynikom 43,75% i 81,25%. '
            'To koszt zadania przy dobranym budżecie tokenów, nie cena miliona tokenów i nie koszt jednego poprawnego rozwiązania. '
            'AIME to OTIS Mock; FrontierMath to tiers 1–3. Brak punktu oznacza brak rekordu w tym zestawie, nie zerowy koszt. '
            'Schodki nie interpolują niezmierzonych spadków. Końce serii różnią się, ostatni rekord nie jest aktualnym cennikiem API.')
    topic(tid, 'Ile kosztuje wynik AI?', note)
    sid = attributed_source('epoch-thought-figure2.csv', 'Epoch AI · Emberson & Roodman · Figure 2', REPORT, note)
    short_names = {'aime': 'AIME (OTIS Mock)', 'gpqa': 'GPQA', 'fm13': 'FrontierMath 1–3', 'chess': 'Szachy'}
    defaults = []
    for r in rows('epoch-thought-figure2.csv'):
        level = float(r['level']); bench = r['bench']; score = float(r['acc'])
        s = series(tid, f'{bench}-{int(level*100)}', f'{short_names.get(bench, r["benchmark"])} · próg {int(level*100)}%',
                   'USD / zadanie', 'usd-nominal-per-task', 'event', note, 'estimate',
                   entity=r['benchmark'], metric=f'Cost at guessing-adjusted score >= {level}', interpolation='step')
        floor = .25 if bench == 'gpqa' else .001 if bench == 'aime' else 0
        assert score >= level
        point(s, r['date'], float(r['cost']), sid, 'day', model=r['model_label'],
              benchmark=r['benchmark'], threshold=level, score=score, guessingFloor=floor,
              rawThreshold=floor + (1-floor)*level, rawScore=floor + (1-floor)*score,
              scoreDefinition='guessing-adjusted', dateMeaning='model-release-as-reported',
              reportPublishedAt=PUBLICATION)
        if bench == 'gpqa' and s['id'] not in defaults:
            defaults.append(s['id'])
    presentation(tid, defaults, 'stały próg wyniku po korekcie zgadywania', 'fixed guessing-adjusted score threshold')

    tid = 'ai-chip-value'
    note = ('Epoch AI, Venkat Somala, 13.08.2026: teoretyczna wydajność TPP za dolara dla chipów dostarczanych w kwartale. '
            'H100 w cenie z 2025 r. = 1; kwoty w cenach stałych 2025. To estymacje dostaw i cen, nie pomiary szybkości LLM. '
            'NVIDIA: cena dla nabywcy; TPU/Trainium: oszacowany koszt pozyskania — podstawy wyceny są różne. '
            '„Inne” to zmienny koszyk chipów. Średnia wszystkich dostaw jest ważona wydatkami, nie liczbą chipów. '
            'Brak chipu w kwartale oznacza brak oddzielnego wiersza w źródle, nie zerową wydajność ani brak dostaw. '
            'Zestaw zawiera tylko 2023 Q1–2025 Q4; nie dopisano danych z 2026.')
    topic(tid, 'Ile mocy AI kupuje dolar?', note)
    sid = attributed_source('epoch-chip-performance.csv', 'Epoch AI · Venkat Somala · chip performance per dollar',
                            'https://epoch.ai/data-insights/chip-performance-per-dollar', note)
    records = rows('epoch-chip-performance.csv')
    perf_key = 'Performance per dollar (relative to an H100 at its 2025 price)'
    spend_key = 'Spending in quarter (billion 2025 USD)'
    quarters = sorted(set(r['Quarter'] for r in records))
    defaults = []
    for chip in dict.fromkeys(r['Chip'] for r in records):
        label = 'Inne chipy' if chip == 'Other' else chip
        perf = series(tid, chip+'-performance', label+' · moc / USD', '× H100', 'tpp-usd2025-relative-h100',
                      'quarterly', note, 'estimate', chip, 'Theoretical performance per inflation-adjusted dollar', 'step')
        spend = series(tid, chip+'-spending', label+' · wydatki', 'mld USD 2025', 'billion-usd2025-quarter',
                       'quarterly', note, 'estimate', chip, 'Estimated spending on quarterly deliveries', 'step')
        perf['includeEmptyPeriods'] = spend['includeEmptyPeriods'] = True
        by_quarter = {r['Quarter']: r for r in records if r['Chip'] == chip}
        for quarter in quarters:
            r = by_quarter.get(quarter)
            # Explicit gaps prevent a discontinued category from being carried
            # forward indefinitely by the animated legend/ranking.
            for s, col in [(perf, perf_key), (spend, spend_key)]:
                point(s, quarter.replace(' ', '-'), float(r[col]) if r else None, sid, 'quarter',
                      missingReason=None if r else 'No separate row in source; not zero')
        if chip in ['H100/H200', 'GB200', 'GB300', 'TPU v6e', 'Trainium2']:
            defaults.append(perf['id'])
    weighted = series(tid, 'all-weighted', 'Wszystkie dostawy · średnia ważona', '× H100', 'tpp-usd2025-relative-h100',
                      'quarterly', note, 'derived', 'All chips', 'Spending-weighted theoretical performance per dollar', 'step')
    total = series(tid, 'all-spending', 'Wszystkie dostawy · wydatki', 'mld USD 2025', 'billion-usd2025-quarter',
                   'quarterly', note, 'derived', 'All chips', 'Total estimated quarterly spending', 'step')
    for quarter in quarters:
        rr = [r for r in records if r['Quarter'] == quarter]
        spending = sum(float(r[spend_key]) for r in rr)
        numerator = sum(float(r[perf_key])*float(r[spend_key]) for r in rr)
        point(weighted, quarter.replace(' ', '-'), numerator/spending, sid, 'quarter',
              spendingBillionUsd2025=spending, weightedNumerator=numerator,
              formula='sum(performancePerDollar * spending) / sum(spending)', sourceRowCount=len(rr))
        point(total, quarter.replace(' ', '-'), spending, sid, 'quarter', formula='sum(spending)', sourceRowCount=len(rr))
    presentation(tid, [weighted['id'], *defaults], 'estymacje TPP · H100 2025 = 1 · różne podstawy cen',
                 'TPP estimates · H100 2025 = 1 · price bases differ')

    tid = 'dna-cost'
    note = ('NHGRI, Wetterstrand, tabela z maja 2022: 78 pomiarów od września 2001 do maja 2022. '
            'Nominalne USD, bez korekty inflacji; koszt produkcyjnego sekwencjonowania w ośrodkach programu NHGRI, '
            'nie cena konsumenckiego testu DNA ani pełny koszt interpretacji medycznej. '
            'Genom: oszacowanie dla 3000 Mb z pokryciem zależnym od technologii. Megabaza: surowa sekwencja. '
            'Od stycznia 2008 zmiana technologii na NGS i założeń porównania. Brak dopisanych późniejszych cen. '
            'Źródło podaje miesiące, nie ciągłe pomiary dzienne; linie łączą tylko dostępne obserwacje.')
    topic(tid, 'Genom: od milionów do setek dolarów', note)
    sid = attributed_source('nhgri-sequencing-costs.xls', 'NHGRI · Wetterstrand · DNA Sequencing Costs',
                            'https://www.genome.gov/about-genomics/fact-sheets/DNA-Sequencing-Costs-Data', note)
    book = xlrd.open_workbook(raw / 'nhgri-sequencing-costs.xls'); sheet = book.sheet_by_name('Data Table')
    assert sheet.row_values(0) == ['Date', 'Cost per Mb', 'Cost per Genome']
    genome = series(tid, 'genome', 'Koszt sekwencjonowania genomu', 'USD / genom', 'usd-nominal-human-genome',
                    'irregular-monthly', note, 'estimate', 'NHGRI sequencing centers', 'Production sequencing cost per human-sized genome')
    megabase = series(tid, 'megabase', 'Koszt megabazy DNA', 'USD / Mb', 'usd-nominal-megabase',
                      'irregular-monthly', note, 'estimate', 'NHGRI sequencing centers', 'Production cost per megabase of raw sequence')
    for i in range(1, sheet.nrows):
        dt = xlrd.xldate_as_datetime(sheet.cell_value(i, 0), book.datemode)
        for s, col in [(genome, 2), (megabase, 1)]:
            point(s, dt.strftime('%Y-%m'), sheet.cell_value(i, col), sid, 'month',
                  sourceSheet='Data Table', sourceRow=i+1, inflationAdjusted=False,
                  technology='Sanger' if dt.year < 2008 else 'Next-generation sequencing')
    presentation(tid, [genome['id']], 'nominalne USD · estymacje NHGRI · do maja 2022',
                 'nominal USD · NHGRI estimates · through May 2022')
