import React,{useEffect,useMemo,useState} from 'react';
import {ArrowUpRight,BrainCircuit,Download,Info,Search} from 'lucide-react';
import {ExportModal,Field,ReelPreview} from './components.jsx';
import {downloadBlob} from './data.js';
import {marketCsv} from './market.js';
import {aiDate,aiFormats,aiValue,rankAt,selectAiRows,timelineSelection} from './ai.js';
import './ai.css';
const json=async(path,signal)=>{const r=await fetch(path,{signal});if(!r.ok)throw new Error('Nie udało się wczytać danych benchmarku. Odśwież stronę.');return r.json();};
const safeUrl=url=>/^https:\/\//.test(url||'')?url:undefined;
export default function AIStudio(){
 const [manifest,setManifest]=useState(null),[data,setData]=useState(null),[id,setId]=useState('eci'),[error,setError]=useState('');
 const [basis,setBasis]=useState('release'),[start,setStart]=useState(''),[end,setEnd]=useState(''),[query,setQuery]=useState(''),[organization,setOrganization]=useState(''),[protocol,setProtocol]=useState('');
 const [mode,setMode]=useState('timeline'),[duration,setDuration]=useState(20),[theme,setTheme]=useState('dark'),[title,setTitle]=useState('Jak szybko rozwija się AI?'),[comparison,setComparison]=useState(''),[page,setPage]=useState(0),[exporting,setExporting]=useState(false);
 useEffect(()=>{const c=new AbortController();json('/ai/manifest.json',c.signal).then(setManifest).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>c.abort();},[]);
 useEffect(()=>{const c=new AbortController();setData(null);setError('');json(`/ai/${id}.json`,c.signal).then(d=>{setData(d);setBasis(d.defaultBasis);setStart('');setEnd('');setQuery('');setOrganization('');setProtocol(id==='gpqa'?'Prompt od 20.02.2026':'');setComparison('');setMode(id==='codeforces2024'?'duel':'timeline');setTitle(id==='eci'?'Jak szybko rozwija się AI?':id.startsWith('iq-')?'Jak modele rozwiązują test „IQ”?':id==='codeforces2024'?'AI na zawodach programistycznych.':`${d.name}. Kolejne modele.`);}).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>c.abort();},[id]);
 const protocols=useMemo(()=>[...new Set(data?.rows.map(r=>r.protocol)||[])].sort(),[data]);
 const orgs=useMemo(()=>[...new Set(data?.rows.map(r=>r.organization).filter(Boolean)||[])].sort(),[data]);
 const hasObserved=!!data?.rows.some(r=>r.observedAt),hasRelease=!!data?.rows.some(r=>r.releaseDate);
 const rows=useMemo(()=>data?selectAiRows(data.rows,{basis,start,end:end||'9999',organization,query,protocol}):[],[data,basis,start,end,organization,query,protocol]);
 const timeline=useMemo(()=>timelineSelection(rows),[rows]);
 const ranked=useMemo(()=>rankAt(rows,rows.at(-1)?.date||''),[rows]);
 const chosen=ranked.find(r=>r.modelId===comparison)||ranked[0];
 const chartRows=mode==='timeline'?timeline:rows;
 const scope=[organization,query?`Filtr: ${query}`:'',protocol].filter(Boolean).join(' · ');
 const config=useMemo(()=>({format:'9:16',title,theme,ai:{rows:chartRows,benchmark:data,basis,mode,scope,comparison:chosen?.modelId}}),[chartRows,data,basis,mode,title,theme,scope,chosen?.modelId]);
 const valid=!!data&&rows.length>0&&(!start||!end||start<=end)&&(mode!=='duel'||!!data.baseline);
 const missingDates=data?.rows.filter(r=>!aiDate(r,basis)).length||0;
 const latest=data?.rows.map(r=>r.observedAt?.slice(0,10)||r.releaseDate).filter(Boolean).sort().at(-1);
 const pageRows=rows.toReversed().slice(page*20,page*20+20),pages=Math.max(1,Math.ceil(rows.length/20));
 useEffect(()=>setPage(0),[rows]);
 function exportData(type){
   if(type==='csv'){
     const headers=['id','model','modelId','organization','date','releaseDate','observedAt','score','stderr','low','high','rawScore','validScore','total','elo','protocol','sourceUrl','notes'];
     downloadBlob(new Blob([marketCsv(rows.map(r=>headers.map(h=>r[h]??'')),headers)],{type:'text/csv;charset=utf-8'}),`plotwist-ai-${id}.csv`);
   } else downloadBlob(new Blob([JSON.stringify({benchmark:{...data,rows:undefined},selection:{basis,start,end,organization,query,protocol,mode},storyIds:chartRows.map(r=>r.id),rows},null,2)],{type:'application/json'}),`plotwist-ai-${id}-zrodla.json`);
 }
 return <div className="ai-page">
   <div className="ai-heading"><div><span className="ai-eyebrow"><BrainCircuit size={16}/> ARCHIWUM MOŻLIWOŚCI AI</span><h1>Każdy model ma swój moment.</h1><p>Znajdź przełom. Wybierz formę. Opowiedz historię.</p></div><button className="primary" disabled={!valid} onClick={()=>setExporting(true)}><Download size={17}/>Eksportuj rolkę</button></div>
   <div className="ai-counts"><span>{manifest?.benchmarks.length||'…'} zestawów i wersji testów</span><span>{manifest?.totalObservations.toLocaleString('pl-PL')||'…'} pomiarów</span><span>Dane pobrane: {manifest?.retrievedAt||'…'}</span></div>
   <div className="ai-workspace">
     <section className="ai-controls" aria-label="Ustawienia benchmarków AI">
       <Field label="Benchmark"><select value={id} onChange={e=>setId(e.target.value)}>{manifest?.benchmarks.map(b=><option key={b.id} value={b.id}>{b.name}</option>)||<option value="eci">ECI · indeks możliwości</option>}</select></Field>
       {data&&<div className="ai-description"><span className="tag ready">{data.category}</span><p>{data.description}</p><a href={safeUrl(data.sourceUrl)} target="_blank" rel="noreferrer">Metodologia źródła<ArrowUpRight size={13}/></a></div>}
       <Field label="Co oznacza data?"><select value={basis} onChange={e=>{setBasis(e.target.value);setStart('');setEnd('');}}><option value="release" disabled={!hasRelease}>Premiera modelu · retrospektywa</option><option value="observed" disabled={!hasObserved}>Data testu / publikacji wyniku</option></select></Field>
       <div className="field-pair"><Field label="Od dnia"><input type="date" aria-label="Początek historii AI" value={start} onInput={e=>setStart(e.target.value)}/></Field><Field label="Do dnia"><input type="date" aria-label="Koniec historii AI" value={end} onInput={e=>setEnd(e.target.value)}/></Field></div>
       <small className="ai-hint">Puste daty = cała dostępna historia.</small>
       {protocols.length>1&&<Field label="Protokół / źródło"><select value={protocol} onChange={e=>setProtocol(e.target.value)}><option value="">Wszystkie · porównanie orientacyjne</option>{protocols.map(p=><option key={p}>{p}</option>)}</select></Field>}
       {orgs.length>1&&<Field label="Organizacja"><select value={organization} onChange={e=>setOrganization(e.target.value)}><option value="">Wszystkie organizacje</option>{orgs.map(o=><option key={o}>{o}</option>)}</select></Field>}
       <div className="search-field ai-search"><Search size={17}/><input aria-label="Filtr modeli AI" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Filtruj, np. GPT, Claude, Gemini…"/></div>
       <Field label="Tytuł rolki"><textarea maxLength="75" rows="2" value={title} onChange={e=>setTitle(e.target.value)}/></Field>
       <div className="field-pair"><Field label="Długość rolki AI"><select value={duration} onChange={e=>setDuration(Number(e.target.value))}>{[6,12,20,30].map(d=><option key={d} value={d}>{d} s</option>)}</select></Field><Field label="Motyw AI"><select value={theme} onChange={e=>setTheme(e.target.value)}><option value="dark">Po zmroku</option><option value="light">Jasna strona</option></select></Field></div>
       {error&&<p role="alert" className="error">{error}</p>}{!data&&!error&&<p role="status">Wczytywanie wyników…</p>}{data&&!rows.length&&<p role="status" className="error">Brak pomiarów dla tego filtra. Zmień daty, nazwę lub protokół.</p>}
     </section>
     <div className="ai-preview-column"><ReelPreview config={config} duration={duration} valid={valid}/></div>
     <aside className="ai-story-controls">
       <h2>Forma opowieści</h2><p className="muted">Nie każda historia potrzebuje linii.</p>
       <div className="ai-formats" role="group" aria-label="Forma rolki AI">{aiFormats.map((f,i)=><button key={f.id} aria-pressed={mode===f.id} disabled={f.id==='duel'&&!data?.baseline} onClick={()=>setMode(f.id)} className={mode===f.id?'selected':''}><span className="ai-format-number">0{i+1}</span><span><strong>{f.name}</strong><small>{f.id==='duel'&&!data?.baseline?'Dostępne dla GPQA i Codeforces — z opisanym odniesieniem do ludzi.':f.note}</small></span></button>)}</div>
       {mode==='duel'&&data?.baseline&&<Field label="Model do porównania"><select value={chosen?.modelId||''} onChange={e=>setComparison(e.target.value)}>{ranked.map(r=><option key={r.modelId} value={r.modelId}>{r.model} · {aiValue(r.score)} {data.unit}</option>)}</select></Field>}
       <div className="ai-selection"><strong>{rows.length.toLocaleString('pl-PL')} pomiarów w filtrze</strong><p>{mode==='timeline'?`${timeline.length} kart wybranych z kolejnych rekordów w filtrze (maks. 8). Każda karta ma rzeczywistą datę i wartość.`:mode==='ranking'?'Ranking bierze ostatni odnotowany wynik wariantu, nie jego najlepszy wynik. Model pozostaje w rankingu do kolejnego pomiaru.':mode==='duel'?'Porównanie ostatniego wyniku wybranego modelu z opisanym punktem odniesienia.':'Punkty pojawiają się zgodnie z wybraną osią dat. Puste okresy nie są uzupełniane.'}</p></div>
       <div className="ai-context"><Info size={18}/><p>{basis==='release'?'To retrospektywa wg premier. Wynik mógł zostać zmierzony później; nie pokazujemy stanu wiedzy z dnia premiery.':'To daty testów lub publikacji podane przez źródło. Brak daty pomiaru nie jest zastępowany datą premiery.'}</p></div>
     </aside>
   </div>
   {data&&<>
     <div className="ai-method-note"><strong>{data.id.startsWith('iq-')?'„IQ” w cudzysłowie.':data.id==='eci'?'ECI to umowny indeks możliwości.':'Warunki testu mają znaczenie.'}</strong><p>{data.caveat}</p>{data.baseline&&<p><strong>Punkt odniesienia:</strong> {data.baseline.name} · {aiValue(data.baseline.score)} {data.baseline.unit}. {data.baseline.note} <a href={safeUrl(data.baseline.sourceUrl)} target="_blank" rel="noreferrer">Źródło</a></p>}</div>
     <section className="ai-results" aria-label="Tabela wyników benchmarków"><div className="ai-table-heading"><div><h2>Wyniki, które stoją za rolką.</h2><p>{data.name} · {data.unit} · {missingDates>0?`${missingDates} rekordów bez wybranego rodzaju daty pominięto.`:'Każdy wynik ma odsyłacz do źródła.'}</p></div><div><button className="secondary" disabled={!rows.length} onClick={()=>exportData('csv')}><Download size={16}/>CSV</button><button className="secondary" disabled={!rows.length} onClick={()=>exportData('json')}><Download size={16}/>Dane i metodologia</button></div></div>
       <div className="ai-table-scroll"><table><thead><tr><th>Model / konfiguracja</th><th>Wynik</th><th>Premiera</th><th>Test / publikacja</th><th>Źródło i warunki</th></tr></thead><tbody>{pageRows.map(r=><tr key={r.id}><th scope="row">{r.model}<small>{r.organization}</small><small>{r.modelId!==r.model?r.modelId:''}</small></th><td><strong>{aiValue(r.score)} {data.unit}</strong>{r.low!=null&&<small>90% CI: {aiValue(r.low)}–{aiValue(r.high)}</small>}{r.stderr!=null&&<small>SE: ±{aiValue(r.stderr)} p.p.</small>}{r.rawScore!=null&&<small>Surowe: {r.rawScore}/{r.total} · valid: {r.validScore}</small>}</td><td>{r.releaseDate||'Nie podano'}</td><td>{r.observedAt?.slice(0,10)||'Nie podano'}</td><td><a href={safeUrl(r.sourceUrl)} target="_blank" rel="noreferrer">Otwórz źródło<ArrowUpRight size={12}/></a><small>{r.protocol}</small>{r.notes&&<details><summary>Notatka źródła</summary><p>{r.notes}</p></details>}</td></tr>)}</tbody></table></div>
       <div className="pagination"><span>Strona {Math.min(page+1,pages)} z {pages} · najnowsze daty najpierw</span><div><button className="secondary" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Poprzednia</button><button className="secondary" disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)}>Następna</button></div></div>
     </section>
     <details className="ai-provenance"><summary>Pochodzenie danych, aktualizacja i ograniczenia</summary><p>Snapshot pobrano {data.retrievedAt}. Najpóźniejsza data w źródle: {latest}. Zbiory nie aktualizują się automatycznie. Historia oznacza wyniki starszych modeli i archiwalne testy, nie komplet dawnych wersji leaderboardów.</p><p>W osi premier stosujemy ostatni pomiar danego wariantu dostępny w snapshotcie. Nie wybieramy najlepszego przebiegu. Braków danych nie zamieniamy na zera. Nazwy wariantów i budżety rozumowania pozostają rozdzielone. Nie wyliczamy średniej z różnych benchmarków.</p>{data.formula&&<p>Przeliczenie autora TrackingAI: <code>{data.formula}</code>. Daty CSV są zapisane jako MM/DD/YYYY. Nie mieszamy testu offline, Mensa Norway ani trybu tekstowego i wizyjnego. Każdy wiersz to pojedynczy test, nie średnia z ostatnich 7 testów.</p>}<p>{data.license}</p><a href={safeUrl(data.sourceUrl)} target="_blank" rel="noreferrer">{data.source} — dokumentacja</a><p>Pełne adresy źródeł, identyfikatory pomiarów i odciski SHA-256 plików wejściowych są w eksporcie JSON.</p></details>
   </>}
   {exporting&&<ExportModal config={config} duration={duration} onClose={()=>setExporting(false)}/>}
 </div>;
}
