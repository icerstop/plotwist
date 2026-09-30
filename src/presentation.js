// One catalogue for the studios. A new data family can declare its supported forms here.
export const seriesFormats = [
 {id:'line',name:'Linie',note:'Historia wartości w czasie. Luki przerywają linię.'},
 {id:'area',name:'Linie z wypełnieniem',note:'Linie z wypełnieniem do zera; serie nie są sumowane.'},
 {id:'bar',name:'Kolumny',note:'Porównanie wartości w kolejnych momentach.'},
 {id:'ranking',name:'Wyścig słupków',note:'Poziome słupki zmieniają kolejność wraz z wartościami.'},
 {id:'cards',name:'Karty liczbowe',note:'Duże wartości i nazwy serii, bez osi wykresu.'},
];
export const aiFormats = [
 {id:'timeline',name:'Karty na osi czasu',note:'Kolejne rekordy jako sceny z łagodnymi przejściami.'},
 {id:'ranking',name:'Wyścig rankingu',note:'Najwyższe ostatnio odnotowane wyniki; liczba pozycji dopasowana do etykiet.'},
 {id:'scatter',name:'Mapa pomiarów',note:'Punkty z datami i niepewnością. Bez łączenia różnych modeli linią.'},
 {id:'records',name:'Schody rekordów',note:'Najwyższy dotąd wynik w wybranym zbiorze. Zmiana tylko w dniu pomiaru.'},
 {id:'duel',name:'AI vs punkt odniesienia',note:'Wynik modelu i udokumentowany punkt odniesienia.'},
];
export const aiBrandFormats = [
 {id:'records',name:'Linie marek',note:'Osobna linia dla każdej marki. Zmiana wyniku tylko w dacie danych.'},
 {id:'ranking',name:'Wyścig marek',note:'Najlepsze modele reprezentują swoje marki; pozycje zmieniają się płynnie.'},
 {id:'timeline',name:'Karty marek',note:'Wszystkie wybrane marki jednocześnie, z wynikiem i aktualnym liderem.'},
];
export const clamp = value => Math.max(0,Math.min(1,value));
export const ease = value => {const t=clamp(value);return t*t*(3-2*t);};
export const lerp = (a,b,t) => a+(b-a)*t;
// Keep series identity separate from rank. Missing values come last and ties
// retain the selection order. Frame-local positions also work when seeking or exporting.
export function rankMotion(previous,values,mix=1){
 const ranks=items=>{
  const result=[];
  items.map((value,index)=>({index,value:Number.isFinite(value)?value:-Infinity}))
   .sort((a,b)=>b.value-a.value||a.index-b.index)
   .forEach((item,rank)=>{result[item.index]=rank;});
  return result;
 };
 const from=ranks(previous),to=ranks(values);
 return to.map((rank,index)=>({from:from[index],to:rank,position:lerp(from[index],rank,clamp(mix))}));
}
// Outgoing and incoming cards retain their own model, score, date and uncertainty.
export function sceneAt(count,progress,duration=20,transition=.65){
 if(!count)return {index:-1,previous:-1,mix:1};
 const p=clamp(progress),index=Math.min(count-1,Math.floor(p*count));
 const seconds=duration*.9/count,age=(p*count-index)*seconds;
 return {index,previous:Math.max(0,index-1),mix:index===0||p===1||transition===0?1:ease(age/Math.min(transition,seconds*.45))};
}
export function upperBound(items,value,key=x=>x){let lo=0,hi=items.length;while(lo<hi){const mid=(lo+hi)>>>1;if(key(items[mid])<=value)lo=mid+1;else hi=mid;}return lo;}
export function eventAt(events,progress,duration=12,transition=.65,timeSeconds=progress*duration){
 if(!events.length)return {index:-1,previous:-1,mix:1,current:0};
 const p=clamp(progress),start=events[0],end=events.at(-1),current=lerp(start,end,p);
 const index=Math.max(0,upperBound(events,current)-1),span=end-start;
 const age=(span?(current-events[index])/span*duration*.9:0)+Math.max(0,timeSeconds-duration*.9);
 const untilNext=index+1<events.length?(events[index+1]-events[index])/(span||1)*duration*.9:duration*.1;
 const window=Math.min(transition,untilNext*.8);
 return {index,previous:Math.max(0,index-1),current,mix:index===0||window<=0?1:ease(age/window)};
}
const seriesCache=new WeakMap();
export function seriesFrame(series,progress,duration,transition,timeSeconds){
 let dates=seriesCache.get(series);if(!dates){dates=[...new Set(series.flatMap(s=>s.points.map(p=>p.x)))].sort((a,b)=>a-b);seriesCache.set(series,dates);}
 const event=eventAt(dates,progress,duration,transition,timeSeconds);
 const at=x=>series.map((s,index)=>{const i=upperBound(s.points,x,p=>p.x)-1;const point=s.points[i];return {series:s,index,point,value:Number.isFinite(point?.y)?point.y:null};});
 return {...event,values:at(event.current),before:at(dates[event.previous])};
}
const aiCache=new WeakMap();
export function aiEvents(rows){
 let frames=aiCache.get(rows);if(frames)return frames;
 frames=[];const latest=new Map();let record=null;
 for(let i=0;i<rows.length;){const date=rows[i].date;while(i<rows.length&&rows[i].date===date){const r=rows[i++],old=latest.get(r.modelId);if(!old||(r.observedAt||r.date)>=(old.observedAt||old.date))latest.set(r.modelId,r);if(!record||r.score>record.score)record=r;}
  frames.push({date,time:Date.parse(date),rank:[...latest.values()].sort((a,b)=>b.score-a.score||a.model.localeCompare(b.model)),record});
 }
 aiCache.set(rows,frames);return frames;
}
export function aiMotionFrame(rows,progress,duration,transition,timeSeconds){
 const frames=aiEvents(rows),event=eventAt(frames.map(f=>f.time),progress,duration,transition,timeSeconds);
 return {...event,frame:frames[event.index],before:frames[event.previous],frames};
}
