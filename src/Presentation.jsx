import React,{createContext,useContext,useMemo,useState} from 'react';
import {seriesFormats,aiFormats} from './presentation.js';
import {scaleAvailability} from './chart-scale.js';
import './presentation.css';
const MotionContext=createContext(null);
export function PresentationProvider({children}){
 const [transition,setTransition]=useState(.65);
 const [axisRange,setAxisRange]=useState('fixed'),[axisScale,setAxisScale]=useState('linear');
 const value=useMemo(()=>({transition,setTransition,axisRange,setAxisRange,axisScale,setAxisScale}),[transition,axisRange,axisScale]);
 return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
export function usePresentationConfig(config){const {transition,axisRange,axisScale}=useContext(MotionContext);return useMemo(()=>({...config,transition,axisRange,axisScale}),[config,transition,axisRange,axisScale]);}
export function PresentationPicker({family='series',value,onChange,hasBaseline=false,config={}}){
 const {transition,setTransition,axisRange,setAxisRange,axisScale,setAxisScale}=useContext(MotionContext),formats=family==='ai'?aiFormats:seriesFormats;
 const {hasAxis,logReason}=useMemo(()=>scaleAvailability(config),[config]);
 const selected=formats.find(f=>f.id===value)||formats[0];
 return <section className="presentation-picker" aria-label="Sposób prezentacji danych">
  <label className="field"><span className="field-label">Sposób prezentacji</span><select aria-label="Sposób prezentacji" value={value} onChange={e=>onChange(e.target.value)}>{formats.map(f=><option key={f.id} value={f.id} disabled={f.id==='duel'&&!hasBaseline}>{f.name}{f.id==='duel'&&!hasBaseline?' · brak punktu odniesienia':''}</option>)}</select></label>
  <p>{selected.note}</p>
  {hasAxis?<div className="axis-settings">
   <label className="field"><span className="field-label">Zakres osi wartości</span><select aria-label="Zakres osi wartości" value={axisRange} onChange={e=>setAxisRange(e.target.value)}><option value="fixed">Stały · cała historia</option><option value="dynamic">Rosnący · wraz z animacją</option></select></label>
   <p>{axisRange==='dynamic'?'Początek ma własną skalę. Zakres rozszerza się w miarę odsłaniania danych; wcześniejsze rekordy pozostają w kadrze.':'Ta sama skala od początku do końca rolki, wyznaczona przez całą wybraną historię.'}</p>
   {family==='ai'&&axisRange==='dynamic'&&<p>Przed nowym pomiarem oś łagodnie robi na niego miejsce. Wynik pojawia się dopiero w swojej dacie.</p>}
   <label className="field"><span className="field-label">Skala osi wartości</span><select aria-label="Skala osi wartości" value={logReason?'linear':axisScale} onChange={e=>setAxisScale(e.target.value)}><option value="linear">Liniowa</option><option value="log" disabled={!!logReason}>Logarytmiczna</option></select></label>
   <p>{logReason||'Na skali logarytmicznej taki sam odstęp oznacza taki sam mnożnik, np. 1 → 10 i 10 → 100. Wartości danych się nie zmieniają.'}</p>
   {axisScale==='log'&&logReason&&<small role="status">Dla tych danych lub tej prezentacji aktywna jest skala liniowa.</small>}
   <small>Ustawienia skali są wspólne dla modułów i eksportu. Rodzaj skali jest oznaczony na rolce.</small>
  </div>:<p>Ta prezentacja nie ma osi wartości. Skalowanie jest dostępne dla wykresów.</p>}
  <label className="field"><span className="field-label">Przejścia między danymi</span><select aria-label="Przejścia między danymi" value={transition} onChange={e=>setTransition(Number(e.target.value))}><option value={.65}>Płynne · 0,65 s</option><option value={1.1}>Spokojne · 1,1 s</option><option value={.3}>Dynamiczne · 0,3 s</option><option value={0}>Bez przejść</option></select></label>
  <small>Tempo przejść jest wspólne dla modułów. Liczby pozostają pomiarami ze źródła; wygładzamy ruch i przenikanie. Gęste dane mają krótsze przejścia.</small>
 </section>;
}
