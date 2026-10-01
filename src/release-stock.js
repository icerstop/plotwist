import {releaseDay} from './ai-releases.js';
import {upperBound} from './presentation.js';

// Keep original trading dates. Never fill unavailable history with future closes.
export function releaseStockSeries(stock,start,end,basis='split'){
 const first=releaseDay(start),last=releaseDay(end),column=basis==='raw'?2:1;
 const points=(stock?.rows||[]).filter(r=>r[0]<=end&&Number.isFinite(r[column])).map(r=>({x:releaseDay(r[0]),y:r[column],date:r[0]}));
 const before=Math.max(0,upperBound(points,first,p=>p.x)-1),selected=points.slice(before);
 return {symbol:'NVDA',name:'NVIDIA',logo:'/logos/companies/nvda.svg',unit:'USD',interpolation:'step',points:selected,
  start:first,end:last,basis,source:stock?.source,sourceUrl:stock?.sourceUrl,retrievedAt:stock?.retrievedAt,
  coverageStart:stock?.rows?.[0]?.[0],coverageEnd:stock?.rows?.at(-1)?.[0]};
}

export function releaseStockFrame(series,current,first,last,fixed=false){
 const index=upperBound(series.points,current,p=>p.x)-1,point=series.points[index];
 const visible=series.points.slice(0,index+1),left=upperBound(visible,first,p=>p.x)-1;
 const path=visible.slice(Math.max(0,left));
 // If the catalogue continues beyond market coverage, stop at the final quote.
 const latest=series.points.at(-1),x=point?Math.min(current,latest.x):null;
 const range=(fixed?series.points:visible).filter(p=>p.x<=last&&(p.x>=first||p===path[0]));
 let min=Infinity,max=-Infinity;for(const p of range){min=Math.min(min,p.y);max=Math.max(max,p.y);}
 return {point,x,path,range:{min,max},stale:point?Math.floor(current)>point.x:false};
}

export function releaseStockPulseLayout(start,end,options,hidden={}){
 const h=end-start,cardHeight=hidden.detail?0:Math.min(h*.46,Math.max(100,h*.3)*options.cardHeight/100),histogram=hidden.distribution?0:Math.min(64,h*.14);
 const maxHeight=Math.max(55,h-cardHeight-histogram-56),height=maxHeight*Math.min(1,options.timelineHeight/100);
 return {top:start+8,height,bottom:start+8+height,histogramBase:start+height+histogram*.6+20,cardTop:end-cardHeight,cardBottom:end-4};
}
