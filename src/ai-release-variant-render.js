import {releaseIntervals,releaseActivity} from './ai-release-views.js';
import {roundFill} from './chart-appearance.js';
const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n);};
// All variants share the same clock, copy editor, section transforms and detail
// card. No DOM animation or wall-clock state: seeking and export are identical.
export function drawReleaseVariant({ctx,r,frame,publishers,theme,style,y,h,text,section,line,dateLabel,t,eventAge,detail,locale}){
 if(!['cards','heatmap','gaps'].includes(r.mode))return false;
 const {fg,muted,panel,grid}=theme,accent=publishers[0]?.color||fg;
 const active=frame.latest[0]?.date,enter=active?smooth(eventAge(active)/.4):1;
 const finish=section('plot',{x:76,y:y(.20),w:928,h:h*(r.mode==='cards'?.16:.44)});
 if(r.mode==='cards'){
  const dates=[...new Set(frame.visible.map(r=>r.date))],previous=dates.slice(-3,-1);
  previous.forEach((date,i)=>{
   const depth=previous.length-i,top=y(.36)-depth*34-(1-enter)*10,x=98+depth*18,w=884-depth*36;
   ctx.save();ctx.globalAlpha*=.55+(2-depth)*.15;ctx.fillStyle=panel;roundFill(ctx,x,top,w,100,Math.max(12,style.radius));
   const models=frame.visible.filter(r=>r.date===date),color=publishers.find(p=>p.id===models[0].publisher)?.color||accent;
   ctx.fillStyle=color;roundFill(ctx,x,top,5,32,2);
   text(`${dateLabel(date)} · ${t('wersje','versions')}: ${models.length}`,x+18,top+24,w-36,23,'labels',muted,1,false,{id:'release.previousCard',entity:depth,dynamic:true,label:'Poprzednia karta'});ctx.restore();
  });
  if(!previous.length)text(t('Każda premiera ma swój moment','Every release has its moment'),98,y(.29),880,30,'labels',muted,1,false,{id:'release.stackIntro',label:'Wprowadzenie do kart'});
 }else if(r.mode==='heatmap'){
  const activity=releaseActivity(r.rows,r.start,r.end,frame.date,r.count),left=170,cellW=68,top=y(.28),cellH=Math.min(78,h*.27/activity.years.length);
  text(t('Premiery miesiąc po miesiącu','Releases, month by month'),76,y(.225),928,28,'labels',fg,1,false,{id:'release.mapTitle',label:'Tytuł mapy'});
  for(let m=0;m<12;m++)text(new Date(Date.UTC(2026,m,1)).toLocaleDateString(locale,{month:'short',timeZone:'UTC'}),left+m*cellW+4,top-10,cellW-6,20,'labels',muted,1,false,{id:'release.mapMonth',entity:m,label:'Miesiąc mapy'});
  activity.years.forEach((year,yi)=>{
   text(String(year),76,top+yi*cellH+cellH*.65,86,27,'labels',muted,1,false,{id:'release.mapYear',entity:year,label:'Rok mapy'});
   for(let m=0;m<12;m++){
    const month=`${year}-${String(m+1).padStart(2,'0')}`,item=activity.months.find(v=>v.month===month),x=left+m*cellW,cy=top+yi*cellH;
    ctx.save();ctx.fillStyle=panel;roundFill(ctx,x,cy,cellW-6,cellH-6,Math.min(8,style.radius));
    if(item&&!item.future){ctx.globalAlpha*=.13+.87*item.count/activity.max;ctx.fillStyle=accent;roundFill(ctx,x,cy,cellW-6,cellH-6,Math.min(8,style.radius));}ctx.restore();
    if(month===frame.date.slice(0,7)){ctx.save();ctx.strokeStyle=fg;ctx.lineWidth=2;ctx.strokeRect(x+1,cy+1,cellW-8,cellH-8);ctx.restore();}
    // Number sits on an opaque theme panel so every palette stays readable.
    if(item&&!item.future){ctx.fillStyle=panel;roundFill(ctx,x+13,cy+(cellH-30)/2,36,24,4);text(String(item.count),x+17,cy+(cellH-30)/2+18,30,20,'labels',fg,1,false,{id:'release.mapCount',entity:month,dynamic:true,label:'Liczba premier w miesiącu'});}
   }
  });
  text(t('Intensywniejszy kolor → więcej premier · puste pola: poza okresem lub przyszłość','Stronger colour → more releases · blank: outside range or future'),76,y(.62),928,21,'labels',muted,1,false,{id:'release.mapLegend',label:'Opis mapy'});
 }else{
  const all=releaseIntervals(r.rows),visible=all.filter(v=>v.date<=frame.date),bars=visible.slice(-11),max=Math.max(2,...all.map(v=>v.days)),left=145,right=1000,top=y(.29),bottom=y(.56),width=(right-left)/10;
  text(t('Ile dni czekaliśmy na kolejną premierę?','Days until the next release'),76,y(.225),928,28,'labels',fg,1,false,{id:'release.gapsTitle',label:'Tytuł odstępów'});
  for(const fraction of (all.length?[0,.5,1]:[])){const yy=bottom-(bottom-top)*fraction;line(left,yy,right,yy,grid,style.gridWidth);text(String(Math.round(max*fraction)),76,yy+6,62,21,'labels',muted,1,false,{id:'release.gapAxis',entity:fraction,label:'Podziałka odstępów'});}
  bars.forEach((bar,i)=>{
   const current=i===bars.length-1,factor=current?enter:1,xx=left+(i-(bars.length>10?1:0))*width+(visible.length>10?(1-enter)*width:0),bh=bar.days/max*(bottom-top)*factor,bw=width*style.barWidth/100;
   ctx.save();ctx.beginPath();ctx.rect(left,top-34,right-left+1,bottom-top+85);ctx.clip();ctx.fillStyle=publishers.find(p=>p.id===bar.models[0].publisher)?.color||accent;
   roundFill(ctx,xx+(width-bw)/2,bottom-bh,bw,bh,Math.min(style.radius,bw/2));
   text(String(bar.days),xx+7,bottom-bh-10,width-10,23,'labels',fg,1,false,{id:'release.gapDays',entity:bar.date,label:'Dni między premierami'});
   text(locale==='pl-PL'?bar.date.slice(8)+'.'+bar.date.slice(5,7):bar.date.slice(5).replace('-','/'),xx+5,bottom+25,width-8,20,'labels',muted,1,false,{id:'release.gapDate',entity:bar.date,label:'Data na słupku'});ctx.restore();
  });
  if(!visible.length)text(t('Potrzebne są dwie różne daty premier','Two distinct release dates are needed'),170,y(.43),810,30,'labels',muted,2,false,{id:'release.gapsEmpty',label:'Brak odstępu'});
  text(t('Dni · do 10 ostatnich odstępów · data DD.MM','Days · up to 10 latest gaps · date MM/DD'),76,y(.64),928,21,'labels',muted,1,false,{id:'release.gapsLegend',label:'Opis odstępów'});
 }
 finish();
 detail(y(r.mode==='cards'?.36:.70),y(.995),r.mode==='cards');
 return true;
}
