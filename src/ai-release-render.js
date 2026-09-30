import {RELEASE_PUBLISHERS,releaseDay,releaseDate,releaseFrame,releaseCount,groupReleases,releaseMonths} from './ai-releases.js';
import {aiFrameLayout} from './ai-layout.js';
import {reelMotionFrame} from './reel-motion.js';
import {themeOf,textSize,setReelText,beginReelSection,designOf} from './reel-design.js';
import {reelFont,reelTitleSize,drawSignature} from './reel-style.js';
import {drawTextBlock,textStyleOf} from './reel-text.js';
import {copyText} from './reel-copy.js';
import {drawReelLogo} from './reel-logo.js';
import {drawVisualBackground,drawVisualOverlays} from './visual-render.js';
import {drawReelOverlays} from './overlay-render.js';
import {getReelLogo} from './reel-assets.js';
import {roundFill,seriesColor} from './chart-appearance.js';
const clamp=n=>Math.max(0,Math.min(1,n));
export function drawReleaseReel(canvas,initial,progress,timeSeconds){
 const motion=reelMotionFrame(initial,progress,timeSeconds),layout=aiFrameLayout(initial.format),{height,start,end,textScale}=layout;
 const config={...motion.config,_aiTextScale:textScale},r=config.releases,frame=releaseFrame(r.rows,r.start,r.end,motion.progress,r.count);
 if(canvas.width!==1080||canvas.height!==height){canvas.width=1080;canvas.height=height;}
 const ctx=canvas.getContext('2d'),theme=themeOf(config),{fg,muted,grid,panel,bg,dark}=theme;
 const en=config.language==='en',t=(pl,eng)=>en?eng:pl,locale=en?'en-GB':'pl-PL',font=reelFont(config.fontId);
 const publishers=RELEASE_PUBLISHERS.filter(p=>r.publishers.includes(p.id)).map(p=>({...p,color:seriesColor(config,RELEASE_PUBLISHERS.findIndex(q=>q.id===p.id),p.color)}));
 const dateLabel=date=>new Date(`${date}T00:00:00Z`).toLocaleDateString(locale,{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
 const monthLabel=date=>new Date(`${date.slice(0,7)}-01T00:00:00Z`).toLocaleDateString(locale,{month:'long',year:'numeric',timeZone:'UTC'});
 function text(value,x,y,width,size=30,role='labels',color=fg,max=1,editable=false){
  setReelText(ctx,config,role,size,font,color,role==='title'||role==='values'?'bold':'');
  if(editable)value=copyText(ctx,config,role,value,{dynamic:role==='date',element:role});
  return drawTextBlock(ctx,value,x,y,width,textSize(config,role,size)*1.19,max,true,config,role,editable);
 }
 function line(x1,y1,x2,y2,color=grid,width=2){ctx.beginPath();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
 function dot(x,y,color,radius=7){ctx.beginPath();ctx.fillStyle=color;ctx.arc(x,y,radius,0,Math.PI*2);ctx.fill();}
 function logo(p,x,y,size){const image=r.logos&&getReelLogo(p.logo);if(image){ctx.fillStyle='#fff';roundFill(ctx,x,y,size,size,8);ctx.drawImage(image,x+5,y+5,size-10,size-10);}else dot(x+size/2,y+size/2,p.color,7);}
 ctx.textAlign='left';ctx.fillStyle=bg;ctx.fillRect(0,0,1080,height);drawVisualBackground(ctx,1080,height,config,timeSeconds);
 const headerEnd=beginReelSection(ctx,config,'header',1080,height);
 drawReelLogo(ctx,config,timeSeconds,{x:76,y:layout.compact?40:73,h:layout.compact?34:50});
 const title=copyText(ctx,config,'title',config.title),size=reelTitleSize(ctx,title,designOf(config).text.title.fontId||config.fontId,textSize(config,'title',83),928,3,layout.titleHeight,textStyleOf(config,'title'));
 // Fitting already includes both the user's size and the compact-frame scale.
 const titleHeight=text(title,76,layout.titleY,928,size/textSize(config,'title',1),'title',fg,3,true);
 text(publishers.map(p=>p.name).join(' × '),76,layout.compact?layout.titleY+titleHeight+20:548,928,38,'subtitle',muted,2,true);headerEnd();
 const stop=beginReelSection(ctx,config,'content',1080,height),h=end-start,y=f=>start+h*f;
 const countLabel=r.count==='launches'?t('premiery producentów','publisher launches'):t('wersje modeli','model versions');
 text(String(frame.monthTotal),76,y(.058),400,72,'values');
 text(monthLabel(frame.date),76,y(.105),470,28,'labels',muted);
 text(`${frame.total}`,620,y(.058),380,72,'values');
 text(t('łącznie w wybranym okresie','total in selected period'),620,y(.105),390,26,'labels',muted);
 text(`${countLabel} · ${t('w katalogu','in catalogue')}`,76,y(.16),930,26,'labels',muted);
 const vt=y(.21),vb=y(.56),vh=vb-vt;
 if(r.mode==='calendar'){
  const month=frame.date.slice(0,7),first=releaseDay(`${month}-01`),d=new Date(`${month}-01T00:00:00Z`),offset=(d.getUTCDay()+6)%7;d.setUTCMonth(d.getUTCMonth()+1);const days=releaseDay(d.toISOString().slice(0,10))-first;
  const labels=en?['M','T','W','T','F','S','S']:['Pn','Wt','Śr','Cz','Pt','So','Nd'],cw=132,ch=(vh-30)/6;
  labels.forEach((label,i)=>text(label,83+i*cw,vt,100,23,'labels',muted));
  for(let day=1;day<=days;day++){
   const cell=offset+day-1,x=76+(cell%7)*cw,top=vt+15+Math.floor(cell/7)*ch,stamp=releaseDate(first+day-1),passed=stamp<=frame.date,inRange=stamp>=r.start&&stamp<=r.end;
   ctx.save();ctx.globalAlpha*=inRange?1:.2;ctx.fillStyle=panel;roundFill(ctx,x,top,cw-8,ch-6,8);
   if(stamp===frame.date){ctx.strokeStyle=publishers[0]?.color||fg;ctx.lineWidth=3;ctx.strokeRect(x+1,top+1,cw-10,ch-8);}
   text(String(day),x+9,top+textSize(config,'labels',25)+2,cw-25,25,'labels',passed?fg:muted);
   if(passed&&inRange){const entries=r.rows.filter(item=>item.date===stamp);publishers.forEach((p,i)=>{if(entries.some(e=>e.publisher===p.id))dot(x+cw-30-i*18,top+ch-17,p.color,5);});}
   ctx.restore();
  }
  publishers.forEach((p,i)=>{dot(85+i*300,vb+25,p.color,6);text(p.name,103+i*300,vb+33,270,24,'labels',muted);});
 }else{
  const left=225,right=1000,a=releaseDay(r.start),b=releaseDay(r.end),x=day=>left+(day-a)/(b-a||1)*(right-left),groups=groupReleases(frame.visible);
  publishers.forEach((p,i)=>{
   const yy=vt+vh*(.18+i*.32);logo(p,76,yy-24,44);text(p.name,76,yy+50,145,25,'labels',muted);
   line(left,yy,right,yy);line(left,yy,x(frame.current),yy,p.color,3);
   for(const group of groups.filter(g=>g.publisher===p.id)){
    const px=x(releaseDay(group.date));dot(px,yy,p.color,6+Math.min(3,group.models.length));
    const age=(frame.current-releaseDay(group.date))/(b-a||1)*(config.duration||24);if(age<.65){ctx.save();ctx.globalAlpha*=1-age/.65;ctx.strokeStyle=p.color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(px,yy,10+30*age/.65,0,Math.PI*2);ctx.stroke();ctx.restore();}
   }
  });
  line(x(frame.current),vt-10,x(frame.current),vt+vh*.65,fg,2);
  text(dateLabel(r.start),left,vt+vh*.77,340,23,'labels',muted);ctx.textAlign='right';text(dateLabel(r.end),right,vt+vh*.77,340,23,'labels',muted);ctx.textAlign='left';
  // Monthly bars use a fixed maximum for the whole selection. Future bars stay blank.
  const months=releaseMonths(r.rows,r.start,r.end,r.count),max=Math.max(1,...months.map(m=>m.count)),step=924/months.length,barBase=vb+10;
  months.forEach((m,i)=>{const items=frame.visible.filter(v=>v.date.startsWith(m.month));let bottom=barBase;publishers.forEach(p=>{const size=releaseCount(items.filter(v=>v.publisher===p.id),r.count)/max*Math.min(60,h*.07);ctx.fillStyle=p.color;ctx.fillRect(76+i*step,bottom-size,Math.max(2,step-5),size);bottom-=size;});
   if(i%Math.ceil(months.length/8)===0){const label=months.length>12?m.month:m.month.slice(5);text(label,76+i*step,barBase+textSize(config,'labels',21)+5,Math.max(110,step-8),21,'labels',muted);}
  });
 }
 const cardTop=y(.64),cardBottom=end-4;ctx.fillStyle=panel;roundFill(ctx,76,cardTop,928,cardBottom-cardTop,18);
 const activeDate=frame.latest[0]?.date,titleY=cardTop+textSize(config,'labels',28)+16;
 text(activeDate?dateLabel(activeDate):t('Czekamy na pierwszą premierę…','Waiting for the first release…'),98,titleY,880,28,'labels',muted);
 const rows=frame.latest.slice(0,4),rowStep=Math.min(64,(cardBottom-titleY-50)/Math.max(3,rows.length));
 const age=activeDate?(frame.current-releaseDay(activeDate))/(releaseDay(r.end)-releaseDay(r.start)||1)*(config.duration||24):1,enter=motion.progress>=1||r.start===r.end?1:clamp(age/.22);
 ctx.save();ctx.globalAlpha*=enter;ctx.translate(0,12*(1-enter));
 rows.forEach((item,i)=>{const p=publishers.find(p=>p.id===item.publisher),yy=titleY+22+(i+.5)*rowStep;logo(p,98,yy-20,36);text(item.name,150,yy+8,820,rows.length>3?30:35,'labels',fg);});ctx.restore();
 const gap=frame.gap===null?t('Pierwsza data w filtrze','First date in selection'):`${frame.gap} ${t('dni od poprzedniej daty premier','days since the preceding launch date')}`;
 text(gap,98,cardBottom-17,880,23,'labels',muted);stop();
 drawVisualOverlays(ctx,1080,height,config,timeSeconds);
 ctx.textAlign='right';text(dateLabel(frame.date),1000,height-175,924,44,'date',fg,1,true);ctx.textAlign='left';
 text(t('Źródła: OpenAI / Anthropic · katalog do ','Sources: OpenAI / Anthropic · catalogue through ')+r.verifiedAt,80,height-132,920,24,'source',muted,2,true);
 drawSignature(ctx,1080,height,config.fontId,dark,config);drawReelOverlays(ctx,1080,height,config);
}
