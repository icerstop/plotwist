import React from 'react';
import {Color,useVisualStatus} from './VisualSettings.jsx';
import {useLanguages} from './language-context.js';
export default function GraphicAppearanceControls({config}){
 const v=useVisualStatus(),chart=v.visuals.design.chart,patch=p=>v.design({chart:{...chart,...p}});
 const g=config.graphic,set=config.onGraphicChange,{uiLanguage}=useLanguages(),en=uiLanguage==='en';
 if(!g||!set)return null;
 return <div className="graphic-chart-controls" translate="no">
  <label className="visual-check"><input type="checkbox" checked={chart.axisLabels} onChange={e=>patch({axisLabels:e.target.checked})}/>{en?'Show value axis':'Pokaż oś wartości'}</label>
  {!['regions','overview'].includes(g.layout)&&<label className="visual-check"><input type="checkbox" checked={chart.grid!=='none'} onChange={e=>patch({grid:e.target.checked?'horizontal':'none'})}/>{en?'Show row guides':'Pokaż linie pomocnicze'}</label>}
  <Color label={en?'Active conscription colour':'Kolor czynnego poboru'} value={g.activeColor} onChange={activeColor=>set({activeColor})}/>
  <Color label={en?'No active conscription colour':'Kolor braku czynnego poboru'} value={g.inactiveColor} onChange={inactiveColor=>set({inactiveColor})}/>
  {[['flags','Flagi krajów','Country flags'],['names','Nazwy krajów','Country names'],['values','Wartości dzietności / udziałów','Fertility / share values'],['summary','Podsumowanie grup','Group summary'],['statisticLabel','Napis „Średnia” / „Mediana”','“Mean” / “Median” label'],['counts','Liczba krajów (n)','Country counts (n)'],['reference','Opis progu zastępowalności','Replacement-level note']].filter(([key])=>!(['regions','overview'].includes(g.layout)&&['flags','names'].includes(key))).map(([key,pl,eng])=><label className="visual-check" key={key}><input type="checkbox" checked={g[key]!==false} onChange={e=>set({[key]:e.target.checked})}/>{en?eng:pl}</label>)}
  <label className="visual-field">{en?'Decimal places':'Miejsca po przecinku'}<select aria-label={en?'Decimal places':'Miejsca po przecinku'} value={g.decimals} onChange={e=>set({decimals:Number(e.target.value)})}>{[0,1,2,3].map(n=><option key={n}>{n}</option>)}</select></label>
 </div>;
}
