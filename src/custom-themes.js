import {normalizeDesign} from './reel-design.js';
import {normalizeLogo} from './reel-logo.js';
import {reelFonts} from './reel-fonts.js';

export const THEME_FILE_LIMIT=34*1024*1024;
const validFont=id=>reelFonts.some(f=>f.id===id)?id:'arial';
const number=(v,f,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):f;
const color=(v,f)=>/^#[0-9a-f]{6}$/i.test(v||'')?v:f;
export function themeName(value){
 const name=typeof value==='string'?value.trim().replace(/\s+/g,' '):'';
 if(!name||name.length>60)throw new Error('Podaj nazwę motywu (1–60 znaków).');
 return name;
}
const assetIds=appearance=>[...new Set([appearance.background.type==='image'&&appearance.background.assetId,appearance.logo.type==='custom'&&appearance.logo.assetId].filter(Boolean))];
export const themeAssetIds=theme=>assetIds(theme.appearance);
export function normalizeSavedTheme(raw){
 if(raw?.version!==1||!raw.appearance||!raw.appearance.design||typeof raw.id!=='string'||!raw.id||raw.id.length>100)throw new Error('Nieprawidłowy plik motywu.');
 const a=raw.appearance,b=a.background||{},design=normalizeDesign(a.design);
 // Data-specific captions and individual overlay tracks belong to the reel.
 design.preset=null;design.metricLabels={};
 design.motion.tracks=Object.fromEntries(Object.entries(design.motion.tracks).filter(([id])=>!id.startsWith('sticker:')));
 const background={type:['theme','color','gradient','image'].includes(b.type)?b.type:'theme',color:color(b.color,'#142a35'),color2:color(b.color2,'#453375'),angle:number(b.angle,115,0,360),pattern:['none','grid','dots'].includes(b.pattern)?b.pattern:'none',animate:b.animate===true,veil:number(b.veil,0,0,.9),assetId:typeof b.assetId==='string'?b.assetId:null,fit:b.fit==='contain'?'contain':'cover',opacity:number(b.opacity,1,0,1),speed:number(b.speed,1,.25,2)};
 const logo=normalizeLogo(a.logo);
 if(b.source&&typeof b.source==='object')background.source={provider:String(b.source.provider||'').slice(0,100),id:String(b.source.id||'').slice(0,100),title:String(b.source.title||'').slice(0,200),url:/^https:\/\//.test(b.source.url||'')?b.source.url.slice(0,2000):'',providerUrl:/^https:\/\//.test(b.source.providerUrl||'')?b.source.providerUrl.slice(0,2000):''};
 if(background.type!=='image')background.assetId=null;
 if(logo.type!=='custom'){logo.assetId=null;logo.name='';}
 const appearance={fontId:validFont(a.fontId),design,background,logo},files={};
 if(background.type==='image'&&!background.assetId||logo.type==='custom'&&!logo.assetId)throw new Error('Brakuje pliku tła lub logo w motywie.');
 for(const id of assetIds(appearance)){
  const file=raw.files?.[id];
  if(!(file instanceof Blob)||!file.size||file.size>12*1024*1024)throw new Error('Brakuje pliku tła lub logo w motywie.');
  files[id]=file;
 }
 return {version:1,id:raw.id,name:themeName(raw.name),createdAt:typeof raw.createdAt==='string'?raw.createdAt:new Date().toISOString(),updatedAt:typeof raw.updatedAt==='string'?raw.updatedAt:new Date().toISOString(),appearance,files};
}
export function captureTheme({name,visuals,files={},fontId,id=crypto.randomUUID(),createdAt}){
 const now=new Date().toISOString();
 return normalizeSavedTheme({version:1,id,name,createdAt:createdAt||now,updatedAt:now,appearance:{fontId:visuals.fontId||fontId,design:visuals.design,background:visuals.background,logo:visuals.logo},files});
}
export function applySavedTheme(visuals,raw){
 const {appearance}=normalizeSavedTheme(raw),current=normalizeDesign(visuals.design);
 const overlayTracks=Object.fromEntries(Object.entries(current.motion.tracks).filter(([id])=>id.startsWith('sticker:')));
 return {...visuals,...appearance,design:normalizeDesign({...appearance.design,metricLabels:current.metricLabels,motion:{...appearance.design.motion,tracks:{...appearance.design.motion.tracks,...overlayTracks}}})};
}
export function duplicateThemeName(themes,name,exceptId){const key=themeName(name).toLocaleLowerCase('pl');return themes.some(t=>t.id!==exceptId&&t.name.toLocaleLowerCase('pl')===key);}
export function uniqueThemeName(themes,name){
 name=themeName(name);if(!duplicateThemeName(themes,name))return name;
 for(let n=2;;n++){const suffix=` (${n})`,candidate=name.slice(0,60-suffix.length)+suffix;if(!duplicateThemeName(themes,candidate))return candidate;}
}
export async function exportTheme(raw){
 const theme=normalizeSavedTheme(raw),files={};
 for(const [id,file] of Object.entries(theme.files)){
  const bytes=new Uint8Array(await file.arrayBuffer());let binary='';
  for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  files[id]={name:file.name||'theme-image',type:file.type,data:btoa(binary)};
 }
 return JSON.stringify({kind:'plotwist-theme',...theme,files},null,2);
}
export async function importTheme(file){
 if(!file?.size||file.size>THEME_FILE_LIMIT)throw new Error('Wybierz plik motywu JSON do 34 MB.');
 let raw;try{raw=JSON.parse(await file.text());}catch{throw new Error('Nieprawidłowy plik motywu.');}
 if(raw?.kind!=='plotwist-theme'||raw.version!==1)throw new Error('Nieprawidłowy plik motywu.');
 const files={};
 if(!raw.files||typeof raw.files!=='object'||Object.keys(raw.files).length>2)throw new Error('Nieprawidłowy plik motywu.');
 for(const [id,encoded] of Object.entries(raw.files)){
  if(typeof encoded?.data!=='string'||encoded.data.length>17*1024*1024)throw new Error('Nieprawidłowy plik motywu.');
  let binary;try{binary=atob(encoded.data);}catch{throw new Error('Nieprawidłowy plik motywu.');}
  files[id]=new File([Uint8Array.from(binary,c=>c.charCodeAt(0))],typeof encoded.name==='string'?encoded.name.slice(0,200):'theme-image',{type:typeof encoded.type==='string'?encoded.type:''});
 }
 // Imported assets get fresh identities, avoiding collisions with existing reels.
 return remapThemeAssets(normalizeSavedTheme({...raw,id:crypto.randomUUID(),files}));
}
export function remapThemeAssets(raw){
 const theme=normalizeSavedTheme(raw),mapped={};
 for(const [id,blob] of Object.entries(theme.files)){const next=crypto.randomUUID();mapped[next]=blob;for(const part of ['background','logo'])if(theme.appearance[part].assetId===id)theme.appearance[part].assetId=next;}
 return {...theme,files:mapped};
}
