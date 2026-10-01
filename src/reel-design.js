import {reelElementDefinitions} from './reel-capabilities.js';
import {normalizeMotion} from './reel-motion.js';
import {aiFrameLayout} from './ai-layout.js';
import {reelFonts,reelFont,normalizeFontWeight,nearestFontWeight} from './reel-fonts.js';
import {beginElement,elementIds} from './reel-elements.js';
import {normalizeChart} from './chart-appearance.js';
// Shared design contract for every preview, PNG and recorded video frame.
export const reelThemes = [
 {id:'dark',name:'Studio · ciemny',bg:'#111514',fg:'#f8faf6',muted:'#adb5af',panel:'#1d2822',grid:'#344239',colors:['#bcf34a','#b18aff','#8fabb6'],dark:true},
 {id:'light',name:'Klasyczny · jasny',bg:'#ffffff',fg:'#17191d',muted:'#535963',panel:'#f0f2f5',grid:'#dce0e6',colors:['#2457a7','#963c58','#43766e'],dark:false},
 {id:'mono',name:'Klasyczny · ciemny',bg:'#141414',fg:'#fafafa',muted:'#bdbdbd',panel:'#252525',grid:'#414141',colors:['#ffffff','#aab9d0','#b69c84'],dark:true},
 {id:'paper',name:'Papier i atrament',bg:'#f4efdf',fg:'#292720',muted:'#656052',panel:'#e9e1ce',grid:'#d1c7b1',colors:['#8c352b','#285f66','#756029'],dark:false},
 {id:'navy',name:'Granat i biel',bg:'#101d35',fg:'#f8fafc',muted:'#b7c4d9',panel:'#1b2d49',grid:'#354861',colors:['#eac578','#90baf0','#d4a4cb'],dark:true},
 {id:'editorial',name:'Redakcyjny · jasny',bg:'#f3f5f7',fg:'#14263b',muted:'#576678',panel:'#e5eaf0',grid:'#cbd4de',colors:['#173b65','#aa3a32','#527969'],dark:false},
 {id:'mint',name:'Mięta i grafit',bg:'#e9f3ed',fg:'#17392f',muted:'#486459',panel:'#d7e8df',grid:'#b7cfc1',colors:['#19745a','#a5486b','#4665aa'],dark:false},
 {id:'lavender',name:'Lawendowy papier',bg:'#f1edfa',fg:'#302346',muted:'#675675',panel:'#e4dcf2',grid:'#cfc2e0',colors:['#7250a2','#26796d','#b54c64'],dark:false},
 {id:'terminal',name:'Terminal',bg:'#071b18',fg:'#eaffef',muted:'#9fbfae',panel:'#12312a',grid:'#31564a',colors:['#81efae','#69c7ed','#ffce80'],dark:true},
 {id:'plum',name:'Śliwka i morela',bg:'#29182d',fg:'#fff1e9',muted:'#cfb4cd',panel:'#432c45',grid:'#654761',colors:['#ffbc8c','#a9c4ff','#e1a2da'],dark:true}
];
export const textRoles=[
 {id:'title',name:'Tytuł',min:60,max:140}, {id:'subtitle',name:'Opis pod tytułem',min:75,max:140},
 {id:'metric',name:'Wspólny wskaźnik',min:75,max:150},
 {id:'labels',name:'Etykiety i osie',min:80,max:140}, {id:'values',name:'Wartości liczbowe',min:75,max:150},
 {id:'date',name:'Data / rok',min:75,max:140}, {id:'source',name:'Źródła i metodologia',min:85,max:110},
 {id:'signature',name:'Podpis autora',min:75,max:120}
];
export const reelLayouts=[{id:'classic',name:'Klasyczny',description:'Nagłówek, wykres, podpis'},{id:'compact',name:'Wykres w centrum',description:'Mniejszy nagłówek, wykres wyżej'},{id:'chart-first',name:'Wykres na górze',description:'Dane przed nagłówkiem'},{id:'centered',name:'Symetryczny',description:'Wyśrodkowany nagłówek'},{id:'minimal',name:'Dane na pierwszym planie',description:'Mały nagłówek, więcej miejsca na dane'},{id:'inset',name:'Z oddechem',description:'Szersze marginesy i lżejsza kompozycja'}];
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const number=(v,fallback,min,max)=>Number.isFinite(Number(v))?clamp(Number(v),min,max):fallback;
export function normalizeDesign(raw={}){
 const metricLabels=Object.fromEntries(Object.entries(raw.metricLabels||{}).filter(([key,value])=>key.length<500&&value&&typeof value==='object').slice(0,200).map(([key,value])=>[key,{pl:typeof value.pl==='string'?value.pl.slice(0,160):'',en:typeof value.en==='string'?value.en.slice(0,160):''}]));
 const hex=(v,f=null)=>/^#[0-9a-f]{6}$/i.test(v||'')?v:f;
 const scopedRoles=Object.entries(reelElementDefinitions).flatMap(([element,s])=>(s.textRoles||[]).map(id=>({...textRoles.find(r=>r.id===id),id:`${element}:${id}`}))).filter(r=>raw.text?.[r.id]);
 const text={};for(const role of [...textRoles,...scopedRoles]){const t=raw.text?.[role.id]||{};text[role.id]={size:number(t.size,100,role.min,role.max),fontId:reelFonts.some(f=>f.id===t.fontId)?t.fontId:null,color:hex(t.color),align:['left','center','right'].includes(t.align)?t.align:'auto',width:number(t.width??100,100,10,200),autoHeight:t.autoHeight===true,headerScales:Object.fromEntries(['9:16','4:5','1:1'].filter(f=>Number.isFinite(t.headerScales?.[f])).map(f=>[f,number(t.headerScales[f],1,.25,1)])),fitRatio:t.fitRatio!=null?number(t.fitRatio,1,.05,2):null,lineHeight:number(t.lineHeight??1,1,.85,1.65),maxLines:Math.round(number(t.maxLines??0,0,0,6)),wrap:t.wrap==='manual'?'manual':'auto',weight:normalizeFontWeight(t.weight),italic:t.italic===true,opacity:number(t.opacity??100,100,20,100),shadow:['soft','hard','glow'].includes(t.shadow)?t.shadow:'none',shadowColor:hex(t.shadowColor,'#000000'),shadowBlur:number(t.shadowBlur??14,14,0,40),shadowX:number(t.shadowX??0,0,-30,30),shadowY:number(t.shadowY??6,6,-30,30),strokeWidth:number(t.strokeWidth??0,0,0,8),strokeColor:hex(t.strokeColor,'#000000'),boxColor:hex(t.boxColor),boxOpacity:number(t.boxOpacity??90,90,10,100),padding:number(t.padding??14,14,0,40),radius:number(t.radius??10,10,0,32)};}
 const positions={};for(const id of ['header','content']){const p=raw.positions?.[id]||{};positions[id]={x:number(p.x,50,0,100),y:number(p.y,0,-20,20),scale:number(p.scale,100,65,100)};}
 const elements=Object.fromEntries(elementIds.map(id=>{const e=raw.elements?.[id]||{};return [id,{x:number(e.x,0,-100,100),y:number(e.y,0,-100,100),scale:number(e.scale,100,25,200),rotation:number(e.rotation,0,-180,180),widthScale:number(e.widthScale??100,100,10,300),heightScale:number(e.heightScale??100,100,10,300)}];}));
 return {fontWeight:normalizeFontWeight(raw.fontWeight),elements,motion:normalizeMotion(raw.motion),chart:normalizeChart(raw.chart),preset:typeof raw.preset==='string'?raw.preset.slice(0,60):null,legendMode:raw.legendMode==='full'?'full':'auto',metricLabels,theme:reelThemes.some(t=>t.id===raw.theme)?raw.theme:'dark',layout:reelLayouts.some(l=>l.id===raw.layout)?raw.layout:'classic',chartHeight:number(raw.chartHeight??100,100,50,100),text,positions,signatureAlign:['left','center','right'].includes(raw.signatureAlign)?raw.signatureAlign:'center'};
}
export const designOf=config=>config.visuals?.design||normalizeDesign({theme:config.theme});
// Choosing the whole-reel font is an explicit typography reset. Per-element
// fonts can be assigned again afterwards without affecting the other styles.
export function applyReelFont(visuals,fontId){
 if(!reelFonts.some(font=>font.id===fontId))return visuals;
 const design=normalizeDesign(visuals.design);
 return {...visuals,fontId,design:{...design,preset:null,text:Object.fromEntries(Object.entries(design.text).map(([role,style])=>[role,{...style,fontId:null}]))},overlays:(visuals.overlays||[]).map(o=>o.kind==='text'?{...o,fontId:null}:o)};
}
export const themeOf=config=>reelThemes.find(t=>t.id===designOf(config).theme)||reelThemes[0];
export const textStyle=(config,role)=>designOf(config).text?.[`${config._textElement}:${role}`]||(['detailDate','detailModels','detailGap'].includes(config._textElement)?designOf(config).text?.[`detail:${role}`]:null)||designOf(config).text?.[role];
export const textSize=(config,role,size)=>size*(textStyle(config,role)?.size??100)/100*(config._aiTextScale??1);
export const textColor=(config,role,fallback)=>textStyle(config,role)?.color||fallback;
// Resize only the plot, anchored above the legend. Old saved designs fill the space.
export const chartTop=(config,top,bottom)=>bottom-(bottom-top)*number(designOf(config).chartHeight??100,100,50,100)/100;
export function seriesPlotLayout(config,width,height,headerBottom,metricHeight=null){
 const short=height<1400,header=sectionTransform(config,'header',width,height),content=sectionTransform(config,'content',width,height);
 const legendStep=Math.max(config.compactTitle?52:43,textSize(config,'labels',27)+16,textSize(config,'values',27)+16);
 const bottom=height-(short?235:285)-(!config.independentAxes&&designOf(config).chart?.legend!==false?100+(Math.max(1,config.series?.length||0)-1)*legendStep:30);
 const gap=48,minPlot=Math.min(280,height*.18),captionSpace=config.metricCaption?(metricHeight??textSize(config,'metric',38)*2)+26:0;
 const lockedHeaderScale=designOf(config).text.title.headerScales?.[config.format]??designOf(config).text.subtitle.headerScales?.[config.format];
 let headerScale=1,top=content.base.y+32;
 if(designOf(config).layout!=='chart-first'){
  const maxHeaderEnd=content.y+(bottom-minPlot-captionSpace-content.base.y)*content.scale-gap;
  headerScale=lockedHeaderScale??clamp((maxHeaderEnd-header.y)/((headerBottom-header.base.y)*header.scale),.25,1);
  const headerEnd=header.y+(headerBottom-header.base.y)*header.scale*headerScale;
  top=content.base.y+(headerEnd+gap-content.y)/content.scale;
 }else{
  headerScale=lockedHeaderScale??clamp((header.footerTop-header.y)/((headerBottom-header.base.y)*header.scale),.25,1);
 }
 // Manual offsets can consume the remaining room; keep a positive plot in that case.
 top=Math.min(top+captionSpace,bottom-100);
 return {top:chartTop(config,top,bottom),bottom,legendStep,headerScale};
}
export function setReelText(ctx,config,role,size,family,color,weight=''){
 ctx.font=reelTextFont(config,role,textSize(config,role,size),weight,family);
 if(color)ctx.fillStyle=textColor(config,role,color);
}
export function textWeight(config,role,fallback=400){
 const design=designOf(config),style=textStyle(config,role),own=normalizeFontWeight(style?.weight),global=normalizeFontWeight(design.fontWeight),requested=own==='auto'?global:own;
 // Automatic weights preserve the original design hierarchy and legacy synthesis.
 return requested==='auto'?(normalizeFontWeight(fallback)==='auto'?400:normalizeFontWeight(fallback)):nearestFontWeight(style?.fontId||config.fontId,requested);
}
// `size` is already scaled/fitted. Use this for both measuring and drawing text.
export function reelTextFont(config,role,size,fallback=400,family=reelFont(config.fontId)){
 const style=textStyle(config,role);
 return `${style?.italic?'italic ':''}${textWeight(config,role,fallback)} ${size}px ${style?.fontId?reelFont(style.fontId):family}`;
}
// Fit whole sections uniformly: charts, logos and type keep their proportions.
// Positions are clamped to the content area; the attribution footer stays separate.
export function sectionTransform(config,section,width,height){
 const ai=!!(config.ai||config.releases),short=height<1400,plot=['line','area','bar'].includes(config.chart||'line');
 const aiLayout=ai?aiFrameLayout(config.format):null;
 const start=ai?aiLayout.start:short?height*(plot ? .24 : .46):700,end=ai?aiLayout.end:height-(short?205:220);
 const base=section==='header'?{x:50,y:50,w:980,h:start-75}:{x:50,y:start,w:980,h:end-start};
 const d=designOf(config),p=d.positions?.[section]||{x:50,y:0,scale:100};
 let scale=1,targetY=base.y;
 if(d.layout==='compact'){if(section==='header')scale=.72;else targetY=start-(start-50)*.23;}
 if(d.layout==='centered'){if(section==='header'){scale=.85;targetY=90;}else targetY=start-45;}
 if(d.layout==='minimal'){if(section==='header')scale=.62;else targetY=start-(start-50)*.32;}
 if(d.layout==='inset'){scale=.83;if(section==='content')targetY=start+35;}
 if(d.layout==='chart-first'){
  if(section==='content')targetY=65;
  else{scale=Math.min(.65,(end-65-(end-start)-25)/base.h);targetY=65+(end-start)+25;}
 }
 scale*=p.scale/100;
 const x=32+(width-64-base.w*scale)*p.x/100;
 const y=clamp(targetY+p.y*height/100,32,end-base.h*scale);
 return {x,y,scale,base,footerTop:end};
}
export function beginReelSection(ctx,config,section,width,height,rect){
 const t=sectionTransform(config,section,width,height);ctx.save();ctx.translate(t.x,t.y);ctx.scale(t.scale,t.scale);ctx.translate(-t.base.x,-t.base.y);
 const end=section==='content'?beginElement(ctx,config,'content',rect||t.base):()=>{};
 return ()=>{end();ctx.restore();};
}
