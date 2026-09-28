import {displayDate} from './market.js';
import {getReelLogo} from './reel-assets.js';
import {seriesFrame,lerp} from './presentation.js';
export function crossText(ctx,previous,current,x,y,mix=1){
 if(previous===current||mix>=1){ctx.fillText(current,x,y);return;}
 ctx.save();ctx.globalAlpha*=Math.max(0,1-mix*2);ctx.fillText(previous,x,y-8*mix);ctx.restore();
 ctx.save();ctx.globalAlpha*=Math.max(0,mix*2-1);ctx.fillText(current,x,y+8*(1-mix));ctx.restore();
}
export function fittedText(ctx,text,x,y,width){let label=String(text);while(ctx.measureText(label).width>width&&label.length>1)label=label.slice(0,-1);if(label!==String(text))label=label.slice(0,-1)+'…';ctx.fillText(label,x,y);}
function logoLabel(ctx,series,x,y,font,fg,maxWidth){
 const logo=getReelLogo(series.logo);let offset=0;
 if(logo){ctx.fillStyle='#fff';ctx.fillRect(x,y-29,38,38);const ratio=Math.min(30/logo.naturalWidth,30/logo.naturalHeight);ctx.drawImage(logo,x+19-logo.naturalWidth*ratio/2,y-10-logo.naturalHeight*ratio/2,logo.naturalWidth*ratio,logo.naturalHeight*ratio);offset=51;}
 ctx.fillStyle=fg;ctx.font=`27px ${font}`;const suffix=series.scheduleText?` · ${series.scheduleText}`:'',suffixWidth=ctx.measureText(suffix).width;
 fittedText(ctx,series.name,x+offset,y,Math.max(40,maxWidth-offset-suffixWidth));if(suffix)ctx.fillText(suffix,x+maxWidth-suffixWidth,y);
}
export function drawSeriesContent(ctx,config,progress,{top,bottom,height,legendStep,font,fg,muted,colors,dark,contentTop,formatValue,timeSeconds}){
 const {series=[],chart='line',unit='',xType='year'}=config;
 const state=seriesFrame(series,progress,config.duration||12,config.transition??.65,timeSeconds),{values,before,mix,current}=state;
 let minX=Infinity,maxX=-Infinity,minY=0,rawMax=0;
 for(const s of series)for(const p of s.points){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);if(Number.isFinite(p.y)){minY=Math.min(minY,p.y);rawMax=Math.max(rawMax,p.y);}}
 const step=10**Math.floor(Math.log10(rawMax-minY||1)),maxY=Math.ceil((rawMax||1)/step)*step;
 const color=i=>series[i].customColor?series[i].color:colors[i%colors.length];
 const text=v=>v===null?(config.language==='en'?'no data':'brak danych'):`${formatValue(v)} ${unit}`;
 const moving=i=>values[i].value===null?null:lerp(before[i].value??values[i].value,values[i].value,mix);
 const left=135,right=900,px=x=>left+(x-minX)/(maxX-minX||1)*(right-left),py=y=>bottom-(y-minY)/(maxY-minY||1)*(bottom-top);
 if(chart==='cards'||chart==='ranking'){
  const yStart=contentTop,yEnd=height-(height<1400?205:290),count=series.length;
  if(chart==='cards'){
   const columns=count===1?1:2,rows=Math.ceil(count/columns),gap=20,w=(924-gap*(columns-1))/columns,h=(yEnd-yStart-gap*(rows-1))/rows;
   values.forEach((entry,i)=>{const x=78+i%columns*(w+gap),y=yStart+Math.floor(i/columns)*(h+gap);ctx.fillStyle=dark?'#1d2822':'#e9efdf';ctx.fillRect(x,y,w,h);ctx.fillStyle=color(i);ctx.fillRect(x,y,5,h);logoLabel(ctx,entry.series,x+22,y+42,font,fg,w-44);
    const now=text(entry.value),old=text(before[i].value);let size=Math.min(80,h*.34);ctx.font=`bold ${size}px ${font}`;while(size>24&&Math.max(ctx.measureText(now).width,ctx.measureText(old).width)>w-44){size--;ctx.font=`bold ${size}px ${font}`;}ctx.fillStyle=color(i);crossText(ctx,old,now,x+22,y+h*.72,mix);
   });
  }else{
   const sorted=items=>items.toSorted((a,b)=>(b.value??-Infinity)-(a.value??-Infinity)||a.index-b.index);
   const oldRank=sorted(before),rank=sorted(values),slot=(yEnd-yStart)/count;
   const x=v=>78+(v-minY)/(maxY-minY||1)*924;
   values.forEach((entry,i)=>{const pos=rank.findIndex(r=>r.index===i),oldPos=oldRank.findIndex(r=>r.index===i),y=yStart+lerp(oldPos,pos,mix)*slot;
    logoLabel(ctx,entry.series,80,y+30,font,fg,600);ctx.fillStyle=fg;ctx.font=`bold 29px ${font}`;ctx.textAlign='right';crossText(ctx,text(before[i].value),text(entry.value),1000,y+30,mix);ctx.textAlign='left';
    ctx.fillStyle=dark?'#2a302c':'#dce3d8';ctx.fillRect(78,y+48,924,Math.min(30,slot*.28));const value=moving(i);if(value!==null){ctx.fillStyle=color(i);ctx.fillRect(Math.min(x(0),x(value)),y+48,Math.max(2,Math.abs(x(value)-x(0))),Math.min(30,slot*.28));}
   });
  }
  return current;
 }
 ctx.lineWidth=2;ctx.font=`25px ${font}`;
 for(let i=0;i<=4;i++){const val=minY+(maxY-minY)*i/4,y=py(val);ctx.strokeStyle=dark?'#2a302c':'#dce3d8';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.fillStyle=muted;ctx.textAlign='right';ctx.fillText(formatValue(val),left-22,y+8);}
 ctx.textAlign='center';
 if(chart==='bar'){
  ctx.fillStyle=muted;ctx.fillText(xType==='date'?displayDate(Math.floor(current),config.language):String(Math.floor(current)),(left+right)/2,bottom+47);
 }else for(let i=0;i<=4;i++){const x=minX+(maxX-minX)*i/4;ctx.fillStyle=muted;ctx.fillText(xType==='date'?displayDate(Math.round(x),config.language):String(Math.round(x)),px(x),bottom+47);}
 ctx.textAlign='left';
 series.forEach((s,i)=>{
  ctx.strokeStyle=ctx.fillStyle=color(i);ctx.lineWidth=7;ctx.lineJoin='round';ctx.lineCap='round';ctx.setLineDash(s.dashed?[18,14]:[]);
  if(chart==='bar'){
   const v=moving(i);if(v!==null){const barWidth=(right-left)/(series.length*1.6),x=left+i*(right-left)/series.length;ctx.fillRect(x,Math.min(py(0),py(v)),barWidth,Math.max(2,Math.abs(py(0)-py(v))));}
  }else{
   ctx.save();ctx.beginPath();ctx.rect(left-8,top-10,(right-left)*progress+16,bottom-top+20);ctx.clip();
   if(chart==='area'){
    ctx.save();ctx.globalAlpha=.13;let segment=[];const fill=()=>{if(!segment.length)return;ctx.beginPath();ctx.moveTo(px(segment[0].x),py(0));for(const p of segment)ctx.lineTo(px(p.x),py(p.y));ctx.lineTo(px(segment.at(-1).x),py(0));ctx.closePath();ctx.fill();segment=[];};for(const p of s.points){if(Number.isFinite(p.y))segment.push(p);else fill();}fill();ctx.restore();
   }
   ctx.beginPath();let previous=false;for(const p of s.points){if(!Number.isFinite(p.y)){previous=false;continue;}if(previous)ctx.lineTo(px(p.x),py(p.y));else ctx.moveTo(px(p.x),py(p.y));previous=true;}ctx.stroke();ctx.restore();
  }
  ctx.setLineDash([]);const y=bottom+100+i*legendStep;ctx.fillStyle=color(i);ctx.fillRect(80,y-21,6,24);logoLabel(ctx,s,108,y,font,fg,515);ctx.fillStyle=fg;ctx.font=`27px ${font}`;ctx.textAlign='right';crossText(ctx,text(before[i].value),text(values[i].value),1000,y,mix);ctx.textAlign='left';
 });
 return current;
}
