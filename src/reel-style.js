export const reelFonts = [
 {id:'arial',name:'Arial · prosta',family:'Arial, Helvetica, sans-serif'},
 {id:'georgia',name:'Georgia · redakcyjna',family:'Georgia, "Times New Roman", serif'},
 {id:'libre-baskerville',name:'Libre Baskerville',family:'"Libre Baskerville", Georgia, serif',face:'Libre Baskerville',file:'/fonts/libre-baskerville/LibreBaskerville-Variable.ttf',weight:'400 700'},
 {id:'verdana',name:'Verdana · czytelna',family:'Verdana, Geneva, sans-serif'},
 {id:'trebuchet',name:'Trebuchet MS · miękka',family:'"Trebuchet MS", Arial, sans-serif'},
 {id:'impact',name:'Impact · wyrazista',family:'Impact, "Arial Narrow", sans-serif'},
 {id:'courier',name:'Courier New · maszynowa',family:'"Courier New", Courier, monospace'}
];
export const reelFont = id => (reelFonts.find(f=>f.id===id)||reelFonts[0]).family;

// The wider serif should retain whole titles within the existing reel margins.
const titleFits=new WeakMap();
export function reelTitleSize(ctx,text,fontId,preferred,width,maxLines){
 if(fontId!=='libre-baskerville')return preferred;
 const key=JSON.stringify([text,fontId,preferred,width,maxLines]),cached=titleFits.get(ctx);
 if(cached?.key===key)return cached.size;
 const words=String(text||'').split(/\s+/);let size=preferred;
 for(;size>50;size--){
  ctx.font=`bold ${size}px ${reelFont(fontId)}`;
  let line='',lines=1;
  for(const word of words){const next=line?`${line} ${word}`:word;if(ctx.measureText(next).width>width&&line){lines++;line=word;}else line=next;}
  if(lines<=maxLines&&words.every(word=>ctx.measureText(word).width<=width))break;
 }
 titleFits.set(ctx,{key,size});return size;
}

const fontLoads=new Map(),loadedFonts=new Set();
export const isReelFontReady=id=>!reelFonts.find(f=>f.id===id)?.file||loadedFonts.has(id);
export function preloadReelFont(id){
 const font=reelFonts.find(f=>f.id===id);
 if(!font?.file)return Promise.resolve();
 if(fontLoads.has(id))return fontLoads.get(id);
 const promise=(async()=>{
  try{
   const face=await new FontFace(font.face,`url("${font.file}")`,{style:'normal',weight:font.weight,display:'swap'}).load();
   document.fonts.add(face);
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
export function drawSignature(ctx,width,height,fontId,dark){
 const family=reelFont(fontId);
 ctx.save();ctx.globalAlpha=1;ctx.textAlign='center';ctx.textBaseline='alphabetic';
 ctx.fillStyle=dark?'#e5e9e2':'#343d32';ctx.font=`bold 28px ${family}`;
 ctx.fillText('Jakub Bilski',width/2,height-60);
 ctx.fillStyle=dark?'#adb5af':'#616a62';ctx.font=`24px ${family}`;
 ctx.fillText('X: @jakub_bilski  ·  IG: jakub__bilski',width/2,height-27);
 ctx.restore();
}
