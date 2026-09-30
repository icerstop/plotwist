import {copyText} from './reel-copy.js';
import {chartAppearance,seriesColor,plotSides,axisTicks,lineAppearance,roundFill,plotGrid} from './chart-appearance.js';
import {aiBrandMotion} from './ai-brand-history.js';
import {aiIdentityLayouts,drawAiIdentity} from './ai-labels.js';
import {getReelLogo} from './reel-assets.js';
import {resolveScale,bounds,visibleAiBounds,createAxis,scaleCaption} from './chart-scale.js';
import {axisNumberFormat,drawAxisNumber,drawAxisCaption} from './axis-numbers.js';
import {clamp,lerp,rankMotion} from './presentation.js';
import {aiValue} from './ai.js';
import {themeOf,textSize,textColor,reelTextFont,chartTop} from './reel-design.js';
import {lineLabelGeometry,drawLineLabels} from './line-labels.js';
import {mysteryRole} from './reel-mystery.js';
import {aiFrameLayout} from './ai-layout.js';

function ellipsis(ctx,text,width){let value=String(text||'');if(ctx.measureText(value).width<=width)return value;while(value.length&&ctx.measureText(value+'…').width>width)value=value.slice(0,-1);return value+'…';}
export function drawAiBrandComparison(ctx,config,progress,timeSeconds,{fg,muted,grid,panel,wrap}){
 const {y:Y,gap:G,compact,start,end}=aiFrameLayout(config.format);
 const {history,brands,mode,showBrandLogos=true,showLeaderNames=true}=config.ai;
 const {benchmark:b}=config.ai,duration=config.duration||20,transition=config.transition??.65;
 if(!history.frames.length)return;
 const motion=aiBrandMotion(history,progress,duration,transition,timeSeconds),{frame,before,mix,current}=motion;
 const date=new Date(current).toISOString().slice(0,10),score=l=>l?`${aiValue(l.score,config.language,b.scoreDecimals??1)} ${b.unit}`:'—';
 const byId=(f,id)=>f.leaders.find(l=>l.brand.id===id);
 const appearance=chartAppearance(config),color=brand=>seriesColor(config,brands.findIndex(b=>b.id===brand.id),themeOf(config).dark?brand.color:darken(brand.color));
 const singleColumn=brands.length<=4&&!compact,wide=mode==='ranking'||mode==='records'&&singleColumn;
 let names=aiIdentityLayouts(ctx,config,history,()=>[...new Set(history.frames.flatMap(f=>f.leaders.map(l=>l.winner)))],{width:wide?925:402,size:wide?28:26,detailSize:wide?25:23});
 // Cards reserve the score in the header and a date below the measured label.
 // At large user font sizes use the available card area before adding space.
 if(mode==='timeline'&&showLeaderNames){
  const available=G(828)/Math.ceil(brands.length/2)-(compact?82:129);
  for(let factor=.95;names.height>available&&factor>=.4;factor-=.05)names=aiIdentityLayouts(ctx,config,history,()=>[...new Set(history.frames.flatMap(f=>f.leaders.map(l=>l.winner)))],{width:402,size:26*factor,detailSize:23*factor});
 }
 const nameHeight=showLeaderNames?names.height:0;
 function text(value,x,y,width,size,fill=fg,bold=false,role='labels',fit=false){
  if(role!=='values'&&!fit)value=copyText(ctx,config,'ai.note',value,{element:'content',label:'Podpis wykresu',multiline:false});
  ctx.fillStyle=textColor(config,role,fill);let px=textSize(config,role,size);
  // Dense brand rows have a fixed vertical rhythm; fit names and keep scores whole.
  if(role==='labels')px=Math.min(px,size+4);
  ctx.font=reelTextFont(config,role,px,bold?'bold':'normal');
  if(role==='values'||fit){while(px>16&&ctx.measureText(String(value)).width>width){px--;ctx.font=reelTextFont(config,role,px,bold?'bold':'normal');}ctx.fillText(String(value),x,y,width);}
  else ctx.fillText(ellipsis(ctx,value,width),x,y);
 }
 function badge(brand,x,y,size=40){if(!showBrandLogos)return 0;const logo=getReelLogo(brand.logo);if(!logo)return 0;const endMystery=mysteryRole(ctx,'labels');ctx.fillStyle='#fff';ctx.fillRect(x,y,size,size);const pad=5,fit=Math.min((size-2*pad)/logo.width,(size-2*pad)/logo.height);ctx.drawImage(logo,x+(size-logo.width*fit)/2,y+(size-logo.height*fit)/2,logo.width*fit,logo.height*fit);endMystery();return size+12;}
 function identity(brand,winner,previous,x,y,width,compact=false){
  const indent=badge(brand,x,y-29,compact?34:40);
  text(copyText(ctx,config,'series.name',brand.name,{element:'content',label:'Nazwa serii',multiline:false}),x+indent,y,width-indent,compact?28:34,color(brand),true,'labels',true);
  if(showLeaderNames){
   // Whole model/configuration labels fade together; no future model is shown.
   const changed=previous?.id!==winner?.id,fade=changed?mix:1;
   const label=r=>{if(r)drawAiIdentity(ctx,config,names.layouts.get(r),x,y+15,fg,muted);else text(config.language==='en'?'No result yet':'Brak wyniku do tej daty',x,y+42,wide?925:402,23,muted);};
   if(changed&&fade<1){ctx.save();ctx.globalAlpha*=1-fade;label(previous);ctx.restore();}
   if(fade>0){ctx.save();ctx.globalAlpha*=fade;label(winner);ctx.restore();}
  }
 }
 function exactScore(now,old,x,y,width,size){
  const changed=now?.winner.id!==old?.winner.id;
  if(changed&&mix<1){ctx.save();ctx.globalAlpha*=1-mix;text(score(old),x,y,width,size,muted,true,'values');ctx.restore();}
  ctx.save();ctx.globalAlpha*=changed?mix:1;text(score(now),x,y,width,size,now?color(now.brand):muted,true,'values');ctx.restore();
 }
 wrap(ctx,date,76,Y(733),928,compact?36:44,1,fg,false,'date');
 wrap(ctx,history.method==='record'?'Rekord marki do tej daty':'Najlepszy z ostatnich wyników marki',76,Y(767),928,compact?20:24,1,muted);
 const scale=resolveScale(config),caption=scaleCaption(config,scale),raw=history.plotRows;
 const range=scale.dynamic?visibleAiBounds(raw,current,history.times[0],history.times.at(-1),duration,transition):bounds(raw.map(r=>r.score));
 const axis=createAxis(range,{log:scale.log,dynamic:scale.dynamic,includeZero:!scale.log,fixedDomain:[Math.min(0,range.min),b.max||Math.max(1,range.max)]});
 if(mode==='records'){
  const legendStride=Math.max(singleColumn?62:84,nameHeight+(compact?54:singleColumn?62:101));
  const legendHeight=(singleColumn?brands.length:Math.ceil(brands.length/2))*legendStride-(compact?20:40);
  // Reserve a real plotting area in shorter formats. A dense legend is fitted
  // uniformly, so text and brand marks keep their original proportions.
  const legendScale=compact?Math.min(1,(end-start)*.43/legendHeight):1;
  const legendTop=(compact?end-60:Y(1615))-legendHeight*legendScale,bottom=appearance.legend?legendTop-(compact?85:97):Y(1575),top=chartTop(config,compact?start+120:840,bottom);const [left,baseRight]=plotSides(config,144,962);
  const labelGeometry=appearance.endLabels?lineLabelGeometry(config,{left,right:baseRight,top,bottom,count:brands.length,hasIcons:brands.some(b=>b.logo)}):null,right=labelGeometry?.right??baseRight;
  const first=history.times[0],last=history.times.at(-1),x=t=>left+(t-first)/(last-first||1)*(right-left),y=v=>bottom-axis.position(v)*(bottom-top),currentX=x(current);
  const ticks=axisTicks(config,axis,scale.log,bottom-top,textSize(config,'labels',24)),numbers=axisNumberFormat(config,bounds(raw.map(r=>r.score)),ticks);
  ctx.font=reelTextFont(config,'labels',textSize(config,'labels',28));ctx.fillStyle=textColor(config,'labels',muted);
  drawAxisCaption(ctx,appearance.axisLabels?copyText(ctx,config,'axis.unit',numbers.caption,{element:'content',label:'Opis jednostki osi',multiline:false}):'',caption?copyText(ctx,config,'axis.scale',caption,{element:'content',label:'Podpis zakresu i skali',multiline:false}):'',left,top-25,840);
  plotGrid(ctx,config,{left,right,top,bottom,ys:ticks.map(y),color:grid,panel});if(appearance.axisLabels)for(const tick of ticks){ctx.textAlign='right';ctx.font=reelTextFont(config,'labels',Math.min(textSize(config,'labels',24),28));ctx.fillStyle=textColor(config,'labels',muted);drawAxisNumber(ctx,numbers.format(tick),left-20,y(tick)+8,left-30);ctx.textAlign='left';}
  // A step appears at its measurement date. Lines never interpolate future scores.
  ctx.save();ctx.beginPath();ctx.rect(left-4,top-5,right-left+8,bottom-top+10);ctx.clip();
  for(const s of history.series){const visible=s.points.filter(p=>p.time<=current);if(!visible.length)continue;
   ctx.save();lineAppearance(ctx,config,color(s.brand));ctx.beginPath();ctx.moveTo(x(visible[0].time),y(visible[0].score));
   let previous=visible[0];for(const point of visible.slice(1)){ctx.lineTo(x(point.time),y(previous.score));ctx.lineTo(x(point.time),y(point.score));previous=point;}
   ctx.lineTo(currentX,y(previous.score));ctx.stroke();ctx.restore();
  }ctx.restore();
  if(labelGeometry){
   const items=brands.flatMap((brand,index)=>{const leader=byId(frame,brand.id);return leader?[{index,series:{name:brand.name,logo:brand.logo},anchorX:currentX,anchorY:y(leader.score),color:color(brand),value:aiValue(leader.score,config.language,b.scoreDecimals??1)}]:[];});
   drawLineLabels(ctx,config,items,labelGeometry,{top,bottom,x:currentX+20,fg});
  }
  if(appearance.axisLabels){text(history.start,left,bottom+39,390,24,muted);ctx.textAlign='right';text(history.end,right,bottom+39,390,24,muted);ctx.textAlign='left';}
  const legend=rankMotion(brands.map(brand=>byId(before,brand.id)?.score),brands.map(brand=>byId(frame,brand.id)?.score),mix);
  if(appearance.legend){ctx.save();ctx.translate(76,legendTop);ctx.scale(legendScale,legendScale);ctx.translate(-76,0);brands.forEach((brand,i)=>{const {from,to,position}=legend[i];
   const x=76+(singleColumn?0:lerp(from%2,to%2,mix)*482),y=singleColumn?position*legendStride:lerp(Math.floor(from/2),Math.floor(to/2),mix)*legendStride,now=byId(frame,brand.id),old=byId(before,brand.id);
   identity(brand,now?.winner,old?.winner,x,y,singleColumn?660:430,!singleColumn);
   exactScore(now,old,compact?x+275:singleColumn?776:x,compact||singleColumn?y:y+nameHeight+54,compact?150:singleColumn?225:430,compact?24:singleColumn?34:29);
  });ctx.restore();}
 }else if(mode==='ranking'){
  const stride=Math.max(G(108),nameHeight+80),count=Math.max(1,Math.min(appearance.aiRankCount??6,brands.length,Math.floor(G(805)/stride)));
  const ranked=frame.rank.slice(0,count),oldRank=before.rank.slice(0,count),ids=[...new Set([...oldRank,...ranked].map(l=>l.brand.id))];
  if(caption)wrap(ctx,caption,76,Y(801),928,21,1,muted);
  ctx.textAlign='right';wrap(ctx,`TOP ${count}`,1000,Y(801),150,21,1,muted);ctx.textAlign='left';
  ctx.save();ctx.beginPath();ctx.rect(65,Y(813),950,G(817));ctx.clip();
  for(const id of ids){const ni=ranked.findIndex(l=>l.brand.id===id),oi=oldRank.findIndex(l=>l.brand.id===id),now=ranked[ni],old=oldRank[oi],brand=(now||old).brand;
   const y=Y(813)+31+lerp(oi<0?count:oi,ni<0?count:ni,mix)*stride;
   ctx.save();ctx.globalAlpha*=ni<0?1-mix:oi<0?mix:1;
   identity(brand,now?.winner,old?.winner,76,y,640,true);exactScore(now,old,762,y,240,34);
   const v=lerp(old?.score??0,now?.score??0,mix),zero=76+axis.position(0)*925,xx=76+axis.position(v)*925;
   ctx.fillStyle=grid;roundFill(ctx,76,y+nameHeight+29,925,Math.max(3,appearance.barWidth*.2),appearance.radius);ctx.fillStyle=color(brand);roundFill(ctx,Math.min(zero,xx),y+nameHeight+29,Math.abs(xx-zero),Math.max(3,appearance.barWidth*.2),appearance.radius);ctx.restore();
  }
  ctx.restore();
 }else{
  const cardHeight=Math.max(G(222),nameHeight+(compact?76:111)),stride=cardHeight+G(18);
  brands.forEach((brand,i)=>{const x=76+(i%2)*482,y=Y(809)+Math.floor(i/2)*stride,now=byId(frame,brand.id),old=byId(before,brand.id);
   ctx.fillStyle=panel;roundFill(ctx,x,y,446,cardHeight,appearance.radius);identity(brand,now?.winner,old?.winner,x+22,y+(compact?32:42),235,true);
   exactScore(now,old,x+275,y+(compact?32:42),149,29);
   if(now)text(now.winner.date,x+22,y+cardHeight-(compact?10:20),402,compact?18:22,muted);
  });
 }
 wrap(ctx,'Wynik i model zmieniają się tylko według danych źródłowych.',76,Y(1661),928,22,1,muted);
}
function darken(hex){return '#'+hex.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*.63).toString(16).padStart(2,'0')).join('');}
