import React,{useState} from 'react';
import {marketStories} from './market-stories.js';
import {useLanguages} from './language-context.js';

export default function MarketStories({catalog,onApply}){
 const {uiLanguage}=useLanguages();
 const [selected,setSelected]=useState(marketStories[0].id);
 const story=marketStories.find(s=>s.id===selected);
 const ready=story.symbols.every(symbol=>catalog.some(a=>a.symbol===symbol));
 return <details className="market-stories">
  <summary>Historie gotowe do rolki <span>9 zestawów</span></summary>
  <div className="market-story-picker">
   <label><span>Wybierz historię</span><select aria-label="Wybierz historię" value={selected} onChange={e=>setSelected(e.target.value)}>{marketStories.map(s=><option translate="no" key={s.id} value={s.id}>{s.title[uiLanguage]}</option>)}</select></label>
   <div><p translate="no">{story.description[uiLanguage]}</p><small>{story.start} → {story.end} · {story.symbols.join(' / ')}</small><a href={story.sourceUrl} target="_blank" rel="noreferrer"><span>Kontekst historyczny:</span> {story.sourceLabel}</a></div>
   <button className="secondary" disabled={!ready} onClick={()=>onApply(story)}>Wczytaj zestaw</button>
  </div>
  <p className="helper">Wczytanie zastępuje serie, daty i tytuł. Możesz je potem zmieniać. Zestawy pokazują wyceny w kontekście wydarzeń, nie dowodzą związku przyczynowego.</p>
 </details>;
}
