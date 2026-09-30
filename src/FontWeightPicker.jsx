import React from 'react';
import {fontWeights,fontWeightNames,normalizeFontWeight,nearestFontWeight} from './reel-fonts.js';
import {useLanguages} from './language-context.js';
import {translate} from './translations.js';

export default function FontWeightPicker({label,fontId,value,onChange,element=false}){
 const {uiLanguage}=useLanguages(),weights=fontWeights(fontId),requested=normalizeFontWeight(value),current=nearestFontWeight(fontId,requested);
 return <label className="visual-field">{label}<select aria-label={label} value={current} onChange={e=>onChange(normalizeFontWeight(e.target.value))}>
  <option value="auto">{element?'Z całej rolki / designu':'Automatyczna · z designu'}</option>
  {weights.map(weight=><option key={weight} value={weight}>{`${weight} · ${translate(fontWeightNames[weight]||String(weight),uiLanguage)}`}</option>)}
 </select>{weights.length===1&&<small>Ta czcionka ma jedną grubość. Wybierz inny krój, aby uzyskać więcej wariantów.</small>}{requested!==current&&<small>Ten krój używa najbliższej dostępnej grubości. Zapisana wartość wróci po zmianie czcionki, jeśli będzie obsługiwana.</small>}</label>;
}
