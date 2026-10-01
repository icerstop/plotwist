import {resizedPlotRect} from './reel-resize.js';
import {releaseRenderConfig} from './release-axis-link.js';
import {releaseStockPulseLayout} from './release-stock.js';
import {drawReleaseStock} from './release-stock-render.js';
import {drawReleaseDetail} from './ai-release-detail.js';
import {normalizeReleaseAppearance,releasePulseLayout,releaseWindow} from './release-appearance.js';
import {drawReleaseVariant} from './ai-release-variant-render.js';
import {RELEASE_PUBLISHERS,releaseDay,releaseDate,releaseFrame,releaseCount,groupReleases,releaseMonths,releaseEndingState} from './ai-releases.js';
import {aiFrameLayout} from './ai-layout.js';
import {reelMotionFrame} from './reel-motion.js';
import {themeOf,textSize,setReelText,beginReelSection,designOf} from './reel-design.js';
import {reelFont,reelTitleSize,drawSignature} from './reel-style.js';
import {drawTextBlock,textStyleOf} from './reel-text.js';
import {copyText,describeCopy} from './reel-copy.js';
import {drawReelLogo} from './reel-logo.js';
import {drawVisualBackground,drawVisualOverlays} from './visual-render.js';
import {drawReelOverlays} from './overlay-render.js';
import {getReelLogo} from './reel-assets.js';
import {roundFill,seriesColor,chartAppearance,lineAppearance} from './chart-appearance.js';
import {beginElement} from './reel-elements.js';
import {datedEvents,eventPausePlan,eventPauseFrame} from './event-timing.js';
const clamp=n=>Math.max(0,Math.min(1,n));
export function drawReleaseReel(canvas,initial,progress,timeSeconds){
 const motion=reelMotionFrame(initial,progress,timeSeconds),layout=aiFrameLayout(initial.format),{height,start,end,textScale}=layout;
 const config=releaseRenderConfig({...motion.config,_aiTextScale:textScale}),r=config.releases;
 const plan=eventPausePlan(config.timelineEvents||datedEvents(r.rows,r.start,r.end),(config.duration||24)*.9,config.visuals?.design?.motion?.eventPauses);
 const playback=eventPauseFrame(plan,motion.dataTime),frame=releaseFrame(r.rows,r.start,r.end,playback.progress,r.count);
 const ending=releaseEndingState(timeSeconds,initial.duration||24);
 const eventAge=date=>config.editorPreview?Infinity:motion.dataTime-(plan.stops.find(e=>e.id===date)?.at??0);
 if(canvas.width!==1080||canvas.height!==height){canvas.width=1080;canvas.height=height;}
 const ctx=canvas.getContext('2d'),theme=themeOf(config),{fg,muted,grid,panel,bg,dark}=theme;
 const style=chartAppearance(config),appearance=normalizeReleaseAppearance(style.release);let textElement='content';
 const en=config.language==='en',t=(pl,eng)=>en?eng:pl,locale=en?'en-GB':'pl-PL',font=reelFont(config.fontId);
 const publishers=RELEASE_PUBLISHERS.filter(p=>r.publishers.includes(p.id)).map(p=>({...p,color:seriesColor(config,RELEASE_PUBLISHERS.findIndex(q=>q.id===p.id),p.color)}));
 const dateLabel=date=>new Date(`${date}T00:00:00Z`).toLocaleDateString(locale,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
 const monthLabel=date=>new Date(`${date.slice(0,7)}-01T00:00:00Z`).toLocaleDateString(locale,{month:'long',year:'numeric',timeZone:'UTC'});
 function text(value,x,y,width,size=30,role='labels',color=fg,max=1,editable=false,options={}){
  const textConfig={...config,_textElement:editable?role:textElement};
  setReelText(ctx,textConfig,role,size,font,color,role==='title'||role==='values'?'bold':'');
  value=copyText(ctx,config,options.id||(editable?role:`${textElement}.${role}.${value}`),value,{dynamic:role==='date',element:editable?role:textElement,...options});
  return drawTextBlock(ctx,value,x,y,width,textSize(textConfig,role,size)*1.19,max,true,textConfig,role,editable);
 }
 function section(id,rect,extra){const previous=textElement;textElement=id;const end=beginElement(ctx,config,id,rect,extra);return ()=>{end();textElement=previous;};}
 function line(x1,y1,x2,y2,color=grid,width=2){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
 function dot(x,y,color,radius=7){ctx.beginPath();ctx.fillStyle=color;ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();}
 function logo(p,x,y,size){const image=r.logos&&getReelLogo(p.logo);if(image){ctx.fillStyle='#fff';roundFill(ctx,x,y,size,size,8);const inset=Math.min(5,size*.15);ctx.drawImage(image,x+inset,y+inset,size-inset*2,size-inset*2);}else dot(x+size/2,y+size/2,p.color,7);}
 ctx.textAlign='left';ctx.fillStyle=bg;ctx.fillRect(0,0,1080,height);drawVisualBackground(ctx,1080,height,config,timeSeconds);
 const headerEnd=beginReelSection(ctx,config,'header',1080,height);
 drawReelLogo(ctx,config,timeSeconds,{x:76,y:layout.compact?40:73,h:layout.compact?34:50});
 const title=copyText(ctx,config,'title',config.title),size=reelTitleSize(ctx,title,designOf(config).text.title.fontId||config.fontId,textSize(config,'title',83),928,3,layout.titleHeight,textStyleOf(config,'title'));
 // Fitting already includes both the user's size and the compact-frame scale.
 const titleHeight=text(title,76,layout.titleY,928,size/textSize(config,'title',1),'title',fg,3,true);
 text(publishers.map(p=>p.name).join(' × '),76,layout.compact?layout.titleY+titleHeight+20:548,928,38,'subtitle',muted,2,true);headerEnd();
 const stop=beginReelSection(ctx,config,'content',1080,height);let h=end-start,y=f=>start+h*f;
 const stockVisible=r.stock&&!config.visuals?.hidden?.stock,summaryHeight=config.visuals?.hidden?.summary?0:stockVisible?Math.min(100,h*.14):h*.18,sy=f=>stockVisible?start+summaryHeight*f/.18:y(f);
 const summaryEnd=section('summary',{x:76,y:start,w:928,h:summaryHeight});
 const countLabel=r.count==='launches'?t('premiery producentów','publisher launches'):t('wersje modeli','model versions');
 text(String(frame.monthTotal),76,sy(.058),400,72,'values',fg,1,false,{id:'release.monthCount',label:'Licznik w miesiącu',dynamic:true});
 text(monthLabel(frame.date),76,sy(.105),470,28,'labels',muted,1,false,{id:'release.month',label:'Aktualny miesiąc',dynamic:true});
 text(`${frame.total}`,620,sy(.058),380,72,'values',fg,1,false,{id:'release.total',label:'Licznik łączny',dynamic:true});
 text(t('łącznie w wybranym okresie','total in selected period'),620,sy(.105),390,26,'labels',muted,1,false,{id:'release.totalLabel',label:'Opis licznika łącznego'});
 text(`${countLabel} · ${r.rows.some(row=>row.category==='restricted')?t('także dostęp partnerski','includes partner access'):t('w katalogu','in catalogue')}`,76,sy(.16),930,26,'labels',muted,1,false,{id:'release.countLabel',label:'Opis sposobu liczenia'});
 summaryEnd();
 const stockHeight=stockVisible?h*appearance.stockHeight/100:0;
 const stockPlot=stockVisible?drawReleaseStock({ctx,config,frame,style,appearance,theme,top:start+summaryHeight+30,bottom:start+summaryHeight+stockHeight-32,text,section,dateLabel,t}):null;
 const bodyStart=stockVisible?start+summaryHeight+stockHeight+16:start;h=end-bodyStart;y=f=>stockVisible?bodyStart+h*(f-.2)/.8:bodyStart+h*f;
 const detail=(top,bottom,hero)=>drawReleaseDetail({ctx,config,s:appearance,theme,frame,publishers,text,section,logo,dateLabel,t,eventAge,textScale},top,bottom,hero);
 if(!drawReleaseVariant({ctx,r,frame,publishers,theme,style,y,h,text,section,line,dateLabel,t,eventAge,detail,locale})){
 const crowded=publishers.length>2,pulse=stockVisible?releaseStockPulseLayout(bodyStart,end,appearance,config.visuals?.hidden):releasePulseLayout(bodyStart,end,appearance,config.visuals?.hidden);
 const baseTop=r.mode==='pulse'?pulse.top:y(crowded?.19:.21),baseBottom=r.mode==='pulse'?pulse.bottom:y(crowded?.60:.56),baseHeight=baseBottom-baseTop;
 const baseLeft=stockPlot?.left??225,baseRight=stockPlot?.right??baseLeft+775*appearance.timelineWidth/100;
 const rect=r.mode==='pulse'?resizedPlotRect(config,'plot',{x:baseLeft,y:baseTop,w:baseRight-baseLeft,h:baseHeight}):{x:76,y:baseTop-30,w:928,h:baseHeight+75};
 const vt=r.mode==='pulse'?rect.y:baseTop,vh=r.mode==='pulse'?rect.h:baseHeight,vb=vt+vh,flowOffset=r.mode==='pulse'?Math.max(0,vb-baseBottom):0;
 const plotEnd=section('plot',rect,r.mode==='pulse'?{geometryResize:true,hitRect:{x:rect.x-149,y:vt-30,w:rect.w+149,h:vh+75}}:undefined);
 if(r.mode==='calendar'){
  const month=frame.date.slice(0,7),first=releaseDay(`${month}-01`),d=new Date(`${month}-01T00:00:00Z`),offset=(d.getUTCDay()+6)%7;d.setUTCMonth(d.getUTCMonth()+1);const days=releaseDay(d.toISOString().slice(0,10))-first;
  const labels=en?['M','T','W','T','F','S','S']:['Pn','Wt','Śr','Cz','Pt','So','Nd'],cw=132,ch=(vh-30)/6;
  labels.forEach((label,i)=>text(label,83+i*cw,vt,100,23,'labels',muted,1,false,{id:'release.weekday',entity:i,label:'Dzień tygodnia'}));
  for(let day=1;day<=days;day++){
   const cell=offset+day-1,x=76+(cell%7)*cw,top=vt+15+Math.floor(cell/7)*ch,stamp=releaseDate(first+day-1),passed=stamp<=frame.date,inRange=stamp>=r.start&&stamp<=r.end;
   ctx.save();ctx.globalAlpha*=inRange?1:.2;ctx.fillStyle=panel;roundFill(ctx,x,top,cw-8,ch-6,style.radius);
   if(stamp===frame.date){ctx.strokeStyle=publishers[0]?.color||fg;ctx.lineWidth=3;ctx.strokeRect(x+1,top+1,cw-10,ch-8);}
   text(String(day),x+9,top+textSize(config,'labels',25)+2,cw-25,25,'labels',passed?fg:muted,1,false,{id:'release.day',entity:day,label:'Dzień miesiąca'});
   if(passed&&inRange){const entries=r.rows.filter(item=>item.date===stamp);publishers.forEach((p,i)=>{if(entries.some(e=>e.publisher===p.id))dot(x+49+(i%5)*14,top+ch/2-5+Math.floor(i/5)*10,p.color,4);});}
   ctx.restore();
  }
  publishers.forEach((p,i)=>{const lx=85+(i%4)*232,ly=vb+18+Math.floor(i/4)*23;dot(lx,ly,p.color,5);text(p.name,lx+15,ly+7,210,23,'labels',muted,1,false,{id:'release.publisher',entity:p.id,label:'Nazwa producenta'});});
 }else{
  const left=rect.x,right=rect.x+rect.w,window=releaseWindow(releaseDay(r.start),releaseDay(r.end),frame.current,appearance.windowDays),a=window.first,b=window.last,x=day=>left+(day-a)/(b-a||1)*(right-left),groups=groupReleases(frame.visible).filter(g=>releaseDay(g.date)>=a);
  publishers.forEach((p,i)=>{
   const pitch=vh*.83/publishers.length,basePitch=baseHeight*.83/publishers.length,yy=vt+pitch*(i+.5),icon=Math.max(5,Math.min(36,basePitch-3)),laneFont=stockVisible?Math.min(25,basePitch*.8/textScale):25;
   const labelRight=left-appearance.laneLabelGap,nameWidth=145-(appearance.laneLogos?icon+7:0),labelConfig={...config,_textElement:'plot'};
   setReelText(ctx,labelConfig,'labels',laneFont,font,muted);
   const name=describeCopy(config,'release.publisher',p.name,{entity:p.id,element:'plot'}).value,measured=appearance.laneNames?Math.min(nameWidth,ctx.measureText(name).width):0;
   if(appearance.laneLogos)logo(p,labelRight-measured-(measured?7:0)-icon,yy-icon/2,icon);
   if(appearance.laneNames){ctx.textAlign='right';text(p.name,labelRight,yy+laneFont*textScale*.3,nameWidth,laneFont,'labels',muted,1,false,{id:'release.publisher',entity:p.id,label:'Nazwa producenta'});ctx.textAlign='left';}
   line(left,yy,right,yy);ctx.save();lineAppearance(ctx,config,p.color);line(left,yy,x(frame.current),yy,p.color,stockVisible?Math.min(style.lineWidth,basePitch*.3):style.lineWidth);ctx.setLineDash([]);ctx.shadowBlur=0;
   for(const group of groups.filter(g=>g.publisher===p.id)){
    const px=x(releaseDay(group.date));if(appearance.pointSize>0)dot(px,yy,p.color,Math.min(appearance.pointSize+Math.min(3,group.models.length),stockVisible?basePitch*.4:Infinity));
    const age=eventAge(group.date),life=ending.pulseDuration;if(appearance.pulses&&age>=0&&age<life){const phase=age/life;ctx.save();ctx.globalAlpha*=(1-phase)**2;ctx.strokeStyle=p.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,yy,10+30*phase,0,Math.PI*2);ctx.stroke();ctx.restore();}
   }ctx.restore();
  });
  ctx.save();ctx.globalAlpha*=config.editorPreview?0:ending.cursorOpacity;line(x(frame.current),vt-10,x(frame.current),vt+vh*.85,fg,2);ctx.restore();
  if(appearance.axisDates){text(dateLabel(releaseDate(Math.floor(a))),left,vt+vh*.96,340,23,'labels',muted,1,false,{id:'release.startDate',label:'Początek osi czasu',dynamic:true});ctx.textAlign='right';text(dateLabel(releaseDate(Math.floor(b))),right,vt+vh*.96,340,23,'labels',muted,1,false,{id:'release.endDate',label:'Koniec osi czasu',dynamic:true});ctx.textAlign='left';}
 }
 plotEnd();
 if(r.mode!=='calendar'){
  const distributionEnd=section('distribution',{x:76,y:vb+8,w:928,h:100});
  // Monthly bars use a fixed maximum for the whole selection. Future bars stay blank.
  const months=releaseMonths(r.rows,r.start,r.end,r.count),max=Math.max(1,...months.map(m=>m.count)),step=924/months.length,barBase=pulse.histogramBase+flowOffset;
  months.forEach((m,i)=>{const items=frame.visible.filter(v=>v.date.startsWith(m.month));let bottom=barBase;publishers.forEach(p=>{const size=releaseCount(items.filter(v=>v.publisher===p.id),r.count)/max*Math.min(crowded?35:60,h*.07),width=Math.max(2,step*style.barWidth/100);ctx.fillStyle=p.color;ctx.fillRect(76+i*step+(step-width)/2,bottom-size,width,size);bottom-=size;});
   if(i%Math.ceil(months.length/8)===0){const label=months.length>12?m.month:m.month.slice(5);text(label,76+i*step,barBase+textSize(config,'labels',21)+5,Math.max(110,step-8),21,'labels',muted,1,false,{id:'release.histogramMonth',entity:m.month,label:'Miesiąc na słupkach'});}
  });
  distributionEnd();
 }
 detail(r.mode==='pulse'?pulse.cardTop+flowOffset:y(crowded?.76:.64),end-4+flowOffset);
 }stop();
 drawVisualOverlays(ctx,1080,height,config,timeSeconds);
 ctx.textAlign='right';text(dateLabel(frame.date),1000,height-175,924,44,'date',fg,1,true);ctx.textAlign='left';
 text(t('Źródła: komunikaty producentów · katalog do ','Sources: publisher notices · catalogue through ')+r.verifiedAt+(r.stock?' · NVIDIA: Yahoo Finance · USD':''),80,height-132,920,24,'source',muted,2,true);
 drawSignature(ctx,1080,height,config.fontId,dark,config);drawReelOverlays(ctx,1080,height,config);
}
