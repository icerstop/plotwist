import {toDay} from './market.js';

export const storyColors=['#78a91c','#9866db','#2694be','#e48b28','#d95376','#648178'];
export const storyDefaults={topic:'apple',selected:[],start:'',end:'',mode:'native',chart:'line',title:'',duration:12,format:'9:16'};
const cache=new Map();
export function loadStoryJson(path){
 if(!cache.has(path))cache.set(path,fetch(path).then(r=>{if(!r.ok)throw Error('Nie udało się wczytać biblioteki danych.');return r.json();}).catch(e=>{cache.delete(path);throw e;}));
 return cache.get(path);
}
export const loadStoryTopic=id=>loadStoryJson(`/stories/${encodeURIComponent(id)}.json`);
export function topicSelection(topic){return topic.defaults.map((id,i)=>({id,color:storyColors[i%storyColors.length],label:''}));}
export function storyRange(series){
 const starts=series.map(s=>s.start).filter(Boolean),ends=series.map(s=>s.end).filter(Boolean);
 return {start:starts.sort()[0]||'',end:ends.sort().at(-1)||'',commonStart:starts.sort().at(-1)||'',commonEnd:ends.sort()[0]||''};
}
export function storyRows(series,start='',end=''){
 return series.flatMap(s=>s.points.filter(p=>(!start||p.date>=start)&&(!end||p.date<=end)).map(p=>({...p,seriesId:s.id,seriesName:s.name,unit:s.unit,kind:s.kind}))).sort((a,b)=>a.date.localeCompare(b.date)||a.seriesId.localeCompare(b.seriesId));
}
export function buildStoryChart(series,settings){
 if(!series.length)throw Error('Dodaj przynajmniej jedną serię.');
 if(series.length>6)throw Error('Na jednej rolce można pokazać maksymalnie 6 serii.');
 if(settings.start&&settings.end&&settings.start>settings.end)throw Error('Data początkowa musi poprzedzać końcową.');
 if(settings.mode==='native'&&new Set(series.map(s=>s.unitKey)).size>1)throw Error('Te serie mają różne jednostki. Wybierz indeks 100, aby porównać tempo zmian, albo usuń niezgodne serie.');
 if(settings.mode==='index'&&series.some(s=>s.kind==='lower-bound'||s.points.some(p=>['>','≥','<','≤'].includes(p.valueQualifier))))throw Error('Indeks zmian wymaga konkretnych wartości. Seria z progami „ponad” lub dolną granicą może być pokazana w oryginalnej jednostce.');
 const bases=[];
 const output=series.map((s,i)=>{
  const points=s.points.filter(p=>(!settings.start||p.date>=settings.start)&&(!settings.end||p.date<=settings.end));
  const observed=points.filter(p=>Number.isFinite(p.value));
  if(!observed.length)throw Error(`Brak obserwacji w wybranym zakresie: ${s.name}`);
  const first=observed[0],last=observed.at(-1),base=first.value;
  if(settings.mode==='index'&&base<=0)throw Error('Indeks 100 wymaga dodatniej wartości początkowej. Zmień zakres dat.');
  bases.push({id:s.id,date:first.date,period:first.period,datePrecision:first.datePrecision,fiscalYear:first.fiscalYear,value:base,unit:s.unit});
  // A missing annual observation is a gap, never a made-up zero or measurement.
  let trimmed=s.includeEmptyPeriods?points:points.filter(p=>p.date>=first.date&&p.date<=last.date);
  if(s.frequency==='annual'&&s.datePrecisions.every(p=>p==='year')){
   const byYear=new Map(trimmed.map(p=>[p.date.slice(0,4),p]));trimmed=[];
   for(let y=Number(first.date.slice(0,4));y<=Number(last.date.slice(0,4));y++)trimmed.push(byYear.get(String(y))||{date:`${y}-12-31`,value:null,datePrecision:'year',period:String(y)});
  }
  const selection=settings.selected.find(item=>item.id===s.id)||{};
  return {id:s.id,name:selection.label||s.name,nameIsCustom:!!selection.label,color:selection.color||storyColors[i],customColor:true,interpolation:s.interpolation,unit:s.unit,
   points:trimmed.map(p=>({...p,x:toDay(p.date),y:p.value===null?null:settings.mode==='index'?p.value/base*100:p.value}))};
 });
 const precisions=new Set(series.flatMap(s=>s.datePrecisions));
 const datePrecision=precisions.size===1?[...precisions][0]:'month';
 return {series:output,bases,datePrecision,unit:settings.mode==='index'?'indeks 100':series[0].unit,hasSingle:output.some(s=>s.points.filter(p=>p.y!==null).length===1)};
}
const quote=v=>'"'+String(v??'').replaceAll('"','""')+'"';
export function storyCsv(rows,sources){
 const bySource=new Map(sources.map(s=>[s.id,s]));
 const header=['series_id','series_name','date','period','date_precision','period_start','value','unit','kind','source_url','retrieved_at','attributes_json'];
 return '\uFEFF'+[header,...rows.map(p=>[p.seriesId,p.seriesName,p.date,p.period,p.datePrecision,p.periodStart,p.value,p.unit,p.kind,bySource.get(p.sourceId)?.url,bySource.get(p.sourceId)?.retrievedAt,JSON.stringify(Object.fromEntries(Object.entries(p).filter(([k])=>!['seriesId','seriesName','date','period','datePrecision','periodStart','value','unit','kind','sourceId'].includes(k))))])].map(r=>r.map(quote).join(',')).join('\r\n');
}
export function readStoryProject(value,manifest){
 if(value?.type!=='plotwist-story-project'||value.version!==1)throw Error('To nie jest projekt z biblioteki historii.');
 const s=value.settings,known=new Set(manifest.series.map(s=>s.id));
 if(!s||!Array.isArray(s.selected)||s.selected.length>6||s.selected.some(x=>!known.has(x?.id))||new Set(s.selected.map(x=>x.id)).size!==s.selected.length)throw Error('Projekt zawiera nieznane lub powtórzone serie.');
 const iso=v=>!v||/^\d{4}-\d{2}-\d{2}$/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 if(!iso(s.start)||!iso(s.end))throw Error('Nieprawidłowe daty w projekcie.');
 return {...storyDefaults,topic:s.topic==='all'||manifest.topics.some(t=>t.id===s.topic)?s.topic:'apple',selected:s.selected.map(x=>({id:x.id,color:/^#[0-9a-f]{6}$/i.test(x.color)?x.color:storyColors[0],label:String(x.label||'').slice(0,80)})),start:s.start||'',end:s.end||'',title:String(s.title||'').slice(0,80),mode:s.mode==='index'?'index':'native',chart:['line','area','bar','ranking','cards'].includes(s.chart)?s.chart:'line',format:['9:16','1:1','4:5'].includes(s.format)?s.format:'9:16',duration:[6,12,20,30].includes(s.duration)?s.duration:12};
}
export function storyProject(settings,builtAt){return {type:'plotwist-story-project',version:1,snapshotBuiltAt:builtAt,settings};}
