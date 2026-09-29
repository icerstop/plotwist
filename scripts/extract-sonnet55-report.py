"""Extract the launch comparison table; keep reported configurations and source evidence."""
import csv, hashlib, json, re
from pathlib import Path
from bs4 import BeautifulSoup

root = Path(__file__).resolve().parents[1]
raw = root / 'research/ai'
url = 'https://www.anthropic.com/claude-sonnet-5-5'
card = url + '-system-card'
aa = 'https://artificialanalysis.ai/articles/claude-sonnet-5-5'
published = '2026-09-28'
retrieved = '2026-09-29'  # This dated report snapshot; refresh only after retrieving its sources again.
table = BeautifulSoup((raw/'sonnet-5-5-announcement.html').read_text(encoding='utf-8'), 'html.parser').find('table')
cells = [[c.get_text(' ', strip=True) for c in tr.find_all(['th','td'], recursive=False)] for tr in table.find_all('tr')]
cells = [r for r in cells if len(r) == 5]
assert cells[0] == ['', 'Sonnet 5.5', 'Sonnet 5', 'Opus 5.5', 'GPT-6 Sol']
assert len(cells) == 9
models = [('claude-sonnet-5-5','Claude Sonnet 5.5','Anthropic'),('claude-sonnet-5','Claude Sonnet 5','Anthropic'),('claude-opus-5-5','Claude Opus 5.5','Anthropic'),('gpt-6-sol','GPT-6 Sol','OpenAI')]
metadata = {r['model_version']:r for r in csv.DictReader((raw/'epoch/model_metadata.csv').open(encoding='utf-8'))}
common = 'Raport opublikowano 28.09.2026; to nie data wykonania testu. Konfiguracje, budżety i środowiska mogą się różnić. Wyniki nie są pomiarami IQ.'
definitions = [
 ('terminal4-report','Terminal-Bench 4.0 · Anthropic','Kod','%', 'Terminal-Bench 4.0 · Claude Code', '66 zadań; Claude Code --bare, safeguards i domyślny fallback. Sonnet 5.5: max; Opus 5.5: xhigh. Bez dostępu do internetu; zasoby buforowane. Osobno od Terminal-Bench 2.0 i pomiarów Artificial Analysis.'),
 ('frontiercode11-report','FrontierCode 1.1 Main · raport','Kod','%', 'FrontierCode 1.1 · Main', 'Zestaw Main, nie Extended. Zachowujemy osobno max i xhigh: większy wysiłek nie musi dawać lepszego wyniku. Claude Code / Codex CLI; wyniki Cognition przytoczone w raporcie Anthropic.'),
 ('cursor4-report','CursorBench 4.0 · raport','Kod','%', 'CursorBench 4.0 · Cursor agent', 'Wyniki zmierzone przez Cursor i przytoczone w raporcie Anthropic. Osobna wersja 4.0, bez łączenia ze starszymi edycjami.'),
 ('gdpval21-report','GDPval-AA v2.1 · raport','Praca zawodowa','Elo', 'GDPval-AA v2.1 · AA', 'Ranking Elo, nie procent ani IQ. Pomiary Artificial Analysis przytoczone przez Anthropic; 220 zadań zawodowych. Sonnet 5.5 testowano przed premierą z błędem structured outputs, naprawionym w wersji publicznej.'),
 ('briefcase11-report','AA-Briefcase v1.1 · raport','Praca zawodowa','Elo', 'AA-Briefcase v1.1 · AA', 'Ranking Elo, nie procent. Pomiary Artificial Analysis przytoczone przez Anthropic. Sonnet 5.5 testowano przed premierą z błędem structured outputs; ponowny pomiar może zmienić wynik.'),
 ('hle-tools-report','HLE · z narzędziami · Anthropic','Wiedza','%', 'HLE · with tools · Anthropic', 'Wyszukiwanie, pobieranie stron i wykonywanie kodu. Budżet 980 tys. tokenów, bez kompakcji; blokowanie źródeł zawierających odpowiedzi HLE. Osobno od wyników bez narzędzi.'),
 ('osworld21-partial-report','OSWorld 2.1 · partial · raport','Obsługa komputera','%', 'OSWorld 2.1 · partial score', 'Partial score: częściowy kredyt za punkty kontrolne, nie odsetek zadań w pełni rozwiązanych. 108 zadań, 1080p, limit 500 kroków, max effort.'),
 ('chartography-report','Chartography · bez narzędzi','Wizja','%', 'Chartography · no tools', 'Rozpoznawanie specjalistycznych wykresów bez narzędzi. Oddzielnie od wariantu z kodem i kadrowaniem obrazu. Niektóre wyniki GPT-6 Sol mogły poprzedzać poprawkę obsługi obrazów.')
]
benchmarks = []
for definition, source_cells in zip(definitions, cells[1:]):
 ident, name, category, unit, protocol, description = definition
 rows=[]
 for (base, model, organization), cell in zip(models, source_cells[1:]):
  match = re.match(r'^(\d+(?:\.\d+)?)',cell)
  if not match: continue  # A dash is missing, not zero.
  effort='max' if organization=='Anthropic' else 'reported'
  if ident=='terminal4-report' and base=='claude-opus-5-5': effort='xhigh'
  rows.append(dict(id=f'{ident}-{base}-{effort}',modelId=f'{base}_{effort}',model=f'{model} ({effort})',organization=organization,releaseDate=metadata[base+'_max']['date'],observedAt=published,dateKind='publication',score=float(match[1]),effort=effort,protocol=protocol,sourceUrl=url,notes=f'{common} {description} Konfiguracja: {effort}.',sourceCell=cell,additionalSourceUrls=[card]))
 if ident=='frontiercode11-report':
  rows.append({**rows[0], 'id':ident+'-claude-sonnet-5-5-xhigh', 'modelId':'claude-sonnet-5-5_xhigh','model':'Claude Sonnet 5.5 (xhigh)','score':52.1,'effort':'xhigh','sourceUrl':card+'#page=111','sourceCell':'52.1% Main, xhigh; section 8.4, page 111','notes':common+' Zestaw Main, xhigh; 46.2% w tej samej tabeli dotyczy max. Źródło: System Card, s. 111.'})
 benchmarks.append(dict(id=ident,name=name,category=category,unit=unit,**({'max':100} if unit=='%' else {}),defaultBasis='release',defaultMode='ranking',source='Anthropic · raport 28.09.2026',sourceUrl=url,description=description,caveat=common,license='Wartości z publicznego raportu; przypisanie do źródeł i autorów ewaluacji.',rows=rows))

# Independent measurements remain separate from the vendor's harness and index.
for ident,name,unit,values,description in [
 ('aa-intelligence-sep26','Artificial Analysis Intelligence Index · 09.2026','pkt indeksu',[('claude-sonnet-5-5','Claude Sonnet 5.5',56,'max'),('claude-opus-5-5','Claude Opus 5.5',58,'max')], 'Snapshot dwóch modeli z raportu 28.09.2026. Indeks Artificial Analysis nie jest ECI ani IQ; nie łączymy różnych wydań indeksu.'),
 ('terminal4-aa-sep26','Terminal-Bench 4.0 · Artificial Analysis','%',[('claude-sonnet-5-5','Claude Sonnet 5.5',64,'max'),('claude-opus-5-5','Claude Opus 5.5',60,'max'),('gpt-6-astra','GPT-6 Astra',60,'xhigh')], 'Wyniki Artificial Analysis zaokrąglone do pełnych procentów w raporcie. Oddzielnie od konfiguracji Anthropic (70,6% dla Sonnet 5.5).')
]:
 rows=[dict(id=f'{ident}-{base}',modelId=f'{base}_{effort}',model=f'{model} ({effort})',organization='Anthropic' if base.startswith('claude') else 'OpenAI',releaseDate=metadata[base+'_'+effort]['date'],observedAt=published,dateKind='publication',score=score,effort=effort,protocol=name,sourceUrl=aa,notes=common+' Sonnet 5.5: przedpremierowy model z błędem structured outputs; default fallback włączony. Źródło zapowiada ponowne pomiary.') for base,model,score,effort in values]
 benchmarks.append(dict(id=ident,name=name,category='Przekrojowe' if unit!='%' else 'Kod',unit=unit,**({'max':100} if unit=='%' else {}),defaultBasis='release',defaultMode='ranking',source='Artificial Analysis · 28.09.2026',sourceUrl=aa,description=description,caveat=common,license='Wartości z publicznego raportu Artificial Analysis; przypisanie autorstwa.',rows=rows))
evidence=dict(retrievedAt=retrieved,publishedAt=published,sourceUrl=url,sourceTable=cells,systemCardUrl=card,systemCardPages=[109,111,113,115,118,125,129,133,134],sourceFiles=[dict(file=f,sha256=hashlib.sha256((raw/f).read_bytes()).hexdigest()) for f in ['sonnet-5-5-announcement.html','sonnet-5-5-system-card.pdf','sonnet-5-5-artificial-analysis.html']],benchmarks=benchmarks)
(raw/'sonnet-5-5-report.json').write_text(json.dumps(evidence,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print(f'Extracted {len(benchmarks)} datasets / {sum(len(b["rows"]) for b in benchmarks)} observations')
