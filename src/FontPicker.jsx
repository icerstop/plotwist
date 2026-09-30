import React,{useEffect,useId,useMemo,useRef,useState} from 'react';
import {Check,ChevronDown,Search,X} from 'lucide-react';
import {reelFonts,reelFontGroups,nearestFontWeight} from './reel-fonts.js';
import {isReelFontReady,preloadReelFont} from './reel-style.js';
import {useLanguages} from './language-context.js';
import {translate} from './translations.js';
import './font-picker.css';

const sample='Zażółć gęślą jaźń · Aa 0123456789';
const fontById=id=>reelFonts.find(font=>font.id===id)||reelFonts[0];
const previewStyle=font=>({fontFamily:font.family,fontWeight:nearestFontWeight(font.id,400)});

function useFontPreview(font,root,eager=false){
 const ref=useRef(null),[attempt,setAttempt]=useState(0);
 const [state,setState]=useState(()=>({id:font.id,status:isReelFontReady(font.id)?'ready':'loading'}));
 useEffect(()=>{
  let active=true,observer;
  const load=()=>{
   observer?.disconnect();
   if(isReelFontReady(font.id)){setState({id:font.id,status:'ready'});return;}
   setState({id:font.id,status:'loading'});
   preloadReelFont(font.id).then(()=>{if(active)setState({id:font.id,status:'ready'});},()=>{if(active)setState({id:font.id,status:'error'});});
  };
  if(eager||attempt||isReelFontReady(font.id)||!globalThis.IntersectionObserver)load();
  else {observer=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting))load();},{root:root?.current,rootMargin:'160px'});if(ref.current)observer.observe(ref.current);}
  return()=>{active=false;observer?.disconnect();};
 },[font.id,root,eager,attempt]);
 return {ref,status:state.id===font.id?state.status:isReelFontReady(font.id)?'ready':'loading',retry:()=>setAttempt(n=>n+1)};
}

function FontChoice({font,id,name,selected,onChoose,root,t}){
 const {ref,status,retry}=useFontPreview(font,root);
 return <li ref={ref} className="font-choice" data-font-id={font.id} data-preview-status={status}>
  <button type="button" className="font-choice-select" aria-pressed={selected} aria-label={name} onClick={()=>onChoose(id)}>
   <span className="font-choice-name" translate="no" style={status==='ready'?previewStyle(font):undefined}>{name}</span>
   {selected&&<Check className="font-choice-check" size={17} aria-hidden="true"/>}
   {status==='ready'?<span className="font-choice-sample" translate="no" style={previewStyle(font)} aria-hidden="true">{sample}</span>:<span className="font-choice-status">{t(status==='error'?'Podgląd niedostępny':'Wczytywanie podglądu…')}</span>}
  </button>
  {status==='error'&&<button type="button" className="font-preview-retry" onClick={retry}>{t('Ponów wczytanie podglądu')}</button>}
 </li>;
}

export function FontPicker({value,onChange,label='Czcionka rolki',inheritFontId}){
 const {uiLanguage}=useLanguages(),t=text=>translate(text,uiLanguage),uid=useId();
 const dialog=useRef(null),trigger=useRef(null),search=useRef(null),list=useRef(null);
 const [open,setOpen]=useState(false),[query,setQuery]=useState(''),[group,setGroup]=useState('');
 const font=fontById(value||inheritFontId),selectedPreview=useFontPreview(font,null,true);
 const selectedName=value||!inheritFontId?t(font.name):t('Czcionka całej rolki');
 const options=useMemo(()=>reelFonts.filter(f=>(!group||f.group===group)&&f.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),[query,group]);
 const close=()=>{dialog.current?.close();setOpen(false);trigger.current?.focus();};
 const choose=id=>{onChange(id);close();};
 useEffect(()=>{if(!open)return;const el=dialog.current;el.showModal();search.current?.focus();return()=>{if(el.open)el.close();};},[open]);
 useEffect(()=>{if(list.current)list.current.scrollTop=0;},[query,group]);
 return <div className="field font-picker">
  <span className="field-label" id={`${uid}-label`}>{t(label)}</span>
  <button ref={trigger} type="button" className="font-picker-trigger" aria-label={t(label)} aria-haspopup="dialog" aria-expanded={open} aria-controls={open?`${uid}-dialog`:undefined} onClick={()=>{setQuery('');setGroup('');setOpen(true);}}>
   <span translate="no" style={selectedPreview.status==='ready'?previewStyle(font):undefined}>{selectedName}</span><ChevronDown size={17} aria-hidden="true"/>
  </button>
  <span className="font-sample" translate="no" style={selectedPreview.status==='ready'?previewStyle(font):undefined}>{selectedPreview.status==='ready'?<>Zażółć gęślą jaźń.<br/>0123456789 · 1 234,56 zł · +12,5%</>:t(selectedPreview.status==='error'?'Podgląd niedostępny':'Wczytywanie podglądu…')}</span>
  {selectedPreview.status==='error'&&<button type="button" className="font-preview-retry" onClick={selectedPreview.retry}>{t('Ponów wczytanie podglądu')}</button>}
  {open&&<dialog ref={dialog} id={`${uid}-dialog`} className="font-picker-dialog" aria-labelledby={`${uid}-heading`} onKeyDown={e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}}} onCancel={e=>{e.preventDefault();close();}} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close();}}}>
   <header><div><h2 id={`${uid}-heading`}>{t(label)}</h2><p>{t('Porównaj kroje przed wyborem.')}</p></div><button type="button" className="icon-btn" aria-label={t('Zamknij wybór czcionki')} onClick={close}><X size={21}/></button></header>
   <div className="font-picker-filters">
    <div className="font-picker-search"><Search size={18} aria-hidden="true"/><input ref={search} type="search" aria-label={t('Szukaj czcionki')} placeholder={t('Szukaj czcionki…')} value={query} onChange={e=>setQuery(e.target.value)}/></div>
    <label><span>{t('Rodzaj czcionki')}</span><select aria-label={t('Rodzaj czcionki')} value={group} onChange={e=>setGroup(e.target.value)}>{[{id:'',name:'Wszystkie kroje'},...reelFontGroups].map(g=><option key={g.id} value={g.id}>{t(g.name)}</option>)}</select></label>
   </div>
   <div ref={list} className="font-picker-results">
    <ul aria-label={t('Dostępne czcionki')}>
     {inheritFontId&&!query&&!group&&<FontChoice font={fontById(inheritFontId)} id="" name={t('Czcionka całej rolki')} selected={!value} onChoose={choose} root={list} t={t}/>}
     {options.map(f=><FontChoice key={f.id} font={f} id={f.id} name={t(f.name)} selected={value===f.id} onChoose={choose} root={list} t={t}/>)}
    </ul>
    {!options.length&&<p className="font-picker-empty" role="status">{t('Nie znaleziono czcionki. Zmień nazwę lub kategorię.')}</p>}
   </div>
   <footer>{t('Podglądy wczytują się podczas przewijania listy.')}</footer>
  </dialog>}
 </div>;
}
