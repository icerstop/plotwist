"""Build a source-backed, year-aligned EU27 cross-section. No imputation."""
import csv, datetime, hashlib, io, json, pathlib, urllib.request, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
RAW=ROOT/'research/conscription-fertility'
OUT=ROOT/'public/graphics'
RAW.mkdir(parents=True,exist_ok=True);OUT.mkdir(parents=True,exist_ok=True)
URL='https://api.worldbank.org/v2/country/all/indicator/SP.DYN.TFRT.IN?date=2024&format=json&source=2&per_page=1000'
EPRS='https://www.europarl.europa.eu/thinktank/en/academic/EPRS_BRI%282025%29769541'
COUNTRIES={'AUT':'Austria','BEL':'Belgia','BGR':'Bułgaria','HRV':'Chorwacja','CYP':'Cypr','CZE':'Czechy','DNK':'Dania','EST':'Estonia','FIN':'Finlandia','FRA':'Francja','DEU':'Niemcy','GRC':'Grecja','HUN':'Węgry','IRL':'Irlandia','ITA':'Włochy','LVA':'Łotwa','LTU':'Litwa','LUX':'Luksemburg','MLT':'Malta','NLD':'Holandia','POL':'Polska','PRT':'Portugalia','ROU':'Rumunia','SVK':'Słowacja','SVN':'Słowenia','ESP':'Hiszpania','SWE':'Szwecja'}
ACTIVE=set('AUT CYP DNK EST FIN GRC LVA LTU SWE'.split())
path=RAW/'world-bank-2024.json'
if '--refresh' in sys.argv or not path.exists():
    with urllib.request.urlopen(URL,timeout=90) as response: body=response.read()
    parsed=json.loads(body);assert parsed[0]['pages']==1
    path.write_bytes(body)
    (RAW/'receipt.json').write_text(json.dumps({'url':URL,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'sha256':hashlib.sha256(body).hexdigest(),'bytes':len(body)},indent=2))
meta,data=json.loads(path.read_text(encoding='utf8'))
rows=[]
for code,pl in COUNTRIES.items():
    matches=[r for r in data if r['countryiso3code']==code and r['date']=='2024']
    assert len(matches)==1,code
    r=matches[0];assert r['value'] is not None and 0<r['value']<10,code
    rows.append({'id':code,'countryCode':code,'name':{'pl':pl,'en':r['country']['value']},'value':r['value'],'year':2024,'group':'active' if code in ACTIVE else 'inactive','statusYear':2024,'statusSource':EPRS,'fertilitySource':URL,'statusNote':{'pl':'Pobór w czasie pokoju, także selektywny; nie oznacza służby każdej osoby.' if code in ACTIVE else 'Brak czynnego poboru w czasie pokoju; obowiązek może być zawieszony.','en':'Peacetime conscription, including selective systems; not everyone serves.' if code in ACTIVE else 'No active peacetime conscription; the legal duty may be suspended.'}})
receipt=json.loads((RAW/'receipt.json').read_text())
dataset={'id':'fertility-conscription-eu-2024','version':1,'year':2024,'universe':'EU27','indicator':'SP.DYN.TFRT.IN','unit':{'pl':'dzieci na kobietę','en':'births per woman'},'retrievedAt':receipt['retrievedAt'],'lastUpdated':meta['lastupdated'],'rows':rows,'sources':[{'id':'wdi','name':'World Bank · World Development Indicators','url':URL,'metadataUrl':'https://databank.worldbank.org/metadataglossary/world-development-indicators/series/SP.DYN.TFRT.IN','license':'CC BY 4.0'},{'id':'eprs','name':'European Parliamentary Research Service · Table 1','url':EPRS,'publishedAt':'2025-03-19','evidence':'EU27 classification extracted from the indexed official briefing table; historical 2024 cross-section. Latvia compulsory from January 2024. Croatia not yet reintroduced.'},{'id':'latvia','name':'Latvian Ministry of Defence','url':'https://www.mod.gov.lv/en/news/saeima-adopts-state-defence-service-law','evidence':'Compulsory service effective 1 January 2024.'}],'methodology':{'pl':'Przekrój UE-27 za 2024 r. Pobór w czasie pokoju, nie sam obowiązek prawny. Średnia i mediana liczone z krajów, każdy kraj ma równą wagę. Porównanie nie identyfikuje wpływu przyczynowego służby na dzietność. Nie uwzględnia m.in. dochodu, polityki rodzinnej, struktury wieku, migracji ani opóźnień skutków.','en':'EU27 cross-section for 2024. Active peacetime conscription, not the legal duty alone. Mean and median give equal weight to each country. This comparison does not identify a causal effect on fertility. Income, family policy, age structure, migration and delayed effects are not controlled.'}}
(OUT/'fertility-conscription.json').write_text(json.dumps(dataset,ensure_ascii=False,indent=2),encoding='utf8')
with (OUT/'fertility-conscription.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.writer(f);writer.writerow(['iso3','country_pl','country_en','year','births_per_woman','peacetime_conscription','status_year','fertility_source','status_source'])
    for r in rows:writer.writerow([r['id'],r['name']['pl'],r['name']['en'],2024,r['value'],r['group'],2024,URL,EPRS])
(RAW/'classification.json').write_text(json.dumps({'referenceYear':2024,'source':EPRS,'publishedAt':'2025-03-19','reviewedAt':'2026-10-01','active':sorted(ACTIVE),'inactive':sorted(set(COUNTRIES)-ACTIVE),'definition':'Peacetime conscription in operation, including selective systems. Frozen or suspended conscription counts as inactive. No inference for other years.'},indent=2),encoding='utf8')
print(json.dumps({'countries':len(rows),'active':len(ACTIVE),'inactive':len(rows)-len(ACTIVE),'year':2024,'lastUpdated':meta['lastupdated']}))
