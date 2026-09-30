import React,{memo} from 'react';
import {Play,RotateCcw} from 'lucide-react';
import {useVisualStatus,Range} from './VisualSettings.jsx';
import {motionPresets,motionRoles,motionEffects,motionEasings,motionPreset,normalizeMotion,textMotionRoles,textMotionEffects} from './reel-motion.js';
import {useLanguages} from './language-context.js';

const PresetLibrary=memo(function PresetLibrary({selected,onSelect}){
 return <div className="motion-preset-grid" role="group" aria-label="Gotowe sekwencje animacji">{motionPresets.map(p=><button type="button" key={p.id} className={selected===p.id?'selected':''} aria-pressed={selected===p.id} aria-label={`Animacja: ${p.name}`} onClick={()=>onSelect(p.id)}>
  <span className={`motion-mini effect-${p.tracks.title.effect}`} aria-hidden="true"><b>Aa</b><svg viewBox="0 0 110 36"><path d="M5 29L30 23L50 27L76 12L105 5"/><path d="M5 16L30 26L50 17L76 20L105 13"/></svg><i style={{left:`${p.tracks.title.start*100}%`,width:`${p.tracks.title.duration*150}%`}}/><i style={{left:`${p.tracks.content.start*100}%`,width:`${p.tracks.content.duration*150}%`}}/></span>
  <strong>{p.name}</strong><small>{p.description}</small>
 </button>)}</div>;
});
export default function MotionEditor({config,playhead,onSeek,onReplay,target,setTarget,beforeChange}){
 const v=useVisualStatus(),{uiLanguage}=useLanguages(),m=v.visuals.design.motion,duration=config.duration||12;
 const choices=[...motionRoles,...v.visuals.stickers.map(s=>[`sticker:${s.id}`,s.name])],id=choices.some(([id])=>id===target)?target:'title',t=m.tracks[id]||m.tracks.stickers;
 const seconds=n=>Math.round(n*duration*100)/100,format=n=>seconds(n).toLocaleString(uiLanguage==='en'?'en-GB':'pl-PL',{maximumFractionDigits:2})+' s';
 const update=patch=>v.design({motion:normalizeMotion({...m,...patch})});
 const track=patch=>update({preset:'custom',tracks:{...m.tracks,[id]:{...t,...patch}}});
 const handlers=React.useRef();handlers.current={beforeChange,design:v.design};
 const selectPreset=React.useCallback(id=>{handlers.current.beforeChange();handlers.current.design({motion:motionPreset(id)});},[]);
 const rows=[['title','Tytuł'],['subtitle','Opis'],['content','Wejście wykresu'],['data','Animacja danych'],['signature','Podpis autora']];
 return <div className="visual-editor motion-editor"><fieldset disabled={!v.ready||v.busy}>
  <label className="visual-check motion-enable"><input type="checkbox" checked={m.enabled} onChange={e=>{beforeChange();update({enabled:e.target.checked});}}/>Animacje elementów</label>
  <button type="button" className="secondary full motion-replay" onClick={onReplay}><Play size={15}/>Odtwórz od początku</button>
  <div className={`motion-timeline ${m.enabled?'':'is-disabled'}`} aria-label="Oś czasu animacji">
   <div className="motion-time-header"><span>Przebieg rolki</span><output>{format(playhead)} / {duration} s</output></div>
   {rows.map(([key,label])=>{const tr=m.tracks[key],start=key==='data'?(m.enabled?m.chartStart:0):m.enabled&&tr.effect!=='none'?tr.start:0,length=key==='data'?.9-start:m.enabled&&tr.effect!=='none'?tr.duration:0;
    return <button type="button" key={key} className={`motion-time-row ${key==='data'?'is-data':''}`} onClick={()=>onSeek(start+length*.5)} aria-label={`Podgląd etapu: ${label}`}><span>{label}</span><span className="motion-time-track"><i style={{left:`${start*100}%`,width:`${Math.max(length*100,.6)}%`}}/><b style={{left:`${playhead*100}%`}}/></span></button>;
   })}
   <p className="visual-hint">Kliknij etap, aby zobaczyć jego środek. Suwak pod rolką przewija cały film.</p>
  </div>
  <details className="appearance-group motion-library" open><summary>Biblioteka · 16 sekwencji</summary><PresetLibrary selected={m.enabled?m.preset:null} onSelect={selectPreset}/></details>
  <p className="visual-hint">Sekwencja zmienia tylko ruch i kolejność wejść. Wybrany design, czcionki i dane zostają.</p>
  <details className="appearance-group" open><summary>Dopasuj animację elementu</summary>
   <label className="visual-field">Animowany element<select aria-label="Animowany element" value={id} onChange={e=>setTarget(e.target.value)}>{choices.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
   <fieldset disabled={!m.enabled} className="motion-track-settings" onFocusCapture={beforeChange} onPointerDownCapture={beforeChange}>
    <label className="visual-field">Efekt wejścia<select aria-label="Efekt wejścia" value={t.effect} onChange={e=>track({effect:e.target.value})}>{motionEffects.filter(([effect])=>textMotionRoles.has(id)||!textMotionEffects.has(effect)).map(([effect,label])=><option key={effect} value={effect}>{label}</option>)}</select></label>
    {t.effect!=='none'&&<>
     <Range label="Początek wejścia" min={0} max={seconds(id==='content'?.5:.8)} step={.01} suffix=" s" value={seconds(t.start)} onChange={n=>track({start:n/duration})}/>
     <Range label="Długość wejścia" min={seconds(.015)} max={seconds(Math.min(.3,(id==='content'?.6:.92)-t.start))} step={.01} suffix=" s" value={seconds(t.duration)} onChange={n=>track({duration:n/duration})}/>
     {!textMotionEffects.has(t.effect)&&!['pop','bounce'].includes(t.effect)&&<label className="visual-field">Tempo wejścia<select aria-label="Tempo wejścia" value={t.easing} onChange={e=>track({easing:e.target.value})}>{motionEasings.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>}
     <button type="button" className="text-btn" onClick={()=>onSeek(t.start+t.duration*.5)}>Zobacz środek tego wejścia</button>
    </>}
    {id.startsWith('sticker:')&&m.tracks[id]&&<button type="button" className="text-btn" onClick={()=>{const tracks={...m.tracks};delete tracks[id];update({preset:'custom',tracks});}}>Użyj wspólnego wejścia dodatków</button>}
   </fieldset>
  </details>
  <fieldset disabled={!m.enabled} onFocusCapture={beforeChange} onPointerDownCapture={beforeChange}>
   <Range label="Start animacji danych" min={seconds(m.tracks.content.effect==='none'?0:m.tracks.content.start+m.tracks.content.duration)} max={seconds(.6)} step={.01} suffix=" s" value={seconds(m.chartStart)} onChange={n=>update({preset:'custom',chartStart:n/duration})}/>
  </fieldset>
  <p className="visual-hint">Dane ruszają po pełnym wejściu wykresu. Sekwencja mieści się w długości rolki; ostatnie 10% zostaje na wynik. Czasy dopasowują się przy zmianie długości filmu.</p>
  <p className="visual-hint">Przy edycji kursorem elementy są widoczne w pozycji docelowej. Źródła pozostają widoczne przez całą rolkę.</p>
  <button type="button" className="text-btn visual-reset" onClick={()=>{beforeChange();update(normalizeMotion());}}><RotateCcw size={14}/>Wyłącz i wyzeruj animacje</button>
 </fieldset></div>;
}
