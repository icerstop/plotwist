// One typing head for the whole reel. The schedule is measured once at the first
// data frame, then replayed from absolute time (preview, seeking and video alike).
const clamp=n=>Math.max(0,Math.min(1,n));
export const typingStyles=[['classic','Klasyczne'],['natural','Naturalne z pauzami'],['terminal','Terminalowe'],['retro','Retro']];
export const typingCursors=[['bar','Pionowa kreska'],['block','Blok'],['underline','Podkreślenie'],['none','Bez kursora']];
export const typingRoles=[['title','Tytuł'],['subtitle','Opis'],['metric','Wspólny wskaźnik'],['content','Etykiety wykresu'],['date','Data / rok'],['source','Źródło'],['signature','Podpis autora']];
export const isSequentialTyping=config=>!!(config.visuals?.design?.motion?.enabled&&config.visuals.design.motion.typing?.enabled&&!config.editorPreview);
export function typingStages(chartStart=.56){
 const start=.01,end=Math.max(.06,chartStart-.02),span=end-start;
 return Object.fromEntries(Object.entries({title:[0,.28],subtitle:[.30,.46],metric:[.48,.53],content:[.55,.79],date:[.80,.835],source:[.845,.92],signature:[.93,1]}).map(([role,[a,b]])=>[role,{start:start+a*span,duration:(b-a)*span}]));
}
const roles=new WeakMap();
export function typingRole(ctx,role){
 const previous=roles.get(ctx);roles.set(ctx,typingRoles.some(([id])=>id===role)?role:'content');
 return ()=>previous==null?roles.delete(ctx):roles.set(ctx,previous);
}
const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
export const typingGraphemes=value=>segmenter?[...segmenter.segment(String(value))].map(g=>g.segment):Array.from(String(value));
function characterWeights(chars,style){
 return chars.map((char,i)=>{
  if(style==='natural')return .7+((char.codePointAt(0)*31+i*17)%67)/100+(/[.!?]/u.test(char)?4:/[,;:]/u.test(char)?2:/\s/u.test(char)?.7:0);
  if(style==='terminal')return i%7===6?2.8:.55;
  if(style==='retro')return /[.!?,;:]/u.test(char)?4:i%4===3?1.5:1;
  return 1;
 });
}
export function buildTypingPlan(items,chartStart,style='classic'){
 const stages=typingStages(chartStart),entries=[];
 for(const [role] of typingRoles){
  const group=items.filter(item=>item.role===role&&item.text.trim()).map(item=>{
   const chars=typingGraphemes(item.text),weights=characterWeights(chars,style);let total=0;
   return {...item,chars,beats:weights.map(w=>(total+=w)),weight:total};
  });
  const total=group.reduce((sum,item)=>sum+item.weight+1.5,0);let offset=0;
  for(const item of group){const stage=stages[role],start=stage.start+stage.duration*offset/total,duration=stage.duration*item.weight/total;
   entries.push({...item,start,duration});offset+=item.weight+1.5;
  }
 }
 return {entries,stages,end:chartStart-.02};
}
export function typingAt(entry,fraction){
 const p=clamp((fraction-entry.start)/entry.duration),beat=p*entry.weight;
 // Binary search avoids scanning long source notes on every exported frame.
 let lo=0,hi=entry.beats.length;while(lo<hi){const mid=(lo+hi)>>1;if(entry.beats[mid]<=beat+1e-10)lo=mid+1;else hi=mid;}
 return {count:lo,started:fraction>=entry.start,active:fraction>=entry.start&&fraction<entry.start+entry.duration,p};
}
const plans=new WeakMap();
const keyOf=(ctx,text,x,y,width)=>JSON.stringify([roles.get(ctx)||'content',String(text),ctx.font,ctx.textAlign,x,y,width??null]);
function replaceText(ctx,fill,stroke){
 const descriptors=['fillText','strokeText'].map(k=>Object.getOwnPropertyDescriptor(ctx,k));
 const originals=[ctx.fillText,ctx.strokeText];ctx.fillText=fill;ctx.strokeText=stroke;
 return ()=>['fillText','strokeText'].forEach((k,i)=>{if(descriptors[i])Object.defineProperty(ctx,k,descriptors[i]);else delete ctx[k];});
}
export function drawTypingCursor(ctx,{x,y,size,ascent,descent,nextWidth},style){
 if(style==='none')return;
 ctx.save();ctx.shadowBlur=0;ctx.shadowOffsetX=0;ctx.shadowOffsetY=0;
 const thickness=Math.max(2,size*.055);
 if(style==='block'){ctx.globalAlpha*=.5;ctx.fillRect(x+1,y-ascent,Math.max(size*.4,nextWidth),ascent+descent);}
 else if(style==='underline')ctx.fillRect(x+1,y+descent-thickness,Math.max(size*.5,nextWidth),thickness);
 else ctx.fillRect(x+1,y-ascent,thickness,ascent+descent);
 ctx.restore();
}
// Capturing actual Canvas text calls covers axes, legends, AI cards and signatures,
// including the raw fillText calls outside the styled-text helper. It never reads pixels.
export function renderTypingFrame(canvas,config,progress,time,render){
 if(!isSequentialTyping(config))return false;
 const motion=config.visuals.design.motion,duration=config.duration||12,fraction=time/duration;
 if(fraction>=motion.chartStart-.02)return false;
 const ctx=canvas.getContext('2d'),cacheKey=config._motionCacheKey||config;
 let cached=plans.get(ctx);
 if(cached?.key!==cacheKey){
  const items=[],restore=replaceText(ctx,function(text,x,y,width){
   if(this.globalAlpha>0)items.push({role:roles.get(this)||'content',text:String(text),key:keyOf(this,text,x,y,width)});
  },()=>{});
  try{render(canvas,{...config,_typingCapture:true},0,0);}finally{restore();roles.delete(ctx);}
  cached={key:cacheKey,plan:buildTypingPlan(items,motion.chartStart,motion.typing.style)};plans.set(ctx,cached);
 }
 const lookup=new Map();for(const entry of cached.plan.entries){const list=lookup.get(entry.key)||[];list.push(entry);lookup.set(entry.key,list);}
 const seen={fill:new Map(),stroke:new Map()},originals={fill:ctx.fillText,stroke:ctx.strokeText};
 function text(method,value,x,y,width){
  const key=keyOf(this,value,x,y,width),index=seen[method].get(key)||0;seen[method].set(key,index+1);
  const entry=lookup.get(key)?.[index];if(!entry)return; // No future labels during the intro.
  const state=typingAt(entry,fraction);if(!state.started)return;
  if(state.count===entry.chars.length){originals[method].call(this,value,x,y,...(width==null?[]:[width]));return;}
  const metrics=this.measureText(String(value)),size=parseFloat(this.font.match(/([\d.]+)px/)?.[1]||30),ratio=width==null?1:Math.min(1,width/(metrics.width||1));
  const fullWidth=metrics.width*ratio,left=x-(this.textAlign==='right'||this.textAlign==='end'?fullWidth:this.textAlign==='center'?fullWidth/2:0);
  const prefix=entry.chars.slice(0,state.count).join(''),advance=this.measureText(prefix).width;
  this.save();this.translate(left,y);this.scale(ratio,1);this.textAlign='left';
  if(prefix)originals[method].call(this,prefix,0,0);
  if(method==='fill'&&state.active){
   const lastBeat=state.count?entry.beats[state.count-1]:0,paused=(fraction-entry.start-lastBeat/entry.weight*entry.duration)*duration>.12;
   if(!motion.typing.blink||!paused||Math.floor(time*2.5)%2===0)drawTypingCursor(this,{x:advance,y:0,size,ascent:metrics.actualBoundingBoxAscent||size*.8,descent:metrics.actualBoundingBoxDescent||size*.2,nextWidth:this.measureText(entry.chars[state.count]||'M').width},motion.typing.cursor);
  }
  this.restore();
 }
 const restore=replaceText(ctx,function(...args){text.call(this,'fill',...args);},function(...args){text.call(this,'stroke',...args);});
 try{render(canvas,config,progress,time);}finally{restore();roles.delete(ctx);}
 return true;
}
