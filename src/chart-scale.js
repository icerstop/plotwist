import {clamp,ease,lerp,upperBound} from './presentation.js';

export const logUnavailable='Skala logarytmiczna wymaga samych dodatnich wartości, także granic niepewności i punktu odniesienia.';
export const logChartUnavailable='Słupki i wypełnienia zaczynają się od zera, dlatego używają skali liniowej.';
const availabilityCache=new WeakMap();
export function scaleAvailability(config={}){
 const cached=availabilityCache.get(config);if(cached)return cached;
 const mode=config.ai?.mode||config.chart||'line';
 if(['cards','timeline','duel'].includes(mode))return {hasAxis:false,logReason:''};
 if(['bar','area','ranking'].includes(mode))return {hasAxis:true,logReason:logChartUnavailable};
 const values=config.ai?config.ai.rows.flatMap(r=>[r.score,r.low??(r.stderr!=null?r.score-r.stderr:r.score),r.high??(r.stderr!=null?r.score+r.stderr:r.score)]):config.series?.flatMap(s=>s.points.map(p=>p.y))||[];
 if(config.ai?.benchmark?.baseline&&mode==='scatter')values.push(config.ai.benchmark.baseline.score);
 const finite=values.filter(Number.isFinite);
 const result={hasAxis:true,logReason:finite.length&&finite.every(v=>v>0)?'':logUnavailable};availabilityCache.set(config,result);return result;
}
export function resolveScale(config){
 const availability=scaleAvailability(config),requested=config.axisScale==='log';
 return {...availability,dynamic:config.axisRange==='dynamic',log:requested&&!availability.logReason&&availability.hasAxis,fallback:requested&&!!availability.logReason};
}

export function bounds(values){
 let min=Infinity,max=-Infinity;for(const v of values)if(Number.isFinite(v)){min=Math.min(min,v);max=Math.max(max,v);}
 return {min,max};
}
const extend=(a,b)=>({min:Math.min(a.min,b.min),max:Math.max(a.max,b.max)});

// Include only the revealed part of each segment. Nulls remain genuine gaps.
const seriesBoundsCache=new WeakMap();
export function visibleSeriesBounds(series,current,log=false){
 let result=bounds([]);
 for(const s of series){
  let prefix=seriesBoundsCache.get(s.points);
  if(!prefix){let range=bounds([]);prefix=s.points.map(p=>{range=extend(range,bounds([p.y]));return range;});seriesBoundsCache.set(s.points,prefix);}
  const index=upperBound(s.points,current,p=>p.x)-1,previous=s.points[index],p=s.points[index+1];
  if(index>=0)result=extend(result,prefix[index]);
   if(s.interpolation!=='step'&&p&&previous&&Number.isFinite(previous.y)&&Number.isFinite(p.y)&&p.x>previous.x){
    const t=clamp((current-previous.x)/(p.x-previous.x));
    const v=log?Math.exp(lerp(Math.log(previous.y),Math.log(p.y),t)):lerp(previous.y,p.y,t);
    result=extend(result,bounds([v]));
   }
 }
 return result;
}

// Deterministic, short camera expansion before discrete AI observations arrive.
// It moves the axis only; dates, values, ranking and record changes stay factual.
const aiBoundsCache=new WeakMap();
export function visibleAiBounds(rows,current,start,end,duration=20,transition=.65){
 let frames=aiBoundsCache.get(rows);
 if(!frames){frames=[];let range=bounds([]);
  for(const r of rows){range=extend(range,bounds([r.score,r.low??r.score-(r.stderr||0),r.high??r.score+(r.stderr||0)]));
   const time=Date.parse(r.date);if(frames.at(-1)?.time===time)frames[frames.length-1]={time,...range};else frames.push({time,...range});
  }aiBoundsCache.set(rows,frames);
 }
 if(!frames.length)return bounds([]);
 const index=Math.max(0,upperBound(frames,current,f=>f.time)-1),now=frames[index],next=frames[index+1];
 if(!next||!transition||end===start)return now;
 const window=Math.min((end-start)*transition/(duration*.9),(next.time-now.time)*.45);
 const mix=window?ease((current-(next.time-window))/window):0;
 return {min:lerp(now.min,next.min,mix),max:lerp(now.max,next.max,mix)};
}

export function createAxis(range,{log=false,dynamic=false,fixedDomain,includeZero=true}={}){
 let {min,max}=range;
 if(!Number.isFinite(min)||!Number.isFinite(max)){min=log?1:0;max=log?10:1;}
 if(log){
  min=Math.max(Number.MIN_VALUE,min);max=Math.max(min,max);
  const low=Math.log10(min),high=Math.log10(max),padding=Math.max((high-low)*.06,.04);
  min=low-padding;max=high+padding;
 }else if(!dynamic&&fixedDomain){[min,max]=fixedDomain;}
 else {
  if(includeZero){min=Math.min(0,min);max=Math.max(0,max);}
  const span=max-min||Math.max(Math.abs(max)*.1,1),pad=span*.08;
  min=includeZero&&min===0?0:min-pad;max=includeZero&&max===0?0:max+pad;
 }
 if(max===min)max=min+1;
 const forward=v=>log?Math.log10(v):v,back=v=>log?10**v:v;
 return {min:back(min),max:back(max),ticks:Array.from({length:5},(_,i)=>back(lerp(min,max,i/4))),position:v=>(forward(v)-min)/(max-min)};
}

export function scaleCaption(config,scale=resolveScale(config)){
 if(config.visuals?.design?.chart?.scaleCaption===false||!scale.hasAxis||!scale.dynamic&&!scale.log&&!scale.fallback)return '';
 const en=config.language==='en';
 return [scale.dynamic?(en?'Expanding range':'Zakres rosnący'):en?'Fixed range':'Zakres stały',scale.log?(en?'Log scale':'Skala logarytmiczna'):en?'Linear scale':'Skala liniowa'].join(' · ');
}
export function formatAxisTick(value,language='pl'){
 const locale=language==='en'?'en-GB':'pl-PL',a=Math.abs(value);
 if(a>0&&a<.0001||a>=1e12)return value.toLocaleString(locale,{notation:'scientific',maximumSignificantDigits:3});
 if(a>=1e9)return (value/1e9).toLocaleString(locale,{maximumFractionDigits:2})+(language==='en'?' bn':' mld');
 if(a>=1e6)return (value/1e6).toLocaleString(locale,{maximumFractionDigits:2})+(language==='en'?' m':' mln');
 if(a>=10000)return (value/1000).toLocaleString(locale,{maximumFractionDigits:2})+(language==='en'?' k':' tys.');
 return value.toLocaleString(locale,{maximumSignificantDigits:3});
}
