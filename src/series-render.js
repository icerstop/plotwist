import {displayDate} from './market.js';
import {getReelLogo} from './reel-assets.js';
import {seriesFrame,lerp} from './presentation.js';
import {resolveScale,bounds,visibleSeriesBounds,createAxis,scaleCaption,formatAxisTick} from './chart-scale.js';
import {textSize,textColor,setReelText} from './reel-design.js';
export function crossText(ctx,previous,current,x,y,mix=1,maxWidth=1000){
 if(previous===current||mix>=1){ctx.fillText(current,x,y,maxWidth);return;}
 ctx.save();ctx.globalAlpha*=Math.max(0,1-mix*2);ctx.fillText(previous,x,y-8*mix,maxWidth);ctx.restore();
 ctx.save();ctx.globalAlpha*=Math.max(0,mix*2-1);ctx.fillText(current,x,y+8*(1-mix),maxWidth);ctx.restore();
}
export function fittedText(ctx,text,x,y,width){let label=String(text);while(ctx.measureText(label).width>width&&label.length>1)label=label.slice(0,-1);if(label!==String(text))label=label.slice(0,-1)+'…';ctx.fillText(label,x,y);}
function logoLabel(ctx,series,x,y,font,fg,maxWidth,config){
 const logo=getReelLogo(series.logo);let offset=0;
 if(logo){ctx.fillStyle='#fff';ctx.fillRect(x,y-29,38,38);const ratio=Math.min(30/logo.naturalWidth,30/logo.naturalHeight);ctx.drawImage(logo,x+19-logo.naturalWidth*ratio/2,y-10-logo.naturalHeight*ratio/2,logo.naturalWidth*ratio,logo.naturalHeight*ratio);offset=51;}
 setReelText(ctx,config,'labels',27,font,fg);const suffix=series.scheduleText?` · ${series.scheduleText}`:'',suffixWidth=ctx.measureText(suffix).width;
 fittedText(ctx,series.name,x+offset,y,Math.max(40,maxWidth-offset-suffixWidth));if(suffix)ctx.fillText(suffix,x+maxWidth-suffixWidth,y);
}
const extentCache=new WeakMap();
export function drawSeriesContent(ctx,config,progress,{top,bottom,height,legendStep,font,fg,muted,colors,dark,panel,grid,contentTop,formatValue,timeSeconds}){
 const {series=[],chart='line',unit='',xType='year'}=config;
 const state=seriesFrame(series,progress,config.duration||12,config.transition??.65,timeSeconds),{values,before,mix,current}=state;
 let all=extentCache.get(series);
 if(!all){all={minX:Infinity,maxX:-Infinity,minY:0,rawMax:0,range:bounds([])};
  for(const s of series)for(const p of s.points){all.minX=Math.min(all.minX,p.x);all.maxX=Math.max(all.maxX,p.x);if(Number.isFinite(p.y)){all.minY=Math.min(all.minY,p.y);all.rawMax=Math.max(all.rawMax,p.y);all.range.min=Math.min(all.range.min,p.y);all.range.max=Math.max(all.range.max,p.y);}}
  extentCache.set(series,all);
 }
 const {minX,maxX,minY,rawMax}=all;
 const step=10**Math.floor(Math.log10(rawMax-minY||1)),maxY=Math.ceil((rawMax||1)/step)*step;
 const scale=resolveScale(config);
 const extent=scale.dynamic?visibleSeriesBounds(series,current,scale.log):all.range;
 // Bars may still be tweening the last observation: keep the axis large enough.
 if(scale.dynamic&&['bar','ranking'].includes(chart))for(const row of before)if(Number.isFinite(row.value)){extent.min=Math.min(extent.min,row.value);extent.max=Math.max(extent.max,row.value);}
 const axis=createAxis(extent,{log:scale.log,dynamic:scale.dynamic,fixedDomain:[minY,maxY]});
 const caption=scaleCaption(config,scale);
 if(caption){setReelText(ctx,config,'labels',23,font,muted);ctx.fillText(caption,chart==='ranking'?78:135,chart==='ranking'?contentTop-22:top-22,860);}
 const color=i=>series[i].customColor?series[i].color:colors[i%colors.length];
 const text=v=>v===null?(config.language==='en'?'no data':'brak danych'):`${formatValue(v)} ${unit}`;
 const moving=i=>values[i].value===null?null:lerp(before[i].value??values[i].value,values[i].value,mix);
 const left=135,right=900,px=x=>left+(x-minX)/(maxX-minX||1)*(right-left),py=y=>bottom-axis.position(y)*(bottom-top);
 if(chart==='cards'||chart==='ranking'){
  const yStart=contentTop,yEnd=height-(height<1400?205:290),count=series.length;
  if(chart==='cards'){
   const columns=count===1?1:2,rows=Math.ceil(count/columns),gap=20,w=(924-gap*(columns-1))/columns,h=(yEnd-yStart-gap*(rows-1))/rows;
   values.forEach((entry,i)=>{const x=78+i%columns*(w+gap),y=yStart+Math.floor(i/columns)*(h+gap);ctx.fillStyle=panel;ctx.fillRect(x,y,w,h);ctx.fillStyle=color(i);ctx.fillRect(x,y,5,h);logoLabel(ctx,entry.series,x+22,y+42,font,fg,w-44,config);
    const now=text(entry.value),old=text(before[i].value);let size=Math.min(textSize(config,'values',80),h*.34);ctx.font=`bold ${size}px ${font}`;while(size>20&&Math.max(ctx.measureText(now).width,ctx.measureText(old).width)>w-44){size--;ctx.font=`bold ${size}px ${font}`;}ctx.fillStyle=textColor(config,'values',color(i));crossText(ctx,old,now,x+22,y+h*.72,mix);
   });
  }else{
   const sorted=items=>items.toSorted((a,b)=>(b.value??-Infinity)-(a.value??-Infinity)||a.index-b.index);
   const oldRank=sorted(before),rank=sorted(values),slot=(yEnd-yStart)/count;
   const x=v=>78+axis.position(v)*924;
   values.forEach((entry,i)=>{const pos=rank.findIndex(r=>r.index===i),oldPos=oldRank.findIndex(r=>r.index===i),y=yStart+lerp(oldPos,pos,mix)*slot;
    logoLabel(ctx,entry.series,80,y+30,font,fg,560,config);setReelText(ctx,config,'values',29,font,fg,'bold');ctx.textAlign='right';crossText(ctx,text(before[i].value),text(entry.value),1000,y+30,mix,340);ctx.textAlign='left';
    ctx.fillStyle=grid;ctx.fillRect(78,y+48,924,Math.min(30,slot*.28));const value=moving(i);if(value!==null){ctx.fillStyle=color(i);ctx.fillRect(Math.min(x(0),x(value)),y+48,Math.max(2,Math.abs(x(value)-x(0))),Math.min(30,slot*.28));}
   });
  }
  return current;
 }
 ctx.lineWidth=2;setReelText(ctx,config,'labels',25,font,muted);
 for(const val of axis.ticks){const y=py(val);ctx.strokeStyle=grid;ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.fillStyle=textColor(config,'labels',muted);ctx.textAlign='right';fittedText(ctx,formatAxisTick(val,config.language),left-22,y+8,left-30);}
 ctx.textAlign='center';
 if(chart==='bar'){
  ctx.fillStyle=textColor(config,'labels',muted);ctx.fillText(xType==='date'?displayDate(Math.floor(current),config.language):String(Math.floor(current)),(left+right)/2,bottom+47);
 }else for(let i=0;i<=4;i++){const x=minX+(maxX-minX)*i/4;ctx.fillStyle=textColor(config,'labels',muted);ctx.fillText(xType==='date'?displayDate(Math.round(x),config.language):String(Math.round(x)),px(x),bottom+47,180);}
 ctx.textAlign='left';
 series.forEach((s,i)=>{
  ctx.strokeStyle=ctx.fillStyle=color(i);ctx.lineWidth=7;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash(s.dashed?[18,14]:[]);
  if(chart==='bar'){
   const v=moving(i);if(v!==null){const barWidth=(right-left)/(series.length*1.6),x=left+i*(right-left)/series.length;ctx.fillRect(x,Math.min(py(0),py(v)),barWidth,Math.max(2,Math.abs(py(0)-py(v))));}
  }else{
   ctx.save();ctx.beginPath();ctx.rect(left-8,top-10,(right-left)*progress+8,bottom-top+20);ctx.clip();
   if(chart==='area'){
    ctx.save();ctx.globalAlpha=.13;let segment=[];const fill=()=>{if(!segment.length)return;ctx.beginPath();ctx.moveTo(px(segment[0].x),py(0));for(const p of segment)ctx.lineTo(px(p.x),py(p.y));ctx.lineTo(px(segment.at(-1).x),py(0));ctx.closePath();ctx.fill();segment=[];};for(const p of s.points){if(Number.isFinite(p.y))segment.push(p);else fill();}fill();ctx.restore();
   }
   ctx.beginPath();let previous=false;for(const p of s.points){if(!Number.isFinite(p.y)){previous=false;continue;}if(previous)ctx.lineTo(px(p.x),py(p.y));else ctx.moveTo(px(p.x),py(p.y));previous=true;}ctx.stroke();ctx.restore();
  }
  ctx.setLineDash([]);const y=bottom+100+i*legendStep;ctx.fillStyle=color(i);ctx.fillRect(80,y-21,6,24);logoLabel(ctx,s,108,y,font,fg,505,config);setReelText(ctx,config,'values',27,font,fg);ctx.textAlign='right';crossText(ctx,text(before[i].value),text(values[i].value),1000,y,mix,350);ctx.textAlign='left';
 });
 return current;
}
