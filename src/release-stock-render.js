import {releaseDay,releaseDate} from './ai-releases.js';
import {releaseWindow} from './release-appearance.js';
import {releaseStockFrame} from './release-stock.js';
import {createAxis,bounds} from './chart-scale.js';
import {axisTicks,lineAppearance,plotGrid} from './chart-appearance.js';
import {axisNumberFormat} from './axis-numbers.js';
import {lineLabelGeometry,drawLineLabels} from './line-labels.js';

// Same clock, label renderer, typography and grid as the other charts.
export function drawReleaseStock({ctx,config,frame,style,appearance,theme,top,bottom,text,section,dateLabel,t}){
 const r=config.releases,series=r.stock,left=225,baseRight=left+775*appearance.timelineWidth/100;
 const window=releaseWindow(releaseDay(r.start),releaseDay(r.end),frame.current,appearance.windowDays);
 const geometry=style.endLabels?lineLabelGeometry(config,{left,right:Math.min(900,baseRight),top,bottom,count:1,hasDates:true}):null;
 const right=Math.min(baseRight,geometry?.right??baseRight),x=day=>left+(day-window.first)/(window.last-window.first||1)*(right-left);
 const stop=section('stock',{x:76,y:top-36,w:928,h:bottom-top+75});
 const c={...config,unit:'USD',xType:'date',_textElement:'stock'};
 const state=releaseStockFrame(series,frame.current,window.first,window.last,appearance.stockScale==='fixed');
 const rawAxis=createAxis(state.range,{includeZero:false}),axis=createAxis(state.range,{fixedDomain:[Math.max(0,rawAxis.min),rawAxis.max]}),py=value=>bottom-axis.position(value)*(bottom-top);
 const ticks=axisTicks(c,axis,false,bottom-top,24),numbers=axisNumberFormat(c,bounds(series.points.map(p=>p.y)),ticks);
 const caption=t('NVIDIA · zamknięcie','NVIDIA · close')+` (${series.basis==='raw'?t('nominalne','nominal'):t('po splitach','split-adjusted')})`;
 text(caption,left,top-18,right-left,25,'labels',theme.fg,1,false,{id:'release.stockCaption',label:'Opis ceny NVIDIA'});
 plotGrid(ctx,c,{left,right,top,bottom,ys:ticks.map(py),color:theme.grid,panel:theme.panel});
 if(style.axisLabels){
  ctx.textAlign='right';for(const tick of ticks)text(numbers.format(tick),left-15,py(tick)+7,130,23,'labels',theme.muted,1,false,{id:'release.stockTick',entity:tick,dynamic:true,label:'Cena na osi'});ctx.textAlign='left';
  if(numbers.caption)text(numbers.caption,76,top-18,140,21,'labels',theme.muted,1,false,{id:'release.stockUnit',label:'Jednostka ceny'});
 }
 const color=appearance.stockColor;
 ctx.save();ctx.beginPath();ctx.rect(left,top-4,right-left,bottom-top+8);ctx.clip();lineAppearance(ctx,c,color);ctx.beginPath();
 state.path.forEach((p,i)=>{if(i===0)ctx.moveTo(x(p.x),py(p.y));else ctx.lineTo(x(p.x),py(p.y));});
 if(state.point)ctx.lineTo(x(state.x),py(state.point.y));ctx.stroke();ctx.restore();
 if(state.point&&geometry&&state.x>=window.first){
  const value=state.point.y.toLocaleString(config.language==='en'?'en-GB':'pl-PL',{minimumFractionDigits:2,maximumFractionDigits:2})+' USD';
  drawLineLabels(ctx,c,[{index:0,series,anchorX:x(state.x),anchorY:py(state.point.y),color,value,date:dateLabel(state.point.date)}],geometry,{top,bottom,x:right+20,fg:theme.fg,background:theme.bg});
 }else if(!state.point||state.x<window.first){
  text(t('Brak notowań w tym okresie','No quotes in this period'),left,top+(bottom-top)/2,right-left,25,'labels',theme.muted,2,false,{id:'release.stockMissing',label:'Brak notowań'});
 }
 // Coverage warning stays factual even if the user hides endpoint dates.
 if(frame.date>series.coverageEnd)text(t('Ostatnie notowanie: ','Last quote: ')+series.coverageEnd,left,bottom+30,right-left,21,'labels',theme.muted,1,false,{id:'release.stockCoverage',label:'Koniec danych giełdowych'});
 else if(r.mode!=='pulse'&&appearance.axisDates){text(dateLabel(releaseDate(window.first)),left,bottom+30,300,21,'labels',theme.muted);ctx.textAlign='right';text(dateLabel(releaseDate(window.last)),right,bottom+30,300,21,'labels',theme.muted);ctx.textAlign='left';}
 stop();return {left,right,window,x};
}
