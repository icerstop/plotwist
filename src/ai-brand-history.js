import {eventAt} from './presentation.js';
const compare=(a,b)=>b.score-a.score||a.model.localeCompare(b.model)||a.modelId.localeCompare(b.modelId)||a.id.localeCompare(b.id);
export const brandLatestNote='Dla każdej marki wybieramy najlepszy spośród ostatnich znanych wyników jej wariantów. Wynik może spaść po ponownym teście. Warianty i protokoły pozostają rozdzielone.';
export const brandRecordNote='Dla każdej marki pokazujemy najwyższy wynik odnotowany do danej daty. To rekord historyczny, nie średnia ani gwarancja powtarzalności wyniku.';
export function aiModelLabel(row){
 if(!row)return '';
 const setting=row.modelId?.match(/_(low|medium|high|xhigh|none|\d+[kK])$/)?.[1];
 return setting&&!row.model.toLowerCase().includes(setting.toLowerCase())?`${row.model} · ${setting}`:row.model;
}
export function buildAiBrandHistory(rows,{brandIds=[],start='',end='',method='latest'}={}){
 const selected=new Set(brandIds),ordered=rows.filter(r=>selected.has(r.brandId)&&r.date&&Number.isFinite(r.score)&&(!end||r.date<=end)).toSorted((a,b)=>a.date.localeCompare(b.date)||(a.observedAt||'').localeCompare(b.observedAt||'')||a.id.localeCompare(b.id));
 if(!ordered.length||start&&end&&start>end)return {frames:[],series:[],times:[]};
 const from=start||ordered[0].date,to=end||rows.at(-1)?.date||ordered.at(-1).date;
 if(from>to)return {frames:[],series:[],times:[]};
 const latest=new Map(),records=new Map(),all=[];
 const leaders=()=>{const winners=new Map();
  for(const r of method==='record'?records.values():latest.values()){const previous=winners.get(r.brandId);if(!previous||compare(r,previous)<0)winners.set(r.brandId,r);}
  return brandIds.flatMap(id=>{const winner=winners.get(id);return winner?[{brand:winner.brand,winner,score:winner.score}]:[];});
 };
 const push=date=>{const current=leaders();all.push({date,time:Date.parse(date),leaders:current,rank:current.toSorted((a,b)=>b.score-a.score||a.brand.id.localeCompare(b.brand.id))});};
 for(let i=0;i<ordered.length;){const date=ordered[i].date;
  while(i<ordered.length&&ordered[i].date===date){const r=ordered[i++],key=JSON.stringify([r.brandId,r.modelId,r.protocol||'']);latest.set(key,r);const record=records.get(r.brandId);if(!record||compare(r,record)<0)records.set(r.brandId,r);}
  push(date);
 }
 const before=all.findLast(f=>f.date<from);
 const frames=all.filter(f=>f.date>=from&&f.date<=to);
 if(before&&frames[0]?.date!==from)frames.unshift({...before,date:from,time:Date.parse(from)});
 else if(frames[0]?.date>from)frames.unshift({date:from,time:Date.parse(from),leaders:[],rank:[]});
 if(frames.length&&frames.at(-1).date<to)frames.push({...frames.at(-1),date:to,time:Date.parse(to)});
 const series=brandIds.flatMap(id=>{const points=[];let brand;
  for(const frame of frames){const leader=frame.leaders.find(l=>l.brand.id===id);if(!leader)continue;brand=leader.brand;const previous=points.at(-1);if(!previous||previous.winner.id!==leader.winner.id)points.push({date:frame.date,time:frame.time,score:leader.score,winner:leader.winner});}
  return brand?[{brand,points}]:[];
 });
 const plotRows=series.flatMap(s=>s.points.map(p=>({date:p.date,score:p.score}))).sort((a,b)=>a.date.localeCompare(b.date));
 return {frames,series,times:frames.map(f=>f.time),plotRows,start:from,end:to,method};
}
export function aiBrandMotion(history,progress,duration=20,transition=.65,timeSeconds=progress*duration){
 const event=eventAt(history.times,progress,duration,transition,timeSeconds);
 return {...event,frame:history.frames[event.index],before:history.frames[event.previous]};
}
