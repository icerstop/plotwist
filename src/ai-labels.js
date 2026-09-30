import {chartAppearance} from './chart-appearance.js';
import {reelTextFont,textSize,textColor} from './reel-design.js';
import {textLines,paintText,textStyleOf} from './reel-text.js';
import {describeCopy,registerCopy,copyCacheKey} from './reel-copy.js';

// Separate trailing settings without guessing at model/version names. Keep nested
// parentheses and every setting; the source label remains available verbatim.
export function aiIdentity(row){
 const original=String(row?.model||'');let name=original.trim();const groups=[];
 while(name.endsWith(')')){
  let depth=0,start=-1;
  for(let i=name.length-1;i>=0;i--){if(name[i]===')')depth++;else if(name[i]==='('&&!--depth){start=i;break;}}
  if(start<=0)break;
  groups.unshift(name.slice(start+1,-1));name=name.slice(0,start).trim();
 }
 const contains=value=>new RegExp(`(^|[^a-z0-9])${String(value).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}($|[^a-z0-9])`,'i').test(original);
 const effort=row?.effort||row?.modelId?.match(/_(low|medium|high|xhigh|none|\d+[kK])$/)?.[1];
 const extras=[];if(effort&&!contains(effort))extras.push(String(effort));
 if(row?.harness&&!contains(row.harness))extras.push(`Harness: ${row.harness}`);
 const short=value=>value.replace(/\b(max|xhigh|high|medium|low|minimal)\s+effort\b/gi,'$1').replace(/\b(max|xhigh|high|medium|low|minimal)\b/gi,s=>s[0].toUpperCase()+s.slice(1).toLowerCase());
 return {name,details:[...groups,...extras].map(short).join(' · '),source:[original,...extras].join(' · ')};
}

// Measured blocks have no line cap or ellipsis. The caller reserves their actual
// height instead of fitting source settings into a single fixed-height line.
export function layoutAiIdentity(ctx,config,row,{width=925,nameWidth=width,size=36,detailSize=28}={}){
 const identity=aiIdentity(row),source=chartAppearance(config).aiLabelStyle==='source';
 const entity=row.modelId||row.model,context=identity.source;
 const edits=[describeCopy(config,source?'ai.model.source':'ai.model.name',source?identity.source:identity.name,{element:'content',label:'Nazwa modelu',entity,context}),...(!source?[describeCopy(config,'ai.model.details',identity.details,{element:'content',label:'Ustawienia modelu',entity,context})]:[])];
 const style=textStyleOf(config,'labels'),lineHeight=1.2*(style.lineHeight??1),blocks=[];let height=0;
 ctx.save();
 for(const [value,base,w,detail] of [[edits[0].value,size,nameWidth,false],[edits[1]?.value||'',detailSize,width,true]]){
  if(!value)continue;
  const px=textSize(config,'labels',base),font=reelTextFont(config,'labels',px,detail?'normal':'bold');ctx.font=font;
  const lines=textLines(ctx,value,w),step=px*lineHeight;
  if(blocks.length)height+=7;
  blocks.push({lines,font,size:px,step,width:w,baseline:height+px,detail});height+=px+(lines.length-1)*step+px*.18;
 }
 // A fully hidden identity still supplies the score's vertical anchor.
 if(!blocks.length){const px=textSize(config,'labels',size);blocks.push({lines:[],font:reelTextFont(config,'labels',px,'bold'),size:px,step:px*lineHeight,width:nameWidth,baseline:px,detail:false});height=px;}
 ctx.restore();return {blocks,height,edits};
}
export function drawAiIdentity(ctx,config,layout,x,top,fg,muted=fg){
 for(const edit of layout.edits||[])registerCopy(ctx,edit);
 ctx.save();ctx.textAlign='left';
 for(const block of layout.blocks){ctx.font=block.font;ctx.fillStyle=textColor(config,'labels',block.detail?muted:fg);paintText(ctx,config,'labels',block.lines,x,top+block.baseline,block.step,block.width);}
 ctx.restore();
}

const collectionCache=new WeakMap();
export function aiIdentityLayouts(ctx,config,owner,rows,options={}){
 ctx.save();ctx.font=reelTextFont(config,'labels',textSize(config,'labels',options.size??36),'bold');
 const key=JSON.stringify([copyCacheKey(config),options,ctx.font,ctx.measureText('Claude Adaptive Reasoning').width,reelTextFont(config,'labels',textSize(config,'labels',options.detailSize??28)),textStyleOf(config,'labels').lineHeight,chartAppearance(config).aiLabelStyle]);ctx.restore();
 let cache=collectionCache.get(owner);if(!cache){cache=new Map();collectionCache.set(owner,cache);}if(cache.has(key))return cache.get(key);
 const layouts=new Map(rows().map(r=>[r,layoutAiIdentity(ctx,config,r,options)])),height=Math.max(0,...[...layouts.values()].map(l=>l.height));
 if(cache.size>20)cache.clear();const result={layouts,height};cache.set(key,result);return result;
}
const rankingCache=new WeakMap();
export function aiRankingLayout(ctx,config,frames){
 const max=Math.max(2,Math.min(6,chartAppearance(config).aiRankCount??6));
 // Include font metrics in the key: a font finishing loading invalidates the
 // fallback layout. Measuring once per style keeps video export inexpensive.
 ctx.save();ctx.font=reelTextFont(config,'labels',textSize(config,'labels',36),'bold');
 const key=JSON.stringify([copyCacheKey(config),max,ctx.font,ctx.measureText('Claude Adaptive Reasoning').width,reelTextFont(config,'labels',textSize(config,'labels',28)),textStyleOf(config,'labels').lineHeight,textSize(config,'values',40),chartAppearance(config).aiLabelStyle,chartAppearance(config).barWidth]);ctx.restore();
 let cache=rankingCache.get(frames);if(!cache){cache=new Map();rankingCache.set(frames,cache);}if(cache.has(key))return cache.get(key);
 let result;
 for(let count=max;count>=1;count--){
  const candidates=[...new Set(frames.flatMap(f=>f.rank.slice(0,count)))],layouts=new Map(candidates.map(r=>[r,layoutAiIdentity(ctx,config,r,{nameWidth:700})]));
  const titleOffset=Math.max(0,textSize(config,'values',40)-textSize(config,'labels',36)),labelHeight=titleOffset+Math.max(0,...[...layouts.values()].map(l=>l.height));
  const dateSize=textSize(config,'labels',23),barHeight=Math.max(3,chartAppearance(config).barWidth*.2),required=labelHeight+14+barHeight+12+dateSize*1.2+20;
  result={count,layouts,titleOffset,labelHeight,dateSize,barHeight,stride:Math.max(required,814/count)};
  if(required*count<=814)break;
 }
 if(cache.size>20)cache.clear();cache.set(key,result);return result;
}
