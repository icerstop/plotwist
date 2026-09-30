// A reusable, seekable clock for dated-event renderers. Pauses consume reel
// seconds, never alter source dates, and do not stop decoration/transition time.
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const seconds=(n,f=1)=>Number.isFinite(Number(n))?clamp(Number(n),0,10):f;
export function normalizeEventPauses(raw={}){
 return {enabled:raw.enabled!==false,seconds:seconds(raw.seconds),overrides:Object.fromEntries(Object.entries(raw.overrides||{}).filter(([k,v])=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&Number.isFinite(Number(v))).slice(0,500).map(([k,v])=>[k,seconds(v)]))};
}
export function eventPausePlan(events=[],available=0,raw={}){
 const settings=normalizeEventPauses(raw),budget=Math.max(0,available),sorted=[...events].sort((a,b)=>a.position-b.position);
 const requested=sorted.map(e=>({...e,requested:settings.enabled?(settings.overrides[e.id]??settings.seconds):0})),total=requested.reduce((sum,e)=>sum+e.requested,0);
 const factor=total?Math.min(1,budget*.75/total):1,moving=budget-total*factor;let paused=0;
 const stops=requested.map(e=>{const at=clamp(e.position,0,1)*moving+paused,hold=e.requested*factor;paused+=hold;return {...e,at,hold};});
 return {stops,totalRequested:total,factor,moving,budget,paused};
}
export function eventPauseFrame(plan,time){
 const elapsed=Math.max(0,time);let consumed=0;
 for(const stop of plan.stops){
  if(elapsed<stop.at)return {progress:plan.moving?clamp((elapsed-consumed)/plan.moving,0,1):stop.position,paused:false};
  if(elapsed<stop.at+stop.hold)return {progress:stop.position,paused:true,event:stop.id};
  consumed+=stop.hold;
 }
 return {progress:plan.moving?clamp((elapsed-consumed)/plan.moving,0,1):1,paused:false};
}
export function datedEvents(rows,start,end){
 const a=Date.parse(start),span=Date.parse(end)-a,groups=new Map();
 for(const r of rows||[]){if(r.date<start||r.date>end)continue;if(!groups.has(r.date))groups.set(r.date,[]);groups.get(r.date).push(r.name);}
 return [...groups].sort(([a],[b])=>a.localeCompare(b)).map(([id,names])=>({id,position:span?(Date.parse(id)-a)/span:0,label:names.join(' / ')}));
}
