import { displayDate } from './market.js';
import { drawAiReel } from './ai-render.js';
const font='Arial, sans-serif';
function wrap(ctx,text,x,y,width,lineHeight,maxLines=3){const words=text.split(/\s+/);let line='',lines=[];for(const w of words){if(ctx.measureText(line+' '+w).width>width&&line){lines.push(line);line=w;}else line=line?line+' '+w:w;}if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(i===maxLines-1&&lines.length>maxLines?l+'…':l,x,y+i*lineHeight));return Math.min(lines.length,maxLines)*lineHeight;}
export function drawReel(canvas,config,progress=1){
 if(config.ai){drawAiReel(canvas,config,progress);return;}
 const ctx=canvas.getContext('2d'); const {series=[],title,subtitle,source,theme='dark',format='9:16',chart='line',unit='',isCoffee=false,xType='year'}=config;
 const width=1080,height=format==='1:1'?1080:format==='4:5'?1350:1920;if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 const dark=theme==='dark';const bg=dark?'#111514':'#f7f9f3',fg=dark?'#f8faf6':'#111514',muted=dark?'#adb5af':'#616a62';
 ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);const colors=dark?['#bcf34a','#b18aff','#8fabb6']:['#568800','#7951c7','#486c80'];
 ctx.fillStyle=colors[0];[20,36,56].forEach((h,i)=>ctx.fillRect(78+i*18,118-h,10,h));ctx.fillStyle=fg;ctx.font=`bold 38px ${font}`;ctx.fillText('plotwist',150,117);
 ctx.fillStyle=fg;ctx.font=`bold ${height<1400?75:145}px ${font}`;const headingY=height<1400?230:320;const headingHeight=wrap(ctx,title||'Twoja historia.',78,headingY,920,height<1400?83:151,height<1400?2:3);
 ctx.fillStyle=muted;ctx.font=`29px ${font}`;wrap(ctx,subtitle,78,headingY+headingHeight+20,910,40,2);
 const top=height<1400?height*.48:height*.47,bottom=height===1080?730:height===1350?940:height*.78,left=135,right=900;
 const points=series.flatMap(s=>s.points);const values=points.filter(p=>p.y!==null).map(p=>p.y);const minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x));const minY=Math.min(0,...values),rawMax=Math.max(1,...values),step=10**Math.floor(Math.log10(rawMax-minY));const maxY=Math.ceil(rawMax/step)*step;
 const px=x=>left+(x-minX)/(maxX-minX||1)*(right-left);const py=y=>bottom-(y-minY)/(maxY-minY||1)*(bottom-top);
 ctx.lineWidth=2;ctx.font=`25px ${font}`;for(let i=0;i<=4;i++){const val=minY+(maxY-minY)*i/4,y=py(val);ctx.strokeStyle=dark?'#2a302c':'#dce3d8';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();ctx.fillStyle=muted;ctx.textAlign='right';ctx.fillText(formatValue(val),left-22,y+8);}
 ctx.textAlign='center';for(let i=0;i<=4;i++){const x=minX+(maxX-minX)*i/4;ctx.fillStyle=muted;ctx.fillText(xType==='date'?displayDate(Math.round(x)):String(Math.round(x)),px(x),bottom+47);}ctx.textAlign='left';
 const current=minX+(maxX-minX)*progress;
 series.forEach((s,idx)=>{const color=colors[idx%3];const ordered=s.points;ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=7;ctx.lineJoin='round';ctx.lineCap='round';let last=null,previous=null;
 if(chart==='bar'){const p=ordered.filter(p=>p.x<=current).at(-1);if(p&&p.y!==null){const barWidth=(right-left)/(series.length*1.6);const x=left+idx*(right-left)/series.length;ctx.fillRect(x,Math.min(py(0),py(p.y)),barWidth,Math.max(2,Math.abs(py(0)-py(p.y))));last={x:x+barWidth/2,y:py(p.y),value:p.y};}}
 else {ctx.save();ctx.beginPath();ctx.rect(left-8,top-10,(right-left)*progress+16,bottom-top+20);ctx.clip();ctx.beginPath();ordered.forEach(p=>{if(p.y===null){previous=null;return;}const x=px(p.x),y=py(p.y);if(previous)ctx.lineTo(x,y);else ctx.moveTo(x,y);previous=p;});ctx.stroke();ctx.restore();const p=ordered.filter(p=>p.x<=current).at(-1);if(p?.y!==null&&p){last={x:px(p.x),y:py(p.y),value:p.y};}}
 if(last){ctx.beginPath();ctx.arc(last.x,last.y,10,0,Math.PI*2);ctx.fill();}
 const legendY=bottom+100+idx*43;ctx.fillRect(80,legendY-19,15,15);ctx.fillStyle=fg;ctx.font=`27px ${font}`;const label=s.name.length>30?s.name.slice(0,28)+'…':s.name;ctx.fillText(label,108,legendY);ctx.textAlign='right';ctx.fillText(last?`${formatValue(last.value)} ${unit}`:'brak danych',1000,legendY);ctx.textAlign='left';
 });
 ctx.fillStyle=dark?'#e5e9e2':'#343d32';ctx.font=`bold ${height<1400?52:xType==='date'?76:110}px ${font}`;ctx.textAlign='right';ctx.fillText(xType==='date'?displayDate(Math.floor(current)):isCoffee?`ROK ${Math.floor(current)}`:String(Math.floor(current)),1000,height<1400?150:height-140);ctx.textAlign='left';
 ctx.fillStyle=muted;ctx.font=`24px ${font}`;wrap(ctx,source,80,height-77,920,30,2);
}
export function formatValue(n){if(Math.abs(n)>=1e6)return (n/1e6).toLocaleString('pl-PL',{maximumFractionDigits:1})+' mln';if(Math.abs(n)>=10000)return (n/1000).toLocaleString('pl-PL',{maximumFractionDigits:1})+' tys.';return n.toLocaleString('pl-PL',{maximumFractionDigits:1});}
export async function recordReel(config,duration,onProgress,signal){
 if(typeof MediaRecorder==='undefined')throw new Error('Ta przeglądarka nie obsługuje nagrywania wideo. Pobierz klatkę PNG lub użyj Chrome/Edge.');
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime)throw new Error('Brak obsługi formatu wideo. Użyj Chrome lub Edge.');
 const canvas=document.createElement('canvas');drawReel(canvas,config,0);const stream=canvas.captureStream(30);const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});const chunks=[];
 return new Promise((resolve,reject)=>{let raf,started;const cleanup=()=>{cancelAnimationFrame(raf);stream.getTracks().forEach(t=>t.stop());signal?.removeEventListener('abort',abort);};const abort=()=>{if(recorder.state!=='inactive')recorder.stop();cleanup();reject(new Error('Eksport anulowany.'));};signal?.addEventListener('abort',abort,{once:true});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=()=>{cleanup();reject(new Error('Nie udało się nagrać wideo.'));};recorder.onstop=()=>{cleanup();if(!signal?.aborted)resolve({blob:new Blob(chunks,{type:mime}),extension:mime.includes('mp4')?'mp4':'webm'});};
 const frame=now=>{started??=now;const p=Math.min((now-started)/(duration*1000),1);drawReel(canvas,config,Math.min(p/.9,1));onProgress(p);if(p<1)raf=requestAnimationFrame(frame);else recorder.stop();};recorder.start(250);raf=requestAnimationFrame(frame);
 });
}
