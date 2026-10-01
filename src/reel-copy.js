// Authored copy belongs to data/language, not to reusable appearance themes.
export const COPY_LIMIT=1500;
export function normalizeCopies(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
 return Object.fromEntries(Object.entries(raw).filter(([key,value])=>key.startsWith('[')&&key.length<=12000&&typeof value==='string').slice(-200).map(([key,value])=>[key,value.slice(0,COPY_LIMIT)]));
}
export function updateCopy(raw,key,value){
 const next={...raw};delete next[key];if(value!==null)next[key]=String(value).slice(0,COPY_LIMIT);return normalizeCopies(next);
}
export function normalizeCopyHidden(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return {};
 return Object.fromEntries(Object.entries(raw).filter(([key,value])=>key.startsWith('[')&&key.length<=12000&&value===true).slice(-200));
}
export function updateCopyHidden(raw,key,hidden){const next={...raw};delete next[key];if(hidden)next[key]=true;return normalizeCopyHidden(next);}
export function copyScope(config){
 if(config._copyScope)return config._copyScope;
 if(config.graphic)return JSON.stringify(['graphic','fertility-conscription',config.graphic.year]);
 if(config.releases)return JSON.stringify(['ai-releases']);
 return JSON.stringify(config.ai?['ai',config.ai.benchmark?.id]:['series',config.source,config.unit,config.isCoffee,config.series?.map(s=>s.id||s.key||s.symbol||s.countryCode||s.name).sort()]);
}
const labels={title:'Tytuł',subtitle:'Opis pod tytułem',metric:'Wspólny wskaźnik',date:'Data / rok',source:'Źródła i metodologia',signature:'Podpis autora',content:'Podpis wykresu'};
export function describeCopy(config,id,original,{element=id,label=labels[element]||labels.content,dynamic=false,shared=false,multiline=true,entity=null,context='',visibilityId=null}={}){
 original=String(original??'');const language=config.language==='en'?'en':'pl';
 const key=JSON.stringify([shared?'author':copyScope(config),language,id,entity,dynamic?null:original]);
 const own=config.visuals?.copy?.[key],custom=typeof own==='string';
 const visibilityKey=visibilityId?JSON.stringify([shared?'author':copyScope(config),language,'visibility',visibilityId,entity]):key;
 const hidden=config.visuals?.copyHidden?.[visibilityKey]===true;
 return {key,id,element,label,original,value:hidden?'':custom?own:original,custom,language,multiline,dynamic,shared,context,visibilityKey,hidden};
}
const frames=new WeakMap();
export function resetReelCopy(canvas){frames.set(canvas,new Map());}
export const reelCopyFields=canvas=>[...(frames.get(canvas)?.values()||[])];
export function registerCopy(ctx,field){const frame=frames.get(ctx.canvas);if(frame&&(frame.has(field.key)||frame.size<150))frame.set(field.key,field);return field.value;}
export function copyText(ctx,config,id,original,options){return registerCopy(ctx,describeCopy(config,id,original,options));}
const revisions=new WeakMap();let revision=0;
export function copyCacheKey(config){const keys=[config.visuals?.copy,config.visuals?.copyHidden].map(value=>{if(!value)return 0;if(!revisions.has(value))revisions.set(value,++revision);return revisions.get(value);});return JSON.stringify([...keys,copyScope(config),config.language]);}
