import {dataStartOf} from './reel-motion.js';
import React,{useState} from 'react';
import {useVisualStatus,Range} from './VisualSettings.jsx';
import {useLanguages} from './language-context.js';
import {eventPausePlan,normalizeEventPauses} from './event-timing.js';

export default function EventPauseControls({config,beforeChange,onDurationChange}){
 const v=useVisualStatus(),{uiLanguage}=useLanguages(),t=(pl,en)=>uiLanguage==='en'?en:pl,[selected,setSelected]=useState('');
 const events=config.timelineEvents||[],m=v.visuals.design.motion,s=normalizeEventPauses(m.eventPauses),fraction=.9-dataStartOf(m),plan=eventPausePlan(events,(config.duration||12)*fraction,s);
 const event=events.find(e=>e.id===selected)||events[0],own=event&&Object.hasOwn(s.overrides,event.id),actual=plan.stops.find(e=>e.id===event?.id);
 const patch=p=>{beforeChange();v.design({motion:{...m,eventPauses:normalizeEventPauses({...s,...p})}});};
 const fit=Math.max(6,Math.ceil(plan.totalRequested/(.75*fraction)));
 if(!events.length)return null;
 return <details className="appearance-group" open><summary>{t('Pauzy przy wydarzeniach','Pauses at events')}</summary>
  <label className="visual-check"><input type="checkbox" checked={s.enabled} onChange={e=>patch({enabled:e.target.checked})}/>{t('Zatrzymaj czas przy premierach','Pause time at releases')}</label>
  {s.enabled&&<>
   <Range label={t('Domyślna pauza','Default pause')} value={s.seconds} min={0} max={5} step={.1} suffix=" s" onChange={seconds=>patch({seconds})}/>
   <p className="visual-hint">{t('Jedna pauza na datę — modele wydane tego samego dnia pojawiają się razem. Ustaw 0 s, aby zatrzymywać się tylko przy wybranych datach.','One pause per date — models released on the same day appear together. Set 0 s to pause only on selected dates.')}</p>
   <label className="visual-field">{t('Wydarzenie do ustawienia pauzy','Event pause settings')}<select aria-label={t('Wydarzenie do ustawienia pauzy','Event pause settings')} value={event?.id||''} onChange={e=>setSelected(e.target.value)}>{events.map(e=><option key={e.id} value={e.id}>{e.id} · {e.label}</option>)}</select></label>
   <label className="visual-check"><input type="checkbox" checked={!!own} onChange={e=>{const overrides={...s.overrides};if(e.target.checked)overrides[event.id]=s.seconds;else delete overrides[event.id];patch({overrides});}}/>{t('Własna pauza dla tej daty','Custom pause for this date')}</label>
   {own&&<Range label={t('Pauza dla wybranej daty','Pause for selected date')} value={s.overrides[event.id]} min={0} max={10} step={.1} suffix=" s" onChange={seconds=>patch({overrides:{...s.overrides,[event.id]:seconds}})}/>}
   <p className="visual-hint" role="status">{t('Rzeczywista pauza dla tej daty:','Actual pause for this date:')} {(actual?.hold||0).toFixed(2)} s.</p>
   {plan.factor<.999&&<><p className="visual-hint">{t('Film jest za krótki na zadane pauzy. Zostały proporcjonalnie skrócone; 25% czasu przebiegu danych pozostaje na ruch.','The reel is too short for the requested pauses. They have been shortened proportionally; 25% of the data sequence remains for movement.')}</p>{onDurationChange&&fit<=600&&<button type="button" className="secondary full" onClick={()=>onDurationChange(fit)}>{t('Dopasuj długość rolki','Fit reel duration')} · {fit} s</button>}</>}
   <p className="visual-hint">{t('Między pauzami daty płyną równomiernie. Pauzy wydłużają ekspozycję wydarzeń, więc czas filmu nie jest proporcjonalny do czasu kalendarzowego.','Dates advance uniformly between pauses. Pauses extend events on screen, so video time is not proportional to calendar time.')}</p>
  </>}
 </details>;
}
