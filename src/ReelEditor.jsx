import CopyEditor from './CopyEditor.jsx';
import {reelCopyFields} from './reel-copy.js';
import MotionEditor from './MotionEditor.jsx';
import FontWeightPicker from './FontWeightPicker.jsx';
import {ChartEditor,TextEffects} from './AppearanceControls.jsx';
import React,{useEffect,useLayoutEffect,useRef,useState} from 'react';
import {createPortal} from 'react-dom';
import {MousePointer2,RotateCcw,Undo2,Check} from 'lucide-react';
import {useVisualStatus,StyleEditor,LayoutEditor,MediaEditor,StickerControls,Range,Color} from './VisualSettings.jsx';
import {FontPicker} from './FontPicker.jsx';
import {themeOf,textRoles,normalizeDesign} from './reel-design.js';
import {reelElements,hitElement,canvasViewport,identityElement} from './reel-elements.js';
import {alignmentTargets,elementBounds,movementLimits,snapTranslation} from './reel-snapping.js';
import {useLanguages} from './language-context.js';
import {translate} from './translations.js';
import './reel-editor.css';

const names={mark:'Logo rolki',title:'Tytuł',subtitle:'Opis pod tytułem',metric:'Wspólny wskaźnik',content:'Wykres i legenda',date:'Data / rok',source:'Źródła i metodologia',signature:'Podpis autora'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angle=v=>((v+180)%360+360)%360-180;
const snapshot=v=>({copy:structuredClone(v.copy||{}),design:structuredClone(v.design),stickers:structuredClone(v.stickers)});
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
 const region=regions.find(r=>r.id===selected),sticker=v.visuals.stickers.find(s=>`sticker:${s.id}`===selected);
 const role=selected==='content'?chartRole:textRoles.some(r=>r.id===selected)?selected:null,t=role?v.visuals.design.text[role]:null;
 const transform=sticker?{rotation:sticker.rotation,scale:sticker.size}:v.visuals.design.elements[selected]||identityElement();
 const label=r=>r?.stickerId?v.visuals.stickers.find(s=>s.id===r.stickerId)?.name||'Obrazek / GIF':names[r?.id]||'';
 function remember(){const s=snapshot(v.visuals);if(JSON.stringify(history.current.at(-1))!==JSON.stringify(s)){history.current.push(s);if(history.current.length>40)history.current.shift();}setUndoCount(history.current.length);}
 function undo(){clearGesture();const previous=history.current.pop();if(previous)v.restoreComposition(previous);setUndoCount(history.current.length);}
 function changeTransform(patch){if(sticker)v.sticker(sticker.id,{...(patch.scale!==undefined?{size:patch.scale}:{}),...(patch.rotation!==undefined?{rotation:patch.rotation}:{})});else v.element(selected,patch);}
 function selectElement(id){setSelected(id||null);setPanel('elements');onPause();setEnabled(true);}
 const panels=[['style','Styl'],['layout','Układ'],['chart','Wykres'],['motion','Animacje'],['media','Tło i GIF-y'],['elements','Elementy']];
 function navigateTabs(e,index){const n=e.key==='ArrowRight'?(index+1)%panels.length:e.key==='ArrowLeft'?(index+panels.length-1)%panels.length:e.key==='Home'?0:e.key==='End'?panels.length-1:null;if(n===null)return;e.preventDefault();setPanel(panels[n][0]);e.currentTarget.parentElement.children[n].focus();if(panels[n][0]==='motion')setEnabled(false);if(panels[n][0]==='elements'){onPause();setEnabled(true);}}
 function point(e){const box=svg.current.getBoundingClientRect();return {x:(e.clientX-box.left)/box.width*canvas.current.width,y:(e.clientY-box.top)/box.height*canvas.current.height};}
 function start(e,kind='move'){
  if(e.button!==0)return;const p=point(e),hit=kind==='move'?hitElement(regions,p):region;
  if(!hit){setSelected(null);return;}e.preventDefault();onPause();setSelected(hit.id);setPanel('elements');remember();
  const s=hit.stickerId?v.visuals.stickers.find(s=>s.id===hit.stickerId):null;
  gesture.current={id:hit.id,kind,start:p,center:hit.center,sticker:s,original:s?{...s}:{...v.visuals.design.elements[hit.id]},before:snapshot(v.visuals),distance:Math.hypot(p.x-hit.center.x,p.y-hit.center.y),angle:Math.atan2(p.y-hit.center.y,p.x-hit.center.x),pointerId:e.pointerId,pointer:{clientX:e.clientX,clientY:e.clientY},bounds:elementBounds(hit),targets:alignmentTargets(regions,hit.id,canvas.current.width,canvas.current.height),locks:{}};
  setAlignment({active:kind==='move'&&snapping&&!e.altKey,guides:[]});
  svg.current.setPointerCapture(e.pointerId);svg.current.focus();
 }
 function move(e){
  const g=gesture.current;if(!g)return;const p=point(e),o=g.original,w=canvas.current.width,h=canvas.current.height;let patch;
  if(g.kind==='rotate')patch={rotation:angle(o.rotation+(Math.atan2(p.y-g.center.y,p.x-g.center.x)-g.angle)*180/Math.PI)};
  else if(g.kind==='scale'){const scale=(g.sticker?o.size:o.scale)*Math.hypot(p.x-g.center.x,p.y-g.center.y)/Math.max(1,g.distance);patch=g.sticker?{size:clamp(scale,5,100)}:{scale:clamp(scale,25,200)};}
  else {
   const moveHeight=g.sticker?h-(config.ai?260:195):h,limits=movementLimits(o,w,moveHeight,!!g.sticker);
   const raw={x:p.x-g.start.x,y:p.y-g.start.y},active=snapping&&!e.altKey;
   const result=active?snapTranslation({bounds:g.bounds,delta:raw,targets:g.targets,scale:svg.current.getBoundingClientRect().width/w,previous:g.locks,limits}):{delta:{x:clamp(raw.x,...limits.x),y:clamp(raw.y,...limits.y)},guides:[],locks:{}};
   g.locks=result.locks;g.pointer={clientX:e.clientX,clientY:e.clientY};setAlignment({active,guides:result.guides});
   patch={x:o.x+result.delta.x/w*100,y:o.y+result.delta.y/moveHeight*100};
  }
  if(g.sticker)v.sticker(g.sticker.id,patch);else v.element(g.id,patch);
 }
 function clearGesture(){const g=gesture.current;gesture.current=null;setAlignment(emptyGuides);if(g&&svg.current?.hasPointerCapture(g.pointerId))svg.current.releasePointerCapture(g.pointerId);}
 function finish(e,cancel=false){const g=gesture.current;if(!g)return;if(cancel)v.restoreComposition(g.before);clearGesture();}
 function altKey(e){if(e.key!=='Alt'||gesture.current?.kind!=='move')return false;e.preventDefault();move({...gesture.current.pointer,altKey:e.type==='keydown'});return true;}
 function keys(e){
  if(altKey(e))return;
  if(e.key==='Escape'){if(gesture.current)v.restoreComposition(gesture.current.before);clearGesture();setSelected(null);e.preventDefault();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo();return;}
  if(e.key==='Enter'){e.preventDefault();setTextFocus(n=>n+1);return;}
  if(!region||!['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key))return;
  e.preventDefault();remember();const step=e.shiftKey?10:1,dx=e.key==='ArrowLeft'?-step:e.key==='ArrowRight'?step:0,dy=e.key==='ArrowUp'?-step:e.key==='ArrowDown'?step:0;
  const o=sticker||v.visuals.design.elements[selected];const patch={x:clamp(o.x+dx/canvas.current.width*100,sticker?0:-100,100),y:clamp(o.y+dy/(canvas.current.height-(sticker?(config.ai?260:195):0))*100,sticker?0:-100,100)};
  if(sticker)v.sticker(sticker.id,patch);else v.element(selected,patch);
 }
 const corners=region?.corners,top=corners?{x:(corners[0].x+corners[1].x)/2,y:(corners[0].y+corners[1].y)/2}:null;
 const unit=viewport?.scale||1,handle=top?{x:top.x+(top.x-region.center.x)/Math.max(1,Math.hypot(top.x-region.center.x,top.y-region.center.y))*26/unit,y:top.y+(top.y-region.center.y)/Math.max(1,Math.hypot(top.x-region.center.x,top.y-region.center.y))*26/unit}:null;
 const color=t?.color||(['labels','subtitle','source'].includes(role)?themeOf(config).muted:themeOf(config).fg);
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
    {panel==='style'&&<StyleEditor fontId={config.fontId}>{fontControls}</StyleEditor>}
    {panel==='layout'&&<LayoutEditor/>}
    {panel==='chart'&&<ChartEditor config={config}/>}
    {panel==='motion'&&<MotionEditor config={config} playhead={playhead} onSeek={onSeek} onReplay={onReplay} target={motionTarget} setTarget={setMotionTarget} beforeChange={remember}/>}
    {panel==='media'&&<MediaEditor onSelect={selectElement}/>}
    {panel==='elements'&&<fieldset className="reel-inspector" disabled={!v.ready||v.busy}>
    <label className="reel-snap-toggle"><input type="checkbox" checked={snapping} onChange={e=>{const checked=e.target.checked;setSnapping(checked);setAlignment(emptyGuides);try{localStorage.setItem(snapPreference,checked?'on':'off');}catch{}}}/><span>Przyciąganie i prowadnice</span></label>
    <p>Środek, krawędzie, ¼ i ¾ rolki oraz wyrównanie do innych elementów. Przytrzymaj Alt, aby przesuwać swobodnie.</p>
    <label>Wybrany element<select aria-label="Wybrany element" value={selected||''} onChange={e=>selectElement(e.target.value)}><option value="">Kliknij element na rolce</option>{Object.entries(names).map(([id,name])=><option key={id} value={id}>{name}</option>)}{v.visuals.stickers.map(s=><option key={s.id} value={`sticker:${s.id}`}>{s.name}</option>)}</select></label>
    {selected&&selected!=='source'&&<button type="button" className="secondary full" onClick={()=>{setMotionTarget(selected);setPanel('motion');setEnabled(false);}}>Ustaw animację tego elementu</button>}
    {selected&&!sticker?<>
     <CopyEditor fields={copyFields.filter(f=>f.element===selected)} beforeChange={remember} focusRequest={textFocus}/>
     {selected==='content'&&<label>Tekst wykresu<select aria-label="Tekst wykresu" value={chartRole} onChange={e=>setChartRole(e.target.value)}><option value="labels">Etykiety i osie</option><option value="values">Wartości liczbowe</option></select></label>}
     {t&&<><FontPicker label="Czcionka elementu" value={t.fontId||''} inheritFontId={config.fontId} onChange={fontId=>{remember();v.textStyle(role,{fontId:fontId||null});}}/><FontWeightPicker label="Grubość czcionki elementu" fontId={t.fontId||config.fontId} value={t.weight} element onChange={weight=>{remember();v.textStyle(role,{weight});}}/><div onFocusCapture={remember} onPointerDownCapture={remember}><Range label="Rozmiar tekstu" value={t.size} min={textRoles.find(r=>r.id===role).min} max={textRoles.find(r=>r.id===role).max} onChange={size=>v.textStyle(role,{size})}/><Color label="Kolor elementu" value={color} onChange={color=>v.textStyle(role,{color})}/></div><button type="button" className="text-btn" onClick={()=>{remember();v.textStyle(role,normalizeDesign().text[role]);}}>Przywróć styl tego tekstu</button>{!['labels','values'].includes(role)&&<TextEffects role={role} config={config} beforeChange={remember}/>}<p>100% to rozmiar wyjściowy. Długie teksty dopasowują się do dostępnego miejsca.</p></>}
     <div className="reel-inspector-pair"><label>Skala elementu<input aria-label="Skala elementu" type="number" min={sticker?5:25} max={sticker?100:200} step="1" value={Math.round(transform.scale)} onFocus={remember} onChange={e=>changeTransform({scale:clamp(Number(e.target.value),sticker?5:25,sticker?100:200)})}/></label><label>Obrót elementu<input aria-label="Obrót elementu" type="number" min="-180" max="180" step="1" value={Math.round(transform.rotation)} onFocus={remember} onChange={e=>changeTransform({rotation:clamp(Number(e.target.value),-180,180)})}/></label></div>
     <button type="button" className="text-btn" onClick={()=>{remember();for(const f of copyFields.filter(f=>f.element===selected))v.copy(f.key,null);if(sticker)v.sticker(sticker.id,{x:83,y:10,size:18,rotation:0});else{v.element(selected,identityElement());if(role)v.textStyle(role,normalizeDesign().text[role]);if(selected==='metric'&&config.commonMetric)v.metricLabel(config.commonMetric.key,reelLanguage,'');}}}><RotateCcw size={14}/>Przywróć wybrany element</button>
    </>:sticker?<StickerControls sticker={sticker} index={v.visuals.stickers.indexOf(sticker)} beforeChange={remember}/>:null}
    <p>Kliknij dwukrotnie lub naciśnij Enter, aby edytować tekst. Przeciągnij, aby przesunąć. Kółko obraca, narożnik skaluje. Strzałki: 1 px, Shift: 10 px. Esc: odznacz.</p>
   </fieldset>}
   </div>
  </section>
 </>;
}
