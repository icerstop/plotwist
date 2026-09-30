import React,{useEffect,useRef,useState} from 'react';
import {Cloud,Save,RefreshCw,Download,Upload,Trash2,Pencil,Check} from 'lucide-react';
import {listThemes,loadTheme,saveTheme,renameTheme,deleteTheme} from './theme-api.js';
import {themeName,duplicateThemeName,uniqueThemeName,exportTheme,importTheme} from './custom-themes.js';
import {reelThemes} from './reel-design.js';
import {reelFont} from './reel-fonts.js';
import {useLanguages} from './language-context.js';
import {translate} from './translations.js';
import './custom-themes.css';

export default function CustomThemes({visual,fontId}){
 const [themes,setThemes]=useState([]),[loading,setLoading]=useState(true),[pending,setPending]=useState(''),[error,setError]=useState(null),[status,setStatus]=useState(''),[name,setName]=useState(''),[selected,setSelected]=useState(''),[action,setAction]=useState(''),[rename,setRename]=useState('');
 const input=useRef(),lock=useRef(false),mounted=useRef(true),generation=useRef(0),{uiLanguage}=useLanguages();
 const t=value=>translate(value,uiLanguage),chosen=themes.find(x=>x.id===selected),disabled=!!pending||loading;
 async function refresh(quiet=false){
  const ticket=++generation.current;if(!quiet)setLoading(true);
  try{const items=await listThemes();if(mounted.current&&ticket===generation.current){setThemes(items);setError(null);}}
  catch(e){if(mounted.current&&ticket===generation.current)setError(e);}
  finally{if(mounted.current&&ticket===generation.current)setLoading(false);}
 }
 useEffect(()=>{mounted.current=true;refresh();const focus=()=>{if(!lock.current&&!document.hidden)refresh(true);};window.addEventListener('focus',focus);document.addEventListener('visibilitychange',focus);return()=>{mounted.current=false;generation.current++;window.removeEventListener('focus',focus);document.removeEventListener('visibilitychange',focus);};},[]);
 async function run(label,fn){
  if(lock.current)return;lock.current=true;generation.current++;setLoading(false);setPending(label);setError(null);setStatus('');
  try{await fn();}catch(e){if(mounted.current)setError(e);}finally{lock.current=false;if(mounted.current)setPending('');}
 }
 function remember(theme){if(!mounted.current)return;setThemes(list=>[theme,...list.filter(x=>x.id!==theme.id)]);setSelected(theme.id);setAction('');}
 async function saveNew(){
  const clean=themeName(name);if(duplicateThemeName(themes,clean))throw new Error(t('Masz już motyw o tej nazwie. Wybierz inną nazwę lub zaktualizuj istniejący motyw.'));
  remember(await saveTheme(visual.captureTheme({name:clean,fontId})));setName('');setStatus('Zapisano motyw na koncie.');
 }
 async function apply(){const theme=await loadTheme(chosen.id);await visual.applyTheme(theme);setStatus('Wczytano motyw. Dane i treść rolki zostały zachowane.');}
 async function update(){const snapshot=visual.captureTheme({name:chosen.name,id:chosen.id,createdAt:chosen.createdAt,fontId});remember(await saveTheme(snapshot,chosen.revision));setStatus('Zaktualizowano motyw na koncie.');}
 async function download(){const content=await exportTheme(await loadTheme(chosen.id)),url=URL.createObjectURL(new Blob([content],{type:'application/json'})),link=document.createElement('a');link.href=url;link.download=`${chosen.name.replace(/[^\p{L}\p{N} _-]/gu,'').slice(0,60)||'motyw'}.plotwist.json`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);setStatus('Pobrano kopię motywu.');}
 const appearance=chosen?.appearance,theme=reelThemes.find(x=>x.id===appearance?.design.theme)||reelThemes[0],bg=appearance?.background;
 return <section className="custom-themes" aria-label="Moje motywy">
  <div className="custom-themes-heading"><strong><Cloud size={17}/>Moje motywy</strong><button type="button" className="icon-btn" aria-label="Odśwież motywy" disabled={!!pending} onClick={()=>refresh()}><RefreshCw size={15}/></button></div>
  <p className="visual-hint">Zapisz wygląd i korzystaj z niego na różnych urządzeniach po zalogowaniu na to samo konto.</p>
  <div className="theme-save-row"><label className="visual-field">Nazwa nowego motywu<input aria-label="Nazwa nowego motywu" maxLength={60} placeholder="Np. Mój styl redakcyjny" value={name} disabled={!!pending} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!disabled&&name.trim()){e.preventDefault();run('Zapisywanie motywu…',saveNew);}}}/></label>
   <button type="button" className="secondary full" disabled={disabled||!name.trim()||!!error&&['signin','local'].includes(error.code)} onClick={()=>run('Zapisywanie motywu…',saveNew)}><Save size={15}/>Zapisz obecny wygląd</button></div>
  {loading&&<p role="status" className="visual-hint">Wczytywanie motywów z konta…</p>}
  {!loading&&!themes.length&&!error&&<p className="theme-empty">Twój pierwszy motyw może powstać z obecnego wyglądu rolki.</p>}
  {!!themes.length&&<>
   <label className="visual-field">Zapisane motywy<select aria-label="Zapisane motywy" value={selected} disabled={disabled} onChange={e=>{setSelected(e.target.value);setAction('');setStatus('');}}><option value="">Wybierz własny motyw</option>{themes.map(x=><option key={x.id} value={x.id} translate="no">{x.name}</option>)}</select></label>
   {chosen&&<div className="saved-theme-card">
    <div className="saved-theme-preview" aria-hidden="true" style={{color:theme.fg,background:bg.type==='color'?bg.color:bg.type==='gradient'?`linear-gradient(${bg.angle}deg,${bg.color},${bg.color2})`:theme.bg}}><b style={{fontFamily:reelFont(appearance.fontId)}}>Aa</b><svg viewBox="0 0 110 44"><path d="M2 37L27 24L52 30L77 13L106 5" fill="none" stroke={theme.colors[0]} strokeWidth="3"/><path d="M2 23L27 30L52 17L77 22L106 10" fill="none" stroke={theme.colors[1]} strokeWidth="2"/></svg></div>
    <div className="saved-theme-meta"><strong translate="no">{chosen.name}</strong><small>{new Intl.DateTimeFormat(uiLanguage==='en'?'en-GB':'pl-PL',{dateStyle:'medium',timeStyle:'short'}).format(new Date(chosen.updatedAt))}</small></div>
    <button type="button" className="secondary full" disabled={disabled} onClick={()=>run('Wczytywanie motywu…',apply)}><Check size={15}/>Zastosuj do rolki</button>
    <button type="button" className="secondary full" disabled={disabled} onClick={()=>run('Zapisywanie motywu…',update)}><Save size={15}/>Zaktualizuj z obecnego wyglądu</button>
    <div className="saved-theme-actions"><button type="button" className="text-btn" disabled={disabled} onClick={()=>{setRename(chosen.name);setAction(action==='rename'?'':'rename');}}><Pencil size={13}/>Zmień nazwę</button><button type="button" className="text-btn" disabled={disabled} onClick={()=>run('Pobieranie motywu…',download)}><Download size={13}/>Eksportuj</button><button type="button" className="text-btn" disabled={disabled} onClick={()=>setAction(action==='delete'?'':'delete')}><Trash2 size={13}/>Usuń</button></div>
    {action==='rename'&&<div className="theme-inline-action"><label className="visual-field">Nowa nazwa motywu<input aria-label="Nowa nazwa motywu" value={rename} maxLength={60} onChange={e=>setRename(e.target.value)} disabled={disabled}/></label><button type="button" className="secondary" disabled={disabled||!rename.trim()} onClick={()=>run('Zapisywanie motywu…',async()=>{remember(await renameTheme(chosen,themeName(rename)));setStatus('Zmieniono nazwę motywu.');})}>Zapisz nazwę</button><button type="button" className="text-btn" disabled={disabled} onClick={()=>setAction('')}>Anuluj</button></div>}
    {action==='delete'&&<div className="theme-inline-action"><p>Usunąć zapisany motyw? Obecny wygląd rolki zostanie zachowany.</p><button type="button" className="secondary" disabled={disabled} onClick={()=>run('Usuwanie motywu…',async()=>{await deleteTheme(chosen);setThemes(list=>list.filter(x=>x.id!==chosen.id));setSelected('');setAction('');setStatus('Usunięto motyw z konta.');})}>Usuń z konta</button><button type="button" className="text-btn" disabled={disabled} onClick={()=>setAction('')}>Anuluj</button></div>}
   </div>}
  </>}
  <button type="button" className="text-btn theme-import" disabled={disabled} onClick={()=>input.current.click()}><Upload size={14}/>Importuj motyw z pliku</button><input hidden ref={input} type="file" accept=".json,application/json" aria-label="Plik własnego motywu" onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)run('Zapisywanie motywu…',async()=>{const imported=await importTheme(file);imported.name=uniqueThemeName(themes,imported.name);remember(await saveTheme(imported));setStatus('Zaimportowano motyw na konto.');});}}/>
  <p className="visual-hint">Motyw zawiera czcionki, kolory, tło, logo, układ, wykres i animacje. Dane, teksty i dodatkowe obrazki należą do rolki.</p>
  {(pending||status)&&<p role="status" className="theme-status">{pending||status}</p>}
  {error&&<div role="alert" className="theme-error"><p>{t(error.message)}</p>{error.code==='signin'?<a href="/signin-with-chatgpt?return_to=%2F" target="_top">Zaloguj się przez ChatGPT</a>:error.code==='local'?<a href="https://plotwist-chart-studio.icerstop.chatgpt.site/" target="_blank" rel="noreferrer">Otwórz stronę z motywami na koncie</a>:<button type="button" className="text-btn" disabled={!!pending} onClick={()=>refresh()}>Odśwież listę</button>}</div>}
 </section>;
}
