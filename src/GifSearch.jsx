import React,{useEffect,useRef,useState} from 'react';
import {Search,Plus,LoaderCircle} from 'lucide-react';
import {searchGifs,gifError,GIF_DOCS} from './gif-search.js';
import {useLanguages} from './language-context.js';
import {translate} from './translations.js';
import './gif-search.css';

export default function GifSearch({onAdd,full,busy,error}){
 const {uiLanguage}=useLanguages(),t=text=>translate(text,uiLanguage);
 const [query,setQuery]=useState(''),[results,setResults]=useState([]),[searched,setSearched]=useState(false),[loading,setLoading]=useState(false),[failure,setFailure]=useState(''),[next,setNext]=useState(null),[target,setTarget]=useState('sticker'),[added,setAdded]=useState(''),[adding,setAdding]=useState(false);
 const request=useRef(),lastQuery=useRef(''),open=useRef(false);
 useEffect(()=>()=>request.current?.abort(),[]);
 async function search(q=query,page=1){
  request.current?.abort();const controller=new AbortController();request.current=controller;
  setLoading(true);setFailure('');setAdded('');
  if(page===1){setResults([]);setNext(null);lastQuery.current=q;}
  try{const result=await searchGifs(q,page,{signal:controller.signal});if(controller.signal.aborted)return;
   setResults(old=>page===1?result.items:[...new Map([...old,...result.items].map(item=>[item.id,item])).values()]);setNext(result.nextPage);setSearched(true);
  }catch(e){if(!controller.signal.aborted){setFailure(gifError(e));setSearched(true);}}
  finally{if(!controller.signal.aborted)setLoading(false);}
 }
 async function insert(item){setAdded('');setAdding(true);try{if(await onAdd(item,target))setAdded(target==='background'?'GIF ustawiony jako tło.':'GIF dodany do rolki. Możesz go przesunąć na podglądzie.');}finally{setAdding(false);}}
 const blocked=busy||adding||(target==='sticker'&&full);
 return <details className="gif-search" onToggle={e=>{if(e.currentTarget.open&&!open.current){open.current=true;search('');}}}>
  <summary><Search size={17}/><span>{t('Wyszukaj GIF-y online')}</span></summary>
  <div className="gif-search-body">
   <div className="gif-search-bar" role="search"><input aria-label={t('Szukaj GIF-ów')} placeholder={t('Np. money, wow, robot…')} value={query} maxLength={160} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();search();}}}/><button type="button" className="secondary" onClick={()=>search()} aria-label={t('Wyszukaj GIF-y')}><Search size={17}/></button></div>
   <div className="gif-suggestions">{['money','wow','robot','celebration'].map(q=><button type="button" key={q} onClick={()=>{setQuery(q);search(q);}}>{q}</button>)}</div>
   <label className="visual-field">{t('Wstaw GIF jako')}<select aria-label={t('Wstaw GIF jako')} value={target} onChange={e=>{setTarget(e.target.value);setAdded('');}}><option value="sticker">{t('Dodatek na rolce')}</option><option value="background">{t('Tło rolki')}</option></select></label>
   {target==='sticker'&&full&&<p className="visual-hint">{t('Masz już 3 dodatki. Usuń jeden lub wstaw GIF jako tło.')}</p>}
   {target==='background'&&<p className="visual-hint">{t('Wybrany GIF zastąpi obecne tło.')}</p>}
   {failure&&<p className="error" role="alert">{t(failure)} <button type="button" className="text-btn" onClick={()=>search(lastQuery.current,results.length&&next?next:1)}>{t('Spróbuj ponownie')}</button></p>}
   {error&&<p className="error" role="alert">{t(error)}</p>}
   <div role="status" className="gif-status">{adding?<><LoaderCircle size={15}/>{t('Pobieranie i przygotowywanie GIF-a…')}</>:added?t(added):loading?t('Wyszukiwanie GIF-ów…'):searched&&!results.length&&!failure?t('Brak GIF-ów dla tego hasła. Spróbuj innego, najlepiej po angielsku.'):null}</div>
   <div className="gif-results" aria-label={t('Wyniki wyszukiwania GIF-ów')} aria-busy={loading}>
    {results.map(item=><div className="gif-result" key={item.id}><button type="button" className="gif-insert" disabled={blocked} onClick={()=>insert(item)} aria-label={`${t('Wstaw GIF')}: ${item.title}`} title={item.title}>
     <img src={item.url} alt="" loading="lazy" referrerPolicy="no-referrer" onError={e=>{if(e.currentTarget.dataset.fallback)return;e.currentTarget.dataset.fallback='1';e.currentTarget.src=item.preview;}}/>
     <span className="gif-result-title" translate="no">{item.title}</span><span className="gif-insert-label"><Plus size={14}/>{t('Wstaw GIF')}</span>
    </button></div>)}
   </div>
   {next&&results.length<72&&<button type="button" className="secondary full" disabled={loading} onClick={()=>search(lastQuery.current,next)}>{t('Więcej GIF-ów')}</button>}
   <p className="visual-hint gif-credit"><a href={GIF_DOCS} target="_blank" rel="noreferrer">GIF-y: GifSnap</a><span>{t('Bez konta i klucza API. Wstawione GIF-y zapisują się w tej przeglądarce.')}</span></p>
   <p className="visual-hint">{t('GIF zachowuje własne tempo i liczbę klatek. Wykres nadal animuje się w 30 lub 60 fps.')}</p>
  </div>
 </details>;
}
