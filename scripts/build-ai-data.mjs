import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseCsv,numeric,trackingDate,trackingIq} from './ai-csv.mjs';
import {aaDatasets} from './aa-datasets.mjs';
import {arc3Datasets} from './arc3-datasets.mjs';
import {trackingRankings} from './tracking-iq.mjs';
const raw='research/ai',out='public/ai';
const {retrievedAt}=JSON.parse(await fs.readFile(`${raw}/source-receipt.json`,'utf8'));
const epochUrl='https://epoch.ai/benchmarks/use-this-data';
const read=async file=>parseCsv(await fs.readFile(`${raw}/${file}`,'utf8'));
const meta=new Map((await read('epoch/model_metadata.csv')).filter(r=>r.model_version).map(r=>[r.model_version,r]));
const datasets=[],audit=[],sonnet55Coverage=new Map(),sol61Coverage=new Map();
await fs.mkdir(out,{recursive:true});
async function save(d,files){
  const ids=new Set();d.rows=d.rows.filter(r=>{if(ids.has(r.id))return false;ids.add(r.id);return true;}).sort((a,b)=>(a.observedAt||a.releaseDate||'').localeCompare(b.observedAt||b.releaseDate||'')||a.id.localeCompare(b.id));
  if(!d.rows.length)throw new Error(`Empty benchmark: ${d.id}`);
  sonnet55Coverage.set(d.id,d.rows.some(r=>/sonnet[\s_-]*5[.\s_-]*5/i.test(`${r.model} ${r.modelId}`)));
  sol61Coverage.set(d.id,d.rows.some(r=>/gpt[\s_-]*6[.\s_-]*1[\s_-]*sol/i.test(`${r.model} ${r.modelId}`)));
  d.retrievedAt=d.retrievedAt||retrievedAt;
  d.provenance=await Promise.all(files.map(async file=>({file,sha256:createHash('sha256').update(await fs.readFile(`${raw}/${file}`)).digest('hex')})));
  await fs.writeFile(`${out}/${d.id}.json`,JSON.stringify(d));
  const {rows,...summary}=d;
  datasets.push({...summary,count:rows.length,models:new Set(rows.map(r=>r.modelId)).size,firstDate:rows.map(r=>r.releaseDate||r.observedAt?.slice(0,10)).filter(Boolean).sort()[0],lastDate:rows.map(r=>r.observedAt?.slice(0,10)||r.releaseDate).filter(Boolean).sort().at(-1)});
}
const specs=[
 ['gpqa','GPQA Diamond','gpqa_diamond.csv','Nauka','198 pytań z biologii, chemii i fizyki. Wynik średni z ewaluacji Epoch, nie najlepszy scorer.','gpqa-diamond'],
 ['math5','MATH Level 5','math_level_5.csv','Matematyka','Najtrudniejszy poziom zadań MATH; odsetek poprawnych odpowiedzi.','math-level-5'],
 ['mock-aime','OTIS Mock AIME 2024–2025','otis_mock_aime_2024_2025.csv','Matematyka','Próbne zadania OTIS. To nie oficjalne wyniki zawodników AIME.','otis-mock-aime-2024-2025'],
 ['swe-v2','SWE-bench Verified · Epoch v2','swe_bench_verified.csv','Kod','Naprawianie repozytoriów. Odrębny zbiór po zmianie środowiska 12.02.2026; 484 zadania w aktualnej metodologii Epoch.','swe-bench-verified'],
 ['swe-v1','SWE-bench Verified · Epoch v1','swe_bench_verified.csv','Kod','Archiwum przed 12.02.2026. Nie łączymy z v2: zmiana środowiska istotnie poprawiła wyniki.','swe-bench-verified'],
 ['frontiermath','FrontierMath · 2025','frontiermath.csv','Matematyka','Prywatny zestaw 2025-02-28. Od 13.11.2025 budżet tokenów zwiększono 10×; porównania wymagają uwzględnienia tej zmiany.','frontiermath-tiers-1-3-v1'],
 ['frontiermath-v2','FrontierMath · tiers 1–3 v2','frontiermath_tiers_1_3_v2.csv','Matematyka','Nowa wersja prywatnego zestawu; nie zszywamy jej z poprzednią skalą trudności. Dokumentacja obejmuje tiers 1–3 i tier 4.','frontiermath-tier-4-v2'],
 ['frontiermath4','FrontierMath · tier 4','frontiermath_tier_4.csv','Matematyka','Najtrudniejszy poziom, wersja 2025-07-01. Od 13.11.2025 budżet tokenów zwiększono 10×. Dokumentacja v1 obejmuje oba poziomy.','frontiermath-tiers-1-3-v1'],
 ['frontiermath4-v2','FrontierMath · tier 4 v2','frontiermath_tier_4_v2.csv','Matematyka','Osobny zestaw najtrudniejszych zadań, wersja v2.','frontiermath-tier-4-v2'],
 ['mmlu','MMLU · 5-shot','mmlu_external.csv','Wiedza','Tylko jawnie oznaczone pomiary 5-shot. Różne źródła mogą mieć inne prompty i implementacje.','mmlu'],
 ['arc1','ARC-AGI-1','arc_agi_external.csv','Rozumowanie','Zewnętrzne wyniki zebrane przez Epoch. Zestawy, koszty i systemy oceny mogą się różnić — sprawdź notatkę rekordu.','arc-agi'],
 ['arc2','ARC-AGI-2','arc_agi_2_external.csv','Rozumowanie','Osobno od ARC-AGI-1. Wynik dotyczy konfiguracji systemu; nie samej nazwy rodziny modeli.','arc-agi-2'],
 ['hle','Humanity’s Last Exam','hle_external.csv','Wiedza','Wyniki zewnętrzne zebrane przez Epoch. Dostęp do narzędzi i konfiguracja zależą od rekordu.','hle'],
];
for(const [id,name,file,category,description,slug] of specs){
 const sourceRows=await read(`epoch/${file}`);let skipped=0;
 const rows=sourceRows.flatMap((r,index)=>{
   if(id==='mmlu'&&r.Shots!=='5')return [];
   if(id.startsWith('swe-')&&(!r['Started at']||((r['Started at'].slice(0,10)>='2026-02-12')!==(id==='swe-v2'))))return [];
   const score=numeric(r.mean_score??r.EM??r.Score??r.Accuracy),modelId=r['Model version']||(r.Name?'name:'+r.Name:null);
   if(score===null||score<0||score>1||!modelId){skipped++;return [];}
   const m=meta.get(modelId)||{}, releaseDate=r['Release date']||m.date||null;
   if(releaseDate&&!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate))throw new Error(`Bad release date ${releaseDate}`);
   const observedAt=r['Started at']||null;
   const sourceUrl=(r['Source link']||r['Log viewer']||`https://epoch.ai/benchmarks/${slug}`).replace(/^http:\/\/arxiv.org\//,'https://arxiv.org/');
   // Undated external reports are distinct observations, not chronological reruns.
   return [{id:r.id||`${id}-${index}`,modelId:file.endsWith('_external.csv')?`${modelId}::${r.id||index}`:modelId,model:m.display_name||r.Name||modelId,organization:r.Organization||m.organization||'Nie podano',releaseDate,observedAt,score:score*100,stderr:numeric(r.stderr??r['Accuracy Standard Error'])===null?null:Number(r.stderr??r['Accuracy Standard Error'])*100,sourceUrl,notes:[r.Notes,r.Source,r.Shots?`Shots: ${r.Shots}`:''].filter(Boolean).join(' · '),protocol:id==='gpqa'?(observedAt?.slice(0,10)>='2026-02-20'?'Prompt od 20.02.2026':'Prompt przed 20.02.2026'):id==='mmlu'?(r.Source||'Źródło nieokreślone'):'Wszystkie rekordy źródła'}];
 });
 audit.push({id,input:sourceRows.length,accepted:rows.length,invalid:skipped});
 await save({id,name,category,description,unit:'%',max:100,defaultBasis:'release',source:'Epoch AI',sourceUrl:`https://epoch.ai/benchmarks/${slug}`,license:file.endsWith('_external.csv')?'Dane zewnętrzne: sprawdź licencję źródła; agregacja Epoch AI.':'Epoch AI · CC BY 4.0',caveat:id.startsWith('swe')?'Wyniki zależą od środowiska i narzędzi. v1 i v2 są rozdzielone.':file.endsWith('_external.csv')?'Różne konfiguracje i źródła; to zestawienie raportów, nie kontrolowany eksperyment.':'Warianty modeli i budżety rozumowania są odrębnymi rekordami. Sprawdź log ewaluacji.',baseline:id==='gpqa'?{name:'Eksperci dziedzinowi z doktoratem',score:69.7,unit:'%',note:'Grupa ekspertów w ewaluacji OpenAI; nie przeciętny człowiek. Inny protokół niż pomiary Epoch.',sourceUrl:'https://epoch.ai/benchmarks/gpqa-diamond'}:null,rows},[`epoch/${file}`,'epoch/model_metadata.csv']);
}
await save({id:'eci',name:'ECI · indeks możliwości',category:'Przekrojowe',description:'Indeks Epoch łączący ponad 50 benchmarków. Skala umowna: nie IQ ani procent poprawnych odpowiedzi.',unit:'ECI',defaultBasis:'release',source:'Epoch AI',sourceUrl:'https://epoch.ai/eci',license:'Epoch AI · CC BY 4.0',caveat:'Retrospektywne przeliczenie całej historii w aktualnej wersji indeksu. Przedziały: bootstrap 90%. Brak ludzkiego punktu odniesienia.',rows:(await read('epoch/epoch_capabilities_index/eci_scores.csv')).filter(r=>numeric(r.eci)!==null&&r.date).map((r,i)=>({id:`eci-${i}`,modelId:r.Model,model:r['Display name']||r.Model,organization:r.Organization,releaseDate:r.date,observedAt:null,score:Number(r.eci),low:numeric(r.eci_ci_low),high:numeric(r.eci_ci_high),protocol:'Aktualna wersja ECI',sourceUrl:'https://epoch.ai/eci',notes:r['Model accessibility']}))},['epoch/epoch_capabilities_index/eci_scores.csv']);
const iq=await read('tracking-iq.csv');
const trackingReceipt=JSON.parse(await fs.readFile(`${raw}/tracking-receipt.json`,'utf8'));
for(const source of ['Offline Test','Mensa Norway'])for(const vision of [false,true]){
 const id=`iq-${source==='Offline Test'?'offline':'mensa'}${vision?'-vision':''}`;
 const rows=iq.flatMap((r,i)=>{if(r.test_source!==source||/vision/i.test(r.ai_name)!==vision)return [];const score=trackingIq(r),observedAt=trackingDate(r.date_time);if(score===null||!observedAt)return [];return [{id:`tracking-${i}`,modelId:r.ai_name,model:r.ai_name,organization:'TrackingAI · alias modelu',releaseDate:null,observedAt,score,rawScore:Number(r.test_score),validScore:Number(r.valid_test_score),total:Number(r.total_possible_score),refusals:numeric(r.num_refused_questions),protocol:vision?'Obraz':'Opis tekstowy',sourceUrl:'https://www.trackingai.org/home',notes:r.updates_annotation_desc||''}];});
 await save({id,name:`„IQ” · ${source}${vision?' · Vision':' · tekst'}`,category:'IQ eksperymentalne',trackingTest:source==='Offline Test'?'offline':'mensa',retrievedAt:trackingReceipt.checkedAt.slice(0,10),checkedAt:trackingReceipt.checkedAt,description:'Pojedyncze pomiary TrackingAI, przeliczone według formuły autora. Bez średniej kroczącej z 7 testów stosowanej w bieżącym rankingu.',unit:'pkt „IQ”',defaultBasis:'observed',source:'TrackingAI · Maxim Lott',sourceUrl:'https://www.trackingai.org/home',license:'Brak zadeklarowanej otwartej licencji w pobranym CSV; podawaj autora i sprawdź warunki wykorzystania.',caveat:'To wynik quizu według TrackingAI, nie diagnoza IQ modelu. Test publiczny może być znany z treningu; tekst i Vision są rozdzielone. Alias API mógł zmieniać model. Strefa czasu źródła nie jest podana.',formula:source==='Offline Test'?'round(63.5 + 3 × 0.8823 × ((valid_test_score − 3) × (35 / 14)))':'round(63.5 + 3 × (test_score − 5.833))',rows},['tracking-iq.csv']);
}
await save({id:'codeforces2024',name:'Codeforces · raport OpenAI 2024',category:'AI vs człowiek',description:'Symulowane konkursy, maksymalnie 10 zgłoszeń. Percentyl odnosi się do uczestników Codeforces, nie wszystkich programistów.',unit:'percentyl',max:100,defaultBasis:'observed',source:'OpenAI · 12.09.2024',sourceUrl:'https://openai.com/index/learning-to-reason-with-llms/',license:'Wartości z opublikowanego raportu; przypisanie do źródła.',caveat:'Wspólna data publikacji, nie chronologia premier. o1 z raportu nie jest tym samym co publiczne o1-preview. Specjalistyczny wariant do IOI jest odrębnym systemem.',baseline:{name:'Mediana uczestników',score:50,unit:'percentyl',note:'50. percentyl z definicji skali; to uczestnicy konkursów, nie populacja ludzi.',sourceUrl:'https://openai.com/index/learning-to-reason-with-llms/'},rows:[['GPT-4o',11,808],['o1-preview',62,1258],['o1 (raport badawczy)',89,1673],['o1 dostrojony do IOI',93,1807]].map(([model,score,elo],i)=>({id:`cf-${i}`,modelId:model,model,organization:'OpenAI',releaseDate:null,observedAt:'2024-09-12',score,elo,protocol:'Symulacja · 10 zgłoszeń',sourceUrl:'https://openai.com/index/learning-to-reason-with-llms/',notes:`Rating Codeforces: ${elo}. Data publikacji raportu.`}))},[]);
for(const benchmark of trackingRankings(iq,trackingReceipt.config,trackingReceipt.checkedAt))await save(benchmark,['tracking-iq.csv','tracking-receipt.json']);
const releaseReport=JSON.parse(await fs.readFile(`${raw}/sonnet-5-5-report.json`,'utf8'));
const arcReceipt=JSON.parse(await fs.readFile(`${raw}/arc-agi-3-receipt.json`,'utf8'));
const arcSnapshot=JSON.parse(await fs.readFile(`${raw}/${arcReceipt.file}`,'utf8'));
for(const benchmark of arc3Datasets(arcSnapshot,arcReceipt))await save(benchmark,[arcReceipt.file,'arc-agi-3-receipt.json']);
audit.push({id:'arc3-snapshot',input:arcSnapshot.evaluations.length,accepted:datasets.filter(d=>d.id==='arc3'||d.id==='arc3-provider-adapter').reduce((n,d)=>n+d.count,0)});
for(const benchmark of releaseReport.benchmarks)await save({...benchmark,retrievedAt:releaseReport.retrievedAt},['sonnet-5-5-report.json','epoch/model_metadata.csv']);
const sonnetRelease={model:'Claude Sonnet 5.5',releaseDate:'2026-09-28',sourceUrl:releaseReport.sourceUrl,benchmarkId:'terminal4-report',benchmarkIds:releaseReport.benchmarks.map(b=>b.id),missingBenchmarks:['eci',...datasets.filter(d=>d.id.startsWith('iq-')).map(d=>d.id)].filter(id=>!sonnet55Coverage.get(id))};
const aaSnapshot=JSON.parse(await fs.readFile(`${raw}/aa-2026-09-30.json`,'utf8'));
const aaBenchmarks=aaDatasets(aaSnapshot);
for(const benchmark of aaBenchmarks)await save(benchmark,['aa-2026-09-30.json']);
audit.push({id:'aa-snapshot',acceptedModels:aaSnapshot.models.length,excludedEstimatedOrUnmeasured:aaSnapshot.excludedEstimatedOrUnmeasured,excludedBenchmarks:aaSnapshot.excludedBenchmarks});
const featuredRelease={model:'GPT-6.1 Sol',releaseDate:'2026-09-29',sourceUrl:'https://openai.com/index/introducing-gpt-6-1-sol/',benchmarkId:'aa-index-v432',benchmarkIds:aaBenchmarks.filter(b=>sol61Coverage.get(b.id)).map(b=>b.id),missingBenchmarks:['eci',...datasets.filter(d=>d.id.startsWith('iq-')).map(d=>d.id)].filter(id=>!sol61Coverage.get(id)),summary:{pl:'Premiera 29.09.2026. Pięć poziomów rozumowania w niezależnych pomiarach Artificial Analysis. Wybierz benchmark i porównaj z pozostałymi modelami.',en:'Released September 29, 2026. Five reasoning efforts in independent Artificial Analysis evaluations. Choose a benchmark and compare with other models.'}};
await fs.writeFile(`${out}/manifest.json`,JSON.stringify({retrievedAt,sourceArchive:'https://epoch.ai/data/benchmark_data.zip',totalObservations:datasets.reduce((a,d)=>a+d.count,0),benchmarks:datasets,audit,featuredRelease,featuredReleases:[featuredRelease,sonnetRelease]},null,2));
console.log(JSON.stringify({benchmarks:datasets.length,observations:datasets.reduce((a,d)=>a+d.count,0),audit},null,2));
