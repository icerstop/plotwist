import React,{useEffect,useRef,useState} from 'react';
import {COPY_LIMIT} from './reel-copy.js';
import {useVisualStatus} from './VisualSettings.jsx';
import {useLanguages} from './language-context.js';
import {translate} from './translations.js';

export default function CopyEditor({fields,beforeChange,focusRequest}){
 const v=useVisualStatus(),{uiLanguage}=useLanguages(),[selected,setSelected]=useState(''),input=useRef();
 fields=[...new Map(fields.map(f=>[f.visibilityKey,f])).values()];
 const field=fields.find(f=>f.visibilityKey===selected)||fields[0];
 useEffect(()=>{if(focusRequest&&field){input.current?.focus();input.current?.select();}},[focusRequest]);
 if(!field)return null;
 const own=v.visuals.copy?.[field.key],custom=typeof own==='string',value=custom?own:field.original;
 const hidden=v.visuals.copyHidden?.[field.visibilityKey]===true,en=uiLanguage==='en';
 const props={ref:input,'aria-label':'Treść tekstu na rolce',value,maxLength:COPY_LIMIT,onFocus:beforeChange,onChange:e=>v.copy(field.key,e.target.value),spellCheck:true};
 return <section className="reel-copy-editor" aria-label="Edycja treści tekstu">
  <h3>Treść tekstu</h3>
  {fields.length>1&&<label>Tekst do edycji<select aria-label="Tekst do edycji" value={field.visibilityKey} onChange={e=>setSelected(e.target.value)}>{fields.map(f=><option key={f.visibilityKey} value={f.visibilityKey} translate="no">{v.visuals.copyHidden?.[f.visibilityKey]?(en?'[Hidden] ':'[Ukryty] '):''}{translate(f.label,uiLanguage)}{f.context||f.original?` · ${(f.context||f.original).slice(0,90)}${(f.context||f.original).length>90?'…':''}`:''}</option>)}</select></label>}
  <label className="reel-copy-visibility" translate="no"><input type="checkbox" aria-label={en?'Show this text on the reel':'Pokaż ten tekst na rolce'} checked={!hidden} onChange={e=>{beforeChange();v.hideCopy(field.visibilityKey,!e.target.checked);}}/>{en?'Show this text on the reel':'Pokaż ten tekst na rolce'}</label>
  {hidden&&<small role="status" translate="no">{en?'Hidden throughout the reel and in exports. Its text is kept.':'Ukryty w całej rolce i w eksporcie. Treść pozostaje zapisana.'}</small>}
  {field.context&&<small translate="no">{field.context}</small>}
  <label><span translate="no">{translate(field.label,uiLanguage)} · {field.language.toUpperCase()}</span>{field.multiline?<textarea {...props} rows={4}/>:<input {...props} type="text"/>}</label>
  <div className="reel-copy-actions"><button type="button" className="text-btn" disabled={!custom} onClick={()=>{beforeChange();v.copy(field.key,null);}}>Przywróć tekst automatyczny</button><span>{value.length}/{COPY_LIMIT}</span></div>
  <small>{field.shared?'Podpis autora jest wspólny dla rolek w tym języku.':'Tekst zapisuje się dla tych danych i języka rolki.'} Puste pole ukrywa tekst.</small>
  {field.dynamic&&<small>Własny tekst zastępuje zmieniającą się datę na całej rolce.</small>}
  {custom&&<details><summary>Tekst automatyczny</summary><p translate="no">{field.original||'—'}</p></details>}
 </section>;
}
