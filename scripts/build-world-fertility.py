"""Reproducible, reviewed comparison; no status inference from fertility or missing text."""
import csv, html, json, pathlib, re, statistics
ROOT=pathlib.Path(__file__).resolve().parents[1]
RAW=ROOT/'research/conscription-fertility'
OUT=ROOT/'public/graphics'
archive=json.loads((RAW/'factbook-2024.json').read_text(encoding='utf8'))
eu=json.loads((OUT/'fertility-conscription.json').read_text(encoding='utf8'))
countries=json.loads((ROOT/'src/world-bank-countries.json').read_text(encoding='utf8'))
raw=json.loads((RAW/'world-bank-2024.json').read_text(encoding='utf8'))
clean=lambda s:html.unescape(re.sub('<[^>]+>',' ',s)).strip()
aliases={'The Bahamas':'BHS','The Gambia':'GMB','DRC':'COD','Congo (Brazzaville)':'COG','Burma':'MMR','Brunei':'BRN','China':'CHN','North Korea':'PRK','South Korea':'KOR','Iran':'IRN','Russia':'RUS','Egypt':'EGY','Turkey':'TUR','Syria':'SYR','Laos':'LAO','Slovakia':'SVK','Kyrgyzstan':'KGZ','Venezuela':'VEN','Yemen':'YEM','The Dominican':'DOM','Sao Tome and Principe':'STP','Saint Kitts and Nevis':'KNA','Saint Lucia':'LCA','Saint Vincent and the Grenadines':'VCT'}
paths={'africa/ct.json':'CAF','middle-east/ae.json':'ARE','australia-oceania/fm.json':'FSM'}
paths.update({'africa/iv.json':'CIV','europe/kv.json':'XKX'})
names={clean(c[k]).casefold():c['id'] for c in countries if not c['aggregate'] for k in ['en','sourceName']}
names.update({k.casefold():v for k,v in aliases.items()})
wb={c['id']:c for c in countries if not c['aggregate']}
values={r['countryiso3code']:r for r in raw[1] if r['value'] is not None}
# Explicit reviewed lists, not a regex classifier. Source excerpts are saved per row.
active=set('DZA AGO BEN TCD CPV EGY ERI GIN MLI MAR MOZ NER GNB TUN CUB SLV GTM KGZ KAZ TJK TKM UZB PRK KOR LAO MNG SGP THA VNM BLR MDA NOR CHE ARE AZE ARM GEO IRN ISR KWT QAT TUR MEX BOL BRA COL PRY RUS'.split())
inactive=set('BWA BDI COG CMR COM CAF DJI GMB GAB GHA CIV KEN LBR LSO MDG MWI MRT NGA RWA SYC ZAF SEN SLE SOM TGO STP UGA NAM SWZ ZMB ZWE AUS FJI NZL TON ATG BRB BHS BLZ DOM HTI HND JAM NIC KNA TTO BRN IDN JPN MYS PNG PHL ALB BIH MNE MKD SRB SMR GBR BHR IRQ LBN OMN SAU ARG ECU GUY SUR PER URY AFG BGD LKA IND MDV NPL PAK MUS SLB FSM KIR VUT NRU PLW MHL TUV WSM CRI DMA GRD PAN LCA VCT AND ISL LIE'.split())
excluded={
 'CHN':('Pobór ustawowy i kwoty rekrutacji; źródło nie rozstrzyga, czy w 2024 stosowano przymus.','Legal levy and recruitment quotas; actual compulsion in 2024 is not established.'),
 'KHM':('Sprzeczne opisy wykonania poboru; zapowiedź wdrożenia od 2026.','Conflicting descriptions of enforcement; implementation announced for 2026.'),
 'COD':('Źródło wprost podaje niejasny zakres stosowania poboru.','Source explicitly says the extent of conscription is unclear.'),
 'GNQ':('Pobór rzadki w praktyce; brak potwierdzenia realizacji w 2024.','Conscription rare in practice; implementation in 2024 not confirmed.'),
 'ETH':('Dobrowolna rekrutacja i możliwe przymusowe powołania; nieustalona praktyka.','Voluntary recruitment with possible compulsory call-ups; practice unresolved.'),
 'LBY':('Brak danych o systemie rekrutacji.','Recruitment-system data unavailable.'),
 'SSD':('Konflikt i niezweryfikowany zakres przymusowej rekrutacji.','Conflict and unverified scope of compulsory recruitment.'),
 'SDN':('Wojna i nierównomierne wykonywanie poboru.','War and uneven enforcement.'),
 'BFA':('Nadzwyczajne uprawnienia mobilizacyjne od 2023, nie zwykły pobór.','Emergency mobilization powers since 2023, not ordinary conscription.'),
 'TZA':('Mieszany obowiązek służby publicznej; nieporównywalny bez dodatkowego rozdzielenia.','Mixed public-service obligation; needs separate classification.'),
 'MMR':('Wdrożenie poboru w trakcie 2024 i wojna domowa.','Conscription introduced during 2024 amid civil war.'),
 'TLS':('Źródło podaje niejasny poziom wdrożenia.','Source says implementation is unclear.'),
 'UKR':('Mobilizacja wojenna; nieporównywalna ze zwykłym poborem.','Wartime mobilization, not comparable with ordinary conscription.'),
 'SYR':('Zmiana reżimu w grudniu 2024 i zerwana ciągłość systemu.','December 2024 regime change and recruitment-system discontinuity.'),
 'JOR':('Zapowiedzi wznowienia nie potwierdzają realizacji w 2024.','Reintroduction announcements do not establish actual operation in 2024.'),
 'YEM':('Ograniczona informacja od początku wojny domowej.','Limited information since the civil war began.'),
 'CHL':('Pobór rezerwowy zwykle niewykorzystywany; brak rozstrzygnięcia dla 2024.','Fallback draft usually unnecessary; 2024 practice unresolved.'),
 'VEN':('Obowiązek szkolenia przy zakazie przymusowej rekrutacji.','Training obligation alongside prohibition of forcible recruitment.'),
 'BTN':('Brak poboru do armii, ale obowiązkowe szkolenie milicji.','No army conscription but mandatory militia training.'),
}
inactive.update(['USA','CAN'])
records={};unmatched=[]
for r in archive['rows']:
 name=clean(r['name'].get('conventional short form',{}).get('text',''))
 code=paths.get(r['path']) or names.get(name.casefold())
 if not code:
  if r['service']:unmatched.append([r['path'],name])
  continue
 records[code]=r
rows=[];omissions=[]
euids={r['id'] for r in eu['rows']}
for code in sorted(active|inactive|set(excluded)|euids):
 assert code in wb,code
 region='Europe' if code in euids else {'africa':'Africa','australia-oceania':'Oceania','east-n-southeast-asia':'Asia','central-asia':'Asia','south-asia':'Asia','middle-east':'Asia','europe':'Europe','north-america':'Americas','south-america':'Americas','central-america-n-caribbean':'Americas'}[records[code]['path'].split('/')[0]]
 if code=='RUS':region='Europe'
 if code=='PNG':region='Oceania'
 if code in excluded:
  r=records[code];omissions.append({'id':code,'name':{'pl':wb[code]['pl'],'en':wb[code]['en']},'region':region,'reason':dict(zip(['pl','en'],excluded[code])),'source':'https://github.com/factbook/factbook.json/blob/'+archive['commit']+'/'+r['path']});continue
 assert code in values,code
 if code in euids:row=dict(next(r for r in eu['rows'] if r['id']==code));evidence='EPRS Table 1, historical 2024 classification.';evidence_year=2024
 else:
  r=records[code];assert r,code
  evidence=clean(' '.join((r['service'] or r['branches']).values()))
  years=re.findall(r'\((20\d\d)\)',evidence);evidence_year=int(years[0]) if years else None
  row={'id':code,'countryCode':code,'name':{'pl':wb[code]['pl'],'en':wb[code]['en']},'value':values[code]['value'],'year':2024,'statusYear':2024,'group':'active' if code in active else 'inactive','statusSource':'https://github.com/factbook/factbook.json/blob/'+archive['commit']+'/'+r['path'],'fertilitySource':eu['rows'][0]['fertilitySource'],'statusNote':{'pl':'Klasyfikacja opisów w archiwum z 26.12.2024; nie pomiar wpływu poboru.','en':'Classification of descriptions in the 26 Dec 2024 archive; not a measure of conscription effects.'}}
 row.update(region=region,eu=code in euids,statusEvidence=evidence,evidenceYear=evidence_year)
 rows.append(row)
assert not (active&inactive)
dataset={**eu,'id':'fertility-conscription-world-2024','version':2,'universe':'world sample','rows':rows,'excluded':omissions,'archiveDate':archive['date'],'sources':eu['sources']+[{'id':'factbook','name':'CIA World Factbook · archiwum / mirror 26.12.2024','url':'https://github.com/factbook/factbook.json/tree/'+archive['commit']},{'id':'cambodia','name':'AKP · Cambodia, announcement of implementation from 2026','url':'https://akp.gov.kh/post/detail/342149'}], 'methodology':{'pl':'Próba krajów z różnych regionów, nie komplet wszystkich państw. Dzietność WDI: 2024. Status poboru: ręczna klasyfikacja opisów CIA World Factbook z archiwum 26.12.2024; UE według EPRS. Część opisów CIA pochodzi z 2023 lub wcześniejszych lat, co oznacza niepewność aktualności; rok opisu dostępny przy kraju. Przypadki niejednoznaczne i wybrane systemy mobilizacji wojennej pominięto jawnie. Czynny pobór obejmuje systemy selektywne, a brak poboru także państwa bez armii. Średnia/mediana: każdy kraj ma równą wagę. Różnice nie dowodzą wpływu służby na dzietność; skład regionów, dochód, wojna i polityka rodzinna mogą je wyjaśniać.','en':'A multi-region sample, not every country. WDI fertility: 2024. Recruitment status: manual classification of CIA World Factbook descriptions archived on 26 Dec 2024; EU from EPRS. Some CIA entries date to 2023 or earlier, creating freshness uncertainty; each country exposes the entry year. Ambiguous cases and selected wartime mobilization systems are explicitly excluded. Active includes selective conscription; inactive includes countries without armies. Each country has equal weight in means/medians. Differences do not establish causation; region composition, income, war and family policy may explain them.'}}
(OUT/'fertility-conscription-world.json').write_text(json.dumps(dataset,ensure_ascii=False,indent=2),encoding='utf8')
summary=[]
for region in ['World','EU','Europe','Asia','Africa','Americas','Oceania']:
 members=[r for r in rows if region=='World' or (region=='EU' and r['eu']) or r['region']==region]
 for group in ['active','inactive']:
  values_in_group=[r['value'] for r in members if r['group']==group]
  summary.append({'region':region,'group':group,'n':len(values_in_group),'mean':statistics.mean(values_in_group) if values_in_group else None,'median':statistics.median(values_in_group) if values_in_group else None,'year':2024})
(OUT/'fertility-regional-summary.json').write_text(json.dumps(summary,indent=2),encoding='utf8')
with (OUT/'fertility-conscription-world.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f);w.writerow(['iso3','country_pl','country_en','region','eu','year','births_per_woman','group','status_year','evidence_year','status_source','fertility_source'])
 for r in rows:w.writerow([r['id'],r['name']['pl'],r['name']['en'],r['region'],r['eu'],2024,r['value'],r['group'],2024,r['evidenceYear'],r['statusSource'],r['fertilitySource']])
print(json.dumps({'included':len(rows),'excluded':len(omissions),'unmatched':unmatched,'groups':{g:{'n':len([r for r in rows if r['group']==g]),'mean':sum(r['value'] for r in rows if r['group']==g)/len([r for r in rows if r['group']==g])} for g in ['active','inactive']}},ensure_ascii=False))
