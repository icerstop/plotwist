import {chartAppearance,seriesColor,plotSides,axisTicks,lineAppearance,roundFill,plotGrid} from './chart-appearance.js';
import {aiBrandMotion,aiModelLabel} from './ai-brand-history.js';
import {getReelLogo} from './reel-assets.js';
import {resolveScale,bounds,visibleAiBounds,createAxis,scaleCaption,formatAxisTick} from './chart-scale.js';
import {clamp,lerp,rankMotion} from './presentation.js';
import {aiValue} from './ai.js';
import {themeOf,textSize,textColor,reelTextFont,chartTop} from './reel-design.js';

function ellipsis(ctx,text,width){let value=String(text||'');if(ctx.measureText(value).width<=width)return value;while(value.length&&ctx.measureText(value+'…').width>width)value=value.slice(0,-1);return value+'…';}
export function drawAiBrandComparison(ctx,config,progress,timeSeconds,{fg,muted,grid,panel,wrap}){
 const {history,brands,mode,showBrandLogos=true,showLeaderNames=true}=config.ai;
 const {benchmark:b}=config.ai,duration=config.duration||20,transition=config.transition??.65;
 if(!history.frames.length)return;
 const motion=aiBrandMotion(history,progress,duration,transition,timeSeconds),{frame,before,mix,current}=motion;
 const date=new Date(current).toISOString().slice(0,10),score=l=>l?`${aiValue(l.score,config.language)} ${b.unit}`:'—';
 const byId=(f,id)=>f.leaders.find(l=>l.brand.id===id);
 const appearance=chartAppearance(config),color=brand=>seriesColor(config,brands.findIndex(b=>b.id===brand.id),themeOf(config).dark?brand.color:darken(brand.color));
 function text(value,x,y,width,size,fill=fg,bold=false,role='labels'){
  ctx.fillStyle=textColor(config,role,fill);let px=textSize(config,role,size);
  // Dense brand rows have a fixed vertical rhythm; fit names and keep scores whole.
  if(role==='labels')px=Math.min(px,size+4);
  ctx.font=reelTextFont(config,role,px,bold?'bold':'normal');
  if(role==='values'){while(px>16&&ctx.measureText(String(value)).width>width){px--;ctx.font=reelTextFont(config,role,px,bold?'bold':'normal');}ctx.fillText(String(value),x,y,width);}
  else ctx.fillText(ellipsis(ctx,value,width),x,y);
 }
 function badge(brand,x,y,size=40){if(!showBrandLogos)return 0;const logo=getReelLogo(brand.logo);if(!logo)return 0;ctx.fillStyle='#fff';ctx.fillRect(x,y,size,size);const pad=5,fit=Math.min((size-2*pad)/logo.width,(size-2*pad)/logo.height);ctx.drawImage(logo,x+(size-logo.width*fit)/2,y+(size-logo.height*fit)/2,logo.width*fit,logo.height*fit);return size+12;}
 function identity(brand,winner,previous,x,y,width,compact=false){
  const indent=badge(brand,x,y-29,compact?34:40);
  text(brand.name,x+indent,y,width-indent,compact?28:34,color(brand),true);
  if(showLeaderNames){
   // Whole model/configuration labels fade together; no future model is shown.
   const changed=previous?.id!==winner?.id,fade=changed?mix:1;
   const label=r=>r?aiModelLabel(r):(config.language==='en'?'No result yet':'Brak wyniku do tej daty');
   if(changed&&fade<1){ctx.save();ctx.globalAlpha*=1-fade;text(label(previous),x,y+37,width,compact?25:29,muted);ctx.restore();}
   if(fade>0){ctx.save();ctx.globalAlpha*=fade;text(label(winner),x,y+37,width,compact?25:29,muted);ctx.restore();}
  }
 }
 function exactScore(now,old,x,y,width,size){
  const changed=now?.winner.id!==old?.winner.id;
  if(changed&&mix<1){ctx.save();ctx.globalAlpha*=1-mix;text(score(old),x,y,width,size,muted,true,'values');ctx.restore();}
  ctx.save();ctx.globalAlpha*=changed?mix:1;text(score(now),x,y,width,size,now?color(now.brand):muted,true,'values');ctx.restore();
 }
 wrap(ctx,date,76,733,928,44,1,fg,false,'date');
 wrap(ctx,history.method==='record'?'Rekord marki do tej daty':'Najlepszy z ostatnich wyników marki',76,767,928,24,1,muted);
 const scale=resolveScale(config),caption=scaleCaption(config,scale),raw=history.plotRows;
 const range=scale.dynamic?visibleAiBounds(raw,current,history.times[0],history.times.at(-1),duration,transition):bounds(raw.map(r=>r.score));
 const axis=createAxis(range,{log:scale.log,dynamic:scale.dynamic,includeZero:!scale.log,fixedDomain:[Math.min(0,range.min),b.max||Math.max(1,range.max)]});
 if(mode==='records'){
  const singleColumn=brands.length<=4;
  const legendHeight=singleColumn?(brands.length-1)*82+(showLeaderNames?37:0):(Math.ceil(brands.length/2)-1)*119+(showLeaderNames?80:43);
  const legendTop=1615-legendHeight,bottom=appearance.legend?legendTop-97:1575,top=chartTop(config,840,bottom);const [left,right]=plotSides(config,144,962);
  const first=history.times[0],last=history.times.at(-1),x=t=>left+(t-first)/(last-first||1)*(right-left),y=v=>bottom-axis.position(v)*(bottom-top),currentX=x(current);
  if(caption)wrap(ctx,caption,left,top-25,840,21,1,muted);
  const ticks=axisTicks(config,axis,scale.log,bottom-top,textSize(config,'labels',24));plotGrid(ctx,config,{left,right,top,bottom,ys:ticks.map(y),color:grid,panel});if(appearance.axisLabels)for(const tick of ticks){ctx.textAlign='right';text(formatAxisTick(tick,config.language),left-20,y(tick)+8,118,24,muted);ctx.textAlign='left';}
  // A step appears at its measurement date. Lines never interpolate future scores.
  ctx.save();ctx.beginPath();ctx.rect(left-4,top-5,right-left+8,bottom-top+10);ctx.clip();
  for(const s of history.series){const visible=s.points.filter(p=>p.time<=current);if(!visible.length)continue;
   ctx.save();lineAppearance(ctx,config,color(s.brand));ctx.beginPath();ctx.moveTo(x(visible[0].time),y(visible[0].score));
   let previous=visible[0];for(const point of visible.slice(1)){ctx.lineTo(x(point.time),y(previous.score));ctx.lineTo(x(point.time),y(point.score));previous=point;}
   ctx.lineTo(currentX,y(previous.score));ctx.stroke();ctx.restore();
  }ctx.restore();
  if(appearance.axisLabels){text(history.start,left,bottom+39,390,24,muted);ctx.textAlign='right';text(history.end,right,bottom+39,390,24,muted);ctx.textAlign='left';}
  const legend=rankMotion(brands.map(brand=>byId(before,brand.id)?.score),brands.map(brand=>byId(frame,brand.id)?.score),mix);
  if(appearance.legend)brands.forEach((brand,i)=>{const {from,to,position}=legend[i];
   const x=76+(singleColumn?0:lerp(from%2,to%2,mix)*482),y=legendTop+(singleColumn?position*82:lerp(Math.floor(from/2),Math.floor(to/2),mix)*119),now=byId(frame,brand.id),old=byId(before,brand.id);
   identity(brand,now?.winner,old?.winner,x,y,singleColumn?660:430,!singleColumn);
   exactScore(now,old,singleColumn?776:x,singleColumn?y:y+(showLeaderNames?80:43),singleColumn?225:430,singleColumn?34:29);
  });
 }else if(mode==='ranking'){
  const ranked=frame.rank,oldRank=before.rank,ids=[...new Set([...oldRank,...ranked].map(l=>l.brand.id))];
  if(caption)wrap(ctx,caption,76,801,928,21,1,muted);
  ctx.save();ctx.beginPath();ctx.rect(65,813,950,812);ctx.clip();
  for(const id of ids){const ni=ranked.findIndex(l=>l.brand.id===id),oi=oldRank.findIndex(l=>l.brand.id===id),now=ranked[ni],old=oldRank[oi],brand=(now||old).brand;
   const y=858+lerp(oi<0?brands.length:oi,ni<0?brands.length:ni,mix)*129;
   ctx.save();ctx.globalAlpha*=ni<0?1-mix:oi<0?mix:1;
   identity(brand,now?.winner,old?.winner,76,y,640,true);exactScore(now,old,762,y,240,34);
   const v=lerp(old?.score??0,now?.score??0,mix),zero=76+axis.position(0)*925,xx=76+axis.position(v)*925;
   ctx.fillStyle=grid;roundFill(ctx,76,y+68,925,Math.max(3,appearance.barWidth*.2),appearance.radius);ctx.fillStyle=color(brand);roundFill(ctx,Math.min(zero,xx),y+68,Math.abs(xx-zero),Math.max(3,appearance.barWidth*.2),appearance.radius);ctx.restore();
  }
  ctx.restore();
 }else{
  brands.forEach((brand,i)=>{const x=76+(i%2)*482,y=822+Math.floor(i/2)*259,now=byId(frame,brand.id),old=byId(before,brand.id);
   ctx.fillStyle=panel;roundFill(ctx,x,y,446,236,appearance.radius);identity(brand,now?.winner,old?.winner,x+22,y+53,402,true);
   exactScore(now,old,x+22,y+165,402,46);
   if(now)text(now.winner.date,x+22,y+209,402,22,muted);
  });
 }
 wrap(ctx,'Wynik i model zmieniają się tylko według danych źródłowych.',76,1661,928,22,1,muted);
}
function darken(hex){return '#'+hex.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*.63).toString(16).padStart(2,'0')).join('');}
