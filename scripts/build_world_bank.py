"""World Bank and separately identified Maddison histories for the story library."""
from collections import defaultdict
import csv, hashlib, json

def add_world_bank_topics(root, topic, series, point, source, topics, sources):
    registry=json.loads((root/'src/world-bank-indicators.json').read_text(encoding='utf8'))
    countries=json.loads((root/'src/world-bank-countries.json').read_text(encoding='utf8'))
    countries={c['id']:c for c in countries}
    receipt=json.loads((root/'research/world-bank/receipt.json').read_text(encoding='utf8'))
    coverage={i['id']:i for i in receipt['indicators']}
    for definition in registry:
        code=definition['id']; path=root/f'public/data/{code}.json'
        data=json.loads(path.read_text(encoding='utf8')); evidence=coverage[code]
        assert hashlib.sha256(path.read_bytes()).hexdigest()==evidence['sha256'],code
        note=definition['note']+' Pełna dostępna historia World Bank; brak danych pozostaje pusty. Kraje i agregaty mają różne zakresy. Granice i definicje mogą zmieniać się w czasie; porównanie przed/po nie dowodzi przyczynowości.'
        topic(code,definition['name'],note)
        topics[code].update(family='world-bank',titleEn=definition.get('nameEn',data['name']),noteEn=definition.get('noteEn','')+' Full available WDI history; missing observations stay empty. Coverage and definitions vary across countries and years. Before/after comparisons alone do not establish causality.',methodologyPath='/stories/WORLD-BANK.md')
        sid=source(code,'World Bank · '+data['name'],f'https://data.worldbank.org/indicator/{code}')
        sources[sid].update(retrievedAt=data['retrievedAt'],lastUpdated=data.get('lastUpdated'),extraction='Full WDI API history; country/year values retained without filling gaps',sha256=evidence['sha256'],requests=data['requests'],sourceNote=evidence['sourceNote'],sourceOrganization=evidence['sourceOrganization'],license='World Bank dataset terms: https://www.worldbank.org/en/about/legal/terms-of-use-for-datasets')
        grouped=defaultdict(list)
        for row in data['rows']:grouped[row['country']].append(row)
        for country,rows in grouped.items():
            if not any(r['value'] is not None for r in rows):continue
            c=countries[country]
            s=series(code,country,c['pl'],definition['unit'],code,entity=country,metric=data['name'],notes=definition['note'])
            s.update(countryCode=country,region=c['region'],aggregate=c['aggregate'],metricLabels={'pl':definition['metric'],'en':definition.get('metricEn',data['name'])},observationYears=sorted(r['year'] for r in rows if r['value'] is not None))
            for r in rows:point(s,str(r['year']),r['value'],sid,**{k:v for k,v in r.items() if k not in ['country','year','value']})
        topics[code]['defaults']=[code+'--'+c for c in ['pol','wld'] if code+'--'+c in topics[code]['seriesIds']]

    slug='gdp-per-capita-maddison-project-database'; tid='maddison-gdp'
    raw=root/'research/stories/raw'
    meta=json.loads((raw/(slug+'.metadata.json')).read_text(encoding='utf8'))
    assert meta['columns']['GDP per capita']['unit']=='international-$ in 2011 prices'
    note='Maddison Project Database 2023 (Bolt i van Zanden), dystrybucja OWID. Historyczne estymacje PKB na mieszkańca w stałych dolarach międzynarodowych 2011; do 2022 r. To osobny zbiór, nie przedłużenie World Bank PPP 2021. Wczesne lata są nieciągłe. Rekonstrukcje dawnych państw nie oznaczają ich istnienia w późniejszych latach. Granice i metody zmieniają się; samo porównanie przed/po nie dowodzi skutków ustroju.'
    topic(tid,'Długi rozwój gospodarczy · Maddison',note)
    topics[tid].update(family='historical-economy',titleEn='Long-run economic development · Maddison',noteEn='Maddison Project Database 2023 (Bolt and van Zanden), distributed by OWID. Historical GDP per capita estimates in constant 2011 international dollars, through 2022. Separate from World Bank PPP 2021. Early years have gaps; former states are reconstructed on their last borders, not assertions of continued existence. Boundaries and methods vary; before/after comparisons alone do not establish causality.',defaultStart='1950-01-01',methodologyPath='/stories/WORLD-BANK.md',reelNote={'pl':'historyczne estymacje Maddison Project','en':'historical estimates from the Maddison Project'})
    sid=source(slug+'.csv','Bolt & van Zanden · Maddison Project Database 2023 / OWID')
    sources[sid].update(metadata=meta,shortName='Maddison Project / OWID',license='CC BY 4.0; Bolt & van Zanden (2024), DOI 10.1111/joes.12618; underlying country papers in the original workbook',originalSourceUrl='https://www.rug.nl/ggdc/historicaldevelopment/maddison/releases/maddison-project-database-2023',originalPapersUrl='https://dataverse.nl/api/access/datafile/421302')
    rows=list(csv.DictReader((raw/(slug+'.csv')).open(encoding='utf-8-sig')))
    grouped=defaultdict(list)
    for row in rows:grouped[row['Entity']].append(row)
    regionByName={c['en']:c for c in countries.values()}
    for entity,rows in grouped.items():
        code=rows[0]['Code']; c=countries.get(code) or regionByName.get(entity) or ({'id':'TWN','region':'EAS'} if code=='TWN' else None)
        # Keep former states and the source's regional aggregates separate.
        aggregate=entity in ['Czechoslovakia','USSR','Yugoslavia','Sudan (former)'] or '(Maddison)' in entity or entity=='World'
        s=series(tid,entity,entity,'int. USD 2011 / osobę','maddison-int-usd2011-person',notes=note,kind='estimate',entity=entity,metric='Maddison GDP per capita')
        s.update(countryCode=c['id'] if c else code,region=c['region'] if c else 'historical',aggregate=aggregate,metricLabels={'pl':'PKB na mieszkańca · estymacja Maddison','en':'GDP per capita · Maddison estimate'},observationYears=sorted(int(r['Year']) for r in rows if r['GDP per capita']))
        for r in rows:
            if r['GDP per capita']:point(s,f"{int(r['Year']):04d}",float(r['GDP per capita']),sid,sourceAnnotation=r.get('GDP per capita (Annotations)',''))
    topics[tid]['defaults']=[tid+'--'+c for c in ['poland','germany','south-korea']]
    topics[tid]['variants']=['Polska, Niemcy i Korea Południowa w latach 1950–2022. Porównaj poziomy albo tempo zmian od wspólnego roku.', 'Europa Środkowa przed i po 1989 r.; uwzględnij luki, granice i historyczne rekonstrukcje. Daty graniczne ustawiasz samodzielnie.']
