import React from 'react';
import countries from './world-bank-countries.json' with {type:'json'};
import {useLanguages} from './language-context.js';
export default function WorldBankCountrySelect({value,selected,coverage,index,onChange}){
 const {uiLanguage}=useLanguages(),en=uiLanguage==='en';
 return <select aria-label={`${en?'Series':'Seria'} ${index+1}`} value={value} onChange={e=>onChange(e.target.value)}>
  {[false,true].map(aggregate=><optgroup key={String(aggregate)} label={aggregate?(en?'Aggregates':'Agregaty'):(en?'Countries and territories':'Kraje i terytoria')}>
   {countries.filter(c=>c.aggregate===aggregate).toSorted((a,b)=>a[uiLanguage].localeCompare(b[uiLanguage],uiLanguage)).map(c=>{const range=coverage.get(c.id);return <option key={c.id} value={c.id} disabled={c.id!==value&&(selected.includes(c.id)||!range)}>{c[uiLanguage]} · {range?`${range.first}–${range.last}`:en?'no data':'brak danych'}</option>;})}
  </optgroup>)}
 </select>;
}
