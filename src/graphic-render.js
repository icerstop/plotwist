import {copyText} from './reel-copy.js';
import {drawTextBlock,paintText} from './reel-text.js';
import {themeOf,setReelText,textSize,beginReelSection} from './reel-design.js';
import {reelFont,drawSignature} from './reel-style.js';
import {drawVisualBackground,drawVisualOverlays} from './visual-render.js';
import {drawReelOverlays} from './overlay-render.js';
import {drawReelLogo} from './reel-logo.js';
import {chartAppearance,seriesColor,roundFill} from './chart-appearance.js';
import {seriesBadge} from './series-identity.js';
import {getReelLogo} from './reel-assets.js';
import {graphicGroups,groupLabel} from './graphic-data.js';

// Static graphics use the same canvas text, media, layers and inspector as reels.
export function drawGraphic(canvas,config){
 const w=1080,h=config.format==='1:1'?1080:config.format==='9:16'?1920:1350;
 if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
 const ctx=canvas.getContext('2d'),g=config.graphic,en=config.language==='en',theme=themeOf(config),font=reelFont(config.fontId),chart=chartAppearance(config),groups=graphicGroups(g.rows,g.statistic);
 const color=id=>seriesColor(config,id==='active'?0:1,id==='active'?g.activeColor:g.inactiveColor);
 const number=n=>n==null?'—':n.toLocaleString(en?'en-GB':'pl-PL',{minimumFractionDigits:g.decimals,maximumFractionDigits:g.decimals});
 const copy=(id,value)=>copyText(ctx,config,`graphic.${id}`,value,{element:'content',label:en?'Chart text':'Tekst wykresu',dynamic:true});
 function text(value,x,y,size=28,role='labels',col=theme.fg,align='left',width=900){ctx.textAlign=align;setReelText(ctx,config,role,size,font,col);paintText(ctx,config,role,[value],x,y,0,width);ctx.textAlign='left';}
 ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillStyle=theme.bg;ctx.fillRect(0,0,w,h);drawVisualBackground(ctx,w,h,config,0);
 const endHeader=beginReelSection(ctx,config,'header',w,h);
 const title=copyText(ctx,config,'title',config.title),subtitle=copyText(ctx,config,'subtitle',config.subtitle);
 const titleSize=textSize(config,'title',h===1080?62:76),titleY=h===1080?110:124;setReelText(ctx,config,'title',h===1080?62:76,font,theme.fg,700);
 const heading=drawTextBlock(ctx,title,76,titleY,924,titleSize*1.12,2,true,config,'title');
 setReelText(ctx,config,'subtitle',30,font,theme.muted);const subtitleHeight=drawTextBlock(ctx,subtitle,76,titleY+heading+18,924,38,2,true,config,'subtitle');
 drawReelLogo(ctx,config,0);endHeader();
 const top=Math.max(h===1080?270:h===1350?315:395,titleY+heading+subtitleHeight+42),bottom=h-(g.reference?285:225);
 const maxRows=Math.max(1,...groups.map(group=>group.n));
 const endContent=beginReelSection(ctx,config,'content',w,h,{x:66,y:top-22,w:950,h:bottom-top+56});
 const max=Math.max(2.1,...g.rows.map(r=>r.value))*1.06;
 const statName=g.statistic==='median'?(en?'Median':'Mediana'):(en?'Mean':'Średnia');
 let rowsTop=top;
 if(g.summary){
  groups.forEach((group,i)=>{const x=78+i*484;ctx.fillStyle=color(group.id);ctx.fillRect(x,top-10,5,80);
   text(copy(`group.${group.id}`,groupLabel(group.id,en)),x+18,top+9,29,'labels',theme.fg,'left',435);
   text(copy(`summary.${group.id}`,number(group.value)),x+18,top+62,48,'values',color(group.id));
   text(copy(`stat.${group.id}`,`${statName} · n = ${group.n}`),x+180,top+65,24,'labels',theme.muted,'left',255);
  });rowsTop+=105;
 }
 function axis(x,y,width){
  if(!chart.axisLabels)return;
  for(let i=0;i<4;i++){const v=max*i/3; text(v.toLocaleString(en?'en-GB':'pl-PL',{maximumFractionDigits:1}),x+width*i/3,y,22,'labels',theme.muted,i===0?'left':i===3?'right':'center');}
 }
 function barList(rows,x,y,width,available,grouped){
  if(grouped&&!g.summary){text(copy(`group.${grouped}`,groupLabel(grouped,en)),x,y,29,'labels',color(grouped),'left',width);y+=45;available-=45;}
  const dots=g.layout==='distribution';
  const rowH=Math.min(h===1920?66:47,available/(grouped?maxRows:Math.max(1,rows.length))),labelSize=Math.min(28,rowH*.8),flagWidth=g.flags?29:0;
  const labelWidth=g.names?Math.min(width*.39,175):0,left=x+labelWidth+flagWidth+(g.names||g.flags?10:0),barW=Math.max(60,width-(left-x)-(g.values?72:8));
  rows.forEach((row,i)=>{const cy=y+(i+.52)*rowH;
   if(g.flags){const img=getReelLogo(seriesBadge(row)?.path);if(img)ctx.drawImage(img,x,cy-10,25,17);}
   if(g.names)text(copy(`country.${row.id}`,row.name[en?'en':'pl']),x+flagWidth,cy+labelSize*.28,labelSize,'labels',theme.fg,'left',labelWidth-3);
   if(chart.grid!=='none'){ctx.save();ctx.strokeStyle=theme.grid;ctx.globalAlpha=chart.gridOpacity/100;ctx.lineWidth=chart.gridWidth;ctx.beginPath();ctx.moveTo(left,cy);ctx.lineTo(left+barW,cy);ctx.stroke();ctx.restore();}
   ctx.save();ctx.globalAlpha*=chart.opacity/100;ctx.fillStyle=color(row.group);const bh=Math.max(3,rowH*.6*chart.barWidth/63);if(dots){const pointX=left+barW*row.value/max;ctx.beginPath();ctx.arc(pointX,cy,Math.max(4,Math.min(9,rowH*.2)),0,Math.PI*2);ctx.fill();}else roundFill(ctx,left,cy-bh/2,barW*row.value/max,bh,chart.radius);ctx.restore();
   if(g.values)text(copy(`value.${row.id}`,number(row.value)),x+width,cy+labelSize*.28,labelSize,'values',theme.fg,'right',69);
  });
  if(dots){const stat=graphicGroups(rows,g.statistic).find(group=>group.value!==null);if(stat){ctx.save();ctx.strokeStyle=color(stat.id);ctx.setLineDash([6,7]);ctx.lineWidth=2;const xx=left+barW*stat.value/max;ctx.beginPath();ctx.moveTo(xx,y);ctx.lineTo(xx,y+rows.length*rowH);ctx.stroke();ctx.restore();}}
  axis(left,y+rows.length*rowH+26,barW);
 }
 if(g.layout==='groups')groups.forEach((group,i)=>barList(group.rows,78+i*484,rowsTop,438,bottom-rowsTop,group.id));
 else if(g.layout==='ranking'){
  const count=Math.ceil(g.rows.length/2);[g.rows.slice(0,count),g.rows.slice(count)].forEach((rows,i)=>barList(rows,78+i*484,rowsTop,438,bottom-rowsTop));
 }else groups.forEach((group,i)=>barList(group.rows,78+i*484,rowsTop,438,bottom-rowsTop,group.id));

 if(g.reference)text(copy('reference',en?'Reference: ≈2.1 births per woman (replacement level)':'Punkt odniesienia: ≈2,1 dziecka na kobietę (zastępowalność)'),78,bottom+65,22,'labels',theme.muted,'left',924);
 endContent();
 const caveat=copyText(ctx,config,'metric',en?'A country comparison, not evidence of causation.':'Porównanie krajów nie dowodzi związku przyczynowego.');
 setReelText(ctx,config,'metric',25,font,theme.muted);drawTextBlock(ctx,caveat,78,h-162,924,30,2,true,config,'metric');
 const source=copyText(ctx,config,'source',config.source);setReelText(ctx,config,'source',22,font,theme.muted);drawTextBlock(ctx,source,78,h-110,924,27,1,true,config,'source');
 drawVisualOverlays(ctx,w,h,config,0);drawSignature(ctx,w,h,config.fontId,theme.dark,config);drawReelOverlays(ctx,w,h,config);
}
