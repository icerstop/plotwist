"""Generate and execute a portable, stdlib-only audit notebook."""
import contextlib, io, json, os
from pathlib import Path
root=Path(__file__).resolve().parents[1]
cells=[]
def md(text):cells.append({'cell_type':'markdown','metadata':{},'source':text.splitlines(True)})
def code(text):cells.append({'cell_type':'code','metadata':{},'source':text.splitlines(True),'execution_count':None,'outputs':[]})
md('''# World Bank i historyczny PKB — audyt 30.09.2026

Jedna obserwacja oznacza kraj/terytorium/agregat × wskaźnik × rok. Nie zastępujemy braków zerami. Źródłowe odpowiedzi WDI i metadane są archiwizowane jako JSON gzip; notebook nie korzysta z sieci.

Źródła: [API World Bank](https://datahelpdesk.worldbank.org/knowledgebase/articles/898581), [Maddison Project](https://www.rug.nl/ggdc/historicaldevelopment/maddison/releases/maddison-project-database-2023), [dystrybucja OWID](https://ourworldindata.org/grapher/gdp-per-capita-maddison-project-database).
''')
code('''import gzip, hashlib, json, csv
from pathlib import Path
candidates=[Path.cwd(),Path.cwd().parents[1]]
root=next(p for p in candidates if (p/'src/world-bank-countries.json').is_file())
read=lambda p:json.loads((root/p).read_text(encoding='utf-8'))
receipt=read('research/world-bank/receipt.json')
countries=read('src/world-bank-countries.json')
allowed={c['id'] for c in countries}
print({'countries_and_territories':sum(not c['aggregate'] for c in countries),'aggregates':sum(c['aggregate'] for c in countries),'indicators':len(receipt['indicators']),'retrievedAt':receipt['retrievedAt']})
''')
code('''total=0
for item in receipt['indicators']:
    raw_bytes=gzip.decompress((root/f"research/world-bank/{item['id']}.json.gz").read_bytes())
    assert hashlib.sha256(raw_bytes).hexdigest()==item['rawSha256']
    raw=json.loads(raw_bytes)
    upstream=[r for page in raw['pages'] for r in page['data'][1]]
    assert len(upstream)==int(raw['pages'][0]['data'][0]['total'])
    assert len(raw['pages'])==int(raw['pages'][0]['data'][0]['pages'])
    expected={(r['countryiso3code'],int(r['date'])):r['value'] for r in upstream if r['countryiso3code'] in allowed}
    blob=(root/f"public/data/{item['id']}.json").read_bytes()
    assert hashlib.sha256(blob).hexdigest()==item['sha256']
    snapshot=json.loads(blob)
    actual={(r['country'],r['year']):r['value'] for r in snapshot['rows']}
    assert len(actual)==len(snapshot['rows'])
    assert actual==expected
    story=read(f"public/stories/{item['id']}.json")
    for series in story['series']:
        extracted={int(p['period']):p['value'] for p in series['points']}
        source={year:value for (country,year),value in expected.items() if country==series['countryCode']}
        assert extracted==source
    total+=sum(v is not None for v in actual.values())
assert total==receipt['observations']==346983
print({'verified_WDI_observations':total,'duplicate_keys':0,'values_changed_or_filled':0})
''')
md('''## Polska — zakres zależy od wskaźnika

Daty początkowa i końcowa nie potwierdzają kompletności lat pośrednich. Gini ma luki. Rok pobrania nie jest rokiem wszystkich obserwacji. Nie ma uniwersalnego limitu 1990–2025 dla Polski.
''')
code('''for item in receipt['indicators']:
    if item['id'] in ['NY.GDP.PCAP.KD','NY.GDP.PCAP.PP.KD','SP.POP.TOTL','SP.DYN.LE00.IN','SP.DYN.TFRT.IN','FP.CPI.TOTL.ZG','SI.POV.GINI','IT.NET.USER.ZS']:
        coverage=next(c for c in item['coverage'] if c['country']=='POL')
        print(item['id'],coverage['first'],coverage['last'],'observations',coverage['count'],'missing_inside',coverage['missingWithin'])
''')
md('''## Maddison — oddzielna historyczna estymacja

Maddison używa stałych dolarów międzynarodowych 2011, WDI PPP — 2021. Nie łączymy poziomów w jeden szereg. Dawne państwa mogą mieć rekonstrukcje dla późniejszych lat. Wczesne punkty są nieciągłe; historyczne granice i zmiany metod ograniczają interpretację. Porównanie przed/po transformacji samo nie dowodzi skutków ustroju.
''')
code('''path=root/'research/stories/raw/gdp-per-capita-maddison-project-database.csv'
maddison_receipt=read('research/stories/raw/gdp-per-capita-maddison-project-database.csv.receipt.json')
assert hashlib.sha256(path.read_bytes()).hexdigest()==maddison_receipt['sha256']
rows=list(csv.DictReader(path.open(encoding='utf-8-sig')))
topic=read('public/stories/maddison-gdp.json')
expected={(r['Entity'],int(r['Year'])):float(r['GDP per capita']) for r in rows if r['GDP per capita']}
actual={(s['entity'],int(p['period'])):p['value'] for s in topic['series'] for p in s['points']}
assert actual==expected
pol=next(s for s in topic['series'] if s['entity']=='Poland')
missing_1950_2022=sorted(set(range(1950,2023))-set(pol['observationYears']))
print({'series':len(topic['series']),'observations':len(actual),'Poland_first':pol['start'],'Poland_last':pol['end'],'Poland_missing_1950_2022':missing_1950_2022})
assert pol['kind']=='estimate'
assert not missing_1950_2022
''')
md('''## Wynik

Potwierdzono kompletność stronicowania, unikalność kraj–rok, SHA-256 i zgodność każdej wartości w snapshotach oraz bibliotece z archiwum źródłowym. Rozszerzenie usuwa wcześniejszą listę 12 krajów. Historyczny Maddison uzupełnia zastosowania sprzed 1990 r. jako jawnie odrębny zbiór, bez udawania obserwacji WDI.

Kod odtwarzający: `scripts/refresh-world-bank.mjs`, `scripts/build_world_bank.py`. Kontrole interfejsu i filtrowania: `tests/world-bank.test.mjs`. Pełna metodologia: `research/world-bank/README.md`.
''')
os.chdir(root);namespace={};count=0
for index,cell in enumerate(cells):
    cell['id']=f'world-bank-audit-{index}'
    if cell['cell_type']!='code':continue
    count+=1;output=io.StringIO()
    with contextlib.redirect_stdout(output):exec(''.join(cell['source']),namespace)
    cell.update(execution_count=count,outputs=[{'output_type':'stream','name':'stdout','text':output.getvalue().splitlines(True)}])
notebook={'cells':cells,'metadata':{'kernelspec':{'name':'python3','display_name':'Python 3','language':'python'},'language_info':{'name':'python','version':'3'}},'nbformat':4,'nbformat_minor':5}
(root/'research/world-bank/audit.ipynb').write_text(json.dumps(notebook,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print(f'Executed {count} audit cells. Full WDI and Maddison values match archived inputs.')
