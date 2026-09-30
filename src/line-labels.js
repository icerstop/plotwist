import {upperBound,lerp} from './presentation.js';
import {chartAppearance,roundFill} from './chart-appearance.js';
import {reelTextFont,textSize,textColor,themeOf} from './reel-design.js';
import {seriesBadge} from './series-identity.js';
import {getReelLogo} from './reel-assets.js';
import {observationPeriod,timelineDate} from './observation-date.js';

// The tip follows the actual drawn segment, including log geometry and steps.
// Never bridge a null or show a series before its first observation.
export function lineEndpoint(series,current,log=false){
 const i=upperBound(series.points,current,p=>p.x)-1,a=series.points[i],b=series.points[i+1];
 if(!Number.isFinite(a?.y))return null;
 if(b&&!Number.isFinite(b.y)&&current>a.x)return null;
 if(!b)return {x:a.x,y:a.y,point:a,estimated:false,ended:current>a.x};
 if(current===a.x||series.interpolation==='step')return {x:current,y:a.y,point:a,estimated:false};
 const t=(current-a.x)/(b.x-a.x),y=log?Math.exp(lerp(Math.log(a.y),Math.log(b.y),t)):lerp(a.y,b.y,t);
 return {x:current,y,point:a,estimated:a.y!==b.y};
}

// Bounded isotonic regression: minimum movement while keeping every box apart.
// Ties use series order, so identical values cannot jitter between ranks.
export function spreadLineLabels(items,top,bottom,height,gap=8){
 const sorted=items.toSorted((a,b)=>a.anchorY-b.anchorY||a.index-b.index),pitch=height+gap;
 const low=top+height/2,high=Math.max(low,bottom-height/2-(sorted.length-1)*pitch),blocks=[];
 sorted.forEach((item,i)=>{
  blocks.push({start:i,end:i,sum:item.anchorY-i*pitch,count:1});
  while(blocks.length>1){const a=blocks.at(-2),b=blocks.at(-1);if(a.sum/a.count<=b.sum/b.count)break;blocks.splice(-2,2,{start:a.start,end:b.end,sum:a.sum+b.sum,count:a.count+b.count});}
 });
 const result=[];
 for(const block of blocks){const base=Math.max(low,Math.min(high,block.sum/block.count));for(let i=block.start;i<=block.end;i++)result.push({...sorted[i],y:base+i*pitch});}
 return result;
}

export function lineLabelGeometry(config,{left,right,top,bottom,count,needsNames=false}){
 const s=chartAppearance(config),names=s.endLabelNames||needsNames,scale=(s.endLabelSize??100)/100;
 const size=Math.max(20,Math.min(52,textSize(config,'values',32)*scale)),gap=8;
 const wantedHeight=size+18+(names?22*scale:0),height=Math.max(1,bottom-top);
 const capacity=Math.max(1,Math.floor((height+gap)/((names?44:34)+gap)));
 const columns=Math.max(1,Math.ceil(count/capacity)),rows=Math.max(1,Math.ceil(count/columns));
 const rowHeight=Math.min(wantedHeight,(height-(rows-1)*gap)/rows);
 const outerRight=Math.min(1004,right+104),available=outerRight-left;
 const columnWidth=Math.min((names?230:195)*scale,Math.max(40,(available*.64-20)/columns));
 const reserve=columnWidth*columns+20,plotRight=Math.max(left+1,outerRight-reserve);
 return {right:plotRight,outerRight,columns,columnWidth,height:rowHeight,gap,names,size:Math.min(size,names?(rowHeight-14)/1.7:rowHeight-12)};
}

export function arrangeLineLabels(items,geometry,{top,bottom,x}){
 const ordered=items.toSorted((a,b)=>a.anchorY-b.anchorY||a.index-b.index),perColumn=Math.ceil(ordered.length/geometry.columns),result=[];
 for(let col=0;col<geometry.columns;col++){
  const group=ordered.slice(col*perColumn,(col+1)*perColumn);
  result.push(...spreadLineLabels(group,top,bottom,geometry.height,geometry.gap).map(item=>({...item,x:x+col*geometry.columnWidth,width:geometry.columnWidth-6,height:geometry.height})));
 }
 return result;
}

const ellipsis=(ctx,text,width)=>{let value=String(text);if(ctx.measureText(value).width<=width)return value;while(value.length&&ctx.measureText(value+'…').width>width)value=value.slice(0,-1);return value+'…';};
export function endpointLabelText(tip,config,formatValue){
 const s=chartAppearance(config),interpolated=s.endLabelValue!=='observed'&&tip.estimated;
 const value=interpolated?tip.y:tip.point.y,q=tip.point.valueQualifier;
 const prefix=(interpolated?'≈ ':'')+(q==='approximately'?(interpolated?'':'≈ '):q||'');
 const date=tip.ended?(tip.point.date?observationPeriod(tip.point,config.language):config.xType==='date'?timelineDate(tip.point.x,config):String(tip.point.x)):'';
 return {value:prefix+formatValue(value),date};
}

export function drawLineLabels(ctx,config,items,geometry,{top,bottom,x,fg,background}){
 if(!items.length)return [];
 const s=chartAppearance(config),layout=arrangeLineLabels(items,geometry,{top,bottom,x});
 ctx.save();ctx.shadowBlur=0;ctx.shadowOffsetX=ctx.shadowOffsetY=0;ctx.setLineDash([]);ctx.lineWidth=2;ctx.textAlign='left';ctx.textBaseline='middle';
 // Paint connectors first, then all opaque cards; no connector crosses a label.
 for(const item of layout){ctx.strokeStyle=item.color;ctx.beginPath();ctx.moveTo(item.anchorX,item.anchorY);ctx.lineTo(item.x-10,item.y);ctx.lineTo(item.x,item.y);ctx.stroke();}
 for(const item of layout){
  const y=item.y-item.height/2,pad=8,name=geometry.names||item.date;
  ctx.fillStyle=background||themeOf(config).bg;roundFill(ctx,item.x,y,item.width,item.height,7);
  ctx.fillStyle=item.color;ctx.fillRect(item.x,y+5,3,item.height-10);
  const badge=s.endLabelIcons!==false?(item.badge||seriesBadge(item.series)):null,logo=badge&&getReelLogo(badge.path);
  const badgeSize=Math.min(38,item.height-12),badgeWidth=badge?.kind==='flag'?badgeSize*4/3:badgeSize;
  let indent=pad;
  if(logo){const lx=item.x+pad,ly=item.y-badgeSize/2;ctx.fillStyle='#ffffff';roundFill(ctx,lx-2,ly-2,badgeWidth+4,badgeSize+4,3);const ratio=Math.min(badgeWidth/logo.naturalWidth,badgeSize/logo.naturalHeight);ctx.drawImage(logo,lx+(badgeWidth-logo.naturalWidth*ratio)/2,ly+(badgeSize-logo.naturalHeight*ratio)/2,logo.naturalWidth*ratio,logo.naturalHeight*ratio);indent+=badgeWidth+9;}
  const width=Math.max(8,item.width-indent-pad),tx=item.x+indent;
  let size=geometry.size;
  ctx.font=reelTextFont(config,'values',size,600);
  while(size>12&&ctx.measureText(item.value).width>width){size--;ctx.font=reelTextFont(config,'values',size,600);}
  ctx.fillStyle=textColor(config,'values',fg);ctx.fillText(item.value,tx,item.y+(name?8:0),width);
  if(name){ctx.font=reelTextFont(config,'labels',Math.min(20,geometry.size*.68),400);ctx.fillStyle=textColor(config,'labels',fg);const text=[geometry.names?item.series.name:'',item.date].filter(Boolean).join(' · ');ctx.fillText(ellipsis(ctx,text,width),tx,y+Math.min(14,item.height*.25),width);}
 }
 ctx.restore();return layout;
}
