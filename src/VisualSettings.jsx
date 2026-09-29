import React,{createContext,useContext,useEffect,useMemo,useRef,useState} from 'react';
import {ImagePlus,Trash2,ChevronUp,ChevronDown,RotateCcw} from 'lucide-react';
import {decodeMedia,loadVisualDraft,saveVisualDraft,mediaAsset,releaseMedia,releaseAllMedia} from './reel-media.js';
import './visual-settings.css';
import {normalizeDesign,reelThemes,reelLayouts,textRoles} from './reel-design.js';

const defaultBackground={type:'theme',color:'#142a35',color2:'#453375',angle:115,pattern:'none',animate:false,veil:0,assetId:null,fit:'cover',opacity:1,speed:1};
const emptyVisuals=()=>({background:{...defaultBackground},stickers:[],design:normalizeDesign()});
const VisualContext=createContext(null);
export function VisualProvider({children}){
 const [visuals,setVisuals]=useState(emptyVisuals),[files,setFiles]=useState({}),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[storage,setStorage]=useState('Wczytywanie dodatków…');
 const operation=useRef(false);
 useEffect(()=>{let active=true;(async()=>{try{
  const draft=await loadVisualDraft();
  if(draft?.version===1){
   const restored={};let failed=false;
   for(const [id,file] of Object.entries(draft.files||{})){try{await decodeMedia(file,id);restored[id]=file;}catch{failed=true;}}
   if(active){const v=draft.visuals;setFiles(restored);setVisuals({design:normalizeDesign(v.design),background:{...defaultBackground,...v.background,...(v.background?.assetId&&!restored[v.background.assetId]?{type:'theme',assetId:null}:{})},stickers:(v.stickers||[]).filter(s=>restored[s.assetId]).slice(0,3)});if(failed)setError('Nie udało się przywrócić jednego z plików. Wgraj go ponownie.');}
  }
 }catch{if(active)setStorage('Zapis lokalny niedostępny. Dodatki działają w tej sesji.');}finally{if(active)setReady(true);}})();return()=>{active=false;};},[]);
 useEffect(()=>{if(!ready)return;let active=true;setStorage('Zapisywanie w przeglądarce…');const timer=setTimeout(()=>{saveVisualDraft({version:1,visuals,files}).then(()=>{if(active)setStorage('Zapisano w tej przeglądarce');}).catch(()=>{if(active)setStorage('Brak miejsca na zapis. Dodatki działają w tej sesji.');});},450);return()=>{active=false;clearTimeout(timer);};},[visuals,files,ready]);
 function background(patch){setVisuals(v=>({...v,background:{...v.background,...patch}}));}
 function sticker(id,patch){setVisuals(v=>({...v,stickers:v.stickers.map(s=>s.id===id?{...s,...patch}:s)}));}
 function forget(id){if(!id)return;releaseMedia(id);setFiles(f=>{const next={...f};delete next[id];return next;});}
 function remove(id){const found=visuals.stickers.find(s=>s.id===id);setVisuals(v=>({...v,stickers:v.stickers.filter(s=>s.id!==id)}));forget(found?.assetId);}
 async function upload(file,target){
  if(!file||operation.current||!ready)return;
  if(target==='sticker'&&visuals.stickers.length>=3){setError('Możesz dodać maksymalnie 3 obrazki lub GIF-y.');return;}
  operation.current=true;setBusy(true);setError('');
  try{
   const id=await decodeMedia(file);setFiles(f=>({...f,[id]:file}));
   if(target==='background'){const old=visuals.background.assetId;background({type:'image',assetId:id,veil:.55,opacity:1});forget(old);}
   else setVisuals(v=>({...v,stickers:[...v.stickers,{id,assetId:id,name:file.name,x:83,y:10,size:18,rotation:0,opacity:1,motion:'none',speed:1,layer:'front',visible:true,shadow:false}]}));
  }catch(e){setError(e.message);}finally{operation.current=false;setBusy(false);}
 }
 function reorder(id,direction){setVisuals(v=>{const list=[...v.stickers],i=list.findIndex(s=>s.id===id),j=i+direction;if(j<0||j>=list.length)return v;[list[i],list[j]]=[list[j],list[i]];return {...v,stickers:list};});}
 function reset(){releaseAllMedia();setFiles({});setVisuals(v=>({...emptyVisuals(),design:v.design}));setError('');}
 function design(patch){setVisuals(v=>({...v,design:normalizeDesign({...v.design,...patch})}));}
 function theme(id){setVisuals(v=>({...v,design:normalizeDesign({...v.design,theme:id,text:Object.fromEntries(Object.entries(v.design.text).map(([key,t])=>[key,{...t,color:null}]))}),background:{...v.background,type:'theme',veil:0,pattern:'none'}}));}
 const context={visuals,ready,busy,error,storage,background,sticker,remove,upload,reorder,reset,design,theme,removeBackground:()=>{forget(visuals.background.assetId);background({assetId:null,type:'theme',veil:0});}};
 return <VisualContext.Provider value={context}>{children}</VisualContext.Provider>;
}
export function useVisualConfig(config,duration){const {visuals}=useContext(VisualContext);return useMemo(()=>({...config,visuals,duration}),[config,visuals,duration]);}
export const useVisualStatus=()=>useContext(VisualContext);
function Range({label,value,min=0,max=100,step=1,onChange,suffix='%'}){return <label className="visual-range"><span>{label}<output>{value}{suffix}</output></span><input type="range" aria-label={label} min={min} max={max} step={step} value={value} onInput={e=>onChange(Number(e.target.value))} onChange={e=>onChange(Number(e.target.value))}/></label>;}
function Color({label,value,onChange}){const [draft,setDraft]=useState(value);useEffect(()=>setDraft(value),[value]);return <label className="visual-color"><span>{label}</span><span><input aria-label={label} type="color" value={value} onInput={e=>onChange(e.target.value)} onChange={e=>onChange(e.target.value)}/><input aria-label={`${label} HEX`} maxLength={7} value={draft} onChange={e=>{setDraft(e.target.value);if(/^#[0-9a-f]{6}$/i.test(e.target.value))onChange(e.target.value);}} onBlur={()=>setDraft(value)}/></span></label>;}
const presets=[['noc','Atrament','#11232f','#373255'],['aurora','Zorza','#10352e','#343576'],['wine','Bordo','#471e35','#1a263d'],['paper','Papier','#e8eee4','#d6e5e9']];
function DesignEditor(){
 const v=useVisualStatus(),d=v.visuals.design,[role,setRole]=useState('title'),[section,setSection]=useState('header');
 const t=reelThemes.find(t=>t.id===d.theme),r=textRoles.find(t=>t.id===role),value=d.text[role],p=d.positions[section];
 const updateText=patch=>v.design({text:{...d.text,[role]:{...value,...patch}}});
 const updatePosition=patch=>v.design({positions:{...d.positions,[section]:{...p,...patch}}});
 const defaultColor=['subtitle','labels','source'].includes(role)?t.muted:t.fg;
 return <details className="visual-editor design-editor" open><summary>Styl i układ rolki <span>Motywy · typografia · kompozycja</span></summary><div className="visual-editor-body"><fieldset disabled={!v.ready}>
  <p className="visual-intro">Ustawienia wspólne dla wszystkich rolek, podglądu i eksportu.</p>
  <div className="reel-theme-grid" role="group" aria-label="Motyw rolki">{reelThemes.map(t=><button type="button" key={t.id} className={d.theme===t.id?'selected':''} aria-pressed={d.theme===t.id} onClick={()=>v.theme(t.id)}><span className="reel-theme-swatch" style={{background:t.bg,color:t.fg}} aria-hidden="true"><b>Aa</b><i style={{background:t.colors[0]}}/><i style={{background:t.colors[1]}}/></span><span>{t.name}</span></button>)}</div>
  <p className="visual-hint">Motyw ustawia tło i kolory tekstu. Rozmiary, układ oraz kolory wybranych serii pozostają bez zmian.</p>
  <div className="visual-section-title"><h3>Typografia</h3></div>
  <label className="visual-field">Element tekstowy<select aria-label="Element tekstowy" value={role} onChange={e=>setRole(e.target.value)}>{textRoles.map(r=><option key={r.id} value={r.id}>{r.name}</option>)}</select></label>
  <Range label="Rozmiar tekstu" value={value.size} min={r.min} max={r.max} onChange={size=>updateText({size})}/>
  <Color label="Kolor tekstu" value={value.color||defaultColor} onChange={color=>updateText({color})}/>
  <button type="button" className="text-btn" onClick={()=>updateText({size:100,color:null})}>Przywróć styl tego tekstu</button>
  <p className="visual-hint">100% to rozmiar wyjściowy. Długie teksty dopasowują się do dostępnego miejsca.</p>
  <div className="visual-section-title"><h3>Kompozycja</h3></div>
  <Range label="Wysokość wykresu" value={d.chartHeight} min={50} max={100} onChange={chartHeight=>v.design({chartHeight})}/>
  <p className="visual-hint">100% wypełnia dostępne miejsce między nagłówkiem a legendą. Suwak zmienia wysokość obszaru osi, bez zmiany rozmiaru tekstu i skali wartości. Dotyczy linii, obszarów, kolumn i wykresów punktowych.</p>
  <button type="button" className="text-btn" onClick={()=>v.design({chartHeight:100})}>Dopasuj wysokość do wolnego miejsca</button>
  <div className="reel-layout-grid" role="group" aria-label="Układ rolki">{reelLayouts.map(l=><button type="button" key={l.id} aria-pressed={d.layout===l.id} className={d.layout===l.id?'selected':''} onClick={()=>v.design({layout:l.id,positions:normalizeDesign().positions})}><span className={`layout-mini ${l.id}`} aria-hidden="true"><i/><b/></span><strong>{l.name}</strong><small>{l.description}</small></button>)}</div>
  <details className="reel-position-editor"><summary>Dopasuj położenie elementów</summary>
   <label className="visual-field">Przesuwany element<select aria-label="Przesuwany element" value={section} onChange={e=>setSection(e.target.value)}><option value="header">Nagłówek i opis</option><option value="content">Wykres i legenda</option></select></label>
   <Range label="Skala elementu" value={p.scale} min={65} max={100} onChange={scale=>updatePosition({scale})}/>
   <Range label="Położenie poziome" value={p.x} onChange={x=>updatePosition({x})}/>
   <Range label="Przesunięcie pionowe" value={p.y} min={-20} max={20} onChange={y=>updatePosition({y})}/>
   <button type="button" className="text-btn" onClick={()=>updatePosition({x:50,y:0,scale:100})}>Przywróć pozycję elementu</button>
  </details>
  <label className="visual-field">Wyrównanie podpisu<select aria-label="Wyrównanie podpisu" value={d.signatureAlign} onChange={e=>v.design({signatureAlign:e.target.value})}><option value="left">Do lewej</option><option value="center">Na środku</option><option value="right">Do prawej</option></select></label>
  <button type="button" className="text-btn visual-reset" onClick={()=>{v.theme('dark');v.design(normalizeDesign());}}><RotateCcw size={14}/>Przywróć domyślny styl i układ</button>
 </fieldset></div></details>;
}
export function VisualEditor(){
 const v=useVisualStatus(),b=v.visuals.background,bgInput=useRef(),stickerInput=useRef();
 return <><DesignEditor/><details className="visual-editor"><summary>Tło i dodatki <span>Obrazy · GIF-y</span></summary><div className="visual-editor-body">
  <p className="visual-intro">Wspólny wygląd rolek. Wgrane pliki pozostają w tej przeglądarce.</p>
  <fieldset disabled={!v.ready||v.busy}>
   <label className="visual-field">Rodzaj tła<select aria-label="Rodzaj tła" value={b.type} onChange={e=>v.background({type:e.target.value,veil:e.target.value==='theme'?0:e.target.value==='image'?.55:.18})}><option value="theme">Z motywu rolki</option><option value="color">Własny kolor</option><option value="gradient">Gradient</option><option value="image">Obraz lub GIF</option></select></label>
   {b.type==='gradient'&&<><div className="background-presets">{presets.map(([id,name,color,color2])=><button type="button" key={id} title={name} aria-label={`Tło ${name}`} onClick={()=>v.background({color,color2})} style={{background:`linear-gradient(120deg,${color},${color2})`}}><span>{name}</span></button>)}</div><Color label="Kolor początkowy" value={b.color} onChange={color=>v.background({color})}/><Color label="Kolor końcowy" value={b.color2} onChange={color2=>v.background({color2})}/><Range label="Kąt gradientu" value={b.angle} max={360} suffix="°" onChange={angle=>v.background({angle})}/><label className="visual-check"><input type="checkbox" checked={b.animate} onChange={e=>v.background({animate:e.target.checked})}/>Delikatny ruch gradientu</label></>}
   {b.type==='color'&&<Color label="Kolor tła" value={b.color} onChange={color=>v.background({color})}/>}
   {b.type==='image'&&<><button type="button" className="secondary full" onClick={()=>bgInput.current.click()}><ImagePlus size={16}/>{b.assetId?'Zmień obraz / GIF tła':'Wgraj obraz / GIF tła'}</button>{b.assetId&&<><div className="visual-asset-summary"><img src={mediaAsset(b.assetId)?.thumbnail} alt="Podgląd tła"/><span>{mediaAsset(b.assetId)?.type==='gif'?'Animowane tło GIF':'Własne tło'}<small>{mediaAsset(b.assetId)?.width} × {mediaAsset(b.assetId)?.height}</small></span><button className="icon-btn" aria-label="Usuń obraz tła" onClick={v.removeBackground}><Trash2 size={16}/></button></div><label className="visual-field">Dopasowanie tła<select value={b.fit} onChange={e=>v.background({fit:e.target.value})}><option value="cover">Wypełnij · przytnij krawędzie</option><option value="contain">Pokaż cały obraz</option></select></label><Range label="Widoczność tła" value={Math.round(b.opacity*100)} onChange={n=>v.background({opacity:n/100})}/>{mediaAsset(b.assetId)?.type==='gif'&&<Range label="Tempo GIF-a w tle" value={b.speed} min={.25} max={2} step={.25} suffix="×" onChange={speed=>v.background({speed})}/>}</>}</>}
   <input ref={bgInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Plik tła" onChange={e=>{v.upload(e.target.files?.[0],'background');e.target.value='';}}/>
   <label className="visual-field">Wzór w tle<select value={b.pattern} onChange={e=>v.background({pattern:e.target.value})}><option value="none">Bez wzoru</option><option value="grid">Delikatna siatka</option><option value="dots">Drobne punkty</option></select></label>
   <Range label="Osłona pod tekst i wykres" value={Math.round(b.veil*100)} max={90} onChange={n=>v.background({veil:n/100})}/><p className="visual-hint">Osłona przyciemnia tło w ciemnym motywie, a rozjaśnia w jasnym. Kolor tekstu zmienisz motywem rolki.</p>
   <div className="visual-section-title"><h3>Obrazki i GIF-y</h3><span>{v.visuals.stickers.length}/3</span></div>
   {v.visuals.stickers.map((s,i)=>{const asset=mediaAsset(s.assetId);return <details className="sticker-editor" key={s.id} open={v.visuals.stickers.length===1?true:undefined}><summary><img src={asset?.thumbnail} alt=""/><span>{s.name}<small>{asset?.type==='gif'?'Animowany GIF':'Obraz'} · {s.visible?'widoczny':'ukryty'}</small></span></summary><div className="sticker-body">
    <div className="sticker-actions"><label className="visual-check"><input type="checkbox" checked={s.visible} onChange={e=>v.sticker(s.id,{visible:e.target.checked})}/>Pokaż dodatek</label><button type="button" className="icon-btn" aria-label={`Usuń dodatek ${i+1}`} onClick={()=>v.remove(s.id)}><Trash2 size={16}/></button></div>
    <div className="sticker-positions" role="group" aria-label={`Pozycja dodatku ${i+1}`}>{[['Lewy górny',16,10],['Środek u góry',50,10],['Prawy górny',84,10]].map(([name,x,y])=><button type="button" key={name} onClick={()=>v.sticker(s.id,{x,y})}>{name}</button>)}</div>
    <Range label={`Poziomo · dodatek ${i+1}`} value={s.x} onChange={x=>v.sticker(s.id,{x})}/><Range label={`Pionowo · dodatek ${i+1}`} value={s.y} onChange={y=>v.sticker(s.id,{y})}/><Range label={`Rozmiar · dodatek ${i+1}`} value={s.size} min={5} max={100} onChange={size=>v.sticker(s.id,{size})}/><Range label={`Obrót · dodatek ${i+1}`} value={s.rotation} min={-180} max={180} suffix="°" onChange={rotation=>v.sticker(s.id,{rotation})}/><Range label={`Widoczność · dodatek ${i+1}`} value={Math.round(s.opacity*100)} onChange={n=>v.sticker(s.id,{opacity:n/100})}/>
    <label className="visual-field">Ruch dodatku<select aria-label={`Ruch dodatku ${i+1}`} value={s.motion} onChange={e=>v.sticker(s.id,{motion:e.target.value})}><option value="none">Bez dodatkowego ruchu</option><option value="float">Lekkie unoszenie</option><option value="pulse">Pulsowanie</option><option value="enter">Łagodne pojawienie</option></select></label>
    {asset?.type==='gif'&&<Range label={`Tempo GIF-a · dodatek ${i+1}`} value={s.speed} min={.25} max={2} step={.25} suffix="×" onChange={speed=>v.sticker(s.id,{speed})}/>}
    <label className="visual-field">Warstwa<select aria-label={`Warstwa dodatku ${i+1}`} value={s.layer} onChange={e=>v.sticker(s.id,{layer:e.target.value})}><option value="front">Nad wykresem</option><option value="behind">Pod tekstem i wykresem</option></select></label><label className="visual-check"><input type="checkbox" checked={s.shadow} onChange={e=>v.sticker(s.id,{shadow:e.target.checked})}/>Cień pod dodatkiem</label>
    <div className="sticker-order"><button type="button" className="text-btn" disabled={i===0} onClick={()=>v.reorder(s.id,-1)}><ChevronUp size={14}/>Niżej</button><button type="button" className="text-btn" disabled={i===v.visuals.stickers.length-1} onClick={()=>v.reorder(s.id,1)}><ChevronDown size={14}/>Wyżej</button></div>
   </div></details>;})}
   <button type="button" className="secondary full" disabled={v.visuals.stickers.length>=3} onClick={()=>stickerInput.current.click()}><ImagePlus size={16}/>Dodaj obrazek lub GIF</button><input ref={stickerInput} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif" aria-label="Plik dodatku" onChange={e=>{v.upload(e.target.files?.[0],'sticker');e.target.value='';}}/>
   <p className="visual-hint">PNG, JPG, WebP lub GIF do 12 MB. Do 3 dodatków. GIF-y odtwarzają się w pętli razem z rolką; PNG zachowuje jedną klatkę. Podpis i źródła mają chroniony obszar.</p>
   <button type="button" className="text-btn visual-reset" onClick={v.reset}><RotateCcw size={14}/>Przywróć proste tło i usuń dodatki</button>
  </fieldset>
  {v.busy&&<p role="status" className="helper">Przygotowywanie klatek obrazu…</p>}{v.error&&<p role="alert" className="error">{v.error}</p>}<p className="visual-storage" role="status">{v.storage}</p>
 </div></details></>;
}
