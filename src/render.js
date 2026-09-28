import { displayDate } from './market.js';
import { drawAiReel } from './ai-render.js';
import { reelFont, drawSignature } from './reel-style.js';
import { preloadReelAssets } from './reel-assets.js';
import { drawVisualBackground, drawVisualOverlays } from './visual-render.js';
import {drawSeriesContent} from './series-render.js';
function wrap(ctx,text,x,y,width,lineHeight,maxLines=3){const words=text.split(/\s+/);let line='',lines=[];for(const w of words){if(ctx.measureText(line+' '+w).width>width&&line){lines.push(line);line=w;}else line=line?line+' '+w:w;}if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(i===maxLines-1&&lines.length>maxLines?l+'…':l,x,y+i*lineHeight));return Math.min(lines.length,maxLines)*lineHeight;}
export function drawReel(canvas,config,progress=1,timeSeconds=progress*(config.duration||12)){
 if(config.ai){drawAiReel(canvas,config,progress,timeSeconds);return;}
 const ctx=canvas.getContext('2d'); const {series=[],title,subtitle,source,theme='dark',format='9:16',chart='line',unit='',isCoffee=false,xType='year'}=config;
 const font=reelFont(config.fontId);
 const width=1080,height=format==='1:1'?1080:format==='4:5'?1350:1920;if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 const dark=theme==='dark';const bg=dark?'#111514':'#f7f9f3',fg=dark?'#f8faf6':'#111514',muted=dark?'#adb5af':'#616a62';
 ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);const colors=dark?['#bcf34a','#b18aff','#8fabb6']:['#568800','#7951c7','#486c80'];
 drawVisualBackground(ctx,width,height,config,timeSeconds);
 ctx.fillStyle=colors[0];[20,36,56].forEach((h,i)=>ctx.fillRect(78+i*18,118-h,10,h));
 ctx.fillStyle=fg;ctx.font=`bold ${height<1400?75:config.compactTitle?110:145}px ${font}`;const headingY=height<1400?230:320;const headingHeight=wrap(ctx,title||'Twoja historia.',78,headingY,920,height<1400?83:config.compactTitle?120:151,height<1400?2:3);
 ctx.fillStyle=muted;ctx.font=`29px ${font}`;wrap(ctx,subtitle,78,headingY+headingHeight+20,910,40,2);
 const legendStep=config.compactTitle?52:43;
 const top=height<1400?height*.48:config.compactTitle?height*.43:height*.47,bottom=Math.min(height===1080?700:height===1350?920:height*.75,height-(height<1400?235:285)-100-(Math.max(1,series.length)-1)*legendStep),left=135,right=900;
 const current=drawSeriesContent(ctx,config,progress,{top,bottom,height,legendStep,font,fg,muted,colors,dark,contentTop:Math.max(height<1400?450:730,headingY+headingHeight+130),formatValue,timeSeconds});
 drawVisualOverlays(ctx,width,height,config,timeSeconds);
 ctx.fillStyle=dark?'#e5e9e2':'#343d32';ctx.font=`bold ${height<1400?52:xType==='date'?76:110}px ${font}`;ctx.textAlign='right';ctx.fillText(xType==='date'?displayDate(Math.floor(current)):isCoffee?`ROK ${Math.floor(current)}`:String(Math.floor(current)),1000,height<1400?150:height-175);ctx.textAlign='left';
 ctx.fillStyle=muted;ctx.font=`24px ${font}`;wrap(ctx,source,80,height-145,920,30,2);
 drawSignature(ctx,width,height,config.fontId,dark);
}
export function formatValue(n){if(Math.abs(n)>=1e6)return (n/1e6).toLocaleString('pl-PL',{maximumFractionDigits:1})+' mln';if(Math.abs(n)>=10000)return (n/1000).toLocaleString('pl-PL',{maximumFractionDigits:1})+' tys.';return n.toLocaleString('pl-PL',{maximumFractionDigits:1});}
export async function recordReel(config,duration,onProgress,signal){
 await preloadReelAssets(config);if(signal?.aborted)throw new Error('Eksport anulowany.');
 if(typeof MediaRecorder==='undefined')throw new Error('Ta przeglądarka nie obsługuje nagrywania wideo. Pobierz klatkę PNG lub użyj Chrome/Edge.');
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime)throw new Error('Brak obsługi formatu wideo. Użyj Chrome lub Edge.');
 const canvas=document.createElement('canvas');drawReel(canvas,config,0);const stream=canvas.captureStream(30);const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});const chunks=[];
 return new Promise((resolve,reject)=>{let raf,started;const cleanup=()=>{cancelAnimationFrame(raf);stream.getTracks().forEach(t=>t.stop());signal?.removeEventListener('abort',abort);};const abort=()=>{if(recorder.state!=='inactive')recorder.stop();cleanup();reject(new Error('Eksport anulowany.'));};signal?.addEventListener('abort',abort,{once:true});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=()=>{cleanup();reject(new Error('Nie udało się nagrać wideo.'));};recorder.onstop=()=>{cleanup();if(!signal?.aborted)resolve({blob:new Blob(chunks,{type:mime}),extension:mime.includes('mp4')?'mp4':'webm'});};
 const frame=now=>{started??=now;const p=Math.min((now-started)/(duration*1000),1);drawReel(canvas,config,Math.min(p/.9,1),p*duration);onProgress(p);if(p<1)raf=requestAnimationFrame(frame);else recorder.stop();};recorder.start(250);raf=requestAnimationFrame(frame);
 });
}
