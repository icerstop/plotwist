export const aiDate = (row,basis) => basis==='release'?row.releaseDate:row.observedAt?.slice(0,10);
export const aiValue = value => Number(value).toLocaleString('pl-PL',{maximumFractionDigits:1});
export function selectAiRows(rows,{basis='release',start='',end='9999',organization='',query='',protocol=''}={}) {
  let selected=rows.filter(r=>(!organization||r.organization===organization)&&(!protocol||r.protocol===protocol)&&`${r.model} ${r.modelId}`.toLowerCase().includes(query.toLowerCase()));
  // A release view is a retrospective: choose the latest measured run, never the best run.
  if(basis==='release'){
    const models=new Map();
    for(const r of selected){const old=models.get(r.modelId);if(!old||(r.observedAt||r.id).localeCompare(old.observedAt||old.id)>0)models.set(r.modelId,r);}
    selected=[...models.values()];
  }
  return selected.filter(r=>aiDate(r,basis)&&aiDate(r,basis)>=start&&aiDate(r,basis)<=end).map(r=>({...r,date:aiDate(r,basis)})).sort((a,b)=>a.date.localeCompare(b.date)||(a.observedAt||'').localeCompare(b.observedAt||'')||a.id.localeCompare(b.id));
}
export function rankAt(rows,date){
  const latest=new Map();
  for(const r of rows){if(r.date<=date){const old=latest.get(r.modelId);if(!old||(r.observedAt||r.date).localeCompare(old.observedAt||old.date)>=0)latest.set(r.modelId,r);}}
  return [...latest.values()].sort((a,b)=>b.score-a.score||a.model.localeCompare(b.model));
}
export function frameAt(rows,progress){
  if(!rows.length)return {date:'',visible:[],rank:[],current:null};
  const start=Date.parse(rows[0].date),end=Date.parse(rows.at(-1).date);
  const date=new Date(start+(end-start)*Math.max(0,Math.min(1,progress))).toISOString().slice(0,10);
  const visible=rows.filter(r=>r.date<=date);
  return {date,visible,rank:rankAt(visible,date),current:visible.at(-1)};
}
export const aiFormats=[
  {id:'timeline',name:'Karty na osi czasu',note:'Model, data i wynik — kolejne obserwacje jako osobne sceny.'},
  {id:'ranking',name:'Zmieniający się ranking',note:'Sześć najwyższych ostatnio odnotowanych wyników w danym momencie.'},
  {id:'scatter',name:'Mapa postępu',note:'Każdy punkt to pomiar. Pozycja pokazuje datę i wynik; bez interpolacji.'},
  {id:'duel',name:'AI vs punkt odniesienia',note:'Dwie karty wyników z opisem grupy ludzi i warunków porównania.'},
];
export function timelineSelection(rows,limit=8){
 let best=-Infinity;const records=rows.filter(r=>{if(r.score>best){best=r.score;return true;}return false;});
 const candidates=records.length>1?records:rows;
 if(candidates.length<=limit)return candidates;
 return Array.from({length:limit},(_,i)=>candidates[Math.round(i*(candidates.length-1)/(limit-1))]);
}
