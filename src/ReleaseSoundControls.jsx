import React,{useEffect,useRef,useState} from 'react';
import {Play,Volume2} from 'lucide-react';
import {useVisualStatus,Range} from './VisualSettings.jsx';
import {useLanguages} from './language-context.js';
import {releaseSounds,normalizeReleaseSound} from './reel-sounds.js';
import {createReleaseAudioPlayer} from './reel-audio.js';

export default function ReleaseSoundControls({config,beforeChange}){
 const v=useVisualStatus(),{uiLanguage}=useLanguages(),t=(pl,en)=>uiLanguage==='en'?en:pl;
 const m=v.visuals.design.motion,s=normalizeReleaseSound(m.releaseSound),player=useRef(null),[error,setError]=useState('');
 player.current??=createReleaseAudioPlayer();
 useEffect(()=>()=>player.current.stop(),[]);
 const patch=p=>{beforeChange();player.current.stop();v.design({motion:{...m,releaseSound:{...s,...p}}});};
 if(!config.releases)return null;
 return <details className="appearance-group" open><summary><Volume2 size={15}/> {t('Dźwięki premier','Release sounds')}</summary>
  <label className="visual-check"><input type="checkbox" checked={s.enabled} onChange={e=>patch({enabled:e.target.checked})}/>{t('Dźwięk w momencie premiery','Play a sound at each release')}</label>
  <div className="release-sound-grid">{releaseSounds.map(sound=><div className={s.preset===sound.id?'selected':''} key={sound.id}>
   <button type="button" aria-pressed={s.preset===sound.id} onClick={()=>patch({preset:sound.id,enabled:true})}>{sound[uiLanguage==='en'?'en':'pl']}</button>
   <button type="button" aria-label={`${t('Odsłuchaj','Preview')}: ${sound[uiLanguage==='en'?'en':'pl']}`} onClick={()=>{beforeChange();setError('');player.current.audition(sound.id,s.volume).catch(e=>setError(e.message));}}><Play size={15}/></button>
  </div>)}</div>
  <Range label={t('Głośność efektów','Effects volume')} min={0} max={100} step={1} suffix="%" value={s.volume} onChange={volume=>patch({volume})}/>
  <p className="visual-hint">{t('Odsłuchaj przyciskiem ▶, a nazwą wybierz efekt. Jeden dźwięk na datę premiery, także gdy tego dnia wyszło kilka modeli. Dźwięki są w podglądzie i pobranym filmie; przewijanie jest bezgłośne.','Preview with ▶ and select by name. One sound per release date, even for multiple models on the same day. Sounds play in the preview and exported video; scrubbing is silent.')}</p>
  {error&&<p role="alert" className="error">{error}</p>}
 </details>;
}
