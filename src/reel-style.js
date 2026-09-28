import {bundledFonts} from './font-catalog.js';
import {themeOf,textSize,textColor,designOf} from './reel-design.js';
export const reelFontGroups=[{id:'sans',name:'Proste · bezszeryfowe'},{id:'serif',name:'Szeryfowe · redakcyjne'},{id:'display',name:'Wąskie · do tytułów'},{id:'mono',name:'Maszynowe · techniczne'}];
export const reelFonts = [
 {id:'arial',name:'Arial · prosta',family:'Arial, Helvetica, sans-serif',group:'sans'},
 {id:'georgia',name:'Georgia · redakcyjna',family:'Georgia, "Times New Roman", serif',group:'serif'},
 {id:'libre-baskerville',name:'Libre Baskerville',family:'"Libre Baskerville", Georgia, serif',face:'Libre Baskerville',file:'/fonts/libre-baskerville/LibreBaskerville-Variable.ttf',weight:'400 700',group:'serif'},
 {id:'verdana',name:'Verdana · czytelna',family:'Verdana, Geneva, sans-serif',group:'sans'},
 {id:'trebuchet',name:'Trebuchet MS · miękka',family:'"Trebuchet MS", Arial, sans-serif',group:'sans'},
 {id:'impact',name:'Impact · wyrazista',family:'Impact, "Arial Narrow", sans-serif',group:'display'},
 {id:'courier',name:'Courier New · maszynowa',family:'"Courier New", Courier, monospace',group:'mono'},
 ...bundledFonts
];
export const reelFont = id => (reelFonts.find(f=>f.id===id)||reelFonts[0]).family;

// Keep titles in frame when a bundled font has different text metrics.
const titleFits=new WeakMap();
export function reelTitleSize(ctx,text,fontId,preferred,width,maxLines,maxHeight=Infinity){
 const key=JSON.stringify([text,fontId,preferred,width,maxLines,maxHeight]),cached=titleFits.get(ctx);
 if(cached?.key===key)return cached.size;
 const words=String(text||'').split(/\s+/);let size=preferred;
 for(;size>24;size--){
  ctx.font=`bold ${size}px ${reelFont(fontId)}`;
  let line='',lines=1;
  for(const word of words){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>width&&line){lines++;line=word;}else line=next;}
  if(lines<=maxLines&&lines*size*1.22<=maxHeight&&words.every(word=>ctx.measureText(word).width<=width))break;
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
 const family=reelFont(fontId);
 const align=designOf(config).signatureAlign,x=align==='left'?76:align==='right'?width-76:width/2,theme=themeOf(config);
 ctx.save();ctx.globalAlpha=1;ctx.textAlign=align;ctx.textBaseline='alphabetic';
 ctx.fillStyle=textColor(config,'signature',theme.fg);ctx.font=`bold ${textSize(config,'signature',28)}px ${family}`;
 ctx.fillText('Jakub Bilski',x,height-64,width-152);
 ctx.fillStyle=textColor(config,'signature',theme.muted);ctx.font=`${textSize(config,'signature',24)}px ${family}`;
 ctx.fillText('X: @jakub_bilski  ·  IG: jakub__bilski',x,height-25,width-152);
 ctx.restore();
}
