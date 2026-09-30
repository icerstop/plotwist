import {reelCapabilities,reelElementDefinitions} from './reel-capabilities.js';
import OverlayControls from './OverlayControls.jsx';
import {overlayKinds,overlayLimit,overlayName} from './reel-overlays.js';
import CopyEditor from './CopyEditor.jsx';
import {reelCopyFields} from './reel-copy.js';
import MotionEditor from './MotionEditor.jsx';
import FontWeightPicker from './FontWeightPicker.jsx';
import {ChartEditor,TextEffects} from './AppearanceControls.jsx';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {MousePointer2,RotateCcw,Undo2,Check,Trash2,Copy,Plus,Eye,EyeOff} from 'lucide-react';
import {useVisualStatus,StyleEditor,LayoutEditor,MediaEditor,StickerControls,Range,Color} from './VisualSettings.jsx';
import {FontPicker} from './FontPicker.jsx';
import {themeOf,textRoles,normalizeDesign} from './reel-design.js';
import {reelElements,hitElement,canvasViewport,identityElement} from './reel-elements.js';
import {alignmentTargets,elementBounds,movementLimits,snapTranslation} from './reel-snapping.js';
import {useLanguages} from './language-context.js';
import {translate} from './translations.js';
import './reel-editor.css';


const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angle=v=>((v+180)%360+360)%360-180;
const snapshot=(v,files={})=>({copy:structuredClone(v.copy||{}),copyHidden:{...v.copyHidden},hidden:{...v.hidden},overlays:structuredClone(v.overlays||[]),design:structuredClone(v.design),stickers:structuredClone(v.stickers),files:Object.fromEntries(v.stickers.filter(s=>files[s.assetId]).map(s=>[s.assetId,files[s.assetId]]))});
const snapPreference='plotwist-editor-snapping-v1';
const emptyGuides={active:false,guides:[]};

function AlignmentGuides({guides,width,height,scale,language}){
 const unit=scale||1;
 return <g className="reel-alignment-guides" aria-hidden="true">
  <g className="reel-center-guides"><line x1={width/2} y1="0" x2={width/2} y2={height}/><line x1="0" y1={height/2} x2={width} y2={height/2}/></g>
  {guides.map(g=>{
   const label=g.kind==='center'?(language==='en'?'Centre':'Środek'):g.kind==='edge'?(language==='en'?'Edge':'Krawędź'):g.kind==='quarter'?`${g.fraction*100}%`:(language==='en'?'Aligned':'Wyrównanie');
   const boxWidth=(label.length*6+16)/unit,boxHeight=20/unit;
   const x=g.axis==='x'?clamp(g.value+8/unit,4/unit,width-boxWidth-4/unit):width-boxWidth-8/unit;
   const y=g.axis==='x'?8/unit:clamp(g.value-24/unit,4/unit,height-boxHeight-4/unit);
   return <g key={g.axis} className="reel-snap-guide" data-axis={g.axis} data-kind={g.kind}>
    <line x1={g.axis==='x'?g.value:0} y1={g.axis==='y'?g.value:0} x2={g.axis==='x'?g.value:width} y2={g.axis==='y'?g.value:height}/>
    <rect x={x} y={y} width={boxWidth} height={boxHeight} rx={4/unit}/>
    <text translate="no" x={x+boxWidth/2} y={y+boxHeight/2} fontSize={11/unit}>{label}</text>
   </g>;
  })}
 </g>;
}

export function ReelEditor({canvas,config,enabled,setEnabled,revision,onPause,valid,fontControls,playhead=1,onReplay,onSeek}){
 const capabilities=reelCapabilities(config),names=Object.fromEntries(capabilities.elements.map(e=>[e.id,e.name]));
 const v=useVisualStatus(),{uiLanguage,reelLanguage}=useLanguages(),svg=useRef(),gesture=useRef(),history=useRef([]);
 const [selected,setSelected]=useState('title'),[panel,setPanel]=useState('style'),[regions,setRegions]=useState([]),[viewport,setViewport]=useState(null),[undoCount,setUndoCount]=useState(0),[chartRole,setChartRole]=useState('labels');
 const [motionTarget,setMotionTarget]=useState('title'),[copyFields,setCopyFields]=useState([]),[textFocus,setTextFocus]=useState(0);
 const [snapping,setSnapping]=useState(()=>{try{return localStorage.getItem(snapPreference)!=='off';}catch{return true;}}),[alignment,setAlignment]=useState(emptyGuides);
 useEffect(()=>{if(!enabled||!valid){gesture.current=null;setAlignment(emptyGuides);}},[enabled,valid]);
 useEffect(()=>{if(selected?.startsWith('sticker:')&&!v.visuals.stickers.some(s=>`sticker:${s.id}`===selected))setSelected(null);},[selected,v.visuals.stickers]);
 useLayoutEffect(()=>{if(enabled&&valid){setRegions(reelElements(canvas.current));setCopyFields(reelCopyFields(canvas.current));}},[config,revision,enabled,valid,canvas]);
 useEffect(()=>{
  const el=canvas.current;if(!el)return;
  const update=()=>{const box=el.getBoundingClientRect(),parent=el.parentElement.getBoundingClientRect(),r=canvasViewport(box,el.width,el.height);setViewport({...r,left:r.left-parent.left,top:r.top-parent.top});};
  const observer=new ResizeObserver(update);observer.observe(el);update();return()=>observer.disconnect();
 },[canvas,config.format,enabled]);
 useEffect(()=>{if(selected?.startsWith('overlay:')&&!v.visuals.overlays.some(o=>`overlay:${o.id}`===selected))setSelected(null);},[selected,v.visuals.overlays]);
 useEffect(()=>{if(selected&&!selected.includes(':')&&!names[selected])setSelected('content');},[selected,Object.keys(names).join(',')]);
 const overlay=v.visuals.overlays.find(o=>`overlay:${o.id}`===selected),hidden=!!v.visuals.hidden[selected];
 const region=regions.find(r=>r.id===selected),sticker=v.visuals.stickers.find(s=>`sticker:${s.id}`===selected);
 const groupRoles=reelElementDefinitions[selected]?.textRoles,baseRole=groupRoles?(groupRoles.includes(chartRole)?chartRole:groupRoles[0]):selected==='content'?chartRole:textRoles.some(r=>r.id===selected)?selected:null,role=groupRoles?`${selected}:${baseRole}`:baseRole,t=role?(v.visuals.design.text[role]||v.visuals.design.text[baseRole]):null;
 const transform=overlay?{rotation:overlay.rotation,scale:overlay.scale}:sticker?{rotation:sticker.rotation,scale:sticker.size}:v.visuals.design.elements[selected]||identityElement();
 const label=r=>r?.id?.startsWith('overlay:')?overlayName(v.visuals.overlays.find(o=>`overlay:${o.id}`===r.id)||{},reelLanguage):r?.stickerId?v.visuals.stickers.find(s=>s.id===r.stickerId)?.name||'Obrazek / GIF':names[r?.id]||'';
 function remember(){const s=snapshot(v.visuals,v.mediaFiles);if(JSON.stringify(history.current.at(-1))!==JSON.stringify(s)){history.current.push(s);if(history.current.length>40)history.current.shift();}setUndoCount(history.current.length);}
 function undo(){if(v.busy)return;clearGesture();const current=JSON.stringify(snapshot(v.visuals,v.mediaFiles));let previous=history.current.pop();while(previous&&JSON.stringify(previous)===current)previous=history.current.pop();if(previous)v.restoreComposition(previous);setUndoCount(history.current.length);}
 function changeTransform(patch){if(overlay)v.overlay(overlay.id,patch);else if(sticker)v.sticker(sticker.id,{...(patch.scale!==undefined?{size:patch.scale}:{}),...(patch.rotation!==undefined?{rotation:patch.rotation}:{})});else v.element(selected,patch);}
 function selectElement(id){setChartRole(reelElementDefinitions[id]?.textRole||'labels');setSelected(id||null);setPanel('elements');onPause();setEnabled(true);}
 function addElement(kind){remember();const id=v.addOverlay(kind);if(id){selectElement(`overlay:${id}`);setTextFocus(n=>n+1);}}
 function removeElement(){if(!selected)return;remember();clearGesture();if(overlay){v.removeOverlay(overlay.id);setSelected(null);}else if(sticker){v.remove(sticker.id);setSelected(null);}else v.hide(selected,true);}
 const layers=[...Object.entries(names).map(([id,name])=>({id,name,visible:!v.visuals.hidden[id]})),...v.visuals.stickers.map(s=>({id:`sticker:${s.id}`,name:s.name,visible:s.visible,sticker:s})),...v.visuals.overlays.map(o=>({id:`overlay:${o.id}`,name:overlayName(o,reelLanguage),visible:o.visible,overlay:o}))];
 function toggleLayer(row){remember();if(row.overlay)v.overlay(row.overlay.id,{visible:!row.visible});else if(row.sticker)v.sticker(row.sticker.id,{visible:!row.visible});else v.hide(row.id,row.visible);}
 const panels=[['style','Styl'],['layout','Układ'],['chart','Wykres'],['motion','Animacje'],['media','Tło i GIF-y'],['elements','Elementy']];
 function navigateTabs(e,index){const n=e.key==='ArrowRight'?(index+1)%panels.length:e.key==='ArrowLeft'?(index+panels.length-1)%panels.length:e.key==='Home'?0:e.key==='End'?panels.length-1:null;if(n===null)return;e.preventDefault();setPanel(panels[n][0]);e.currentTarget.parentElement.children[n].focus();if(panels[n][0]==='motion')setEnabled(false);if(panels[n][0]==='elements'){onPause();setEnabled(true);}}
 function point(e){const box=svg.current.getBoundingClientRect();return {x:(e.clientX-box.left)/box.width*canvas.current.width,y:(e.clientY-box.top)/box.height*canvas.current.height};}
 function start(e,kind='move'){
  if(e.button!==0)return;const p=point(e),hit=kind==='move'?hitElement(regions,p):region;
  if(!hit){setSelected(null);return;}e.preventDefault();onPause();setSelected(hit.id);setChartRole(reelElementDefinitions[hit.id]?.textRole||'labels');setPanel('elements');remember();
  const s=hit.stickerId?v.visuals.stickers.find(s=>s.id===hit.stickerId):null,o=v.visuals.overlays.find(o=>`overlay:${o.id}`===hit.id);
  gesture.current={id:hit.id,kind,start:p,center:hit.center,sticker:s,overlay:o,original:o?{...o}:s?{...s}:{...v.visuals.design.elements[hit.id]},before:snapshot(v.visuals,v.mediaFiles),distance:Math.hypot(p.x-hit.center.x,p.y-hit.center.y),angle:Math.atan2(p.y-hit.center.y,p.x-hit.center.x),pointerId:e.pointerId,pointer:{clientX:e.clientX,clientY:e.clientY},bounds:elementBounds(hit),targets:alignmentTargets(regions,hit.id,canvas.current.width,canvas.current.height),locks:{}};
  setAlignment({active:kind==='move'&&snapping&&!e.altKey,guides:[]});
  svg.current.setPointerCapture(e.pointerId);svg.current.focus();
 }
 function move(e){
  const g=gesture.current;if(!g)return;const p=point(e),o=g.original,w=canvas.current.width,h=canvas.current.height;let patch;
  if(g.kind==='rotate')patch={rotation:angle(o.rotation+(Math.atan2(p.y-g.center.y,p.x-g.center.x)-g.angle)*180/Math.PI)};
  else if(g.kind==='scale'){const scale=(g.sticker?o.size:o.scale)*Math.hypot(p.x-g.center.x,p.y-g.center.y)/Math.max(1,g.distance);patch=g.sticker?{size:clamp(scale,5,100)}:{scale:clamp(scale,25,200)};}
  else {
   const moveHeight=g.sticker?h-(config.ai?260:195):h,limits=movementLimits(o,w,moveHeight,!!(g.sticker||g.overlay));
   const raw={x:p.x-g.start.x,y:p.y-g.start.y},active=snapping&&!e.altKey;
   const result=active?snapTranslation({bounds:g.bounds,delta:raw,targets:g.targets,scale:svg.current.getBoundingClientRect().width/w,previous:g.locks,limits}):{delta:{x:clamp(raw.x,...limits.x),y:clamp(raw.y,...limits.y)},guides:[],locks:{}};
   g.locks=result.locks;g.pointer={clientX:e.clientX,clientY:e.clientY};setAlignment({active,guides:result.guides});
   patch={x:o.x+result.delta.x/w*100,y:o.y+result.delta.y/moveHeight*100};
  }
  if(g.overlay)v.overlay(g.overlay.id,patch);else if(g.sticker)v.sticker(g.sticker.id,patch);else v.element(g.id,patch);
 }
 function clearGesture(){const g=gesture.current;gesture.current=null;setAlignment(emptyGuides);if(g&&svg.current?.hasPointerCapture(g.pointerId))svg.current.releasePointerCapture(g.pointerId);}
 function finish(e,cancel=false){const g=gesture.current;if(!g)return;if(cancel)v.restoreComposition(g.before);clearGesture();}
 function altKey(e){if(e.key!=='Alt'||gesture.current?.kind!=='move')return false;e.preventDefault();move({...gesture.current.pointer,altKey:e.type==='keydown'});return true;}
 function keys(e){
  if(altKey(e))return;
  if(e.key==='Escape'){if(gesture.current)v.restoreComposition(gesture.current.before);clearGesture();setSelected(null);e.preventDefault();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo();return;}
  if(['Delete','Backspace'].includes(e.key)&&selected){e.preventDefault();removeElement();return;}
  if(e.key==='Enter'){e.preventDefault();setTextFocus(n=>n+1);return;}
  if(!region||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();remember();const step=e.shiftKey?10:1,dx=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0,dy=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;
  const o=overlay||sticker||v.visuals.design.elements[selected];const patch={x:clamp(o.x+dx/canvas.current.width*100,sticker||overlay?0:-100,100),y:clamp(o.y+dy/(canvas.current.height-(sticker?(config.ai?260:195):0))*100,sticker||overlay?0:-100,100)};
  if(overlay)v.overlay(overlay.id,patch);else if(sticker)v.sticker(sticker.id,patch);else v.element(selected,patch);
 }
 const corners=region?.corners,top=corners?{x:(corners[0].x+corners[1].x)/2,y:(corners[0].y+corners[1].y)/2}:null;
 const unit=viewport?.scale||1,handle=top?{x:top.x+(top.x-region.center.x)/Math.max(1,Math.hypot(top.x-region.center.x,top.y-region.center.y))*26/unit,y:top.y+(top.y-region.center.y)/Math.max(1,Math.hypot(top.x-region.center.x,top.y-region.center.y))*26/unit}:null;
 const color=t?.color||(['labels','subtitle','source'].includes(baseRole)?themeOf(config).muted:themeOf(config).fg);
 return <>
  {enabled&&valid&&viewport&&canvas.current&&createPortal(<svg ref={svg} className="reel-edit-overlay" style={{left:viewport.left,top:viewport.top,width:viewport.width,height:viewport.height}} viewBox={`0 0 ${canvas.current.width} ${canvas.current.height}`} tabIndex="0" role="application" aria-label="Edytor elementów rolki" onPointerDown={start} onPointerMove={move} onPointerUp={finish} onPointerCancel={e=>finish(e,true)} onLostPointerCapture={e=>finish(e,true)} onKeyDown={keys} onKeyUp={altKey} onDoubleClick={e=>{const hit=hitElement(regions,point(e));if(hit){selectElement(hit.id);setTextFocus(n=>n+1);}}}>
   {regions.map(r=><polygon key={r.id} className="reel-hit-region" points={r.corners.map(p=>`${p.x},${p.y}`).join(' ')}><title>{translate(label(r),uiLanguage)}</title></polygon>)}
   {alignment.active&&<AlignmentGuides guides={alignment.guides} width={canvas.current.width} height={canvas.current.height} scale={unit} language={uiLanguage}/>}
   {region&&<g className="reel-selection"><polygon points={corners.map(p=>`${p.x},${p.y}`).join(' ')}/><line x1={top.x} y1={top.y} x2={handle.x} y2={handle.y}/><circle className="reel-rotate-handle" data-handle="rotate" cx={handle.x} cy={handle.y} r={7/unit} onPointerDown={e=>{e.stopPropagation();start(e,'rotate');}}><title>Obróć element</title></circle><rect className="reel-scale-handle" data-handle="scale" x={corners[2].x-6/unit} y={corners[2].y-6/unit} width={12/unit} height={12/unit} onPointerDown={e=>{e.stopPropagation();start(e,'scale');}}><title>Zmień rozmiar elementu</title></rect></g>}
  </svg>,canvas.current.parentElement)}
  <section className="reel-edit-controls reel-appearance" aria-label="Wygląd rolki">
   <header className="reel-appearance-heading"><h2>Wygląd rolki</h2><p>Wspólny styl zostaje przy zmianie danych.</p></header>
   <div className="reel-edit-toolbar"><button type="button" className={`secondary ${enabled?'is-editing':''}`} aria-pressed={enabled} disabled={!valid} onClick={()=>{onPause();setEnabled(!enabled);if(!enabled)setPanel('elements');}}>{enabled?<Check size={15}/>:<MousePointer2 size={15}/>}<span>{enabled?'Zakończ edycję':'Edytuj na podglądzie'}</span></button>{(enabled||undoCount>0)&&<button type="button" className="icon-btn" aria-label="Cofnij zmianę elementu" disabled={!undoCount} onClick={undo}><Undo2 size={18}/></button>}</div>
   <div className="reel-appearance-tabs" role="tablist" aria-label="Ustawienia wyglądu">{panels.map(([id,name],i)=><button key={id} type="button" role="tab" id={`appearance-tab-${id}`} aria-selected={panel===id} aria-controls={`appearance-panel-${id}`} tabIndex={panel===id?0:-1} onKeyDown={e=>navigateTabs(e,i)} onClick={()=>{setPanel(id);if(id==='motion')setEnabled(false);if(id==='elements'){onPause();setEnabled(true);}}}>{name}</button>)}</div>
   <div className="reel-appearance-content" role="tabpanel" id={`appearance-panel-${panel}`} aria-labelledby={`appearance-tab-${panel}`}>
    {panel==='style'&&<StyleEditor config={config} fontId={config.fontId}>{fontControls}</StyleEditor>}
    {panel==='layout'&&<LayoutEditor config={config}/>}
    {panel==='chart'&&<ChartEditor config={config}/>}
    {panel==='motion'&&<MotionEditor config={config} playhead={playhead} onSeek={onSeek} onReplay={onReplay} target={motionTarget} setTarget={setMotionTarget} beforeChange={remember}/>}
    {panel==='media'&&<MediaEditor onSelect={selectElement}/>}
    {panel==='elements'&&<fieldset className="reel-inspector" disabled={!v.ready||v.busy}>
    <section className="reel-add-elements"><h3>Dodaj element</h3><div>{overlayKinds.map(([kind,name])=><button type="button" className="secondary" key={kind} disabled={v.visuals.overlays.length>=overlayLimit} onClick={()=>addElement(kind)}><Plus size={15}/>{name}</button>)}<button type="button" className="secondary" onClick={()=>setPanel('media')}><Plus size={15}/>Obrazek / GIF</button></div><p>{v.visuals.overlays.length}/{overlayLimit} <span>własnych elementów</span></p></section>
    <details className="reel-layers" open><summary>Elementy na rolce</summary><div>{layers.map(row=><div key={row.id} className={row.id===selected?'selected':''}><button type="button" className="layer-name" onClick={()=>selectElement(row.id)}><span translate={row.overlay||row.sticker?'no':undefined}>{row.name}</span>{!row.visible&&<small>Ukryty</small>}</button><button type="button" className="icon-btn" aria-label={`${translate(row.visible?'Ukryj':'Pokaż',uiLanguage)}: ${row.overlay||row.sticker?row.name:translate(row.name,uiLanguage)}`} onClick={()=>toggleLayer(row)}>{row.visible?<Eye size={17}/>:<EyeOff size={17}/>}</button></div>)}</div></details>
    <label className="reel-snap-toggle"><input type="checkbox" checked={snapping} onChange={e=>{const checked=e.target.checked;setSnapping(checked);setAlignment(emptyGuides);try{localStorage.setItem(snapPreference,checked?'on':'off');}catch{}}}/><span>Przyciąganie i prowadnice</span></label>
    <p>Środek, krawędzie, ¼ i ¾ rolki oraz wyrównanie do innych elementów. Przytrzymaj Alt, aby przesuwać swobodnie.</p>
    <label>Wybrany element<select aria-label="Wybrany element" value={selected||''} onChange={e=>selectElement(e.target.value)}><option value="">Kliknij element na rolce</option>{Object.entries(names).map(([id,name])=><option key={id} value={id}>{name}</option>)}{v.visuals.stickers.map(s=><option key={s.id} value={`sticker:${s.id}`}>{s.name}</option>)}{v.visuals.overlays.map(o=><option key={o.id} value={`overlay:${o.id}`}>{overlayName(o,reelLanguage)}</option>)}</select></label>
    {selected&&<div className="reel-element-actions">{hidden?<button type="button" className="secondary" onClick={()=>{remember();v.hide(selected,false);}}><Eye size={16}/>Przywróć na rolkę</button>:<button type="button" className="secondary remove-element" onClick={removeElement}><Trash2 size={16}/>Usuń element</button>}{overlay&&<button type="button" className="secondary" disabled={v.visuals.overlays.length>=overlayLimit} onClick={()=>{remember();const id=v.duplicateOverlay(overlay.id);if(id)selectElement(`overlay:${id}`);}}><Copy size={16}/>Duplikuj</button>}</div>}
    {hidden&&<p>Element jest usunięty z podglądu i eksportu. Możesz go przywrócić bez utraty tekstu i ustawień.</p>}
    {selected&&selected!=='source'&&<button type="button" className="secondary full" onClick={()=>{setMotionTarget(selected);setPanel('motion');setEnabled(false);}}>Ustaw animację tego elementu</button>}
    {overlay?<OverlayControls item={overlay} config={config} beforeChange={remember} focusRequest={textFocus}/>:selected&&!sticker?<>
     <CopyEditor fields={copyFields.filter(f=>f.element===selected||selected==='content'&&reelElementDefinitions[f.element]?.textRole)} beforeChange={remember} focusRequest={textFocus}/>
     {(selected==='content'||groupRoles?.length>1)&&<label>Tekst wykresu<select aria-label="Tekst wykresu" value={chartRole} onChange={e=>setChartRole(e.target.value)}><option value="labels">Etykiety i osie</option><option value="values">Wartości liczbowe</option></select></label>}
     {t&&<><FontPicker label="Czcionka elementu" value={t.fontId||''} inheritFontId={config.fontId} onChange={fontId=>{remember();v.textStyle(role,{fontId:fontId||null});}}/><FontWeightPicker label="Grubość czcionki elementu" fontId={t.fontId||config.fontId} value={t.weight} element onChange={weight=>{remember();v.textStyle(role,{weight});}}/><div onFocusCapture={remember} onPointerDownCapture={remember}><Range label="Rozmiar tekstu" value={t.size} min={textRoles.find(r=>r.id===baseRole).min} max={textRoles.find(r=>r.id===baseRole).max} onChange={size=>v.textStyle(role,{size})}/><Color label="Kolor elementu" value={color} onChange={color=>v.textStyle(role,{color})}/></div><button type="button" className="text-btn" onClick={()=>{remember();v.textStyle(role,groupRoles?null:normalizeDesign().text[role]);}}>Przywróć styl tego tekstu</button>{!['labels','values'].includes(baseRole)&&<TextEffects role={role} config={config} beforeChange={remember}/>}<p>100% to rozmiar wyjściowy. Długie teksty dopasowują się do dostępnego miejsca.</p></>}
     <div className="reel-inspector-pair"><label>Skala elementu<input aria-label="Skala elementu" type="number" min={sticker?5:25} max={sticker?100:200} step="1" value={Math.round(transform.scale)} onFocus={remember} onChange={e=>changeTransform({scale:clamp(Number(e.target.value),sticker?5:25,sticker?100:200)})}/></label><label>Obrót elementu<input aria-label="Obrót elementu" type="number" min="-180" max="180" step="1" value={Math.round(transform.rotation)} onFocus={remember} onChange={e=>changeTransform({rotation:clamp(Number(e.target.value),-180,180)})}/></label></div>
     <button type="button" className="text-btn" onClick={()=>{remember();for(const f of copyFields.filter(f=>f.element===selected||selected==='content'&&reelElementDefinitions[f.element]?.textRole)){v.copy(f.key,null);v.hideCopy(f.visibilityKey,false);}if(sticker)v.sticker(sticker.id,{x:83,y:10,size:18,rotation:0});else{v.element(selected,identityElement());if(role)v.textStyle(role,groupRoles?null:normalizeDesign().text[role]);if(selected==='metric'&&config.commonMetric)v.metricLabel(config.commonMetric.key,reelLanguage,'');}}}><RotateCcw size={14}/>Przywróć wybrany element</button>
    </>:sticker?<StickerControls sticker={sticker} index={v.visuals.stickers.indexOf(sticker)} beforeChange={remember}/>:null}
    <p>Kliknij dwukrotnie lub naciśnij Enter, aby edytować tekst. Przeciągnij, aby przesunąć. Kółko obraca, narożnik skaluje. Strzałki: 1 px, Shift: 10 px. Delete: usuń. Ctrl/Cmd+Z: cofnij. Esc: odznacz.</p>
   </fieldset>}
   </div>
  </section>
 </>;
}
