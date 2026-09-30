import {textLines,paintText} from './reel-text.js';
import {reelFonts,reelFont} from './reel-fonts.js';
export {reelFonts,reelFont,reelFontGroups} from './reel-fonts.js';
import {beginElement} from './reel-elements.js';
import {themeOf,textSize,textColor,designOf} from './reel-design.js';
// Keep titles in frame when a bundled font has different text metrics.
const titleFits=new WeakMap();
export function reelTitleSize(ctx,text,fontId,preferred,width,maxLines,maxHeight=Infinity,style={}){
 const key=JSON.stringify([text,fontId,preferred,width,maxLines,maxHeight,style]),cached=titleFits.get(ctx);
 if(cached?.key===key)return cached.size;
 width*=((style.width??100)/100);maxLines=style.maxLines||maxLines;
 let size=preferred;
 for(;size>24;size--){
  ctx.font=`${style.italic?'italic ':''}${style.weight==='normal'?'normal':'bold'} ${size}px ${reelFont(fontId)}`;
  const lines=textLines(ctx,text,width,style.wrap==='manual');
  if(lines.length<=maxLines&&lines.length*size*1.22*(style.lineHeight??1)<=maxHeight&&lines.every(line=>ctx.measureText(line).width<=width))break;
 }
 titleFits.set(ctx,{key,size});return size;
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
   await Promise.all([400,700].map(weight=>document.fonts.load(`${weight} 24px "${font.face}"`,'Zażółć gęślą jaźń 0123456789')));
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
 const family=reelFont(designOf(config).text?.signature?.fontId||fontId);
 const align=designOf(config).signatureAlign,x=align==='left'?76:align==='right'?width-76:width/2,theme=themeOf(config);
 ctx.font=`${textSize(config,'signature',24)}px ${family}`;
 const w=Math.min(width-152,Math.max(ctx.measureText('X: @jakub_bilski  ·  IG: jakub__bilski').width,200));
 const end=beginElement(ctx,config,'signature',{x:x-(align==='left'?0:align==='right'?w:w/2),y:height-94,w,h:76});
 ctx.save();ctx.globalAlpha=1;ctx.textAlign=align;ctx.textBaseline='alphabetic';
 ctx.fillStyle=textColor(config,'signature',theme.fg);ctx.font=`bold ${textSize(config,'signature',28)}px ${family}`;
 paintText(ctx,config,'signature',['Jakub Bilski'],x,height-64,0,width-152);
 ctx.fillStyle=textColor(config,'signature',theme.muted);ctx.font=`${textSize(config,'signature',24)}px ${family}`;
 paintText(ctx,config,'signature',['X: @jakub_bilski  ·  IG: jakub__bilski'],x,height-25,0,width-152);
 ctx.restore();end();
}

export const configFontIds=config=>[...new Set([config.fontId,...Object.values(designOf(config).text||{}).map(t=>t.fontId)].filter(Boolean))];
