import React,{createContext,useContext,useMemo,useState} from 'react';
import {seriesFormats,aiFormats} from './presentation.js';
import './presentation.css';
const MotionContext=createContext(null);
export function PresentationProvider({children}){
 const [transition,setTransition]=useState(.65);
 const value=useMemo(()=>({transition,setTransition}),[transition]);
 return <MotionContext.Provider value={value}>{children}</MotionContext.Provider>;
}
export function usePresentationConfig(config){const {transition}=useContext(MotionContext);return useMemo(()=>({...config,transition}),[config,transition]);}
export function PresentationPicker({family='series',value,onChange,hasBaseline=false}){
 const {transition,setTransition}=useContext(MotionContext),formats=family==='ai'?aiFormats:seriesFormats;
 const selected=formats.find(f=>f.id===value)||formats[0];
 return <section className="presentation-picker" aria-label="Sposób prezentacji danych">
  <label className="field"><span className="field-label">Sposób prezentacji</span><select aria-label="Sposób prezentacji" value={value} onChange={e=>onChange(e.target.value)}>{formats.map(f=><option key={f.id} value={f.id} disabled={f.id==='duel'&&!hasBaseline}>{f.name}{f.id==='duel'&&!hasBaseline?' · brak punktu odniesienia':''}</option>)}</select></label>
  <p>{selected.note}</p>
  <label className="field"><span className="field-label">Przejścia między danymi</span><select aria-label="Przejścia między danymi" value={transition} onChange={e=>setTransition(Number(e.target.value))}><option value={.65}>Płynne · 0,65 s</option><option value={1.1}>Spokojne · 1,1 s</option><option value={.3}>Dynamiczne · 0,3 s</option><option value={0}>Bez przejść</option></select></label>
  <small>Tempo przejść jest wspólne dla modułów. Liczby pozostają pomiarami ze źródła; wygładzamy ruch i przenikanie. Gęste dane mają krótsze przejścia.</small>
 </section>;
}
