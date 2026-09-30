import React,{useEffect,useRef} from 'react';
import {useVisualStatus,Range,Color} from './VisualSettings.jsx';
import {FontPicker} from './FontPicker.jsx';
import FontWeightPicker from './FontWeightPicker.jsx';
import {themeOf} from './reel-design.js';
import {useLanguages} from './language-context.js';

export default function OverlayControls({item:o,config,beforeChange,focusRequest}){
 const v=useVisualStatus(),{reelLanguage}=useLanguages(),input=useRef(),set=patch=>v.overlay(o.id,patch);
 useEffect(()=>{if(focusRequest&&o.kind==='text'){input.current?.focus();input.current?.select();}},[focusRequest,o.id]);
 return <div className="overlay-controls" onFocusCapture={beforeChange} onPointerDownCapture={beforeChange}>
  {o.kind==='text'&&<>
   <label>Treść własnego tekstu<textarea ref={input} aria-label="Treść własnego tekstu" rows={4} maxLength={1500} value={o.text[reelLanguage]} onChange={e=>set({text:{...o.text,[reelLanguage]:e.target.value}})}/></label>
   <p>Własny tekst ma osobną treść dla polskiej i angielskiej wersji rolki. Enter zaczyna nowy wiersz; długie teksty zawijają się automatycznie.</p>
   <FontPicker label="Czcionka własnego tekstu" value={o.fontId||''} inheritFontId={config.fontId} onChange={fontId=>set({fontId:fontId||null})}/>
   <FontWeightPicker label="Grubość własnego tekstu" fontId={o.fontId||config.fontId} value={o.weight} element onChange={weight=>set({weight})}/>
   <Range label="Wielkość własnego tekstu" value={o.fontSize} min={16} max={240} suffix=" px" onChange={fontSize=>set({fontSize})}/>
   <label>Wyrównanie własnego tekstu<select aria-label="Wyrównanie własnego tekstu" value={o.align} onChange={e=>set({align:e.target.value})}><option value="left">Do lewej</option><option value="center">Do środka</option><option value="right">Do prawej</option></select></label>
   <Range label="Interlinia własnego tekstu" value={o.lineHeight} min={.8} max={2} step={.05} suffix="×" onChange={lineHeight=>set({lineHeight})}/>
   <label className="reel-snap-toggle"><input type="checkbox" checked={o.italic} onChange={e=>set({italic:e.target.checked})}/>Kursywa</label>
  </>}
  <Color label="Kolor dodatku" value={o.color||(o.kind==='text'?themeOf(config).fg:themeOf(config).colors[0])} onChange={color=>set({color})}/>
  <Range label="Szerokość dodatku" value={o.width} min={5} max={100} onChange={width=>set({width})}/>
  {['rectangle','ellipse'].includes(o.kind)&&<>
   <Range label="Wysokość dodatku" value={o.height} min={1} max={80} onChange={height=>set({height})}/>
   <label className="reel-snap-toggle"><input type="checkbox" checked={o.fill} onChange={e=>set({fill:e.target.checked})}/>Wypełnienie kształtu</label>
  </>}
  {o.kind!=='text'&&<Range label="Grubość linii dodatku" value={o.strokeWidth} min={1} max={30} suffix=" px" onChange={strokeWidth=>set({strokeWidth})}/>}
  {o.kind==='rectangle'&&<Range label="Zaokrąglenie dodatku" value={o.radius} min={0} max={100} suffix=" px" onChange={radius=>set({radius})}/>}
  <div className="reel-inspector-pair"><label>Pozycja X (%)<input aria-label="Pozycja X dodatku" type="number" min={0} max={100} step={.1} value={Math.round(o.x*10)/10} onChange={e=>set({x:Number(e.target.value)})}/></label><label>Pozycja Y (%)<input aria-label="Pozycja Y dodatku" type="number" min={0} max={100} step={.1} value={Math.round(o.y*10)/10} onChange={e=>set({y:Number(e.target.value)})}/></label></div>
  <Range label="Skala dodatku" value={o.scale} min={25} max={200} onChange={scale=>set({scale})}/>
  <Range label="Obrót dodatku" value={o.rotation} min={-180} max={180} suffix="°" onChange={rotation=>set({rotation})}/>
  <Range label="Widoczność dodatku" value={o.opacity} min={0} max={100} onChange={opacity=>set({opacity})}/>
  <label className="reel-snap-toggle"><input type="checkbox" checked={o.shadow} onChange={e=>set({shadow:e.target.checked})}/>Cień pod dodatkiem</label>
  <label>Warstwa własnego elementu<select aria-label="Warstwa własnego elementu" value={o.layer} onChange={e=>set({layer:e.target.value})}><option value="front">Nad tekstem i wykresem</option><option value="behind">Pod tekstem i wykresem</option></select></label>
  <div className="reel-inspector-pair"><button type="button" className="secondary" disabled={v.visuals.overlays.filter(x=>x.layer===o.layer)[0]?.id===o.id} onClick={()=>v.orderOverlay(o.id,-1)}>Przesuń niżej</button><button type="button" className="secondary" disabled={v.visuals.overlays.filter(x=>x.layer===o.layer).at(-1)?.id===o.id} onClick={()=>v.orderOverlay(o.id,1)}>Przesuń wyżej</button></div>
 </div>;
}
