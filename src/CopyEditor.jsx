import React,{useEffect,useRef,useState} from 'react';
import {COPY_LIMIT} from './reel-copy.js';
import {useVisualStatus} from './VisualSettings.jsx';
import {useLanguages} from './language-context.js';
import {translate} from './translations.js';

export default function CopyEditor({fields,beforeChange,focusRequest}){
 const v=useVisualStatus(),{uiLanguage}=useLanguages(),[selected,setSelected]=useState(''),input=useRef();
 const field=fields.find(f=>f.key===selected)||fields[0];
 useEffect(()=>{if(focusRequest&&field){input.current?.focus();input.current?.select();}},[focusRequest]);
 if(!field)return null;
 const own=v.visuals.copy?.[field.key],custom=typeof own==='string',value=custom?own:field.original;
 const props={ref:input,'aria-label':'Treść tekstu na rolce',value,maxLength:COPY_LIMIT,onFocus:beforeChange,onChange:e=>v.copy(field.key,e.target.value),spellCheck:true};
 return <section className="reel-copy-editor" aria-label="Edycja treści tekstu">
  <h3>Treść tekstu</h3>
  {fields.length>1&&<label>Tekst do edycji<select aria-label="Tekst do edycji" value={field.key} onChange={e=>setSelected(e.target.value)}>{fields.map(f=><option key={f.key} value={f.key} translate="no">{translate(f.label,uiLanguage)}{f.context||f.original?` · ${(f.context||f.original).slice(0,90)}${(f.context||f.original).length>90?'…':''}`:''}</option>)}</select></label>}
  {field.context&&<small translate="no">{field.context}</small>}
  <label><span translate="no">{translate(field.label,uiLanguage)} · {field.language.toUpperCase()}</span>{field.multiline?<textarea {...props} rows={4}/>:<input {...props} type="text"/>}</label>
  <div className="reel-copy-actions"><button type="button" className="text-btn" disabled={!custom} onClick={()=>{beforeChange();v.copy(field.key,null);}}>Przywróć tekst automatyczny</button><span>{value.length}/{COPY_LIMIT}</span></div>
  <small>{field.shared?'Podpis autora jest wspólny dla rolek w tym języku.':'Tekst zapisuje się dla tych danych i języka rolki.'} Puste pole ukrywa tekst.</small>
  {field.dynamic&&<small>Własny tekst zastępuje zmieniającą się datę na całej rolce.</small>}
  {custom&&<details><summary>Tekst automatyczny</summary><p translate="no">{field.original||'—'}</p></details>}
 </section>;
}
