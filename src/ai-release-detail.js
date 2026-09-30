import {paintReleasePanel} from './release-appearance.js';
const clamp=n=>Math.max(0,Math.min(1,n));
export function drawReleaseDetail({ctx,config,s,theme,frame,publishers,text,section,logo,dateLabel,t,eventAge,textScale},top,bottom,hero=false){
 const width=928*s.cardWidth/100,left=540-width/2;
 if(config.releases.mode!=='pulse')top=bottom-(bottom-top)*s.cardHeight/100;
 const rect={x:left,y:top,w:width,h:bottom-top},pad=Math.min(s.cardPadding,rect.h*.12,width*.1),end=section('detail',rect);
 if(hero){const q=clamp(eventAge(frame.latest[0]?.date)/.4);ctx.translate((1-q)**2*55,0);}
 paintReleasePanel(ctx,rect,s,theme);
 const x=left+pad,w=width-pad*2,active=frame.latest[0]?.date,hidden=config.visuals?.hidden||{},dateFont=Math.min(28,rect.h*.17/textScale),dateSize=dateFont*textScale;
 const dateY=top+pad+dateSize,dateEnd=section('detailDate',{x,y:top+pad,w,h:dateSize*1.3});
 const cardDate=active?(s.cardDateFormat==='iso'?active:s.cardDateFormat==='short'?new Date(active+'T00:00:00Z').toLocaleDateString(config.language==='en'?'en-GB':'pl-PL',{day:'2-digit',month:'2-digit',year:'numeric',timeZone:'UTC'}):dateLabel(active)):null;
 text(active?cardDate:t('Czekamy na pierwszą premierę…','Waiting for the first release…'),x,dateY,w,dateFont,'labels',theme.muted,1,false,{id:'release.activeDate',label:'Data ostatniej premiery',dynamic:true});dateEnd();
 const gapFont=Math.min(23,rect.h*.14/textScale),gapSize=gapFont*textScale,gapY=bottom-pad,modelsTop=hidden.detailDate?top+pad:dateY+16,modelsBottom=hidden.detailGap?bottom-pad:gapY-gapSize-10;
 const modelEnd=section('detailModels',{x,y:modelsTop,w,h:Math.max(1,modelsBottom-modelsTop)}),rows=frame.latest;
 const age=active?eventAge(active):1,enter=clamp(age/.22);ctx.save();ctx.globalAlpha*=enter;ctx.translate(0,12*(1-enter));
 if(hero&&rows.length<=2){
  const step=Math.max(30,(modelsBottom-modelsTop)/Math.max(1,rows.length)*Math.min(1,s.rowSpacing/100)),size=Math.min(52,step*.30/textScale);
  rows.forEach((item,i)=>{const p=publishers.find(p=>p.id===item.publisher),yy=modelsTop+i*step;
   const icon=Math.min(48,step*.3);if(s.cardLogos)logo(p,x,yy+8,icon);
   const tx=x+(s.cardLogos?icon+16:0);
   text(p.name+(item.category==='restricted'?t(' · dostęp partnerski',' · partner access'):''),tx,yy+icon*.75+8,w-(tx-x),28,'labels',theme.muted,1,false,{id:'release.cardPublisher',entity:item.id,label:'Producent i dostępność'});
   text(item.name,x,yy+icon+18+size*textScale,w,size,'labels',theme.fg,2,false,{id:'release.model',entity:item.id,label:'Nazwa modelu',context:item.name});
  });
 }else{
  const columns=rows.length>4?2:1,count=Math.ceil(rows.length/columns),cw=w/columns,available=Math.max(12,modelsBottom-modelsTop),step=Math.min(64*s.rowSpacing/100,available/Math.max(1,count)),font=Math.max(10,Math.min(columns>1?28:35,step/(1.35*textScale)));
  rows.forEach((item,i)=>{const p=publishers.find(p=>p.id===item.publisher),xx=x+(i%columns)*cw,yy=modelsTop+(Math.floor(i/columns)+.5)*step,icon=Math.max(8,Math.min(32,step-4));if(s.cardLogos)logo(p,xx,yy-icon/2,icon);const inset=s.cardLogos?icon+12:0;
   text(item.name+(item.category==='restricted'?t(' · dostęp partnerski',' · partner access'):''),xx+inset,yy+font*textScale*.3,cw-inset-(columns>1?12:0),font,'labels',theme.fg,1,false,{id:'release.model',entity:item.id,label:'Nazwa modelu',context:item.name});
  });
 }ctx.restore();modelEnd();
 const gapEnd=section('detailGap',{x,y:gapY-gapSize,w,h:gapSize*1.4});
 const gap=frame.gap===null?t('Pierwsza data w filtrze','First date in selection'):`${frame.gap} ${t(frame.gap===1?'dzień od poprzedniej daty premier':'dni od poprzedniej daty premier',frame.gap===1?'day since the preceding launch date':'days since the preceding launch date')}`;
 const gapText=frame.gap===null||s.gapFormat==='full'?gap:s.gapFormat==='number'?String(frame.gap):`${frame.gap} ${t(frame.gap===1?'dzień':'dni',frame.gap===1?'day':'days')}`;
 text(gapText,x,gapY,w,gapFont,'labels',theme.muted,1,false,{id:'release.gap',label:'Odstęp między premierami',dynamic:true});gapEnd();end();
}
