import {chartAppearance,seriesColor,plotSides,axisTicks,lineAppearance,roundFill,plotGrid} from './chart-appearance.js';
import {timelineDate,observationPeriod} from './observation-date.js';
import {getReelLogo} from './reel-assets.js';
import {seriesFrame,lerp,rankMotion} from './presentation.js';
import {resolveScale,bounds,visibleSeriesBounds,createAxis,scaleCaption} from './chart-scale.js';
import {axisNumberFormat,drawAxisNumber,drawAxisCaption} from './axis-numbers.js';
import {textSize,textColor,setReelText,reelTextFont} from './reel-design.js';
import {lineEndpoint,lastLineObservation,lineLabelGeometry,endpointLabelText,drawLineLabels} from './line-labels.js';
import {seriesBadge} from './series-identity.js';
import {mysteryRole} from './reel-mystery.js';
import {copyText} from './reel-copy.js';
import {drawIndependentSeries} from './independent-series.js';
export function crossText(ctx,previous,current,x,y,mix=1,maxWidth=1000){
 if(previous===current||mix>=1){ctx.fillText(current,x,y,maxWidth);return;}
 ctx.save();ctx.globalAlpha*=Math.max(0,1-mix*2);ctx.fillText(previous,x,y-8*mix,maxWidth);ctx.restore();
 ctx.save();ctx.globalAlpha*=Math.max(0,mix*2-1);ctx.fillText(current,x,y+8*(1-mix),maxWidth);ctx.restore();
}
export function fittedText(ctx,text,x,y,width){let label=String(text);while(ctx.measureText(label).width>width&&label.length>1)label=label.slice(0,-1);if(label!==String(text))label=label.slice(0,-1)+'…';ctx.fillText(label,x,y);}
function logoLabel(ctx,series,x,y,font,fg,maxWidth,config,fontLimit=Infinity){
 const endMystery=mysteryRole(ctx,'labels');
 const logo=getReelLogo(series.logo);let offset=0;
 if(logo){ctx.fillStyle='#fff';ctx.fillRect(x,y-29,38,38);const ratio=Math.min(30/logo.naturalWidth,30/logo.naturalHeight);ctx.drawImage(logo,x+19-logo.naturalWidth*ratio/2,y-10-logo.naturalHeight*ratio/2,logo.naturalWidth*ratio,logo.naturalHeight*ratio);offset=51;}
 setReelText(ctx,config,'labels',Math.min(27,fontLimit/textSize(config,'labels',1)),font,fg);const suffix=series.scheduleText?` · ${series.scheduleText}`:'',suffixWidth=ctx.measureText(suffix).width;
 fittedText(ctx,copyText(ctx,config,'series.name',series.name,{element:'content',label:'Nazwa serii',multiline:false}),x+offset,y,Math.max(40,maxWidth-offset-suffixWidth));if(suffix)ctx.fillText(suffix,x+maxWidth-suffixWidth,y);endMystery();
}
const extentCache=new WeakMap();
export function drawSeriesContent(ctx,config,progress,{top,bottom,height,legendStep,font,fg,muted,colors,dark,panel,grid,contentTop,formatValue,timeSeconds}){
 const {series=[],chart='line',unit='',xType='year'}=config;
 const state=seriesFrame(series,progress,config.duration||12,config.transition??.65,timeSeconds),{values,before,mix,current}=state;
 if(config.independentAxes&&chart!=='cards')return drawIndependentSeries(ctx,config,progress,state,{top,bottom,height,legendStep,font,fg,muted,colors,dark,panel,grid,contentTop,formatValue,timeSeconds});
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
 const ticks=axisTicks(config,axis,scale.log,bottom-top,textSize(config,'labels',25)),numbers=axisNumberFormat(config,all.range,ticks);
 const unitCaption=chartAppearance(config).axisLabels&&['line','area','bar'].includes(chart)?copyText(ctx,config,'axis.unit',numbers.caption,{element:'content',label:'Opis jednostki osi',multiline:false}):'',autoCaption=scaleCaption(config,scale),caption=autoCaption?copyText(ctx,config,'axis.scale',autoCaption,{element:'content',label:'Podpis zakresu i skali',multiline:false}):'';
 if(unitCaption||caption){setReelText(ctx,config,'labels',unitCaption?28:23,font,muted);drawAxisCaption(ctx,unitCaption,caption,chart==='ranking'?78:135,chart==='ranking'?contentTop-22:top-22,860);}
 const appearance=chartAppearance(config),color=i=>seriesColor(config,i,series[i].customColor?series[i].color:colors[i%colors.length]);
 const text=(v,rowUnit)=>v===null?(config.language==='en'?'no data':'brak danych'):`${formatValue(v)} ${rowUnit}`;
 const rowText=row=>(row.value!==null&&row.point?.valueQualifier?(row.point.valueQualifier==='approximately'?'≈ ':row.point.valueQualifier+' '):'')+text(row.value,config.independentAxes?row.series.unit:unit)+(config.showObservationDates&&row.value!==null&&row.point?.date?` · ${observationPeriod(row.point,config.language)}`:'');
 const moving=i=>values[i].value===null?null:lerp(before[i].value??values[i].value,values[i].value,mix);
 const [left,baseRight]=plotSides(config,135,900),labelsEnabled=appearance.endLabels&&['line','area'].includes(chart);
 const labelGeometry=labelsEnabled?lineLabelGeometry(config,{left,right:baseRight,top,bottom,count:series.length,hasIcons:series.some(s=>seriesBadge(s)),hasDates:series.some(s=>lastLineObservation(s)?.x<maxX)}):null;
 const right=labelGeometry?.right??baseRight,px=x=>left+(x-minX)/(maxX-minX||1)*(right-left),py=y=>bottom-axis.position(y)*(bottom-top);
 if(chart==='cards'||chart==='ranking'){
  const yStart=contentTop,yEnd=height-(height<1400?205:290),count=series.length;
  if(chart==='cards'){
   const columns=count===1?1:2,rows=Math.ceil(count/columns),gap=20,w=(924-gap*(columns-1))/columns,h=(yEnd-yStart-gap*(rows-1))/rows;
   values.forEach((entry,i)=>{const x=78+i%columns*(w+gap),y=yStart+Math.floor(i/columns)*(h+gap);ctx.fillStyle=panel;roundFill(ctx,x,y,w,h,appearance.radius);ctx.fillStyle=color(i);ctx.fillRect(x,y,5,h);logoLabel(ctx,entry.series,x+22,y+Math.min(42,h*.34),font,fg,w-44,config,h*.3);
    const now=rowText(entry),old=rowText(before[i]);let size=Math.min(textSize(config,'values',80),h*.34);ctx.font=reelTextFont(config,'values',size,'bold');while(size>20&&Math.max(ctx.measureText(now).width,ctx.measureText(old).width)>w-44){size--;ctx.font=reelTextFont(config,'values',size,'bold');}ctx.fillStyle=textColor(config,'values',color(i));crossText(ctx,old,now,x+22,y+h*(h<120?.8:.72),mix);
   });
  }else{
   const sorted=items=>items.toSorted((a,b)=>(b.value??-Infinity)-(a.value??-Infinity)||a.index-b.index);
   const oldRank=sorted(before),rank=sorted(values),slot=(yEnd-yStart)/count;
   const x=v=>78+axis.position(v)*924;
   values.forEach((entry,i)=>{const pos=rank.findIndex(r=>r.index===i),oldPos=oldRank.findIndex(r=>r.index===i),y=yStart+lerp(oldPos,pos,mix)*slot;
    logoLabel(ctx,entry.series,80,y+30,font,fg,560,config);setReelText(ctx,config,'values',29,font,fg,'bold');ctx.textAlign='right';crossText(ctx,rowText(before[i]),rowText(entry),1000,y+30,mix,340);ctx.textAlign='left';
    ctx.fillStyle=grid;roundFill(ctx,78,y+48,924,Math.min(44,slot*.38)*appearance.barWidth/95,appearance.radius);const value=moving(i);if(value!==null){ctx.fillStyle=color(i);roundFill(ctx,Math.min(x(0),x(value)),y+48,Math.max(2,Math.abs(x(value)-x(0))),Math.min(44,slot*.38)*appearance.barWidth/95,appearance.radius);}
   });
  }
  return current;
 }
 ctx.lineWidth=2;setReelText(ctx,config,'labels',25,font,muted);
 plotGrid(ctx,config,{left,right,top,bottom,ys:ticks.map(py),color:grid,panel});
 if(appearance.axisLabels){
  for(const val of ticks){const y=py(val);ctx.fillStyle=textColor(config,'labels',muted);ctx.textAlign='right';drawAxisNumber(ctx,numbers.format(val),left-22,y+8,left-30);}
  ctx.textAlign='center';ctx.fillStyle=textColor(config,'labels',muted);
  if(chart==='bar')ctx.fillText(xType==='date'?timelineDate(current,config):String(Math.floor(current)),(left+right)/2,bottom+47);
  else for(let i=0;i<appearance.xTicks;i++){const x=minX+(maxX-minX)*i/(appearance.xTicks-1);ctx.fillText(xType==='date'?timelineDate(Math.round(x),config):String(Math.round(x)),px(x),bottom+47,Math.min(180,(right-left)/(appearance.xTicks-1)));}
 }
 ctx.textAlign='left';
 const legend=rankMotion(before.map(row=>row.value),values.map(row=>row.value),mix);
 series.forEach((s,i)=>{
  ctx.save();ctx.fillStyle=color(i);lineAppearance(ctx,config,color(i),s.dashed);
  if(chart==='bar'){
   const v=moving(i);if(v!==null){const slot=(right-left)/series.length,barWidth=slot*appearance.barWidth/100,x=left+i*slot+(slot-barWidth)/2;roundFill(ctx,x,Math.min(py(0),py(v)),barWidth,Math.max(2,Math.abs(py(0)-py(v))),appearance.radius);}
  }else{
   ctx.save();ctx.beginPath();ctx.rect(left-8,top-10,(right-left)*progress+8,bottom-top+20);ctx.clip();
   if(chart==='area'){
    ctx.save();ctx.shadowBlur=0;ctx.globalAlpha*=appearance.fillOpacity/100;
    if(appearance.fillStyle==='fade'){const gradient=ctx.createLinearGradient(0,top,0,bottom);if(gradient?.addColorStop){gradient.addColorStop(0,color(i));gradient.addColorStop(1,color(i)+'00');ctx.fillStyle=gradient;}}
    let segment=[];const fill=()=>{if(!segment.length)return;ctx.beginPath();ctx.moveTo(px(segment[0].x),py(0));let previous=null;for(const p of segment){if(previous&&s.interpolation==='step')ctx.lineTo(px(p.x),py(previous.y));ctx.lineTo(px(p.x),py(p.y));previous=p;}ctx.lineTo(px(segment.at(-1).x),py(0));ctx.closePath();ctx.fill();segment=[];};for(const p of s.points){if(Number.isFinite(p.y))segment.push(p);else fill();}fill();ctx.restore();
   }
   ctx.beginPath();let previous=null;for(const p of s.points){if(!Number.isFinite(p.y)){previous=null;continue;}if(previous){if(s.interpolation==='step')ctx.lineTo(px(p.x),py(previous.y));ctx.lineTo(px(p.x),py(p.y));}else ctx.moveTo(px(p.x),py(p.y));previous=p;}ctx.stroke();ctx.restore();
  }
  ctx.restore();if(!appearance.legend)return;const endLegend=mysteryRole(ctx,'labels');ctx.setLineDash([]);const y=bottom+100+legend[i].position*legendStep;ctx.fillStyle=color(i);ctx.fillRect(80,y-21,6,24);logoLabel(ctx,s,108,y,font,fg,505,config);setReelText(ctx,config,'values',27,font,fg);ctx.textAlign='right';crossText(ctx,rowText(before[i]),rowText(values[i]),1000,y,mix,350);ctx.textAlign='left';endLegend();
 });
 if(labelGeometry){
  const items=series.flatMap((s,index)=>{const tip=lineEndpoint(s,current,scale.log);return tip?[{index,series:s,anchorX:px(tip.x),anchorY:py(tip.y),color:color(index),...endpointLabelText(tip,config,formatValue)}]:[];});
  drawLineLabels(ctx,config,items,labelGeometry,{top,bottom,x:px(current)+20,fg});
 }
 return current;
}
