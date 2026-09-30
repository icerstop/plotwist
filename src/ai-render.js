import {reelMotionFrame} from './reel-motion.js';
import {copyText,resetReelCopy} from './reel-copy.js';
import {renderMysteryFrame} from './reel-mystery.js';
import {chartAppearance,seriesColor,plotSides,axisTicks,lineAppearance,roundFill,plotGrid} from './chart-appearance.js';
import {drawTextBlock,textStyleOf} from './reel-text.js';
import {drawReelLogo} from './reel-logo.js';
import {beginElement,textRect} from './reel-elements.js';
import {drawReelOverlays} from './overlay-render.js';
import {translate} from './translations.js';
import {drawAiBrandComparison} from './ai-brand-render.js';
import {aiValue as formatAiValue,frameAt} from './ai.js';
import {reelFont,reelTitleSize,drawSignature} from './reel-style.js';
import {sceneAt,aiMotionFrame,ease,lerp,clamp} from './presentation.js';
import {crossText} from './series-render.js';
import {drawVisualBackground,drawVisualOverlays} from './visual-render.js';
import {resolveScale,bounds,visibleAiBounds,createAxis,scaleCaption} from './chart-scale.js';
import {axisNumberFormat,drawAxisNumber,drawAxisCaption} from './axis-numbers.js';
import {layoutAiIdentity,drawAiIdentity,aiRankingLayout,aiIdentityLayouts} from './ai-labels.js';
import {themeOf,textSize,textColor,setReelText,reelTextFont,textWeight,beginReelSection,chartTop,designOf} from './reel-design.js';
function typography(font,language,config){
function wrap(ctx,text,x,y,width,size=34,max=3,color,custom=false,role='labels'){
 if(!custom)text=translate(text,language);
 if(role!=='values')text=copyText(ctx,config,role==='labels'?'ai.note':role,text,{element:role==='labels'?'content':role,dynamic:role==='date',multiline:role!=='date'});
 const title=role==='title';
 setReelText(ctx,config,role,title?size/textSize(config,role,1):size,font,color,title||size>=60?'bold':'');
 const actual=title?size:textSize(config,role,size);
 return drawTextBlock(ctx,text,x,y,width,actual*1.22,max,true,config,role,title||role==='date');

}
function fit(ctx,text,width,size,min=26){size=textSize(config,'values',size);ctx.font=reelTextFont(config,'values',size,'bold');while(size>min&&ctx.measureText(text).width>width){size--;ctx.font=reelTextFont(config,'values',size,'bold');}ctx.fillStyle=textColor(config,'values',ctx.fillStyle);return size;}
return {wrap,fit};
}
export function drawAiReel(canvas,config,progress=1,timeSeconds=progress*(config.duration||12)){
 resetReelCopy(canvas);
 if(renderMysteryFrame(canvas,config,progress,timeSeconds,drawAiReelFrame))return;
 drawAiReelFrame(canvas,config,progress,timeSeconds);
}
function drawAiReelFrame(canvas,config,progress,timeSeconds){
 const visualTime=timeSeconds,motionFrame=reelMotionFrame(config,progress,timeSeconds);config=motionFrame.config;progress=motionFrame.progress;timeSeconds=motionFrame.dataTime;
 const {wrap,fit}=typography(reelFont(config.fontId),config.language,config);
 const aiValue=value=>formatAiValue(value,config.language,config.ai.benchmark.scoreDecimals??1);
 const {ai:{rows,benchmark:b,basis,mode,comparison,scope},title,theme='dark'}=config;
 const trackingAverage=b.aggregation==='tracking-last-n';
 const ctx=canvas.getContext('2d');if(canvas.width!==1080||canvas.height!==1920){canvas.width=1080;canvas.height=1920;}
 const {dark,bg,fg,muted,panel,grid,colors}=themeOf(config),appearance=chartAppearance(config),[accent,purple]=colors.map((c,i)=>seriesColor(config,i,c));
 ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);ctx.textAlign='left';
 drawVisualBackground(ctx,1080,1920,config,visualTime);
 const endHeader=beginReelSection(ctx,config,'header',1080,1920);
 drawReelLogo(ctx,config,visualTime,{x:76,y:73,h:50});
 wrap(ctx,title||b.name,76,304,928,reelTitleSize(ctx,copyText(ctx,config,'title',title||b.name),designOf(config).text.title.fontId||config.fontId,textSize(config,'title',83),928,3,270,{...textStyleOf(config,'title'),weight:textWeight(config,'title','bold')}),3,fg,true,'title');
 const endSubtitle=beginElement(ctx,config,'subtitle',{x:76,y:508,w:928,h:168});
 const subtitleHeight=wrap(ctx,`${b.name}${b.unit?` (${b.unit})`:''}`,76,548,928,40,2,accent,false,'subtitle');
 if(scope||trackingAverage)wrap(ctx,trackingAverage?'Średnia z ostatnich maks. 7 prób':scope,76,548+subtitleHeight+18,928,28,1,muted,false,'subtitle');
 endSubtitle();endHeader();
 const first=rows[0],last=rows.at(-1),transition=config.transition??.65,duration=config.duration||20;
 const frame=mode==='scatter'?frameAt(rows,progress):null;
 if(!first)return;
 const endContent=beginReelSection(ctx,config,'content',1080,1920);
 const scale=resolveScale(config),caption=scaleCaption(config,scale);
 const aiAxis=()=>{
  const start=Date.parse(first.date),end=Date.parse(last.date),current=lerp(start,end,clamp(progress));
  const range=scale.dynamic?visibleAiBounds(rows,current,start,end,duration,transition):bounds(rows.flatMap(r=>[r.score,r.low??r.score-(r.stderr||0),r.high??r.score+(r.stderr||0)]));
  if(mode==='scatter'&&b.baseline){range.min=Math.min(range.min,b.baseline.score);range.max=Math.max(range.max,b.baseline.score);}
  const domain=mode==='scatter'?[b.max?0:Math.floor(range.min/10)*10-10,b.max||Math.ceil(range.max/10)*10+10]:[Math.min(0,range.min),b.max||Math.max(1,range.max)];
  return createAxis(range,{log:scale.log,dynamic:scale.dynamic,fixedDomain:domain,includeZero:mode!=='scatter'||!!b.max});
 };
 const score=r=>`${aiValue(r.score)} ${b.unit}`;
 if(config.ai.groupBy==='brand'){
   drawAiBrandComparison(ctx,config,progress,timeSeconds,{fg,muted,grid,panel,wrap});
 } else if(mode==='timeline'){
   const scene=sceneAt(rows.length,progress,duration,transition);
   function card(index,opacity,dy){
    if(opacity<=0)return;const r=rows[index];ctx.save();ctx.globalAlpha*=opacity;ctx.translate(0,dy);
    wrap(ctx,r.date,76,735,920,39,1,muted,false,'date');
    drawAiIdentity(ctx,config,layoutAiIdentity(ctx,config,r,{width:920,size:58,detailSize:34}),76,775,fg,muted);
    ctx.fillStyle=accent;fit(ctx,score(r),930,147,70);ctx.fillText(score(r),76,1190);
    const detail=r.low!=null?`90% CI: ${aiValue(r.low)}–${aiValue(r.high)}`:r.stderr!=null?`Błąd standardowy: ±${aiValue(r.stderr)} p.p.`:r.rawScore!==undefined?`Surowy wynik: ${r.rawScore}/${r.total}`:r.elo?`Rating Codeforces: ${r.elo}`:'Wynik odnotowany w źródle';
    wrap(ctx,detail,76,1260,920,31,2,muted);
    const recent=rows.slice(Math.max(0,index-1),index+1).map(p=>({row:p,layout:layoutAiIdentity(ctx,config,p,{width:920,nameWidth:700,size:28,detailSize:24})}));
    while(recent.length>1&&recent.reduce((h,p)=>h+p.layout.height+46,0)>268)recent.shift();
    let recentY=1370;for(const {row:p,layout} of recent){wrap(ctx,p.date,76,recentY+23,920,22,1,muted);drawAiIdentity(ctx,config,layout,76,recentY+31,fg,muted);ctx.textAlign='right';wrap(ctx,aiValue(p.score),999,recentY+31+layout.blocks[0].baseline,220,31,1,fg,false,'values');ctx.textAlign='left';recentY+=layout.height+46;}
    wrap(ctx,`Obserwacja ${index+1} / ${rows.length}`,76,1660,920,28,1,muted);ctx.restore();
   }
   if(scene.mix<1)card(scene.previous,clamp(1-scene.mix*2),-28*scene.mix);
   card(scene.index,clamp(scene.mix*2-1),28*(1-scene.mix));
   ctx.fillStyle=grid;ctx.fillRect(76,1340,925,5);ctx.fillStyle=accent;ctx.fillRect(76,1340,925*clamp(progress),5);
 } else if(mode==='ranking'){
   const motion=aiMotionFrame(rows,progress,duration,transition,timeSeconds),now=motion.frame,old=motion.before,{mix}=motion;
   wrap(ctx,now.date,76,735,920,44,1,fg,false,'date');
   const layout=aiRankingLayout(ctx,config,motion.frames),{count,stride,labelHeight,dateSize,barHeight}=layout;
   const current=now.rank.slice(0,count),before=old.rank.slice(0,count),ids=[...new Set([...before,...current].map(r=>r.modelId))];
   const axis=aiAxis(),barX=v=>76+axis.position(v)*925;
   if(caption)wrap(ctx,caption,76,780,720,23,1,muted);
   ctx.textAlign='right';wrap(ctx,`TOP ${count}`,1000,780,170,23,1,muted);ctx.textAlign='left';
   ctx.save();ctx.beginPath();ctx.rect(65,796,950,824);ctx.clip();
   for(const id of ids){
    const ni=current.findIndex(r=>r.modelId===id),oi=before.findIndex(r=>r.modelId===id),r=current[ni]||before[oi],prev=before[oi]||r;
    const alpha=ni<0?1-mix:oi<0?mix:1;if(alpha<=0)continue;
    const y=802+lerp(oi<0?count:oi,ni<0?count:ni,mix)*stride;
    ctx.save();ctx.globalAlpha*=alpha;
    // The identity follows the row, while only its position and bar length tween.
    const identity=layout.layouts.get(r);drawAiIdentity(ctx,config,identity,76,y+layout.titleOffset,fg,muted);
    ctx.textAlign='right';setReelText(ctx,config,'values',40,reelFont(config.fontId),ni===0?accent:fg,'bold');crossText(ctx,aiValue(prev.score),aiValue(r.score),1000,y+layout.titleOffset+identity.blocks[0].baseline,mix,240);ctx.textAlign='left';
    const barY=y+labelHeight+14;
    ctx.fillStyle=grid;roundFill(ctx,76,barY,925,barHeight,appearance.radius);ctx.fillStyle=ni===0?accent:purple;const v=lerp(prev.score,r.score,mix);roundFill(ctx,Math.min(barX(0),barX(v)),barY,Math.abs(barX(v)-barX(0)),barHeight,appearance.radius);
    const uncertainty=r.low!=null?`90% CI: ${aiValue(r.low)}–${aiValue(r.high)}`:r.stderr!=null?`SE: ±${aiValue(r.stderr)} p.p.`:'';
    const detail=trackingAverage?`Średnia z ${r.sampleCount} prób · ostatni test ${r.lastRunAt.slice(0,10)}`:`${r.date}${uncertainty?' · '+uncertainty:''}`;
    wrap(ctx,detail,76,barY+barHeight+12+dateSize,920,23,1,muted);ctx.restore();
   }
   ctx.restore();wrap(ctx,trackingAverage?'TrackingAI · średnia z ostatnich maks. 7 prób':`${b.unit} · ostatni dostępny pomiar każdego wariantu`,76,1650,920,26,1,muted);
 } else if(mode==='records'){
   const motion=aiMotionFrame(rows,progress,duration,transition,timeSeconds),{frames,frame:now,before:old,mix,current}=motion;
   const names=aiIdentityLayouts(ctx,config,frames,()=>[...new Set(frames.map(f=>f.record))],{width:920,size:32,detailSize:26}),nameTop=1605-names.height,valueY=nameTop-56;
   const bottom=valueY-115,top=chartTop(config,815,bottom),axis=aiAxis();const [left,right]=plotSides(config,130,960);
   const start=frames[0].time,end=frames.at(-1).time,x=t=>left+(t-start)/(end-start||1)*(right-left),y=v=>bottom-axis.position(v)*(bottom-top);
   const ticks=axisTicks(config,axis,scale.log,bottom-top,textSize(config,'labels',25)),numbers=axisNumberFormat(config,bounds(rows.map(r=>r.score)),ticks);
   setReelText(ctx,config,'labels',28,reelFont(config.fontId),muted);
   drawAxisCaption(ctx,appearance.axisLabels?copyText(ctx,config,'axis.unit',numbers.caption,{element:'content',label:'Opis jednostki osi',multiline:false}):'',caption?copyText(ctx,config,'axis.scale',caption,{element:'content',label:'Podpis zakresu i skali',multiline:false}):'',left,top-22,850);
   wrap(ctx,`${b.unit} · najwyższy dotąd wynik w filtrze`,76,727,920,30,2,muted);
   plotGrid(ctx,config,{left,right,top,bottom,ys:ticks.map(y),color:grid,panel});if(appearance.axisLabels)for(const value of ticks){ctx.textAlign='right';setReelText(ctx,config,'labels',25,reelFont(config.fontId),muted);drawAxisNumber(ctx,numbers.format(value),left-20,y(value)+9,left-30);ctx.textAlign='left';}
   ctx.save();ctx.beginPath();ctx.rect(left-5,top-5,(right-left)*progress+5,bottom-top+10);ctx.clip();lineAppearance(ctx,config,accent);ctx.beginPath();let previous=frames[0].record.score;ctx.moveTo(left,y(previous));
   for(const f of frames.slice(1)){ctx.lineTo(x(f.time),y(previous));ctx.lineTo(x(f.time),y(f.record.score));previous=f.record.score;}ctx.lineTo(right,y(previous));ctx.stroke();ctx.restore();
   if(appearance.axisLabels){wrap(ctx,first.date,left,bottom+55,400,27,1,muted);ctx.textAlign='right';wrap(ctx,last.date,right,bottom+55,400,27,1,muted);ctx.textAlign='left';}
   function recordLabel(r,alpha){
    if(alpha<=0)return;ctx.save();ctx.globalAlpha*=alpha;
    setReelText(ctx,config,'values',43,reelFont(config.fontId),accent,'bold');ctx.fillText(score(r),76,valueY);
    const uncertainty=r.low!=null?`90% CI: ${aiValue(r.low)}–${aiValue(r.high)}`:r.stderr!=null?`SE: ±${aiValue(r.stderr)} p.p.`:'';
    if(uncertainty)wrap(ctx,uncertainty,76,nameTop-16,920,24,1,muted);
    drawAiIdentity(ctx,config,names.layouts.get(r),76,nameTop,fg,muted);
    wrap(ctx,`Rekord z ${r.date}`,76,1634,920,24,1,muted);ctx.restore();
   }
   if(now.record.id!==old.record.id&&mix<1){recordLabel(old.record,clamp(1-mix*2));recordLabel(now.record,clamp(mix*2-1));}else recordLabel(now.record,1);
   wrap(ctx,new Date(current).toISOString().slice(0,10),76,1669,920,27,1,muted,false,'date');
 } else if(mode==='scatter'){
   const names=aiIdentityLayouts(ctx,config,rows,()=>rows,{width:920,size:32,detailSize:26}),nameTop=1595-names.height;
   const bottom=nameTop-120,top=chartTop(config,775,bottom);const [left,right]=plotSides(config,130,960);
   const axis=aiAxis(),min=axis.min,max=axis.max;
   const t0=Date.parse(first.date),t1=Date.parse(last.date);const x=d=>left+(Date.parse(d)-t0)/(t1-t0||1)*(right-left),y=v=>bottom-axis.position(v)*(bottom-top);
   const ticks=axisTicks(config,axis,scale.log,bottom-top,textSize(config,'labels',25)),numbers=axisNumberFormat(config,bounds(rows.map(r=>r.score)),ticks);
   setReelText(ctx,config,'labels',28,reelFont(config.fontId),muted);
   drawAxisCaption(ctx,appearance.axisLabels?copyText(ctx,config,'axis.unit',numbers.caption,{element:'content',label:'Opis jednostki osi',multiline:false}):'',caption?copyText(ctx,config,'axis.scale',caption,{element:'content',label:'Podpis zakresu i skali',multiline:false}):'',left,top-22,850);
   plotGrid(ctx,config,{left,right,top,bottom,ys:ticks.map(y),color:grid,panel});if(appearance.axisLabels)for(const value of ticks){ctx.textAlign='right';setReelText(ctx,config,'labels',25,reelFont(config.fontId),muted);drawAxisNumber(ctx,numbers.format(value),left-20,y(value)+9,left-30);ctx.textAlign='left';}
   wrap(ctx,b.unit,76,720,920,30,1,muted);
   if(b.baseline){const yy=y(b.baseline.score);ctx.strokeStyle=purple;ctx.setLineDash([10,10]);ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(right,yy);ctx.stroke();ctx.setLineDash([]);wrap(ctx,`Punkt odniesienia: ${aiValue(b.baseline.score)}`,left,yy-15,800,26,1,purple);}
   frame.visible.forEach(r=>{const age=(lerp(t0,t1,progress)-Date.parse(r.date))/(t1-t0||1)*duration*.9+Math.max(0,timeSeconds-duration*.9);const alpha=transition&&r.date!==first.date?ease(age/Math.min(transition,duration*.08)):1;ctx.save();ctx.globalAlpha*=alpha;ctx.fillStyle=accent;ctx.save();ctx.globalAlpha*=.48;ctx.beginPath();ctx.arc(x(r.date),y(r.score),7,0,Math.PI*2);ctx.fill();ctx.restore();const lo=r.low??(r.stderr!=null?r.score-r.stderr:null),hi=r.high??(r.stderr!=null?r.score+r.stderr:null);if(lo!=null&&hi!=null){ctx.strokeStyle=grid;ctx.beginPath();ctx.moveTo(x(r.date),y(Math.max(min,lo)));ctx.lineTo(x(r.date),y(Math.min(max,hi)));ctx.stroke();}ctx.restore();});
   if(appearance.axisLabels){wrap(ctx,first.date,left,bottom+55,400,27,1,muted);ctx.textAlign='right';wrap(ctx,last.date,right,bottom+55,400,27,1,muted);ctx.textAlign='left';}
   if(frame.current){wrap(ctx,`Ostatnio: ${aiValue(frame.current.score)} ${b.unit}`,76,nameTop-20,920,32,1,accent,false,'values');drawAiIdentity(ctx,config,names.layouts.get(frame.current),76,nameTop,fg,muted);}
   wrap(ctx,frame.date,76,1630,900,45,1,fg,false,'date');wrap(ctx,`${frame.visible.length} pomiarów · ${b.id==='eci'?'wąsy: 90% CI':rows.some(r=>r.stderr!=null)?'wąsy: ±1 SE':'bez interpolacji'}`,76,1665,920,28,1,muted);
 } else {
   const r=rows.filter(r=>r.modelId===comparison).at(-1)||last,base=b.baseline;
   if(!base){endContent();return;}
   [{row:r,value:score(r),color:accent},{row:{model:base.name},value:`${aiValue(base.score)} ${b.unit}`,color:purple}].forEach((item,i)=>{const y=735+i*370;ctx.save();const enter=transition?ease((timeSeconds-i*.25)/transition):1;ctx.globalAlpha*=enter;ctx.translate(0,24*(1-enter));ctx.fillStyle=panel;roundFill(ctx,76,y,928,320,appearance.radius);drawAiIdentity(ctx,config,layoutAiIdentity(ctx,config,item.row,{width:850,size:39,detailSize:29}),112,y+24,fg,muted);ctx.fillStyle=item.color;fit(ctx,item.value,850,104,55);ctx.fillText(item.value,112,y+255);if(i===0&&r.stderr!=null)wrap(ctx,`SE: ±${aiValue(r.stderr)} p.p.`,112,y+296,850,23,1,muted);ctx.restore();});
   wrap(ctx,`${r.date} · różnica ${aiValue(r.score-base.score)} ${b.unit==='%'?'p.p.':'punktów percentylowych'}`,76,1520,920,35,2,fg);
   wrap(ctx,base.note,76,1600,920,28,3,muted);
 }
 endContent();
 // Methodology stays in the reel; the mystery sequence reveals it with the answer.
 drawVisualOverlays(ctx,1080,1920,config,visualTime);
 const dating=basis==='release'?'Wg premier · retrospektywa, pomiary mogły być późniejsze':b.dateKind==='snapshot'?'Stan rankingu na dzień pobrania':'Wg dat testu / publikacji · bez interpolacji';
 const warning=trackingAverage?b.caveat:b.id.startsWith('iq-')?'Quiz TrackingAI ≠ psychometryczne IQ człowieka':b.id==='eci'?'ECI ≠ IQ · aktualne przeliczenie historii':b.id==='codeforces2024'?'Percentyl wśród uczestników · 10 zgłoszeń':b.id.startsWith('swe-')?'Wynik systemu z narzędziami; wersje środowiska rozdzielone':b.id==='gpqa'&&mode==='duel'?'Eksperci dziedzinowi; różne protokoły ewaluacji':['frontiermath','frontiermath4'].includes(b.id)?'Od 13.11.2025 budżet tokenów 10× większy; porównanie orientacyjne':b.caveat;
 const endSource=beginElement(ctx,config,'source',{x:76,y:1673,w:928,h:158});
 wrap(ctx,dating,76,1700,928,22,2,muted,false,'source');wrap(ctx,warning,76,1760,928,22,2,muted,false,'source');wrap(ctx,`${b.source} · dane ${b.retrievedAt}`,76,1821,928,23,1,muted,false,'source');
 endSource();
 drawSignature(ctx,1080,1920,config.fontId,dark,config);
 drawReelOverlays(ctx,1080,1920,config);
}
