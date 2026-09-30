import {axisTicks,chartAppearance,lineAppearance,plotGrid,roundFill,seriesColor} from './chart-appearance.js';
import {bounds,createAxis,resolveScale,visibleSeriesBounds,scaleCaption} from './chart-scale.js';
import {axisNumberFormat,drawAxisNumber} from './axis-numbers.js';
import {setReelText,textSize} from './reel-design.js';
import {copyText} from './reel-copy.js';
import {timelineDate,observationPeriod} from './observation-date.js';
import {lerp} from './presentation.js';
import {lineEndpoint,lineLabelGeometry,endpointLabelText,drawLineLabels} from './line-labels.js';
import {seriesBadge} from './series-identity.js';
import {mysteryRole} from './reel-mystery.js';

const extents=new WeakMap();
function extent(series){let r=extents.get(series);if(!r){r=bounds(series.points.map(p=>p.y));extents.set(series,r);}return r;}
function fit(ctx,text,x,y,width){ctx.fillText(text,x,y,width);}
function tweenText(ctx,previous,current,x,y,width,mix){
 if(previous===current||mix>=1){fit(ctx,current,x,y,width);return;}
 ctx.save();ctx.globalAlpha*=Math.max(0,1-mix*2);fit(ctx,previous,x,y-8*mix,width);ctx.restore();
 ctx.save();ctx.globalAlpha*=Math.max(0,mix*2-1);fit(ctx,current,x,y+8*(1-mix),width);ctx.restore();
}

// Every panel shares the timeline and animation frame, but never its value axis.
// Raw source observations (including zeros, negatives and gaps) stay unchanged.
export function drawIndependentSeries(ctx,config,progress,state,layout){
 const {series,chart}=config,{top,bottom,font,fg,muted,colors,panel,grid,formatValue}=layout;
 const appearance=chartAppearance(config),scale=resolveScale(config),{current,values,before,mix}=state;
 let minX=Infinity,maxX=-Infinity;for(const s of series)for(const p of s.points){minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);}
 const columns=series.length>3?2:1,rows=Math.ceil(series.length/columns),gapX=32,gapY=34;
 const caption=scaleCaption(config,scale);
 const captionSpace=caption?30:0,available=bottom-top-captionSpace,slot=(available-gapY*(rows-1))/rows,width=(924-gapX*(columns-1))/columns;
 if(caption){const end=mysteryRole(ctx,'labels');setReelText(ctx,config,'labels',23,font,muted);fit(ctx,copyText(ctx,config,'axis.scale',caption,{element:'content',label:'Podpis zakresu i skali',multiline:false}),78,top-22,924);end();}
 series.forEach((s,i)=>{
  const col=i%columns,row=Math.floor(i/columns),x=78+col*(width+gapX),y=top+captionSpace+row*(slot+gapY),lastRow=row===rows-1;
  const color=seriesColor(config,i,s.customColor?s.color:colors[i%colors.length]);
  const name=copyText(ctx,config,'series.name',s.name,{element:'content',label:'Nazwa serii',multiline:false});
  const endHeader=mysteryRole(ctx,'labels');
  ctx.textAlign='left';setReelText(ctx,config,'labels',Math.min(30,slot*.16),font,fg,'bold');
  if(appearance.legend){const labelColor=ctx.fillStyle;ctx.fillStyle=color;ctx.fillRect(x,y-21,5,25);ctx.fillStyle=labelColor;fit(ctx,name,x+14,y,width-14);}
  const entry=values[i],unit=s.unit||'';
  const valueNumbers=axisNumberFormat({...config,unit,visuals:{...config.visuals,design:{...config.visuals?.design,chart:{...appearance,axisUnitPosition:'caption'}}}},extent(s),[],{minimumAutoDecimals:1});
  const rowText=row=>{const qualifier=row.point?.valueQualifier;return row.value===null?(config.language==='en'?'no data':'brak danych'):`${qualifier==='approximately'?'≈ ':qualifier||''}${valueNumbers.format(row.value)} ${valueNumbers.unit}${config.showObservationDates&&row.point?.date?` · ${observationPeriod(row.point,config.language)}`:''}`;};
  if(appearance.legend){setReelText(ctx,config,'values',Math.min(25,slot*.14),font,color);tweenText(ctx,rowText(before[i]),rowText(entry),x+14,y+32,width-14,mix);}
  endHeader();
  const pTop=y+(appearance.legend?66:8),pBottom=Math.max(pTop+12,y+slot-(lastRow&&appearance.axisLabels?40:8));
  const full=extent(s),range=scale.dynamic?visibleSeriesBounds([s],current,scale.log):full;
  if(chart==='bar'&&scale.dynamic&&Number.isFinite(before[i].value)){range.min=Math.min(range.min,before[i].value);range.max=Math.max(range.max,before[i].value);}
  const axis=createAxis(range,{log:scale.log,dynamic:scale.dynamic});
  const ticks=axisTicks(config,axis,scale.log,pBottom-pTop,24),numbers=axisNumberFormat({...config,unit},full,ticks);
  const margin=columns===1?84:68,inset=(width-margin)*(1-appearance.width/100)/2,left=x+margin+inset,baseRight=x+width-inset;
  let geometry=appearance.endLabels&&['line','area'].includes(chart)?lineLabelGeometry(config,{left,right:baseRight-104,top:pTop,bottom:pBottom,count:1,hasIcons:!!seriesBadge(s),hasDates:s.points.at(-1)?.x<maxX}):null;
  const right=geometry?.right??baseRight,px=v=>left+(v-minX)/(maxX-minX||1)*(right-left),py=v=>pBottom-axis.position(v)*(pBottom-pTop);
  plotGrid(ctx,config,{left,right,top:pTop,bottom:pBottom,ys:ticks.map(py),color:grid,panel});
  const endAxes=mysteryRole(ctx,'labels');
  if(appearance.axisLabels){
   setReelText(ctx,config,'labels',24,font,muted);ctx.textAlign='right';for(const v of ticks)drawAxisNumber(ctx,numbers.format(v),left-12,py(v)+7,margin-20);
   ctx.textAlign='left';setReelText(ctx,config,'labels',21,font,muted);
   const unitCaption=copyText(ctx,config,'axis.unit',numbers.caption,{element:'content',label:'Opis jednostki osi',multiline:false,entity:s.id,context:s.name});
   if(unitCaption)fit(ctx,unitCaption,left,pTop-10,right-left);
   if(lastRow){ctx.textAlign='center';setReelText(ctx,config,'labels',24,font,muted);const count=Math.min(appearance.xTicks,columns===1?8:4);for(let j=0;j<count;j++){const v=minX+(maxX-minX)*j/(count-1);fit(ctx,config.xType==='date'?timelineDate(Math.round(v),config):String(Math.round(v)),px(v),pBottom+32,(right-left)/(count-1));}}
  }ctx.textAlign='left';endAxes();
  ctx.save();lineAppearance(ctx,config,color,s.dashed);ctx.fillStyle=color;
  if(chart==='bar'){
   const value=entry.value===null?null:lerp(before[i].value??entry.value,entry.value,mix);
   if(value!==null){const w=(right-left)*appearance.barWidth/100;roundFill(ctx,left+(right-left-w)/2,Math.min(py(0),py(value)),w,Math.max(2,Math.abs(py(value)-py(0))),appearance.radius);}
  }else{
   ctx.beginPath();ctx.rect(left-8,pTop-10,Math.max(0,px(current)-left)+8,pBottom-pTop+20);ctx.clip();
   if(chart==='area'){
    ctx.save();ctx.shadowBlur=0;ctx.globalAlpha*=appearance.fillOpacity/100;
    if(appearance.fillStyle==='fade'){const g=ctx.createLinearGradient(0,pTop,0,pBottom);g.addColorStop(0,color);g.addColorStop(1,color+'00');ctx.fillStyle=g;}
    let segment=[];const fill=()=>{if(!segment.length)return;ctx.beginPath();ctx.moveTo(px(segment[0].x),py(0));let old=null;for(const p of segment){if(old&&s.interpolation==='step')ctx.lineTo(px(p.x),py(old.y));ctx.lineTo(px(p.x),py(p.y));old=p;}ctx.lineTo(px(segment.at(-1).x),py(0));ctx.closePath();ctx.fill();segment=[];};for(const p of s.points){if(Number.isFinite(p.y))segment.push(p);else fill();}fill();ctx.restore();
   }
   ctx.beginPath();let old=null;for(const p of s.points){if(!Number.isFinite(p.y)){old=null;continue;}if(old){if(s.interpolation==='step')ctx.lineTo(px(p.x),py(old.y));ctx.lineTo(px(p.x),py(p.y));}else ctx.moveTo(px(p.x),py(p.y));old=p;}ctx.stroke();
  }ctx.restore();
  if(geometry){const tip=lineEndpoint(s,current,scale.log);if(tip)drawLineLabels(ctx,config,[{index:i,series:s,anchorX:px(tip.x),anchorY:py(tip.y),color,...endpointLabelText(tip,config,formatValue)}],geometry,{top:pTop,bottom:pBottom,x:px(current)+20,fg});}
 });
 return current;
}
