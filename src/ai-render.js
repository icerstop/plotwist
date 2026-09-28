import {aiValue,frameAt} from './ai.js';
import {reelFont,drawSignature} from './reel-style.js';
function typography(font){
function wrap(ctx,text,x,y,width,size=34,max=3,color){
 ctx.font=`${size>=60?'bold ':''}${size}px ${font}`;if(color)ctx.fillStyle=color;
 const words=String(text||'').split(/\s+/);let lines=[],line='';
 for(const word of words){if(ctx.measureText(`${line} ${word}`).width>width&&line){lines.push(line);line=word;}else line=line?`${line} ${word}`:word;}if(line)lines.push(line);
 lines.slice(0,max).forEach((s,i)=>ctx.fillText(i===max-1&&lines.length>max?`${s.slice(0,-2)}…`:s,x,y+i*size*1.22));
 return Math.min(lines.length,max)*size*1.22;
}
function fit(ctx,text,width,size,min=26){ctx.font=`bold ${size}px ${font}`;while(size>min&&ctx.measureText(text).width>width){size--;ctx.font=`bold ${size}px ${font}`;}return size;}
return {wrap,fit};
}
export function drawAiReel(canvas,config,progress=1){
 const {wrap,fit}=typography(reelFont(config.fontId));
 const {ai:{rows,benchmark:b,basis,mode,comparison,scope},title,theme='dark'}=config;
 const ctx=canvas.getContext('2d');if(canvas.width!==1080||canvas.height!==1920){canvas.width=1080;canvas.height=1920;}
 const dark=theme==='dark',bg=dark?'#101612':'#f6f8ef',fg=dark?'#f3f8eb':'#152017',muted=dark?'#aab6ab':'#576657',accent=dark?'#c0ef66':'#557b20',purple=dark?'#bca1ff':'#7452b4',panel=dark?'#1a251e':'#e9efde',grid=dark?'#344239':'#cbd7c4';
 ctx.fillStyle=bg;ctx.fillRect(0,0,1080,1920);ctx.textAlign='left';
 ctx.fillStyle=accent;[18,32,50].forEach((h,i)=>ctx.fillRect(76+i*19,123-h,11,h));
 wrap(ctx,title||b.name,76,240,928,83,3,fg);
 wrap(ctx,b.name,76,565,928,33,2,accent);
 if(scope)wrap(ctx,scope,76,648,928,23,2,muted);
 const frame=frameAt(rows,progress),first=rows[0],last=rows.at(-1);
 if(!first)return;
 const score=r=>`${aiValue(r.score)} ${b.unit}`;
 if(mode==='timeline'){
   const index=Math.min(rows.length-1,Math.floor(progress*rows.length));const r=rows[index];
   wrap(ctx,r.date,76,725,920,39,1,muted);
   wrap(ctx,r.model,76,825,920,62,3,fg);
   ctx.fillStyle=accent;fit(ctx,score(r),930,147,70);ctx.fillText(score(r),76,1190);
   const detail=r.low!==null&&r.low!==undefined?`90% CI: ${aiValue(r.low)}–${aiValue(r.high)}`:r.stderr!==null&&r.stderr!==undefined?`Błąd standardowy: ±${aiValue(r.stderr)} p.p.`:r.rawScore!==undefined?`Surowy wynik: ${r.rawScore}/${r.total}`:r.elo?`Rating Codeforces: ${r.elo}`:'Wynik odnotowany w źródle';
   wrap(ctx,detail,76,1260,920,31,2,muted);
   ctx.fillStyle=grid;ctx.fillRect(76,1340,925,5);ctx.fillStyle=accent;ctx.fillRect(76,1340,925*(index+1)/rows.length,5);
   rows.slice(Math.max(0,index-2),index+1).forEach((p,i)=>{wrap(ctx,`${p.date}  ·  ${p.model}`,76,1420+i*68,730,29,1,muted);ctx.textAlign='right';wrap(ctx,aiValue(p.score),999,1420+i*68,220,31,1,fg);ctx.textAlign='left';});
   wrap(ctx,`Obserwacja ${index+1} / ${rows.length}`,76,1660,920,28,1,muted);
 } else if(mode==='ranking'){
   wrap(ctx,frame.date,76,715,920,56,1,fg);
   frame.rank.slice(0,6).forEach((r,i)=>{const y=805+i*136;wrap(ctx,`${i+1}. ${r.model}`,76,y,735,37,2,fg);ctx.textAlign='right';wrap(ctx,aiValue(r.score),1000,y,230,48,1,i===0?accent:fg);ctx.textAlign='left';
     if(b.max){ctx.fillStyle=grid;ctx.fillRect(76,y+60,925,8);ctx.fillStyle=i===0?accent:purple;ctx.fillRect(76,y+60,925*Math.max(0,r.score)/b.max,8);}
     const uncertainty=r.low!=null?`90% CI: ${aiValue(r.low)}–${aiValue(r.high)}`:r.stderr!=null?`SE: ±${aiValue(r.stderr)} p.p.`:'';
     wrap(ctx,`${r.date}${uncertainty?' · '+uncertainty:''}`,76,y+94,920,23,1,muted);
   });
   wrap(ctx,`${b.unit} · ostatni dostępny pomiar każdego wariantu`,76,1625,920,28,2,muted);
 } else if(mode==='scatter'){
   const top=775,bottom=1450,left=130,right=960;
   const min=b.max?0:Math.floor(Math.min(...rows.map(r=>r.low??r.score))/10)*10-10,max=b.max||Math.ceil(Math.max(...rows.map(r=>r.high??r.score))/10)*10+10;
   const t0=Date.parse(first.date),t1=Date.parse(last.date);const x=d=>left+(Date.parse(d)-t0)/(t1-t0||1)*(right-left),y=v=>bottom-(v-min)/(max-min)*(bottom-top);
   for(let i=0;i<=4;i++){const v=min+(max-min)*i/4;ctx.strokeStyle=grid;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(left,y(v));ctx.lineTo(right,y(v));ctx.stroke();ctx.textAlign='right';wrap(ctx,aiValue(v),left-20,y(v)+9,120,27,1,muted);ctx.textAlign='left';}
   wrap(ctx,b.unit,76,720,920,30,1,muted);
   if(b.baseline){const yy=y(b.baseline.score);ctx.strokeStyle=purple;ctx.setLineDash([10,10]);ctx.beginPath();ctx.moveTo(left,yy);ctx.lineTo(right,yy);ctx.stroke();ctx.setLineDash([]);wrap(ctx,`Punkt odniesienia: ${aiValue(b.baseline.score)}`,left,yy-15,800,26,1,purple);}
   frame.visible.forEach(r=>{ctx.fillStyle=accent;ctx.globalAlpha=.48;ctx.beginPath();ctx.arc(x(r.date),y(r.score),7,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;const lo=r.low??(r.stderr!=null?r.score-r.stderr:null),hi=r.high??(r.stderr!=null?r.score+r.stderr:null);if(lo!=null&&hi!=null){ctx.strokeStyle=grid;ctx.beginPath();ctx.moveTo(x(r.date),y(Math.max(min,lo)));ctx.lineTo(x(r.date),y(Math.min(max,hi)));ctx.stroke();}});
   wrap(ctx,first.date,left,bottom+55,400,27,1,muted);ctx.textAlign='right';wrap(ctx,last.date,right,bottom+55,400,27,1,muted);ctx.textAlign='left';
   if(frame.current)wrap(ctx,`Ostatnio: ${frame.current.model} · ${aiValue(frame.current.score)}`,76,1555,920,27,1,accent);
   wrap(ctx,frame.date,76,1630,900,59,1,fg);wrap(ctx,`${frame.visible.length} pomiarów · ${b.id==='eci'?'wąsy: 90% CI':rows.some(r=>r.stderr!=null)?'wąsy: ±1 SE':'bez interpolacji'}`,76,1665,920,28,1,muted);
 } else {
   const r=rows.filter(r=>r.modelId===comparison).at(-1)||last,base=b.baseline;
   if(!base)return;
   [{name:r.model,value:score(r),color:accent},{name:base.name,value:`${aiValue(base.score)} ${b.unit}`,color:purple}].forEach((item,i)=>{const y=735+i*370;ctx.globalAlpha=Math.min(1,Math.max(0,progress*3-i*.5));ctx.fillStyle=panel;ctx.fillRect(76,y,928,320);wrap(ctx,item.name,112,y+62,850,39,2,fg);ctx.fillStyle=item.color;fit(ctx,item.value,850,104,55);ctx.fillText(item.value,112,y+255);if(i===0&&r.stderr!=null)wrap(ctx,`SE: ±${aiValue(r.stderr)} p.p.`,112,y+296,850,23,1,muted);ctx.globalAlpha=1;});
   wrap(ctx,`${r.date} · różnica ${aiValue(r.score-base.score)} ${b.unit==='%'?'p.p.':'punktów percentylowych'}`,76,1520,920,35,2,fg);
   wrap(ctx,base.note,76,1600,920,28,3,muted);
 }
 // Essential methodology is burned into every exported frame.
 const dating=basis==='release'?'Wg premier · retrospektywa, pomiary mogły być późniejsze':'Wg dat testu / publikacji · bez interpolacji';
 const warning=b.id.startsWith('iq-')?'Quiz TrackingAI ≠ psychometryczne IQ człowieka':b.id==='eci'?'ECI ≠ IQ · aktualne przeliczenie historii':b.id==='codeforces2024'?'Percentyl wśród uczestników · 10 zgłoszeń':b.id.startsWith('swe-')?'Wynik systemu z narzędziami; wersje środowiska rozdzielone':b.id==='gpqa'&&mode==='duel'?'Eksperci dziedzinowi; różne protokoły ewaluacji':['frontiermath','frontiermath4'].includes(b.id)?'Od 13.11.2025 budżet tokenów 10× większy; porównanie orientacyjne':b.caveat;
 wrap(ctx,dating,76,1705,928,22,2,muted);wrap(ctx,warning,76,1760,928,22,2,muted);wrap(ctx,`${b.source} · dane ${b.retrievedAt}`,76,1821,928,23,1,muted);
 drawSignature(ctx,1080,1920,config.fontId,dark);
}
