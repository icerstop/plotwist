import ReleaseSoundControls from './ReleaseSoundControls.jsx';
import {reelCapabilities} from './reel-capabilities.js';
import EventPauseControls from './EventPauseControls.jsx';
import React,{memo} from 'react';
import {overlayName} from './reel-overlays.js';
import {Play,RotateCcw} from 'lucide-react';
import {useVisualStatus,Range} from './VisualSettings.jsx';
import {dataStartOf,motionTrack,motionPresets,motionRoles,motionEffects,motionEasings,motionPreset,normalizeMotion,textMotionRoles,textMotionEffects} from './reel-motion.js';
import {useLanguages} from './language-context.js';
import {typingStyles,typingCursors,typingRoles,typingStages} from './reel-typing.js';

const PresetLibrary=memo(function PresetLibrary({selected,onSelect}){
 return <div className="motion-preset-grid" role="group" aria-label="Gotowe sekwencje animacji">{motionPresets.map(p=><button type="button" key={p.id} className={selected===p.id?'selected':''} aria-pressed={selected===p.id} aria-label={`Animacja: ${p.name}`} onClick={()=>onSelect(p.id)}>
  <span className={`motion-mini effect-${p.tracks.title.effect}`} aria-hidden="true"><b>Aa</b><svg viewBox="0 0 110 36"><path d="M5 29L30 23L50 27L76 12L105 5"/><path d="M5 16L30 26L50 17L76 20L105 13"/></svg><i style={{left:`${p.tracks.title.start*100}%`,width:`${p.tracks.title.duration*150}%`}}/><i style={{left:`${p.tracks.content.start*100}%`,width:`${p.tracks.content.duration*150}%`}}/></span>
  <strong>{p.name}</strong><small>{p.description}</small>
 </button>)}</div>;
});
export default function MotionEditor({config,playhead,onSeek,onReplay,target,setTarget,beforeChange,onDurationChange}){
 const v=useVisualStatus(),{uiLanguage}=useLanguages(),m=v.visuals.design.motion,duration=config.duration||12,mystery=m.mystery.enabled;
 const cap=reelCapabilities(config),available=id=>cap.motionElements.includes(id)&&!v.visuals.hidden[id];
 const choices=mystery?[['title','Tytuł']]:[...cap.elements.filter(e=>available(e.id)).map(e=>[e.id,e.name]),...v.visuals.stickers.map(s=>[`sticker:${s.id}`,s.name]),...v.visuals.overlays.map(o=>[`overlay:${o.id}`,overlayName(o,uiLanguage)])],id=choices.some(([id])=>id===target)?target:'title',t=m.tracks[id]||m.tracks.stickers;
 const seconds=n=>Math.round(n*duration*100)/100,format=n=>seconds(n).toLocaleString(uiLanguage==='en'?'en-GB':'pl-PL',{maximumFractionDigits:2})+' s';
 const update=patch=>v.design({motion:normalizeMotion({...m,...patch})});
 const track=patch=>update({preset:'custom',tracks:{...m.tracks,[id]:{...t,...patch}}});
 const handlers=React.useRef();handlers.current={beforeChange,design:v.design,eventPauses:m.eventPauses,releaseSound:m.releaseSound,overlap:m.overlap,dataStart:m.dataStart};
 const selectPreset=React.useCallback(id=>{handlers.current.beforeChange();handlers.current.design({motion:{...motionPreset(id),eventPauses:handlers.current.eventPauses,releaseSound:handlers.current.releaseSound,overlap:handlers.current.overlap,dataStart:handlers.current.dataStart}});},[]);
 const sequential=m.typing.enabled,overlap=m.overlap&&!mystery,stages=typingStages(m.chartStart),tr=(pl,en)=>uiLanguage==='en'?en:pl;
 const earlyStart=n=>{beforeChange();update({enabled:true,overlap:true,dataStart:n/duration});};
 const rows=mystery?[['title','Tytuł'],['content','Wykres bez opisów'],['data','Animacja danych'],['answer','Odsłonięcie odpowiedzi']]:sequential?[...typingRoles,['data','Animacja danych']]:[['title','Tytuł'],['subtitle','Opis'],['content','Wejście wykresu'],...cap.elements.filter(e=>e.textRole).map(e=>[e.id,e.name]),['data','Animacja danych'],['signature','Podpis autora']];
 return <div className="visual-editor motion-editor"><fieldset disabled={!v.ready||v.busy}>
  <label className="visual-check motion-enable"><input type="checkbox" checked={m.enabled} onChange={e=>{beforeChange();update({enabled:e.target.checked});}}/>Animacje elementów</label>
  <button type="button" className="secondary full motion-replay" onClick={onReplay}><Play size={15}/>Odtwórz od początku</button>
  {!mystery&&<div className="motion-overlap-controls">
   <label className="visual-check"><input type="checkbox" checked={overlap} onChange={e=>{beforeChange();update({enabled:true,overlap:e.target.checked,...(e.target.checked?{dataStart:.5/duration}:{})});}}/>{tr('Równoległe animacje','Overlapping animations')}</label>
   <div className="filters" role="group" aria-label={tr('Szybki start wykresu','Quick chart start')}>{[0,.5,1].map(n=><button type="button" key={n} className={overlap&&Math.abs(dataStartOf(m)*duration-n)<.005?'selected':''} aria-pressed={overlap&&Math.abs(dataStartOf(m)*duration-n)<.005} onClick={()=>earlyStart(n)}>{n===0?tr('Od razu','Immediately'):tr('Po ','After ')+n.toLocaleString(uiLanguage==='en'?'en-GB':'pl-PL')+' s'}</button>)}</div>
   {overlap&&<Range label={tr('Start wykresu','Chart start')} min={0} max={seconds(.6)} step={.01} suffix=" s" value={seconds(m.dataStart)} onChange={earlyStart}/>}
   <p className="visual-hint">{tr('Wykres może ruszyć podczas wejścia tytułu i pozostałych elementów. Przy pisaniu tekstów jego bieżące etykiety są widoczne i aktualizują się od razu.','The chart can start while the title and other elements are entering. While text is typing, live chart labels remain visible and update immediately.')}</p>
  </div>}
  <ReleaseSoundControls config={config} beforeChange={beforeChange}/>
  <EventPauseControls config={config} beforeChange={beforeChange} onDurationChange={onDurationChange}/>
  <div className={`motion-timeline ${m.enabled?'':'is-disabled'}`} aria-label="Oś czasu animacji">
   <div className="motion-time-header"><span>Przebieg rolki</span><output>{format(playhead)} / {duration} s</output></div>
   {rows.filter(([key])=>['data','answer'].includes(key)||key==='source'||available(key)).map(([key,label])=>{const tr=key==='answer'?{effect:'fade',start:m.mystery.answerAt,duration:m.mystery.fade}:overlap&&key==='content'?motionTrack(m,key):overlap&&sequential&&key==='date'?{effect:'none',start:0,duration:0}:sequential?stages[key]:motionTrack(m,key),start=key==='data'?dataStartOf(m):m.enabled&&tr&&(sequential||tr.effect!=='none')?tr.start:0,length=key==='data'?.9-start:m.enabled&&tr&&(sequential||tr.effect!=='none')?tr.duration:0;
    return <button type="button" key={key} className={`motion-time-row ${key==='data'?'is-data':''}`} onClick={()=>onSeek(start+length*.5)} aria-label={`Podgląd etapu: ${label}`}><span>{label}</span><span className="motion-time-track"><i style={{left:`${start*100}%`,width:`${Math.max(length*100,.6)}%`}}/><b style={{left:`${playhead*100}%`}}/></span></button>;
   })}
   <p className="visual-hint">Kliknij etap, aby zobaczyć jego środek. Suwak pod rolką przewija cały film.</p>
  </div>
  <details className="appearance-group motion-library" open><summary>Biblioteka · {motionPresets.length} <span>sekwencji</span></summary><PresetLibrary selected={m.enabled?m.preset:null} onSelect={selectPreset}/></details>
  <p className="visual-hint">Sekwencja zmienia tylko ruch i kolejność wejść. Wybrany design, czcionki i dane zostają.</p>
  <label className="visual-check"><input type="checkbox" checked={mystery} onChange={e=>{beforeChange();update({enabled:true,preset:'custom',mystery:{...m.mystery,enabled:e.target.checked},...(e.target.checked?{typing:{...m.typing,enabled:false}}:{})});}}/>Tryb zagadki · ukryj odpowiedź</label>
  {mystery&&<fieldset disabled={!m.enabled} className="motion-mystery" onFocusCapture={beforeChange} onPointerDownCapture={beforeChange}>
   <Range label="Odsłoń kształt wykresu" min={seconds(.05)} max={seconds(.45)} step={.01} suffix=" s" value={seconds(m.mystery.chartAt)} onChange={n=>update({preset:'custom',mystery:{...m.mystery,chartAt:n/duration}})}/>
   <Range label="Odsłoń odpowiedź i opisy" min={seconds(m.mystery.chartAt+m.mystery.fade+.12)} max={seconds(Math.min(.82,.9-m.mystery.fade))} step={.01} suffix=" s" value={seconds(m.mystery.answerAt)} onChange={n=>update({preset:'custom',mystery:{...m.mystery,answerAt:n/duration}})}/>
   <Range label="Czas odsłaniania" min={seconds(.02)} max={seconds(.15)} step={.01} suffix=" s" value={seconds(m.mystery.fade)} onChange={n=>update({preset:'custom',mystery:{...m.mystery,fade:n/duration}})}/>
   <button type="button" className="text-btn" onClick={()=>onSeek(m.mystery.chartAt/2)}>Zobacz sam tytuł</button>
   <button type="button" className="text-btn" onClick={()=>onSeek((m.chartStart+m.mystery.answerAt)/2)}>Zobacz wykres bez odpowiedzi</button>
   <button type="button" className="text-btn" onClick={()=>onSeek(1)}>Zobacz odsłoniętą odpowiedź</button>
   <p className="visual-hint">Najpierw tylko tytuł, potem kształt danych. Nazwy, wartości, opisy osi, flagi, logotypy, daty, źródła i dodatki odsłaniają się z odpowiedzią. Wyłączone elementy pozostają wyłączone. Wpisz tytuł w formie pytania, które nie zdradza rozwiązania.</p>
  </fieldset>}
  <label className="visual-check"><input type="checkbox" checked={sequential} onChange={e=>{beforeChange();update({enabled:true,preset:'custom',typing:{...m.typing,enabled:e.target.checked},...(e.target.checked?{chartStart:.56,mystery:{...m.mystery,enabled:false}}:{})});}}/>Cały tekst po kolei</label>
  {sequential&&<fieldset disabled={!m.enabled} onFocusCapture={beforeChange} onPointerDownCapture={beforeChange}>
   <label className="visual-field">Rytm pisania<select aria-label="Rytm pisania" value={m.typing.style} onChange={e=>update({preset:'custom',typing:{...m.typing,style:e.target.value}})}>{typingStyles.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
   <label className="visual-field">Kursor pisania<select aria-label="Kursor pisania" value={m.typing.cursor} onChange={e=>update({preset:'custom',typing:{...m.typing,cursor:e.target.value}})}>{typingCursors.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
   <label className="visual-check"><input type="checkbox" disabled={m.typing.cursor==='none'} checked={m.typing.blink} onChange={e=>update({preset:'custom',typing:{...m.typing,blink:e.target.checked}})}/>Miganie kursora w pauzach</label>
   <Range label={overlap?tr("Czas pisania tekstów","Text typing time"):"Czas na pisanie przed wykresem"} min={seconds(.2)} max={seconds(.6)} step={.01} suffix=" s" value={seconds(m.chartStart)} onChange={n=>update({preset:'custom',chartStart:n/duration})}/>
   <p className="visual-hint">{overlap?tr("Teksty piszą się kolejno, a wykres działa równolegle. Czas pisania nie opóźnia startu danych.","Text types sequentially while the chart runs alongside it. Typing time does not delay the data."):"Jeden kursor: tytuł → opis → wskaźnik → etykiety → data → źródło → podpis. Potem ruszają dane. Dłuższa rolka daje spokojniejsze tempo pisania."}</p>
  </fieldset>}
  {!sequential&&<><details className="appearance-group" open><summary>Dopasuj animację elementu</summary>
   <label className="visual-field">Animowany element<select aria-label="Animowany element" value={id} onChange={e=>setTarget(e.target.value)}>{choices.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label>
   <fieldset disabled={!m.enabled} className="motion-track-settings" onFocusCapture={beforeChange} onPointerDownCapture={beforeChange}>
    <label className="visual-field">Efekt wejścia<select aria-label="Efekt wejścia" value={t.effect} onChange={e=>track({effect:e.target.value})}>{motionEffects.filter(([effect])=>textMotionRoles.has(id)||v.visuals.overlays.some(o=>`overlay:${o.id}`===id&&o.kind==='text')||!textMotionEffects.has(effect)).map(([effect,label])=><option key={effect} value={effect}>{label}</option>)}</select></label>
    {t.effect!=='none'&&<>
     <Range label="Początek wejścia" min={0} max={seconds(id==='content'?.5:.8)} step={.01} suffix=" s" value={seconds(t.start)} onChange={n=>track({start:n/duration})}/>
     <Range label="Długość wejścia" min={seconds(.015)} max={seconds(Math.min(.3,(id==='content'?.6:.92)-t.start))} step={.01} suffix=" s" value={seconds(t.duration)} onChange={n=>track({duration:n/duration})}/>
     {!textMotionEffects.has(t.effect)&&!['pop','bounce'].includes(t.effect)&&<label className="visual-field">Tempo wejścia<select aria-label="Tempo wejścia" value={t.easing} onChange={e=>track({easing:e.target.value})}>{motionEasings.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>}
     <button type="button" className="text-btn" onClick={()=>onSeek(t.start+t.duration*.5)}>Zobacz środek tego wejścia</button>
    </>}
    {id.startsWith('sticker:')&&m.tracks[id]&&<button type="button" className="text-btn" onClick={()=>{const tracks={...m.tracks};delete tracks[id];update({preset:'custom',tracks});}}>Użyj wspólnego wejścia dodatków</button>}
   </fieldset>
  </details>
  {!mystery&&!overlap&&<fieldset disabled={!m.enabled} onFocusCapture={beforeChange} onPointerDownCapture={beforeChange}>
   <Range label="Start animacji danych" min={seconds(m.tracks.content.effect==='none'?0:m.tracks.content.start+m.tracks.content.duration)} max={seconds(.6)} step={.01} suffix=" s" value={seconds(m.chartStart)} onChange={n=>update({preset:'custom',chartStart:n/duration})}/>
  </fieldset>}
  </>}
  <p className="visual-hint">{overlap?tr("Start danych jest niezależny od końca animacji tekstów. Wejście wykresu dopasowuje się do wcześniejszego startu. Ostatnie 10% filmu pozostaje na wynik.","Data starts independently of text animation endings. The chart entrance adapts to the earlier start. The final 10% of the video holds the result."):"Dane ruszają po pełnym wejściu wykresu. Sekwencja mieści się w długości rolki; ostatnie 10% zostaje na wynik. Czasy dopasowują się przy zmianie długości filmu."}</p>
  <p className="visual-hint">{overlap?tr('Przy edycji kursorem wszystkie elementy są widoczne w pozycji docelowej.','When editing on the canvas, all elements appear in their final positions.'):mystery?'Przy edycji kursorem wszystkie elementy są widoczne. W trybie zagadki źródła i metodologia pojawiają się z odpowiedzią i pozostają do końca.':sequential&&!overlap?'Przy edycji kursorem wszystkie teksty są widoczne. Źródło wpisuje się przed uruchomieniem danych i pozostaje do końca.':'Przy edycji kursorem elementy są widoczne w pozycji docelowej. Źródła pozostają widoczne przez całą rolkę.'}</p>
  <button type="button" className="text-btn visual-reset" onClick={()=>{beforeChange();update(normalizeMotion());}}><RotateCcw size={14}/>Wyłącz i wyzeruj animacje</button>
 </fieldset></div>;
}
