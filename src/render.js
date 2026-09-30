import {drawReelLogo} from './reel-logo.js';
import {resetElements,beginElement,textRect} from './reel-elements.js';
import { timelineDate } from './observation-date.js';
import { drawAiReel } from './ai-render.js';
import { reelFont, reelTitleSize, drawSignature } from './reel-style.js';
import { preloadReelAssets } from './reel-assets.js';
import { drawVisualBackground, drawVisualOverlays } from './visual-render.js';
import {drawSeriesContent} from './series-render.js';
import {themeOf,textSize,textColor,setReelText,beginReelSection,seriesPlotLayout,designOf} from './reel-design.js';
import {drawTextBlock as wrap,paintText,textStyleOf} from './reel-text.js';
export function drawReel(canvas,config,progress=1,timeSeconds=progress*(config.duration||12)){
 resetElements(canvas);
 if(config.ai){drawAiReel(canvas,config,progress,timeSeconds);return;}
 const ctx=canvas.getContext('2d'); const {series=[],title,subtitle,source,theme='dark',format='9:16',chart='line',unit='',isCoffee=false,xType='year'}=config;
 const font=reelFont(config.fontId),titleFontId=designOf(config).text.title.fontId||config.fontId,titleFont=reelFont(titleFontId);
 const width=1080,height=format==='1:1'?1080:format==='4:5'?1350:1920;if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
 const {dark,bg,fg,muted,colors,panel,grid}=themeOf(config);
 ctx.textAlign='left';ctx.fillStyle=bg;ctx.fillRect(0,0,width,height);
 drawVisualBackground(ctx,width,height,config,timeSeconds);
 const endHeader=beginReelSection(ctx,config,'header',width,height);
 const preferred=textSize(config,'title',height<1400?75:config.compactTitle?110:145),maxLines=height<1400?2:3;
 const headerBottom=height<1400?height*.46-28:670,baseHeadingY=height<1400?200:240;
 // Lower the heading without changing its font fit or the chart's position.
 const headingY=baseHeadingY+(height<1400?40:64);
 const titleSize=reelTitleSize(ctx,title||'Twoja historia.',titleFontId,preferred,920,maxLines,headerBottom-baseHeadingY-100,textStyleOf(config,'title'));
 ctx.font=`${textStyleOf(config,'title').italic?'italic ':''}${textStyleOf(config,'title').weight==='normal'?'normal':'bold'} ${titleSize}px ${titleFont}`;
 const headingHeight=wrap(ctx,title||'Twoja historia.',78,headingY,920,titleSize*1.08,maxLines,false,config,'title'),subtitleY=headingY+headingHeight+16,subtitleStep=textSize(config,'subtitle',35);
 setReelText(ctx,config,'subtitle',29,font,muted);
 const subtitleHeight=wrap(ctx,subtitle||'',78,subtitleY,910,subtitleStep,2,false,config,'subtitle');
 const headerEnd=subtitleHeight?subtitleY+subtitleHeight-subtitleStep+textSize(config,'subtitle',29)*.3:headingY+headingHeight-titleSize*1.08+titleSize*.3;
 const hasPlot=['line','area','bar'].includes(chart),metricStep=textSize(config,'metric',38);
 setReelText(ctx,config,'metric',32,font,fg,'bold');
 const metricHeight=config.metricCaption?wrap(ctx,config.metricCaption,hasPlot?135:78,0,hasPlot?765:924,metricStep,2,false,config,'metric'):0;
 const plot=seriesPlotLayout(config,width,height,headerEnd,metricHeight);
 // Only a crowded small frame needs a more compact header; the height slider
 // itself never scales text, logos, the legend or the attribution footer.
 if(hasPlot){ctx.translate(50,50);ctx.scale(plot.headerScale,plot.headerScale);ctx.translate(-50,-50);}
 drawReelLogo(ctx,config,timeSeconds);
 ctx.fillStyle=textColor(config,'title',fg);ctx.font=`${textStyleOf(config,'title').italic?'italic ':''}${textStyleOf(config,'title').weight==='normal'?'normal':'bold'} ${titleSize}px ${titleFont}`;wrap(ctx,title||'Twoja historia.',78,headingY,920,titleSize*1.08,maxLines,true,config,'title');
 setReelText(ctx,config,'subtitle',29,font,muted);wrap(ctx,subtitle||'',78,subtitleY,910,subtitleStep,2,true,config,'subtitle');
 endHeader();
 const contentTop=(height<1400?height*.48:730)+(config.metricCaption?metricHeight+26:0);
 const contentY=(hasPlot?plot.top:contentTop)-(config.metricCaption?metricHeight+76:hasPlot?40:50);
 const endContent=beginReelSection(ctx,config,'content',width,height,{x:70,y:contentY,w:940,h:(hasPlot?plot.bottom+(designOf(config).chart?.legend!==false?125+(series.length-1)*plot.legendStep:65):height-210)-contentY});
 const {top,bottom,legendStep}=plot;
 if(config.metricCaption){setReelText(ctx,config,'metric',32,font,fg,'bold');wrap(ctx,config.metricCaption,hasPlot?135:78,(hasPlot?top:contentTop)-metricHeight-30,hasPlot?765:924,metricStep,2,true,config,'metric');}
 const current=drawSeriesContent(ctx,config,progress,{top,bottom,height,legendStep,font,fg,muted,colors,dark,panel,grid,contentTop,formatValue:n=>formatValue(n,config.language),timeSeconds});
 endContent();
 drawVisualOverlays(ctx,width,height,config,timeSeconds);
 setReelText(ctx,config,'date',height<1400?44:xType==='date'?58:64,font,fg,'bold');ctx.textAlign='right';const date=config.dateLabel||(xType==='date'?timelineDate(current,config):isCoffee?`${config.language==='en'?'YEAR':'ROK'} ${Math.floor(current)}`:String(Math.floor(current)));const endDate=beginElement(ctx,config,'date',textRect(ctx,[date],1000,height-175,0,924));paintText(ctx,config,'date',[date],1000,height-175,0,924);endDate();ctx.textAlign='left';
 setReelText(ctx,config,'source',24,font,muted);wrap(ctx,source||'',80,height-132,920,textSize(config,'source',27),2,true,config,'source');
 drawSignature(ctx,width,height,config.fontId,dark,config);
}
export function formatValue(n,language='pl'){const locale=language==='en'?'en-GB':'pl-PL';if(Math.abs(n)>=1e6)return (n/1e6).toLocaleString(locale,{maximumFractionDigits:1})+(language==='en'?' m':' mln');if(Math.abs(n)>=10000)return (n/1000).toLocaleString(locale,{maximumFractionDigits:1})+(language==='en'?' k':' tys.');if(n!==0&&Math.abs(n)<1)return n.toLocaleString(locale,{maximumSignificantDigits:3});return n.toLocaleString(locale,{maximumFractionDigits:1});}
export async function recordReel(config,duration,onProgress,signal,{fps=60}={}){
 await preloadReelAssets(config);if(signal?.aborted)throw new Error('Eksport anulowany.');
 const {encodeReel}=await import('./video-export.js');
 const canvas=document.createElement('canvas');drawReel(canvas,config,0,0);
 return encodeReel({canvas,draw:(progress,time)=>drawReel(canvas,config,progress,time),duration,fps,onProgress,signal});
}
