import { displayDate } from './market.js';
import { drawAiReel } from './ai-render.js';
import { reelFont, reelTitleSize, drawSignature } from './reel-style.js';
import { preloadReelAssets } from './reel-assets.js';
import { drawVisualBackground, drawVisualOverlays } from './visual-render.js';
import {drawSeriesContent} from './series-render.js';
import {themeOf,textSize,textColor,setReelText,beginReelSection} from './reel-design.js';
function wrap(ctx,text,x,y,width,lineHeight,maxLines=3){const words=text.split(/\s+/);let line='',lines=[];for(const w of words){if(ctx.measureText(line+' '+w).width>width&&line){lines.push(line);line=w;}else line=line?line+' '+w:w;}if(line)lines.push(line);lines.slice(0,maxLines).forEach((l,i)=>ctx.fillText(i===maxLines-1&&lines.length>maxLines?l+'…':l,x,y+i*lineHeight));return Math.min(lines.length,maxLines)*lineHeight;}
export function drawReel(canvas,config,progress=1,timeSeconds=progress*(config.duration||12)){
 if(config.ai){drawAiReel(canvas,config,progress,timeSeconds);return;}
 const ctx=canvas.getContext('2d'); const {series=[],title,subtitle,source,theme='dark',format='9:16',chart='line',unit='',isCoffee=false,xType='year'}=config;
 const font=reelFont(config.fontId);
 const width=1080,height=format==='1:1'?1080:format==='4:5'?1350:1920;if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 const {dark,bg,fg,muted,colors,panel,grid}=themeOf(config);
 ctx.textAlign='left';ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
 drawVisualBackground(ctx,width,height,config,timeSeconds);
 const endHeader=beginReelSection(ctx,config,'header',width,height);
 ctx.fillStyle=colors[0];[20,36,56].forEach((h,i)=>ctx.fillRect(78+i*18,118-h,10,h));
 const preferred=textSize(config,'title',height<1400?75:config.compactTitle?110:145),maxLines=height<1400?2:3;
 const headerBottom=height<1400?height*.46-28:670,headingY=height<1400?200:240;
 const titleSize=reelTitleSize(ctx,title||'Twoja historia.',config.fontId,preferred,920,maxLines,headerBottom-headingY-100);
 ctx.fillStyle=textColor(config,'title',fg);ctx.font=`bold ${titleSize}px ${font}`;const headingHeight=wrap(ctx,title||'Twoja historia.',78,headingY,920,titleSize*1.08,maxLines);
 setReelText(ctx,config,'subtitle',29,font,muted);wrap(ctx,subtitle||'',78,headingY+headingHeight+16,910,textSize(config,'subtitle',35),2);
 endHeader();const endContent=beginReelSection(ctx,config,'content',width,height);
 const legendStep=config.compactTitle?52:43;
 const top=height<1400?height*.48:config.compactTitle?height*.43:height*.47,bottom=Math.min(height===1080?700:height===1350?920:height*.75,height-(height<1400?235:285)-100-(Math.max(1,series.length)-1)*legendStep),left=135,right=900;
 const current=drawSeriesContent(ctx,config,progress,{top,bottom,height,legendStep,font,fg,muted,colors,dark,panel,grid,contentTop:height<1400?height*.48:730,formatValue:n=>formatValue(n,config.language),timeSeconds});
 endContent();
 drawVisualOverlays(ctx,width,height,config,timeSeconds);
 setReelText(ctx,config,'date',height<1400?44:xType==='date'?58:64,font,fg,'bold');ctx.textAlign='right';ctx.fillText(xType==='date'?displayDate(Math.floor(current),config.language):isCoffee?`${config.language==='en'?'YEAR':'ROK'} ${Math.floor(current)}`:String(Math.floor(current)),1000,height-175,924);ctx.textAlign='left';
 setReelText(ctx,config,'source',24,font,muted);wrap(ctx,source||'',80,height-132,920,textSize(config,'source',27),2);
 drawSignature(ctx,width,height,config.fontId,dark,config);
}
export function formatValue(n,language='pl'){const locale=language==='en'?'en-GB':'pl-PL';if(Math.abs(n)>=1e6)return (n/1e6).toLocaleString(locale,{maximumFractionDigits:1})+(language==='en'?' m':' mln');if(Math.abs(n)>=10000)return (n/1000).toLocaleString(locale,{maximumFractionDigits:1})+(language==='en'?' k':' tys.');return n.toLocaleString(locale,{maximumFractionDigits:1});}
export async function recordReel(config,duration,onProgress,signal){
 await preloadReelAssets(config);if(signal?.aborted)throw new Error('Eksport anulowany.');
 if(typeof MediaRecorder==='undefined')throw new Error('Ta przeglądarka nie obsługuje nagrywania wideo. Pobierz klatkę PNG lub użyj Chrome/Edge.');
 const mime=['video/webm;codecs=vp9','video/webm;codecs=vp8','video/webm','video/mp4'].find(m=>MediaRecorder.isTypeSupported(m));if(!mime)throw new Error('Brak obsługi formatu wideo. Użyj Chrome lub Edge.');
 const canvas=document.createElement('canvas');drawReel(canvas,config,0);const stream=canvas.captureStream(30);const recorder=new MediaRecorder(stream,{mimeType:mime,videoBitsPerSecond:8000000});const chunks=[];
 return new Promise((resolve,reject)=>{let raf,started;const cleanup=()=>{cancelAnimationFrame(raf);stream.getTracks().forEach(t=>t.stop());signal?.removeEventListener('abort',abort);};const abort=()=>{if(recorder.state!=='inactive')recorder.stop();cleanup();reject(new Error('Eksport anulowany.'));};signal?.addEventListener('abort',abort,{once:true});recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};recorder.onerror=()=>{cleanup();reject(new Error('Nie udało się nagrać wideo.'));};recorder.onstop=()=>{cleanup();if(!signal?.aborted)resolve({blob:new Blob(chunks,{type:mime}),extension:mime.includes('mp4')?'mp4':'webm'});};
 const frame=now=>{started??=now;const p=Math.min((now-started)/(duration*1000),1);drawReel(canvas,config,Math.min(p/.9,1),p*duration);onProgress(p);if(p<1)raf=requestAnimationFrame(frame);else recorder.stop();};recorder.start(250);raf=requestAnimationFrame(frame);
 });
}
