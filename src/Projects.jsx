import {FolderOpen} from 'lucide-react';
import React,{createContext,useContext,useRef,useState,useEffect} from 'react';
import {useVisualStatus} from './VisualSettings.jsx';
import {usePresentationSettings} from './Presentation.jsx';
import {useLanguages} from './language-context.js';
import {projectAssetIds,validateProject,projectName} from './reel-project.js';
import {listProjects,loadProject,saveProject,deleteProject,renameProject} from './project-api.js';
import './projects.css';
const Context=createContext(null);
export const useProjects=()=>useContext(Context);
export function useProjectState(seed,key,fallback){return useState(()=>seed&&Object.hasOwn(seed,key)?seed[key]:typeof fallback==='function'?fallback():fallback);}
export function useProjectSeed(kind){const p=useProjects();const [initial]=useState(()=>p?.drafts.current[kind]||(p?.seed?.kind===kind?p.seed.editor:null));return initial;}
export function useProjectDraft(kind,editor,active=true){const p=useProjects();if(p&&active){p.current.current.kind=kind;p.current.current.editor=editor;p.drafts.current[kind]=editor;}}
export function useProjectPreview(config,output,valid){const p=useProjects();if(p){p.current.current.preview={title:config.title,fontId:config.fontId,output,valid};}const setReady=p?.setPreviewReady;useEffect(()=>{setReady?.(!!valid);return()=>setReady?.(false);},[valid,setReady]);}
export function ProjectProvider({children}){
 const visuals=useVisualStatus(),presentation=usePresentationSettings(),language=useLanguages();
 const [seed,setSeed]=useState(null),[session,setSession]=useState(0),[active,setActive]=useState(null),[opened,setOpened]=useState(false),[busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState('');
 const current=useRef({}),drafts=useRef({}),lock=useRef(false);const [previewReady,setPreviewReady]=useState(false);
 async function run(fn){if(lock.current)return;lock.current=true;setBusy(true);setError('');setMessage('');try{return await fn();}catch(e){setError(e.message==='invalid'?'Podaj nazwę projektu (1–80 znaków).':e.message);}finally{lock.current=false;setBusy(false);}}
 async function save(name,copy=false){return run(async()=>{
  const c=current.current;if(!c.editor||!c.preview?.valid||!visuals.ready||visuals.busy)throw Error('Poczekaj na wczytanie poprawnego podglądu i wszystkich dodatków.');
  const document=validateProject({version:1,kind:c.kind,editor:c.editor,visuals:{...visuals.visuals,fontId:visuals.visuals.fontId||c.preview.fontId},presentation:{transition:presentation.transition,axisRange:presentation.axisRange,axisScale:presentation.axisScale},reelLanguage:language.reelLanguage,output:c.preview.output});
  const files={};for(const id of projectAssetIds(document)){if(!visuals.mediaFiles[id])throw Error('Brakuje pliku dodatku. Wgraj go ponownie przed zapisem.');files[id]=visuals.mediaFiles[id];}
  const identity=copy?null:active,result=await saveProject(identity?.id||crypto.randomUUID(),projectName(name),document,files,identity?.revision||0);setActive(result);setMessage('Zapisano na koncie. Możesz otworzyć projekt na innym urządzeniu.');return result;
 });}
 async function open(p){return run(async()=>{const saved=await loadProject(p.id),document=validateProject(saved.document);await visuals.applyProject(document.visuals,saved.files);presentation.setTransition(document.presentation.transition??.65);presentation.setAxisRange(document.presentation.axisRange||'fixed');presentation.setAxisScale(document.presentation.axisScale||'linear');language.setReelLanguage(document.reelLanguage);setSeed(document);setActive(saved);current.current={};drafts.current={};setSession(n=>n+1);setOpened(false);});}
 const value={previewReady,setPreviewReady,seed,session,active,current,drafts,opened,busy,error,message,show:()=>{setError('');setMessage('');setOpened(true);},close:()=>!busy&&setOpened(false),save,open,run,setActive};
 return <Context.Provider value={value}>{children}{opened&&<ProjectLibrary/>}</Context.Provider>;
}
export function ProjectApp({component:Component}){const {session}=useProjects();return <Component key={session}/>;}
export function ProjectButtons(){const p=useProjects();return <button className="save-btn project-button" aria-label="Moje projekty" onClick={p.show}><FolderOpen size={18}/><span>Projekty</span>{p.active&&<small className="project-current">{p.active.name}</small>}</button>;}
function ProjectLibrary(){
 const p=useProjects(),ref=useRef(),[items,setItems]=useState([]),[listing,setListing]=useState(true),[listError,setListError]=useState(''),[name,setName]=useState(p.active?.name||p.current.current.preview?.title?.slice(0,80)||'Moja rolka'),[deleteId,setDeleteId]=useState(null),[renameId,setRenameId]=useState(null),[newName,setNewName]=useState(''),[query,setQuery]=useState('');
 async function refresh(){setListing(true);setListError('');try{setItems(await listProjects());}catch(e){setListError(e.message);}finally{setListing(false);}}
 useEffect(()=>{ref.current.showModal();refresh();return()=>ref.current?.close();},[]);
 const available=p.previewReady&&!!p.current.current.preview?.valid;
 return <dialog className="project-dialog" ref={ref} onCancel={e=>{e.preventDefault();p.close();}} translate="no"><header><h2>Moje projekty</h2><button aria-label="Zamknij projekty" className="icon-btn" disabled={p.busy} onClick={p.close}>×</button></header><div className="project-dialog-body">
  <p>Zapis na koncie: dane, wygląd, własne teksty, animacje, dźwięki i dodane obrazy/GIF-y. Na telefonie otwórz tę samą stronę i zaloguj się tym samym kontem.</p>
  <section className="project-save"><label>Nazwa projektu<input aria-label="Nazwa projektu" maxLength={80} value={name} disabled={p.busy} onChange={e=>setName(e.target.value)}/></label><div className="project-actions"><button className="primary" disabled={p.busy||!available||!name.trim()} onClick={async()=>{if(await p.save(name))await refresh();}}>{p.busy?'Pracuję…':p.active?'Zapisz zmiany na koncie':'Zapisz projekt na koncie'}</button>{p.active&&<button className="secondary" disabled={p.busy||!available||!name.trim()} onClick={async()=>{if(await p.save(name,true))await refresh();}}>Zapisz jako kopię</button>}</div><small>Zapisuj zmiany przed przejściem na inne urządzenie. Dane w projekcie zachowują stan z chwili zapisu.</small></section>
  {p.message&&<p role="status" className="project-success">{p.message}</p>}{(p.error||listError)&&<p role="alert" className="error">{p.error||listError}</p>}
  <div className="project-actions"><input aria-label="Szukaj projektów" placeholder="Szukaj projektów…" value={query} onChange={e=>setQuery(e.target.value)}/><button className="secondary" disabled={p.busy||listing} onClick={refresh}>Odśwież listę</button></div>
  {listing?<p role="status">Wczytywanie projektów…</p>:!items.length&&!listError?<p>Nie masz jeszcze zapisanych projektów.</p>:<ul className="project-list">{items.filter(x=>x.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(item=><li key={item.id}><div><strong>{item.name}</strong><small>{({studio:'Studio',market:'Giełda',comparison:'Wiele serii',ai:'AI / LLM',releases:'Premiery AI',stories:'Biblioteka danych',graphics:'Grafika'})[item.kind]} · {new Date(item.updatedAt).toLocaleString('pl-PL')} · v{item.revision}</small></div><div className="project-actions"><button className="secondary" disabled={p.busy} onClick={()=>p.open(item)}>Otwórz</button><button className="text-btn" disabled={p.busy} onClick={()=>{setRenameId(item.id);setNewName(item.name);}}>Zmień nazwę</button><button className="text-btn" disabled={p.busy} onClick={()=>setDeleteId(item.id)}>Usuń</button></div>{renameId===item.id&&<div className="project-actions"><input aria-label="Nowa nazwa projektu" maxLength={80} value={newName} onChange={e=>setNewName(e.target.value)}/><button className="secondary" disabled={p.busy||!newName.trim()} onClick={()=>p.run(async()=>{const r=await renameProject(item,newName);if(p.active?.id===r.id){p.setActive(r);setName(r.name);}setRenameId(null);await refresh();})}>Zatwierdź nazwę</button></div>}{deleteId===item.id&&<div className="project-actions"><span>Usunąć projekt z konta?</span><button className="secondary" disabled={p.busy} onClick={()=>p.run(async()=>{await deleteProject(item);if(p.active?.id===item.id)p.setActive(null);setDeleteId(null);await refresh();})}>Tak, usuń</button><button className="text-btn" onClick={()=>setDeleteId(null)}>Anuluj</button></div>}</li>)}</ul>}
 </div></dialog>;
}
