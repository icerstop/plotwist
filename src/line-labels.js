import {upperBound,lerp} from './presentation.js';
import {chartAppearance,roundFill} from './chart-appearance.js';
import {reelTextFont,textSize,textColor,themeOf} from './reel-design.js';
import {seriesBadge} from './series-identity.js';
import {getReelLogo} from './reel-assets.js';
import {observationPeriod,timelineDate} from './observation-date.js';
import {mysteryRole} from './reel-mystery.js';

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

export const lineLabelPresets=[
 {id:'icon',name:'Sama flaga / logo',options:{endLabelIcons:true,endLabelNames:false,endLabelValues:false,endLabelDates:false}},
 {id:'icon-name',name:'Flaga / logo + nazwa',options:{endLabelIcons:true,endLabelNames:true,endLabelValues:false,endLabelDates:false}},
 {id:'icon-value',name:'Flaga / logo + wartość',options:{endLabelIcons:true,endLabelNames:false,endLabelValues:true,endLabelDates:false}},
 {id:'name-value',name:'Nazwa + wartość',options:{endLabelIcons:false,endLabelNames:true,endLabelValues:true,endLabelDates:false}},
 {id:'value',name:'Sama wartość',options:{endLabelIcons:false,endLabelNames:false,endLabelValues:true,endLabelDates:false}},
 {id:'all',name:'Wszystkie elementy',options:{endLabelIcons:true,endLabelNames:true,endLabelValues:true,endLabelDates:true}},
];

export function lineLabelGeometry(config,{left,right,top,bottom,count,hasDates=false,hasIcons=true}){
 const s=chartAppearance(config),names=s.endLabelNames===true,values=s.endLabelValues!==false,dates=s.endLabelDates!==false&&hasDates,icons=s.endLabelIcons!==false&&hasIcons,scale=(s.endLabelSize??100)/100;
 if(!count||!names&&!values&&!dates&&!icons)return null;
 const size=Math.max(20,Math.min(52,textSize(config,'values',32)*scale)),gap=8;
 const nameSize=Math.max(14,Math.min(42,textSize(config,'labels',values?22:30)*scale)),dateSize=Math.min(20,nameSize*.85),rowsOfText=Number(names)+Number(values)+Number(dates);
 const textHeight=(names?nameSize:0)+(values?size:0)+(dates?dateSize:0)+Math.max(0,rowsOfText-1)*4;
 const contentHeight=Math.max(textHeight,icons?38*scale:0),wantedHeight=contentHeight+16,height=Math.max(1,bottom-top);
 const minimumHeight=Math.max(icons?34:0,rowsOfText*12+Math.max(0,rowsOfText-1)*3+12);
 const capacity=Math.max(1,Math.floor((height+gap)/(minimumHeight+gap)));
 const columns=Math.max(1,Math.ceil(count/capacity)),rows=Math.max(1,Math.ceil(count/columns));
 const rowHeight=Math.min(wantedHeight,(height-(rows-1)*gap)/rows);
 const outerRight=Math.min(1004,right+104),available=outerRight-left;
 const columnWidth=Math.min((names?230:values||dates?(icons?195:160):72)*scale,Math.max(40,(available*.64-20)/columns));
 const reserve=columnWidth*columns+20,plotRight=Math.max(left+1,outerRight-reserve);
 const fit=Math.min(1,Math.max(1,rowHeight-12)/contentHeight);
 return {right:plotRight,outerRight,columns,columnWidth,height:rowHeight,gap,names,values,dates,icons,size:size*fit,nameSize:nameSize*fit,dateSize:dateSize*fit,iconSize:38*scale*fit,textGap:4*fit};
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
 if(!items.length||!geometry)return [];
 const endMystery=mysteryRole(ctx,'labels');
 // Explicit switches always win, even with duplicate flags or a missing image.
 const visible=items.flatMap(item=>{
  const badge=geometry.icons?(item.badge||seriesBadge(item.series)):null,logo=badge&&getReelLogo(badge.path);
  const name=geometry.names?item.series.name:'',value=geometry.values?item.value:'',date=geometry.dates?item.date:'';
  return logo||name||value||date?[{...item,badge,logo,name,value,date}]:[];
 }),layout=arrangeLineLabels(visible,geometry,{top,bottom,x});
 ctx.save();ctx.shadowBlur=0;ctx.shadowOffsetX=ctx.shadowOffsetY=0;ctx.setLineDash([]);ctx.lineWidth=2;ctx.textAlign='left';ctx.textBaseline='middle';
 // Paint connectors first, then all opaque cards; no connector crosses a label.
 for(const item of layout){ctx.strokeStyle=item.color;ctx.beginPath();ctx.moveTo(item.anchorX,item.anchorY);ctx.lineTo(item.x-10,item.y);ctx.lineTo(item.x,item.y);ctx.stroke();}
 for(const item of layout){
  const y=item.y-item.height/2,pad=8;
  ctx.fillStyle=background||themeOf(config).bg;roundFill(ctx,item.x,y,item.width,item.height,7);
  ctx.fillStyle=item.color;ctx.fillRect(item.x,y+5,3,item.height-10);
  const {badge,logo}=item,badgeSize=Math.min(geometry.iconSize,item.height-12,(item.width-pad*2)/(badge?.kind==='flag'?4/3:1)),badgeWidth=badge?.kind==='flag'?badgeSize*4/3:badgeSize;
  let indent=pad;
  if(logo){const lx=item.x+(!item.name&&!item.value&&!item.date?(item.width-badgeWidth)/2:pad),ly=item.y-badgeSize/2;ctx.fillStyle='#ffffff';roundFill(ctx,lx-2,ly-2,badgeWidth+4,badgeSize+4,3);const ratio=Math.min(badgeWidth/logo.naturalWidth,badgeSize/logo.naturalHeight);ctx.drawImage(logo,lx+(badgeWidth-logo.naturalWidth*ratio)/2,ly+(badgeSize-logo.naturalHeight*ratio)/2,logo.naturalWidth*ratio,logo.naturalHeight*ratio);indent+=badgeWidth+9;}
  const width=Math.max(8,item.width-indent-pad),tx=item.x+indent;
  const rows=[{text:item.name,size:geometry.nameSize,role:'labels'},{text:item.value,size:geometry.size,role:'values'},{text:item.date,size:geometry.dateSize,role:'labels'}].filter(r=>r.text!==undefined&&r.text!=='');
  const textHeight=rows.reduce((sum,r)=>sum+r.size,0)+Math.max(0,rows.length-1)*geometry.textGap;
  let ty=item.y-textHeight/2;
  for(const row of rows){
   let size=row.size;ctx.font=reelTextFont(config,row.role,size,row.role==='values'?600:400);
   if(row.role==='values')while(size>12&&ctx.measureText(row.text).width>width){size--;ctx.font=reelTextFont(config,row.role,size,600);}
   ctx.fillStyle=textColor(config,row.role,fg);ctx.fillText(row.role==='values'?row.text:ellipsis(ctx,row.text,width),tx,ty+row.size/2,width);ty+=row.size+geometry.textGap;
  }
 }
 ctx.restore();endMystery();return layout;
}
