export const RELEASE_PUBLISHERS=[{id:'openai',name:'OpenAI',color:'#137b70',logo:'/logos/ai/openai.svg'},{id:'anthropic',name:'Anthropic',color:'#c86d46',logo:'/logos/ai/anthropic.svg'}];
export const RELEASE_CATEGORIES=['general','coding','open-weight','revision'];
const DAY=86400000;
export const releaseDay=date=>Date.parse(`${date}T00:00:00Z`)/DAY;
export const releaseDate=day=>new Date(Math.floor(day)*DAY).toISOString().slice(0,10);
export function validateReleases(data){
 const ids=new Set();let previous='';
 for(const r of data.rows){
  if(ids.has(r.id)||!Number.isFinite(releaseDay(r.date))||releaseDate(releaseDay(r.date))!==r.date||r.date<previous||r.date<data.coverage.start||r.date>data.coverage.end||!RELEASE_PUBLISHERS.some(p=>p.id===r.publisher)||!RELEASE_CATEGORIES.includes(r.category)||!r.name||!/^https:\/\/(www\.)?(openai\.com|anthropic\.com|platform\.claude\.com|developers\.openai\.com)\//.test(r.sourceUrl))throw new Error(`Invalid release: ${r.id}`);
  ids.add(r.id);previous=r.date;
 }
 return true;
}
export function selectReleases(rows,{start,end,publishers=RELEASE_PUBLISHERS.map(p=>p.id),categories=RELEASE_CATEGORIES}={}){
 return rows.filter(r=>(!start||r.date>=start)&&(!end||r.date<=end)&&publishers.includes(r.publisher)&&categories.includes(r.category)).toSorted((a,b)=>a.date.localeCompare(b.date)||a.publisher.localeCompare(b.publisher)||a.id.localeCompare(b.id));
}
export function groupReleases(rows){
 const groups=new Map();for(const r of rows){const key=`${r.date}:${r.publisher}`;if(!groups.has(key))groups.set(key,{id:key,date:r.date,publisher:r.publisher,models:[]});groups.get(key).models.push(r);}
 return [...groups.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.publisher.localeCompare(b.publisher));
}
export const releaseCount=(rows,mode='versions')=>mode==='launches'?groupReleases(rows).length:rows.length;
export function releaseMonths(rows,start,end,mode='versions'){
 if(!start||!end||start>end)return [];
 const months=[];let date=start.slice(0,7)+'-01';
 while(date<=end){const month=date.slice(0,7),next=new Date(`${date}T00:00:00Z`);next.setUTCMonth(next.getUTCMonth()+1);const nextDate=next.toISOString().slice(0,10),items=rows.filter(r=>r.date>=start&&r.date<=end&&r.date.startsWith(month));
  months.push({month,count:releaseCount(items,mode),openai:releaseCount(items.filter(r=>r.publisher==='openai'),mode),anthropic:releaseCount(items.filter(r=>r.publisher==='anthropic'),mode),partial:start>date||end<releaseDate(releaseDay(nextDate)-1)});date=nextDate;
 }
 return months;
}
export function releaseFrame(rows,start,end,progress,mode='versions'){
 const first=releaseDay(start),last=releaseDay(end),current=first+Math.max(0,Math.min(1,progress))*(last-first),date=releaseDate(current),visible=rows.filter(r=>r.date<=date),dates=[...new Set(visible.map(r=>r.date))].sort(),latest=dates.at(-1),previous=dates.at(-2);
 return {current,date,visible,latest:visible.filter(r=>r.date===latest),total:releaseCount(visible,mode),monthTotal:releaseCount(visible.filter(r=>r.date.startsWith(date.slice(0,7))),mode),gap:previous?(releaseDay(latest)-releaseDay(previous)):null,since:latest?Math.floor(current-releaseDay(latest)):null};
}
// Dates stop at the range boundary; transient effects keep ageing during the
// final hold. Use the same deterministic seconds for seeking and video export.
export function releaseEventAge(date,start,end,progress,dataDuration,dataTime){
 const span=releaseDay(end)-releaseDay(start),fraction=span?(releaseDay(date)-releaseDay(start))/span:0;
 return (Math.max(0,Math.min(1,progress))-fraction)*dataDuration*.9+Math.max(0,dataTime-dataDuration*.9);
}
export function releaseEndingState(time,duration){
 const fadeDuration=Math.min(.65,duration*.06),elapsed=Math.max(0,time-duration*.9),p=Math.min(1,elapsed/fadeDuration);
 return {pulseDuration:fadeDuration,cursorOpacity:1-p*p*(3-2*p)};
}
export function releaseCsv(rows){
 const keys=['date','publisher','name','category','availability','sourceUrl','notes','verifiedAt','id'];
 const cell=s=>'"'+String(s??'').replaceAll('"','""')+'"';return '\uFEFF'+[keys,...rows.map(r=>keys.map(k=>r[k]))].map(row=>row.map(cell).join(',')).join('\r\n');
}
