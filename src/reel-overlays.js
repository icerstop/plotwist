import {reelFonts,normalizeFontWeight} from './reel-fonts.js';

export const overlayLimit=20;
export const overlayKinds=[['text','Tekst'],['rectangle','Prostokąt'],['ellipse','Elipsa'],['line','Linia'],['arrow','Strzałka']];
import {reelElementDefinitions} from './reel-capabilities.js';
const builtins=Object.keys(reelElementDefinitions);
const number=(v,f,min,max)=>v!=null&&Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):f;
const color=(v,f)=>/^#[0-9a-f]{6}$/i.test(v||'')?v:f;
export const normalizeHidden=raw=>Object.fromEntries(builtins.filter(id=>raw?.[id]===true).map(id=>[id,true]));
export function normalizeOverlays(raw){
 const seen=new Set();return (Array.isArray(raw)?raw:[]).filter(o=>o&&typeof o.id==='string'&&/^[\w-]{1,100}$/.test(o.id)&&overlayKinds.some(([kind])=>kind===o.kind)&&!seen.has(o.id)&&seen.add(o.id)).slice(0,overlayLimit).map(o=>({
  id:o.id,kind:o.kind,name:String(o.name||'').slice(0,80),text:{pl:String(o.text?.pl??'Twój tekst').slice(0,1500),en:String(o.text?.en??'Your text').slice(0,1500)},
  x:number(o.x,50,0,100),y:number(o.y,35,0,100),width:number(o.width,o.kind==='text'?70:30,5,100),height:number(o.height,12,1,80),scale:number(o.scale,100,25,200),rotation:number(o.rotation,0,-180,180),opacity:number(o.opacity,100,0,100),visible:o.visible!==false,layer:o.layer==='behind'?'behind':'front',
  color:color(o.color,null),fill:o.fill!==false,strokeWidth:number(o.strokeWidth,6,1,30),radius:number(o.radius,20,0,100),shadow:o.shadow===true,
  fontId:reelFonts.some(f=>f.id===o.fontId)?o.fontId:null,fontSize:number(o.fontSize,64,16,240),weight:normalizeFontWeight(o.weight??700),italic:o.italic===true,align:['left','right'].includes(o.align)?o.align:'center',lineHeight:number(o.lineHeight,1.2,.8,2)
 }));
}
export function newOverlay(kind){return normalizeOverlays([{id:crypto.randomUUID(),kind}])[0];}
export function overlayName(o,language='pl'){return o.name||(o.kind==='text'?(o.text[language==='en'?'en':'pl'].split('\n')[0].slice(0,50)||'Tekst'):overlayKinds.find(([id])=>id===o.kind)?.[1]||'Element');}
export function reorderOverlay(list,id,direction){
 const current=list.find(o=>o.id===id);if(!current)return list;
 const group=list.filter(o=>o.layer===current.layer),at=group.findIndex(o=>o.id===id),other=group[at+direction];if(!other)return list;
 const next=[...list],a=next.indexOf(current),b=next.indexOf(other);[next[a],next[b]]=[next[b],next[a]];return next;
}
