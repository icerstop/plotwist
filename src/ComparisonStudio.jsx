import PriceCurrencyPicker from './PriceCurrencyPicker.jsx';
import {FrequencyPicker} from './FrequencyPicker.jsx';
import MarketStories from './MarketStories.jsx';
import {marketStories} from './market-stories.js';
import {frequencyPhrase,periodAmount,scheduleRule} from './recurrence.js';
import {useLanguages,localeFor} from './language-context.js';
import {translate} from './translations.js';
import {PresentationPicker} from './Presentation.jsx';
import {useVisualStatus} from './VisualSettings.jsx';
import {themeOf} from './reel-design.js';
import React,{useEffect,useMemo,useState} from 'react';
import {Download,Plus,Trash2,RotateCcw} from 'lucide-react';
import {ExportModal,Field,ReelPreview} from './components.jsx';
import {buildComparison,comparisonRange} from './comparison.js';
import {fromDay,marketCsv} from './market.js';
import {downloadBlob} from './data.js';
import {preloadReelAssets} from './reel-assets.js';

const fallbackColors=['#76b900','#a6b7cd','#ff8567','#b18aff','#50c9d8','#ebbf4d'];
const initialEntries=[{id:'nvidia',kind:'asset',symbol:'NVDA'},{id:'apple',kind:'asset',symbol:'AAPL'},{id:'drink',kind:'expense',name:'Coca-Cola · wydatki',amount:'3',color:'#f45b69'}];
async function read(path,signal){const response=await fetch(path,{signal});if(!response.ok||!response.headers.get('content-type')?.includes('json'))throw new Error('Nie udało się wczytać danych porównania. Odśwież stronę.');return response.json();}
function SeriesColor({color,index,onChange,onReset}){
 const [hex,setHex]=useState(color);
 useEffect(()=>setHex(color),[color]);
 return <div className="series-color"><label><input type="color" aria-label={`Kolor serii ${index}`} value={color} onInput={e=>onChange(e.target.value)} onChange={e=>onChange(e.target.value)}/><input className="color-hex" aria-label={`Kolor HEX serii ${index}`} value={hex} maxLength={7} onChange={e=>{setHex(e.target.value);if(/^#[0-9a-f]{6}$/i.test(e.target.value))onChange(e.target.value);}} onBlur={()=>setHex(color)}/></label><button className="text-btn" onClick={onReset} aria-label={`Przywróć kolor serii ${index}`}><RotateCcw size={13}/>Domyślny</button></div>;
}

export default function ComparisonStudio({manifest,fx,fontId,onFontChange,active=true,priceCurrency='native',onPriceCurrencyChange}){
 const {uiLanguage,reelLanguage}=useLanguages();
 const value=(n,unit)=>`${n.toLocaleString(localeFor(uiLanguage),{maximumFractionDigits:2})} ${translate(unit,uiLanguage)}`;
 const [extras,setExtras]=useState(null),[brands,setBrands]=useState(null),[assets,setAssets]=useState({});
 const [entries,setEntries]=useState(initialEntries),[mode,setMode]=useState('dca'),[scale,setScale]=useState('index');
 const [start,setStart]=useState('2020-01-01'),[end,setEnd]=useState(''),[investment,setInvestment]=useState('5');
 const [investmentFrequency,setInvestmentFrequency]=useState('daily');
 const [chart,setChart]=useState('line');
 const {visuals}=useVisualStatus(),theme=themeOf({visuals}).dark?'dark':'light';
 const [showLogos,setShowLogos]=useState(true),[duration,setDuration]=useState(12);
 const [title,setTitle]=useState(''),[addType,setAddType]=useState('asset'),[query,setQuery]=useState('');
 const [assetType,setAssetType]=useState('all'),[region,setRegion]=useState('all');
 const [error,setError]=useState(''),[logoError,setLogoError]=useState(''),[loading,setLoading]=useState(true),[logosReady,setLogosReady]=useState(false),[exporting,setExporting]=useState(false);
 useEffect(()=>{const c=new AbortController();Promise.all([read('/commodities/manifest.json',c.signal),read('/logos/manifest.json',c.signal)]).then(([e,b])=>{setExtras(e);setBrands(b);}).catch(e=>{if(e.name!=='AbortError')setError(e.message);});return()=>c.abort();},[]);
 const catalog=useMemo(()=>[...(manifest?.stocks||[]).map(s=>({...s,kind:'stock'})),...(extras?.assets||[])],[manifest,extras]);
 const symbols=[...new Set(entries.filter(e=>e.kind==='asset').map(e=>e.symbol))].sort().join('|');
 useEffect(()=>{
  if(!catalog.length||!extras)return;
  const c=new AbortController();setLoading(true);setError('');
  Promise.all(symbols.split('|').filter(Boolean).map(async symbol=>{
   if(assets[symbol])return [symbol,assets[symbol]];
   const item=catalog.find(a=>a.symbol===symbol);
   if(!item)throw new Error(`Brak instrumentu ${symbol}.`);
   return [symbol,await read(`/${item.kind==='stock'?'market':'commodities'}/${item.file||`${encodeURIComponent(symbol)}.json`}`,c.signal)];
  })).then(pairs=>{setAssets(previous=>({...previous,...Object.fromEntries(pairs)}));setEnd(previous=>previous||pairs.map(([,a])=>a.rows.at(-1)[0]).sort()[0]||'');}).catch(e=>{if(e.name!=='AbortError')setError(e.message);}).finally(()=>{if(!c.signal.aborted)setLoading(false);});
  return()=>c.abort();
  // A new symbol triggers a load; color and label edits reuse the cached data.
 },[symbols,catalog,extras]);
 const selectedAssets=entries.filter(e=>e.kind==='asset').map(e=>assets[e.symbol]);
 const range=comparisonRange(selectedAssets,fx,mode,priceCurrency);
 const resolved=useMemo(()=>entries.map((e,i)=>{const brand=brands?.companies?.[e.symbol];return {...e,color:e.color||(theme==='light'?brand?.chartColorLight:brand?.chartColor)||brand?.brandColor||catalog.find(a=>a.symbol===e.symbol)?.color||fallbackColors[i%fallbackColors.length],logo:showLogos?brand?.path:undefined};}),[entries,brands,catalog,showLogos,theme]);
 const result=useMemo(()=>{try{return {...buildComparison({entries:resolved,assets,fx,start,end,mode,scale,currency:priceCurrency,investmentFrequency,investmentAmount:investment.trim()?Number(investment):NaN}),error:''};}catch(e){return {series:[],summaries:{},error:e.message};}},[resolved,assets,fx,start,end,mode,scale,priceCurrency,investment,investmentFrequency]);
 const matchedStory=mode==='prices'?marketStories.find(s=>s.start===start&&s.end===end&&s.symbols.length===entries.length&&entries.every((e,i)=>e.kind==='asset'&&e.symbol===s.symbols[i])):null;
 const generatedTitle=matchedStory?matchedStory.title[reelLanguage]:mode==='dca'?`${investment||'0'} zł ${frequencyPhrase(investmentFrequency)}. Kilka możliwości.`:scale==='percent'?'Jak zmieniały się ceny?':scale==='index'?'Ten sam start. Różne historie.':'Ceny na wspólnym wykresie.';
 const config=useMemo(()=>({series:result.series,title:title||generatedTitle,titleIsCustom:!!title,subtitle:mode==='dca'?`Osobne portfele · ${investment||0} zł ${frequencyPhrase(investmentFrequency)} na każdy`:`${scale==='index'?'Indeks 100':scale==='percent'?'Zmiana procentowa':'Ceny zamknięcia'} · ${priceCurrency==='native'?'waluty instrumentów':priceCurrency}${result.converted?' · przeliczenie walutowe':''} · wspólna baza ${result.baseDate||'…'}`,source:mode==='dca'?'Yahoo Finance + NBP · bez dywidend, opłat i podatków':result.converted?'Yahoo Finance + NBP · kurs z tabeli sprzed sesji':'Yahoo Finance · waluty instrumentów · bez dywidend',format:'9:16',theme,fontId,chart,unit:result.unit||'',xType:'date',compactTitle:true}),[result,title,generatedTitle,investment,mode,scale,theme,fontId,chart,investmentFrequency,priceCurrency]);
 useEffect(()=>{let active=true;setLogosReady(false);setLogoError('');preloadReelAssets(config).then(()=>{if(active)setLogosReady(true);}).catch(e=>{if(active)setLogoError(e.message);});return()=>{active=false;};},[config]);
 const visibleError=error||logoError||(!loading?result.error:'');
 const valid=!loading&&!visibleError&&logosReady&&result.series.length>0;
 function update(id,patch){setEntries(old=>old.map(e=>e.id===id?{...e,...patch,...(Object.hasOwn(patch,'name')?{nameIsCustom:true}:{})}:e));}
 function add(){
  if(entries.length>=6)return;
  const id=crypto.randomUUID();
  if(addType==='asset'){
   const next=available.find(a=>!entries.some(e=>e.symbol===a.symbol));
   if(next)setEntries(old=>[...old,{id,kind:'asset',symbol:next.symbol}]);
  }else setEntries(old=>[...old,{id,kind:addType,name:addType==='goal'?'Mój cel':'Regularny zakup',amount:addType==='goal'?'10000':'10',color:fallbackColors[old.length%fallbackColors.length]}]);
 }
 function exportCsv(){const rows=result.series.flatMap(s=>s.points.map(p=>[fromDay(p.x),s.name,p.y,result.unit,p.raw??'',entries.find(e=>e.id===s.id)?.symbol||'',s.schedule?.amount??'',s.schedule?.frequency??'',p.deposit??'',p.expense??'',start,end,p.sourceCurrency??'',p.priceCurrency??'',p.convertedClose??'',p.fxRate??'',p.fxDate??'']));downloadBlob(new Blob([marketCsv(rows,['data','seria','wartosc_wykresu','jednostka','cena_zrodlowa','symbol','kwota_okresowa','czestotliwosc','wplata_dnia','wydatek_dnia','poczatek_harmonogramu','koniec_harmonogramu','waluta_zrodlowa','waluta_ceny','cena_po_przeliczeniu','przelicznik_walutowy','data_tabeli_nbp'])],{type:'text/csv;charset=utf-8'}),'plotwist-porownanie.csv');}
 const available=catalog.filter(a=>(mode!=='dca'||a.kind!=='futures')&&(assetType==='all'||a.kind===assetType)&&(region==='all'||a.region===region)&&`${a.name} ${translate(a.name,'en')} ${a.symbol} ${a.country} ${translate(a.country,'en')} ${a.region} ${translate(a.region,'en')}`.toLowerCase().includes(query.toLowerCase()));
 const canAddAsset=available.some(a=>!entries.some(e=>e.symbol===a.symbol));
 function applyStory(story){setEntries(story.symbols.map((symbol,i)=>({id:`${story.id}-${i}`,kind:'asset',symbol})));setStart(story.start);setEnd(story.end);setMode('prices');onPriceCurrencyChange?.('native');setScale(story.scale||'index');setChart('line');setTitle('');setQuery('');setAssetType('all');setRegion('all');}
 return <>
  <div className="market-heading"><div><h1>Jedna historia. Wiele serii.</h1><p>Do 6 serii, różne formy prezentacji, własne kolory i logotypy.</p></div><button className="primary" disabled={!valid} onClick={()=>setExporting(true)}><Download size={17}/>Eksportuj rolkę</button></div>
  <div className="catalog-counts"><span>{catalog.filter(a=>a.kind==='stock').length} <span>akcji</span></span><span>{catalog.filter(a=>a.kind==='etf').length} ETF</span><span>{catalog.filter(a=>a.kind==='fund').length} <span>funduszy surowcowych</span></span><span>{catalog.filter(a=>a.kind==='futures').length} <span>kontraktów surowcowych</span></span></div>
  <MarketStories catalog={catalog} onApply={applyStory}/>
  <div className="market-workspace comparison-workspace">
   <section className="market-controls" aria-label="Ustawienia porównania wielu serii">
    <PresentationPicker config={config} value={chart} onChange={setChart}/><Field label="Co porównujesz?"><select value={mode} onChange={e=>{setMode(e.target.value);if(e.target.value==='dca'&&assetType==='futures')setAssetType('all');}}><option value="dca">Inwestycje w PLN</option><option value="prices">Ceny i zmiany cen</option></select></Field>
    {mode==='dca'?<><Field label="Kwota wpłaty na każdy portfel"><input aria-label="Wpłata na każdy portfel" type="number" min="0.01" max="100000" step="0.01" value={investment} onChange={e=>setInvestment(e.target.value)}/><small translate="no">{periodAmount(investment||0,investmentFrequency,uiLanguage)}</small><small>To osobne scenariusze — każdy portfel otrzymuje pełną kwotę.</small></Field><FrequencyPicker label="Częstotliwość inwestowania" value={investmentFrequency} onChange={setInvestmentFrequency}/><p className="helper schedule-rule">{scheduleRule} Wpłata w dzień bez sesji czeka w gotówce na najbliższą sesję.</p></>:<><Field label="Skala porównania"><select value={scale} onChange={e=>setScale(e.target.value)}><option value="index">Indeks 100 · wspólny start</option><option value="percent">Zmiana procentowa od startu</option><option value="price">Cena · zgodne jednostki</option></select></Field><PriceCurrencyPicker value={priceCurrency} onChange={onPriceCurrencyChange}/><p className="helper">Indeks i zmianę procentową liczymy po przeliczeniu na wybraną walutę.</p></>}
    <Field label="Szukaj instrumentu"><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Spółka, ETF, symbol, kraj, surowiec…"/></Field>
    <div className="field-pair catalog-filters"><Field label="Typ instrumentu"><select aria-label="Typ instrumentu" value={assetType} onChange={e=>setAssetType(e.target.value)}><option value="all">Wszystkie</option><option value="stock">Spółki</option><option value="etf">ETF</option><option value="fund">Fundusze surowcowe</option><option value="futures" disabled={mode==='dca'}>Futures</option></select></Field><Field label="Rynek"><select aria-label="Rynek instrumentu" value={region} onChange={e=>setRegion(e.target.value)}><option value="all">Wszystkie</option>{['Polska','USA','Europa','Świat'].map(r=><option key={r}>{r}</option>)}</select></Field></div>
    <p className="helper catalog-filter-note">{available.length} <span>pasujących instrumentów. Filtry zmieniają listy wyboru poniżej.</span></p>
    <div className="series-list" aria-label="Serie porównania">{resolved.map((entry,i)=>{
     const selected=catalog.find(a=>a.symbol===entry.symbol),brand=brands?.companies?.[entry.symbol];
     return <article className="series-card" key={entry.id} style={{'--series-color':entry.color}}>
      <div className="series-card-top"><span>{entry.logo?<img src={entry.logo} alt=""/>:<span className="series-swatch"/>}Seria {i+1} · {entry.kind==='goal'?'cel':entry.kind==='expense'?'wydatek':selected?.kind==='futures'?'futures':selected?.kind==='fund'?'fundusz':selected?.kind==='etf'?'ETF':'spółka'}</span><button className="icon-btn" aria-label={`Usuń serię ${i+1}`} onClick={()=>setEntries(old=>old.filter(e=>e.id!==entry.id))}><Trash2 size={16}/></button></div>
      {entry.kind==='asset'?<><select aria-label={`Instrument serii ${i+1}`} value={entry.symbol} onChange={e=>update(entry.id,{symbol:e.target.value,color:undefined})}>
       {!available.some(a=>a.symbol===entry.symbol)&&<option value={entry.symbol}>{selected?.name||entry.symbol} (wybrany)</option>}
       {[['stock','Spółki'],['etf','ETF · indeksy, sektory i obligacje'],['fund','Fundusze surowcowe'],['futures','Surowce · kontrakty futures']].map(([kind,label])=><optgroup label={label} key={kind}>{available.filter(a=>a.kind===kind&&!entries.some(e=>e.id!==entry.id&&e.symbol===a.symbol)).map(a=><option key={a.symbol} value={a.symbol}>{a.name} · {a.symbol}</option>)}</optgroup>)}
      </select><small>{selected?.kind==='futures'?selected.unit:selected?.currency} · {selected?.firstDate} – {selected?.lastDate}</small></>:<><input aria-label={`Nazwa serii ${i+1}`} maxLength={40} value={entry.nameIsCustom?entry.name:translate(entry.name,reelLanguage)} onChange={e=>update(entry.id,{name:e.target.value})}/><label className="series-amount">{entry.kind==='goal'?'Cel w zł':'Kwota jednego zakupu w zł'}<input aria-label={`Kwota serii ${i+1}`} type="number" min="0.01" step="0.01" value={entry.amount} onChange={e=>update(entry.id,{amount:e.target.value})}/></label></>}
      {entry.kind==='expense'&&<FrequencyPicker label={`Częstotliwość zakupów serii ${i+1}`} value={entry.frequency||'daily'} onChange={frequency=>update(entry.id,{frequency})}/>}
      <SeriesColor color={entry.color} index={i+1} onChange={color=>update(entry.id,{color})} onReset={()=>update(entry.id,{color:undefined})}/>
      {entry.kind==='asset'&&!brand&&brands&&<small>Oznaczenie kolorem</small>}
     </article>;
    })}</div>
    <div className="add-series"><select aria-label="Rodzaj nowej serii" value={addType} onChange={e=>setAddType(e.target.value)}><option value="asset">Spółka / ETF / surowiec</option><option value="expense" disabled={mode==='prices'}>Regularny wydatek</option><option value="goal" disabled={mode==='prices'}>Cel w złotych</option></select><button className="secondary" disabled={entries.length>=6||!catalog.length||(addType==='asset'&&!canAddAsset)||(mode==='prices'&&addType!=='asset')} onClick={add}><Plus size={16}/>Dodaj serię</button></div>
    <p className="helper">{entries.length}/6 serii. {mode==='prices'?'Indeks i % pozwalają porównać różne jednostki.':'Wydatki i cele porównujemy z wartością osobnych portfeli.'}</p>
    <label className="logo-toggle"><input type="checkbox" checked={showLogos} onChange={e=>setShowLogos(e.target.checked)}/>Logotypy firm na rolce</label>
    <div className="field-pair"><Field label="Od dnia"><input aria-label="Początek porównania" type="date" min={range?.start} max={range?.end} value={start} onInput={e=>setStart(e.target.value)}/></Field><Field label="Do dnia"><input aria-label="Koniec porównania" type="date" min={start} max={range?.end} value={end} onInput={e=>setEnd(e.target.value)}/></Field></div>
    <button className="text-btn range-button" disabled={!range} onClick={()=>{setStart(range.start);setEnd(range.end);}}>Cały wspólny zakres</button>
    {range&&<p className="helper">Wspólna historia: {range.start} – {range.end}</p>}
    <Field label="Tytuł porównania"><textarea rows="2" maxLength={80} value={title} translate="no" placeholder={translate(generatedTitle,reelLanguage)} onChange={e=>setTitle(e.target.value)}/>{title&&<button type="button" className="text-btn" onClick={()=>setTitle('')}>Przywróć tytuł automatyczny</button>}</Field>
    <div className="field-pair"><Field label="Długość rolki"><select value={duration} onChange={e=>setDuration(Number(e.target.value))}>{[6,12,20,30].map(n=><option key={n} value={n}>{n} s</option>)}</select></Field></div>
    {loading&&<p role="status" className="helper">Wczytywanie historii…</p>}{visibleError&&<p role="alert" className="error">{visibleError}</p>}
   </section>
   {active&&<ReelPreview config={config} duration={duration} valid={valid}/>}
   <aside className="market-results comparison-results"><h2>Na końcu historii</h2><p className="muted">{result.baseDate||start} → {result.endDate||end}</p>
    {valid&&<div className="comparison-totals">{result.series.map(s=><div key={s.id} className="comparison-total"><span translate={s.nameIsCustom?'no':undefined} style={{borderLeftColor:s.color}}>{s.name}</span>{s.schedule&&<small translate="no">{periodAmount(s.schedule.amount,s.schedule.frequency,uiLanguage)}</small>}<strong>{value(s.points.at(-1).y,result.unit)}</strong>{result.summaries[s.id]&&<small>Wpłaty: {value(result.summaries[s.id].contributions,'zł')} · wynik: {value(result.summaries[s.id].profit,'zł')}</small>}</div>)}</div>}
    <button className="secondary full" disabled={!valid} onClick={exportCsv}><Download size={16}/>Dane porównania CSV</button>
    <div className="market-assumptions"><div><strong>Jak czytać porównanie</strong><p>{result.methodology||'Wybierz serie i wspólny zakres dat.'}</p>{result.converted&&<p>{result.currencyMethodology}</p>}<p>ETF-y pokazują ceny udziałów, nie poziomy indeksów. Dywidendy wypłacane inwestorowi nie są reinwestowane; akumulacja wewnątrz funduszu jest już zawarta w cenie. Fundusze surowcowe mogą korzystać z kontraktów, więc ich wynik różni się od ceny spot.</p></div></div>
   </aside>
  </div>
  <details className="market-methodology"><summary>Źródła danych i biblioteka logotypów</summary><div><p>Dane są lokalnym snapshotem. Akcje: {manifest?.retrievedAt?.slice(0,10)}; ETF-y i surowce: {extras?.retrievedAt?.slice(0,10)}. Pełny dostępny zakres zależy od instrumentu. Nie używamy nieukończonej sesji.</p><p>Filtr rynku oznacza kraj spółki, a dla funduszy miejsce notowania. Ekspozycję opisuje nazwa. ADR to amerykański kwit depozytowy, nie lokalna akcja. Historia symbolu może obejmować poprzedników prawnych i zmiany działalności.</p><div className="market-source-links">{selectedAssets.filter(Boolean).map(a=><a key={a.symbol} href={a.sourceUrl} target="_blank" rel="noreferrer">{a.symbol} · historia</a>)}<a href="https://api.nbp.pl/" target="_blank" rel="noreferrer">Kursy NBP</a><a href="https://www.spdrgoldshares.com/usa/gld/" target="_blank" rel="noreferrer">GLD</a><a href="https://www.ishares.com/us/products/239855/ishares-silver-trust-fund" target="_blank" rel="noreferrer">SLV</a><a href="https://www.uscfinvestments.com/uso" target="_blank" rel="noreferrer">USO</a></div><p>Logotypy są przechowywane lokalnie według symbolu giełdowego. Domyślne kolory można zmienić; jasność wybranych kolorów dostosowano do czytelności na ciemnej rolce. Znaki należą do ich właścicieli.</p><a href="/logos/manifest.json" target="_blank" rel="noreferrer">Spis logotypów i źródeł</a></div></details>
  {active&&exporting&&<ExportModal config={config} duration={duration} onClose={()=>setExporting(false)}/>}
 </>;
}
