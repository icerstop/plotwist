import {releaseDay,releaseMonths} from './ai-releases.js';
export const RELEASE_VIEWS=[
 {id:'pulse',pl:'Radar premier · tory producentów',en:'Release radar · publisher lanes'},
 {id:'calendar',pl:'Żywy kalendarz',en:'Living calendar'},
 {id:'cards',pl:'Stos kart premier',en:'Release card stack'},
 {id:'heatmap',pl:'Mapa aktywności',en:'Activity map'},
 {id:'gaps',pl:'Odstępy między premierami',en:'Time between releases'}
];
// One interval per distinct date, even when multiple models or producers launch
// together. The first observed date has no measurable preceding interval.
export function releaseIntervals(rows){
 const dates=[...new Set(rows.map(r=>r.date))].sort();
 return dates.slice(1).map((date,i)=>({date,previous:dates[i],days:releaseDay(date)-releaseDay(dates[i]),models:rows.filter(r=>r.date===date)}));
}
export function releaseActivity(rows,start,end,current,count='versions'){
 const full=releaseMonths(rows,start,end,count),shown=releaseMonths(rows.filter(r=>r.date<=current),start,end,count);
 const first=Number(start.slice(0,4)),last=Number(end.slice(0,4)),year=Number(current.slice(0,4));
 const windowEnd=Math.min(last,Math.max(first+3,year)),windowStart=Math.max(first,windowEnd-3);
 return {max:Math.max(1,...full.map(m=>m.count)),years:Array.from({length:windowEnd-windowStart+1},(_,i)=>windowStart+i),months:shown.map(m=>({...m,future:m.month>current.slice(0,7)}))};
}
