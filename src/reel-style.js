import {textLines,paintText,rememberTitleFit} from './reel-text.js';
import {copyText} from './reel-copy.js';
import {reelFonts,reelFont,normalizeFontWeight,fontWeights} from './reel-fonts.js';
export {reelFonts,reelFont,reelFontGroups} from './reel-fonts.js';
import {beginElement} from './reel-elements.js';
import {themeOf,designOf,setReelText} from './reel-design.js';
// Keep titles in frame when a bundled font has different text metrics.
const titleFits=new WeakMap();
export function reelTitleSize(ctx,text,fontId,preferred,width,maxLines,maxHeight=Infinity,style={}){
 if(Number.isFinite(style.fitRatio))return rememberTitleFit(ctx,preferred*style.fitRatio,preferred);
 const key=JSON.stringify([text,fontId,preferred,width,maxLines,maxHeight,style]),cached=titleFits.get(ctx);
 if(cached?.key===key)return rememberTitleFit(ctx,cached.size,preferred);
 width*=((style.width??100)/100);maxLines=style.maxLines||maxLines;
 let size=preferred;
 for(;size>24;size--){
  const weight=normalizeFontWeight(style.weight);
  ctx.font=`${style.italic?'italic ':''}${weight==='auto'?700:weight} ${size}px ${reelFont(fontId)}`;
  const lines=textLines(ctx,text,width,style.wrap==='manual');
  if(lines.length<=maxLines&&lines.length*size*1.22*(style.lineHeight??1)<=maxHeight&&lines.every(line=>ctx.measureText(line).width<=width))break;
 }
 titleFits.set(ctx,{key,size});return rememberTitleFit(ctx,size,preferred);
}

const fontLoads=new Map(),loadedFonts=new Set();
export const isReelFontReady=id=>{const font=reelFonts.find(f=>f.id===id);return !font?.file&&!font?.files?.length||loadedFonts.has(id);};
export function preloadReelFont(id){
 const font=reelFonts.find(f=>f.id===id);
 if(!font?.file&&!font?.files?.length)return Promise.resolve();
 if(fontLoads.has(id))return fontLoads.get(id);
 const promise=(async()=>{
  try{
   const files=font.files||[{path:font.file,weight:font.weight}];
   const faces=await Promise.all(files.map(file=>new FontFace(font.face,`url("${file.path}")`,{style:'normal',weight:file.weight,display:'swap'}).load()));
   faces.forEach(face=>document.fonts.add(face));
   await Promise.all(fontWeights(id).map(weight=>document.fonts.load(`${weight} 24px "${font.face}"`,'Zażółć gęślą jaźń 0123456789')));
   loadedFonts.add(id);
  }catch{
   fontLoads.delete(id);
   throw new Error('Nie udało się wczytać czcionki. Wybierz ją ponownie lub odśwież stronę.');
  }
 })();
 fontLoads.set(id,promise);return promise;
}

// Shared by the preview, PNG cover and video frames in all three studios.
export function drawSignature(ctx,width,height,fontId,dark,config={}){
 const name=copyText(ctx,config,'signature.name','Jakub Bilski',{element:'signature',label:'Imię i nazwisko / autor',shared:true,multiline:false});
 const links=copyText(ctx,config,'signature.links','X: @jakub_bilski  ·  IG: jakub__bilski',{element:'signature',label:'Profile i kontakt',shared:true,multiline:false});
 const family=reelFont(designOf(config).text?.signature?.fontId||fontId);
 const align=designOf(config).signatureAlign,x=align==='left'?76:align==='right'?width-76:width/2,theme=themeOf(config);
 setReelText(ctx,config,'signature',24,family);
 const w=Math.min(width-152,Math.max(ctx.measureText(links).width,ctx.measureText(name).width*1.2,200));
 const end=beginElement(ctx,config,'signature',{x:x-(align==='left'?0:align==='right'?w:w/2),y:height-94,w,h:76});
 ctx.save();ctx.textAlign=align;ctx.textBaseline='alphabetic';
 setReelText(ctx,config,'signature',28,family,theme.fg,'bold');
 paintText(ctx,config,'signature',[name],x,height-64,0,width-152);
 setReelText(ctx,config,'signature',24,family,theme.muted);
 paintText(ctx,config,'signature',[links],x,height-25,0,width-152);
 ctx.restore();end();
}

export const configFontIds=config=>[...new Set([config.fontId,...Object.values(designOf(config).text||{}).map(t=>t.fontId),...(config.visuals?.overlays||[]).filter(o=>o.visible).map(o=>o.fontId)].filter(Boolean))];
