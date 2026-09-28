import React from 'react';
import {useLanguages} from './language-context.js';
import './language.css';
export default function LanguageControls(){const {uiLanguage,reelLanguage,setUiLanguage,setReelLanguage}=useLanguages();return <div className="language-controls" aria-label="Ustawienia języka">
 <label><span>Menu</span><select aria-label="Język menu" value={uiLanguage} onChange={e=>setUiLanguage(e.target.value)}><option value="pl">Polski</option><option value="en">English</option></select></label>
 <label><span>Rolka</span><select aria-label="Język rolki" value={reelLanguage} onChange={e=>setReelLanguage(e.target.value)}><option value="pl">Polski</option><option value="en">English</option></select></label>
 </div>;}
