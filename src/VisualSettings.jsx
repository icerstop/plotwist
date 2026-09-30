import {reelCapabilities} from './reel-capabilities.js';
import {normalizeCopies,updateCopy,copyScope,normalizeCopyHidden,updateCopyHidden} from './reel-copy.js';
import {normalizeOverlays,normalizeHidden,newOverlay,overlayLimit,reorderOverlay} from './reel-overlays.js';
import {seriesColor} from './chart-appearance.js';
import {reelPresets,applyReelPreset} from './reel-presets.js';
import {normalizeLogo,restoreLogo,reelLogoOptions} from './reel-logo.js';
import React,{createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {ImagePlus,Trash2,ChevronUp,ChevronDown,RotateCcw} from 'lucide-react';
import {decodeMedia,loadVisualDraft,saveVisualDraft,mediaAsset,releaseMedia} from './reel-media.js';
import './visual-settings.css';
import {normalizeDesign,reelThemes,reelLayouts,applyReelFont} from './reel-design.js';
import GifSearch from './GifSearch.jsx';
import {reelFonts} from './reel-fonts.js';
import CustomThemes from './CustomThemes.jsx';
import FontWeightPicker from './FontWeightPicker.jsx';
import {captureTheme,applySavedTheme,normalizeSavedTheme,remapThemeAssets} from './custom-themes.js';
import {downloadGif,gifError,GIF_PROVIDER,GIF_DOCS} from './gif-search.js';

const defaultBackground={type:'theme',color:'#142a35',color2:'#453375',angle:115,pattern:'none',animate:false,veil:0,assetId:null,fit:'cover',opacity:1,speed:1};
const validFont=id=>reelFonts.some(f=>f.id===id)?id:null;
const emptyVisuals=()=>({copy:{},copyHidden:{},hidden:{},overlays:[],fontId:null,logo:normalizeLogo(),background:{...defaultBackground},stickers:[],design:normalizeDesign()});
const VisualContext=createContext(null);
export function VisualProvider({children}){
 const [visuals,setVisuals]=useState(emptyVisuals),[files,setFiles]=useState({}),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[storage,setStorage]=useState('Wczytywanie dodatków…');
 const operation=useRef(false),[presetUndo,setPresetUndo]=useState(null);
 useEffect(()=>{let active=true;(async()=>{try{
  const draft=await loadVisualDraft();
  if(draft?.version===1){
   const restored={};let failed=false;
   for(const [id,file] of Object.entries(draft.files||{})){try{await decodeMedia(file,id);restored[id]=file;}catch{failed=true;}}
   if(active){const v=draft.visuals;setFiles(restored);setVisuals({copy:normalizeCopies(v.copy),copyHidden:normalizeCopyHidden(v.copyHidden),hidden:normalizeHidden(v.hidden),overlays:normalizeOverlays(v.overlays),fontId:validFont(v.fontId),logo:restoreLogo(v.logo,restored),design:normalizeDesign(v.design),background:{...defaultBackground,...v.background,...(v.background?.assetId&&!restored[v.background.assetId]?{type:'theme',assetId:null}:{})},stickers:(v.stickers||[]).filter(s=>restored[s.assetId]).slice(0,3)});if(failed)setError('Nie udało się przywrócić jednego z plików. Wgraj go ponownie.');}
  }
 }catch{if(active)setStorage('Zapis lokalny niedostępny. Dodatki działają w tej sesji.');}finally{if(active)setReady(true);}})();return()=>{active=false;};},[]);
 useEffect(()=>{if(!ready)return;let active=true;setStorage('Zapisywanie w przeglądarce…');const timer=setTimeout(()=>{saveVisualDraft({version:1,visuals,files}).then(()=>{if(active)setStorage('Zapisano w tej przeglądarce');}).catch(()=>{if(active)setStorage('Brak miejsca na zapis. Dodatki działają w tej sesji.');});},450);return()=>{active=false;clearTimeout(timer);};},[visuals,files,ready]);
 function logo(patch){setVisuals(v=>({...v,logo:normalizeLogo({...v.logo,...patch})}));}
 function background(patch){setVisuals(v=>({...v,background:{...v.background,...patch}}));}
 function sticker(id,patch){setVisuals(v=>({...v,stickers:v.stickers.map(s=>s.id===id?{...s,...patch}:s)}));}
 function forget(id){if(!id)return;releaseMedia(id);setFiles(f=>{const next={...f};delete next[id];return next;});}
 function remove(id){const found=visuals.stickers.find(s=>s.id===id);setVisuals(v=>({...v,stickers:v.stickers.filter(s=>s.id!==id)}));forget(found?.assetId);}
 async function upload(input,target,source=null){
  if(!input||operation.current||!ready)return false;
  if(target==='sticker'&&visuals.stickers.length>=3){setError('Możesz dodać maksymalnie 3 obrazki lub GIF-y.');return false;}
  operation.current=true;setBusy(true);setError('');
  try{
   const file=typeof input==='function'?await input():input;
   const id=await decodeMedia(file);setFiles(f=>({...f,[id]:file}));
   if(target==='background'){const old=visuals.background.assetId;background({type:'image',assetId:id,veil:.55,opacity:1,source});forget(old);}
   else if(target==='logo'){const old=visuals.logo.assetId;logo({type:'custom',assetId:id,name:file.name});forget(old);}
   else setVisuals(v=>({...v,stickers:[...v.stickers,{id,assetId:id,name:source?.title||file.name,source,x:83,y:10,size:18,rotation:0,opacity:1,motion:'none',speed:1,layer:'front',visible:true,shadow:false}]}));
   return true;
  }catch(e){setError(source?gifError(e):e.message);return false;}finally{operation.current=false;setBusy(false);}
 }
 function importGif(item,target){return upload(()=>downloadGif(item),target,{provider:GIF_PROVIDER,id:item.id,title:item.title,url:item.url,providerUrl:GIF_DOCS});}
 function reorder(id,direction){setVisuals(v=>{const list=[...v.stickers],i=list.findIndex(s=>s.id===id),j=i+direction;if(j<0||j>=list.length)return v;[list[i],list[j]]=[list[j],list[i]];return {...v,stickers:list};});}
 function reset(){const keep=visuals.logo.assetId;for(const id of Object.keys(files))if(id!==keep)releaseMedia(id);setFiles(f=>keep&&f[keep]?{[keep]:f[keep]}:{});setVisuals(v=>({...emptyVisuals(),logo:v.logo,design:v.design,fontId:v.fontId,copy:v.copy,copyHidden:v.copyHidden,hidden:v.hidden,overlays:v.overlays}));setError('');}
 function design(patch){setVisuals(v=>({...v,design:normalizeDesign({...v.design,...patch,preset:null})}));}
 function theme(id){setVisuals(v=>({...v,design:normalizeDesign({...v.design,preset:null,theme:id,text:Object.fromEntries(Object.entries(v.design.text).map(([key,t])=>[key,{...t,color:null}]))}),background:{...v.background,type:'theme',veil:0,pattern:'none'}}));}
 function element(id,patch){setVisuals(v=>({...v,design:normalizeDesign({...v.design,preset:null,elements:{...v.design.elements,[id]:{...v.design.elements[id],...patch}}})}));}
 function copy(key,value){setVisuals(v=>({...v,copy:updateCopy(v.copy,key,value)}));}
 function hideCopy(key,hidden){setVisuals(v=>({...v,copyHidden:updateCopyHidden(v.copyHidden,key,hidden)}));}
 function hide(id,hidden){setVisuals(v=>({...v,hidden:normalizeHidden({...v.hidden,[id]:hidden})}));}
 function addOverlay(kind){if(visuals.overlays.length>=overlayLimit)return null;const o=newOverlay(kind);if(!o)return null;setVisuals(v=>({...v,overlays:normalizeOverlays([...v.overlays,o])}));return o.id;}
 function overlay(id,patch){setVisuals(v=>({...v,overlays:normalizeOverlays(v.overlays.map(o=>o.id===id?{...o,...patch}:o))}));}
 function duplicateOverlay(id){if(visuals.overlays.length>=overlayLimit)return null;const original=visuals.overlays.find(o=>o.id===id);if(!original)return null;const o={...original,id:crypto.randomUUID(),x:Math.min(95,original.x+3),y:Math.min(95,original.y+3)};setVisuals(v=>{const motion=v.design.motion,track=motion.tracks[`overlay:${id}`];return {...v,overlays:normalizeOverlays([...v.overlays,o]),design:track?normalizeDesign({...v.design,motion:{...motion,tracks:{...motion.tracks,[`overlay:${o.id}`]:track}}}):v.design};});return o.id;}
 function removeOverlay(id){setVisuals(v=>{const tracks={...v.design.motion.tracks};delete tracks[`overlay:${id}`];return {...v,overlays:v.overlays.filter(o=>o.id!==id),design:normalizeDesign({...v.design,motion:{...v.design.motion,tracks}})};});}
 function orderOverlay(id,direction){setVisuals(v=>({...v,overlays:reorderOverlay(v.overlays,id,direction)}));}
 function textStyle(id,patch){setVisuals(v=>({...v,design:normalizeDesign({...v.design,preset:null,text:patch===null?Object.fromEntries(Object.entries(v.design.text).filter(([key])=>key!==id)):{...v.design.text,[id]:{...v.design.text[id.split(':').at(-1)],...v.design.text[id],...patch}}})}));}
 function metricLabel(key,language,text){setVisuals(v=>({...v,design:normalizeDesign({...v.design,metricLabels:{...v.design.metricLabels,[key]:{...v.design.metricLabels[key],[language]:text}}})}));}
 async function restoreComposition(saved){
  if(operation.current)return;
  const media=saved.files||{},missing=Object.keys(media).filter(id=>!mediaAsset(id));
  const apply=()=>{setFiles(f=>({...f,...media}));setVisuals(v=>({...v,copy:normalizeCopies(saved.copy),copyHidden:normalizeCopyHidden(saved.copyHidden),hidden:normalizeHidden(saved.hidden),overlays:normalizeOverlays(saved.overlays),design:normalizeDesign(saved.design),stickers:saved.stickers.filter(s=>mediaAsset(s.assetId))}));};
  if(!missing.length){apply();return;}
  operation.current=true;setBusy(true);setError('');
  try{await Promise.all(missing.map(id=>decodeMedia(media[id],id)));apply();}catch(e){setError(e.message);}finally{operation.current=false;setBusy(false);}
 }
 function applyPreset(id){setPresetUndo({design:visuals.design,fontId:visuals.fontId,background:visuals.background});setVisuals(v=>applyReelPreset(v,id));}
 function undoPreset(){if(presetUndo)setVisuals(v=>({...v,...presetUndo}));setPresetUndo(null);}
 async function applyTheme(raw){
  if(operation.current||!ready)throw new Error('Poczekaj na zakończenie wczytywania dodatków.');
  const saved=remapThemeAssets(normalizeSavedTheme(raw)),decoded=[];
  operation.current=true;setBusy(true);setError('');
  try{
   // Prepare every asset before replacing the current composition. A decode failure
   // leaves the current visual state and its cached media intact.
   for(const [id,file] of Object.entries(saved.files)){await decodeMedia(file,id);decoded.push(id);}
   const retained=Object.fromEntries(visuals.stickers.map(s=>[s.assetId,files[s.assetId]]).filter(([,file])=>file));
   setFiles({...retained,...saved.files});setVisuals(v=>applySavedTheme(v,saved));setPresetUndo(null);
   for(const id of Object.keys(files))if(!retained[id])releaseMedia(id);
  }catch(error){for(const id of decoded)releaseMedia(id);throw error;}
  finally{operation.current=false;setBusy(false);}
 }
 const context={mediaFiles:files,hide,addOverlay,overlay,duplicateOverlay,removeOverlay,orderOverlay,captureTheme:options=>captureTheme({...options,visuals,files}),applyTheme,applyPreset,undoPreset,canUndoPreset:!!presetUndo,font:fontId=>setVisuals(v=>applyReelFont(v,fontId)),logo,removeLogo:()=>{forget(visuals.logo.assetId);logo({type:'none',assetId:null,name:''});},element,textStyle,copy,hideCopy,metricLabel,restoreComposition,visuals,ready,busy,error,storage,background,sticker,remove,upload,importGif,reorder,reset,design,theme,removeBackground:()=>{forget(visuals.background.assetId);background({assetId:null,type:'theme',veil:0,source:null});}};
 return <VisualContext.Provider value={context}>{children}</VisualContext.Provider>;
}
export function useVisualConfig(config,duration){const {visuals}=useContext(VisualContext);return useMemo(()=>({...config,_copyScope:copyScope(config),fontId:visuals.fontId||config.fontId,visuals,duration}),[config,visuals,duration]);}
export const useVisualStatus=()=>useContext(VisualContext);
export function LegendOptions({beforeChange=()=>{}}){const v=useVisualStatus();return <label className="visual-field">Opisy w legendzie<select aria-label="Opisy w legendzie" value={v.visuals.design.legendMode} onChange={e=>{beforeChange();v.design({legendMode:e.target.value});}}><option value="auto">Automatycznie · wspólny wskaźnik raz</option><option value="full">Pełne nazwy przy każdej serii</option></select><small>Wspólny podpis pojawia się tylko dla zgodnych wskaźników i jednostek. Własne nazwy serii pozostają bez zmian.</small></label>;}
export function Range({label,value,min=0,max=100,step=1,onChange,suffix='%'}){return <label className="visual-range"><span>{label}<output>{value}{suffix}</output></span><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onInput={e=>onChange(Number(e.target.value))} onChange={e=>onChange(Number(e.target.value))}/></label>;}
export function Color({label,value,onChange}){const [draft,setDraft]=useState(value);useEffect(()=>setDraft(value),[value]);return <label className="visual-color"><span>{label}</span><span><input aria-label={label} type="color" value={value} onInput={e=>onChange(e.target.value)} onChange={e=>onChange(e.target.value)}/><input aria-label={`${label} HEX`} maxLength={7} value={draft} onChange={e=>{setDraft(e.target.value);if(/^#[0-9a-f]{6}$/i.test(e.target.value))onChange(e.target.value);}} onBlur={()=>setDraft(value)}/></span></label>;}
const presets=[['noc','Atrament','#11232f','#373255'],['aurora','Zorza','#10352e','#343576'],['wine','Bordo','#471e35','#1a263d'],['paper','Papier','#e8eee4','#d6e5e9']];
function LogoEditor(){
 const v=useVisualStatus(),logo=v.visuals.logo,input=useRef();
 return <div className="reel-logo-settings"><label className="visual-field">Logo rolki<select aria-label="Logo rolki" value={logo.type} disabled={v.busy} onChange={e=>v.logo({type:e.target.value})}>{reelLogoOptions.map(o=><option key={o.id} value={o.id}>{o.name}</option>)}</select></label>
  {logo.type==='custom'&&<><button type="button" className="secondary full" disabled={v.busy} onClick={()=>input.current.click()}><ImagePlus size={16}/>{logo.assetId?'Zmień plik logo':'Wgraj własne logo'}</button>
   {logo.assetId&&<div className="visual-asset-summary"><img src={mediaAsset(logo.assetId)?.thumbnail} alt="Podgląd logo"/><span translate="no">{logo.name}</span><button type="button" className="icon-btn" aria-label="Usuń plik logo" onClick={v.removeLogo}><Trash2 size={16}/></button></div>}
   <p className="visual-hint">PNG, JPG, WebP lub GIF do 12 MB. Przezroczyste tło PNG jest zachowane. Logo nie zajmuje miejsca na dodatki.</p>
   {v.busy&&<p role="status" className="helper">Przygotowywanie logo…</p>}{v.error&&<p role="alert" className="error">{v.error}</p>}
  </>}
  <input ref={input} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Plik logo" onChange={e=>{v.upload(e.target.files?.[0],'logo');e.target.value='';}}/>
  {!['none','custom'].includes(logo.type)&&<Color label="Kolor logo" value={logo.color||themeOfLogo(v.visuals.design.theme)} onChange={color=>v.logo({color})}/>}
  <p className="visual-hint">Domyślnie bez logo. Wybrane logo możesz przesuwać, obracać i skalować bezpośrednio na podglądzie.</p>
 </div>;
}
const themeOfLogo=id=>(reelThemes.find(t=>t.id===id)||reelThemes[0]).colors[0];
export function StyleEditor({children,fontId,config}){
 const v=useVisualStatus(),d=v.visuals.design;
 return <div className="visual-editor design-editor"><div className="visual-editor-body"><fieldset disabled={!v.ready||v.busy}>
  <CustomThemes visual={v} fontId={fontId}/>
  <div className="design-preset-heading"><strong>Gotowe designy</strong><span>8 zestawów</span></div>
  <div className="design-preset-grid" role="group" aria-label="Gotowe designy">{reelPresets.map(p=>{const theme=reelThemes.find(t=>t.id===p.theme),colors=theme.colors.map((c,i)=>seriesColor({visuals:{design:{theme:p.theme,chart:p.chart}}},i,c));return <button type="button" key={p.id} aria-label={`Design: ${p.name}`} aria-pressed={d.preset===p.id} className={d.preset===p.id?'selected':''} onClick={()=>v.applyPreset(p.id)}>
   <span className={`design-preset-mini ${p.layout}`} style={{background:theme.bg,color:theme.fg}} aria-hidden="true"><b style={{fontFamily:reelFonts.find(f=>f.id===p.font)?.family,textShadow:p.text.title.shadow?'2px 2px 5px '+colors[0]:undefined}}>Aa<span>01—26</span></b><svg viewBox="0 0 120 55"><path d="M4 46H116 M4 28H116 M4 10H116" stroke={theme.grid} strokeWidth="1" fill="none"/><path d="M5 43L28 34L51 39L74 17L96 24L115 5" stroke={colors[0]} strokeWidth={p.chart.lineWidth/2} fill="none" strokeLinejoin="round"/><path d="M5 30L28 39L51 25L74 29L96 13L115 22" stroke={colors[1]} strokeWidth="2" fill="none"/></svg><i style={{background:colors[0]}}/><i style={{background:colors[1]}}/></span><strong>{p.name}</strong><small>{p.description}</small>
  </button>;})}</div>
  <p className="visual-hint">Design ustawia czcionki, kolory, układ i wykres oraz zeruje ręczne pozycje elementów. Dane, treści i dodane obrazki zostają.</p>
  {v.canUndoPreset&&<button type="button" className="secondary full" onClick={v.undoPreset}><RotateCcw size={14}/>Cofnij wybór designu</button>}
  <details className="appearance-group"><summary>Sam motyw kolorystyczny</summary>
   <div className="reel-theme-grid" role="group" aria-label="Motyw rolki">{reelThemes.map(t=><button type="button" key={t.id} className={d.theme===t.id?'selected':''} aria-pressed={d.theme===t.id} onClick={()=>v.theme(t.id)}><span className="reel-theme-swatch" style={{background:t.bg,color:t.fg}} aria-hidden="true"><b>Aa</b><i style={{background:t.colors[0]}}/><i style={{background:t.colors[1]}}/></span><span>{t.name}</span></button>)}</div>
  <p className="visual-hint">Motyw ustawia tło i kolory tekstu. Rozmiary, układ oraz kolory wybranych serii pozostają bez zmian.</p>

 </details>
 {children}
 <p className="visual-hint">Zmiana czcionki rolki obejmuje wszystkie napisy, także legendę i osie. Osobny krój możesz potem ustawić w zakładce Elementy.</p>
 <FontWeightPicker label="Grubość czcionki rolki" fontId={v.visuals.fontId||fontId} value={d.fontWeight} onChange={fontWeight=>v.design({fontWeight})}/>
 <p className="visual-hint">Ustawienie wspólne. Elementy z własną grubością mają pierwszeństwo.</p>
 {reelCapabilities(config).legendOptions&&<LegendOptions/>}
   <button type="button" className="text-btn visual-reset" onClick={()=>{v.theme('dark');v.design(normalizeDesign());v.logo({type:'none'});}}><RotateCcw size={14}/>Przywróć domyślny styl i układ</button>

 </fieldset></div></div>;
}
export function LayoutEditor({config}){
 const v=useVisualStatus(),d=v.visuals.design,[section,setSection]=useState('header'),p=d.positions[section];
 const updatePosition=patch=>v.design({positions:{...d.positions,[section]:{...p,...patch}}});
 return <div className="visual-editor design-editor"><div className="visual-editor-body"><fieldset disabled={!v.ready||v.busy}>
   {reelCapabilities(config).plotDimensions&&<><Range label="Szerokość wykresu" value={d.chart.width} min={60} max={100} onChange={width=>v.design({chart:{...d.chart,width}})}/>
   <Range label="Wysokość wykresu" value={d.chartHeight} min={50} max={100} onChange={chartHeight=>v.design({chartHeight})}/>
  <p className="visual-hint">100% wypełnia dostępne miejsce między nagłówkiem a legendą. Suwak zmienia wysokość obszaru osi, bez zmiany rozmiaru tekstu i skali wartości. Dotyczy linii, obszarów, kolumn i wykresów punktowych.</p>
  <button type="button" className="text-btn" onClick={()=>v.design({chartHeight:100})}>Dopasuj wysokość do wolnego miejsca</button></>}
  <div className="reel-layout-grid" role="group" aria-label="Układ rolki">{reelLayouts.map(l=><button type="button" key={l.id} aria-pressed={d.layout===l.id} className={d.layout===l.id?'selected':''} onClick={()=>v.design({layout:l.id,positions:normalizeDesign().positions})}><span className={`layout-mini ${l.id}`} aria-hidden="true"><i/><b/></span><strong>{l.name}</strong><small>{l.description}</small></button>)}</div>
  <details className="reel-position-editor"><summary>Dopasuj położenie elementów</summary>
   <label className="visual-field">Przesuwana sekcja<select aria-label="Przesuwana sekcja" value={section} onChange={e=>setSection(e.target.value)}><option value="header">Nagłówek i opis</option><option value="content">Wykres i legenda</option></select></label>
   <Range label="Skala sekcji" value={p.scale} min={65} max={100} onChange={scale=>updatePosition({scale})}/>
   <Range label="Położenie poziome" value={p.x} onChange={x=>updatePosition({x})}/>
   <Range label="Przesunięcie pionowe" value={p.y} min={-20} max={20} onChange={y=>updatePosition({y})}/>
   <button type="button" className="text-btn" onClick={()=>updatePosition({x:50,y:0,scale:100})}>Przywróć pozycję elementu</button>
  </details>
  <label className="visual-field">Wyrównanie podpisu<select aria-label="Wyrównanie podpisu" value={d.signatureAlign} onChange={e=>v.design({signatureAlign:e.target.value})}><option value="left">Do lewej</option><option value="center">Na środku</option><option value="right">Do prawej</option></select></label>

 </fieldset></div></div>;
}
export function MediaEditor({onSelect}){
 const v=useVisualStatus(),b=v.visuals.background,bgInput=useRef(),stickerInput=useRef();
 return <div className="visual-editor media-editor"><div className="visual-editor-body">
  <fieldset disabled={!v.ready||v.busy}>
   <LogoEditor/>
   <label className="visual-field">Rodzaj tła<select aria-label="Rodzaj tła" value={b.type} onChange={e=>v.background({type:e.target.value,veil:e.target.value==='theme'?0:e.target.value==='image'?.55:.18})}><option value="theme">Z motywu rolki</option><option value="color">Własny kolor</option><option value="gradient">Gradient</option><option value="image">Obraz lub GIF</option></select></label>
   {b.type==='gradient'&&<><div className="background-presets">{presets.map(([id,name,color,color2])=><button type="button" key={id} title={name} aria-label={`Tło ${name}`} onClick={()=>v.background({color,color2})} style={{background:`linear-gradient(120deg,${color},${color2})`}}><span>{name}</span></button>)}</div><Color label="Kolor początkowy" value={b.color} onChange={color=>v.background({color})}/><Color label="Kolor końcowy" value={b.color2} onChange={color2=>v.background({color2})}/><Range label="Kąt gradientu" value={b.angle} max={360} suffix="°" onChange={angle=>v.background({angle})}/><label className="visual-check"><input type="checkbox" checked={b.animate} onChange={e=>v.background({animate:e.target.checked})}/>Delikatny ruch gradientu</label></>}
   {b.type==='color'&&<Color label="Kolor tła" value={b.color} onChange={color=>v.background({color})}/>}
   {b.type==='image'&&<><button type="button" className="secondary full" onClick={()=>bgInput.current.click()}><ImagePlus size={16}/>{b.assetId?'Zmień obraz / GIF tła':'Wgraj obraz / GIF tła'}</button>{b.assetId&&<><div className="visual-asset-summary"><img src={mediaAsset(b.assetId)?.thumbnail} alt="Podgląd tła"/><span>{mediaAsset(b.assetId)?.type==='gif'?'Animowane tło GIF':'Własne tło'}<small>{mediaAsset(b.assetId)?.width} × {mediaAsset(b.assetId)?.height}</small></span><button className="icon-btn" aria-label="Usuń obraz tła" onClick={v.removeBackground}><Trash2 size={16}/></button></div><label className="visual-field">Dopasowanie tła<select value={b.fit} onChange={e=>v.background({fit:e.target.value})}><option value="cover">Wypełnij · przytnij krawędzie</option><option value="contain">Pokaż cały obraz</option></select></label><Range label="Widoczność tła" value={Math.round(b.opacity*100)} onChange={n=>v.background({opacity:n/100})}/>{mediaAsset(b.assetId)?.type==='gif'&&<Range label="Tempo GIF-a w tle" value={b.speed} min={.25} max={2} step={.25} suffix="×" onChange={speed=>v.background({speed})}/>}</>}</>}
   <input ref={bgInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Plik tła" onChange={e=>{v.upload(e.target.files?.[0],'background');e.target.value='';}}/>
   <label className="visual-field">Wzór w tle<select value={b.pattern} onChange={e=>v.background({pattern:e.target.value})}><option value="none">Bez wzoru</option><option value="grid">Delikatna siatka</option><option value="dots">Drobne punkty</option></select></label>
   <Range label="Osłona pod tekst i wykres" value={Math.round(b.veil*100)} max={90} onChange={n=>v.background({veil:n/100})}/><p className="visual-hint">Osłona przyciemnia tło w ciemnym motywie, a rozjaśnia w jasnym. Kolor tekstu zmienisz motywem rolki.</p>
   <div className="visual-section-title"><h3>Obrazki i GIF-y</h3><span>{v.visuals.stickers.length}/3</span></div>
   <GifSearch onAdd={v.importGif} full={v.visuals.stickers.length>=3} busy={v.busy} error={v.error}/>
   {v.visuals.stickers.map((s,i)=><div className="visual-asset-summary" key={s.id}><img src={mediaAsset(s.assetId)?.thumbnail} alt=""/><span translate="no">{s.name}<small>{s.visible?'widoczny':'ukryty'}</small></span><button type="button" className="secondary" onClick={()=>onSelect('sticker:'+s.id)}>Edytuj dodatek</button></div>)}

   <button type="button" className="secondary full" disabled={v.visuals.stickers.length>=3} onClick={()=>stickerInput.current.click()}><ImagePlus size={16}/>Dodaj obrazek lub GIF</button><input ref={stickerInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Plik dodatku" onChange={e=>{v.upload(e.target.files?.[0],'sticker');e.target.value='';}}/>
   <p className="visual-hint">PNG, JPG, WebP lub GIF do 12 MB. Do 3 dodatków. GIF-y odtwarzają się w pętli razem z rolką; PNG zachowuje jedną klatkę. Podpis i źródła mają chroniony obszar.</p>
   <button type="button" className="text-btn visual-reset" onClick={v.reset}><RotateCcw size={14}/>Przywróć proste tło i usuń dodatki</button>
  </fieldset>
  {v.busy&&<p role="status" className="helper">Przygotowywanie klatek obrazu…</p>}{v.error&&<p role="alert" className="error">{v.error}</p>}<p className="visual-storage" role="status">{v.storage}</p>
 </div></div>;
}

export function StickerControls({sticker:s,index:i,beforeChange=()=>{}}){
 const v=useVisualStatus(),asset=mediaAsset(s.assetId);
 return <div className="sticker-body" onFocusCapture={beforeChange} onPointerDownCapture={beforeChange}>
     <div className="sticker-actions"><label className="visual-check"><input type="checkbox" checked={s.visible} onChange={e=>v.sticker(s.id,{visible:e.target.checked})}/>Pokaż dodatek</label><button type="button" className="icon-btn" aria-label={`Usuń dodatek ${i+1}`} onClick={()=>v.remove(s.id)}><Trash2 size={16}/></button></div>
    <div className="sticker-positions" role="group" aria-label={`Pozycja dodatku ${i+1}`}>{[['Lewy górny',16,10],['Środek u góry',50,10],['Prawy górny',84,10]].map(([name,x,y])=><button type="button" key={name} onClick={()=>v.sticker(s.id,{x,y})}>{name}</button>)}</div>
    <Range label={`Poziomo · dodatek ${i+1}`} value={s.x} onChange={x=>v.sticker(s.id,{x})}/><Range label={`Pionowo · dodatek ${i+1}`} value={s.y} onChange={y=>v.sticker(s.id,{y})}/><Range label={`Rozmiar · dodatek ${i+1}`} value={s.size} min={5} max={100} onChange={size=>v.sticker(s.id,{size})}/><Range label={`Obrót · dodatek ${i+1}`} value={s.rotation} min={-180} max={180} suffix="°" onChange={rotation=>v.sticker(s.id,{rotation})}/><Range label={`Widoczność · dodatek ${i+1}`} value={Math.round(s.opacity*100)} onChange={n=>v.sticker(s.id,{opacity:n/100})}/>
    <label className="visual-field">Ruch dodatku<select aria-label={`Ruch dodatku ${i+1}`} value={s.motion} onChange={e=>v.sticker(s.id,{motion:e.target.value})}><option value="none">Bez dodatkowego ruchu</option><option value="float">Lekkie unoszenie</option><option value="pulse">Pulsowanie</option><option value="enter">Łagodne pojawienie</option></select></label>
    {asset?.type==='gif'&&<Range label={`Tempo GIF-a · dodatek ${i+1}`} value={s.speed} min={.25} max={2} step={.25} suffix="×" onChange={speed=>v.sticker(s.id,{speed})}/>}
    <label className="visual-field">Warstwa<select aria-label={`Warstwa dodatku ${i+1}`} value={s.layer} onChange={e=>v.sticker(s.id,{layer:e.target.value})}><option value="front">Nad wykresem</option><option value="behind">Pod tekstem i wykresem</option></select></label><label className="visual-check"><input type="checkbox" checked={s.shadow} onChange={e=>v.sticker(s.id,{shadow:e.target.checked})}/>Cień pod dodatkiem</label>
    <div className="sticker-order"><button type="button" className="text-btn" disabled={i===0} onClick={()=>v.reorder(s.id,-1)}><ChevronUp size={14}/>Niżej</button><button type="button" className="text-btn" disabled={i===v.visuals.stickers.length-1} onClick={()=>v.reorder(s.id,1)}><ChevronDown size={14}/>Wyżej</button></div>
    <button type="button" className="text-btn visual-reset" onClick={()=>v.sticker(s.id,{x:83,y:10,size:18,rotation:0})}><RotateCcw size={14}/>Przywróć wybrany element</button>

 </div>;
}
