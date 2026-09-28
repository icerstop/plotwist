import React,{createContext,useContext,useEffect,useMemo,useState} from 'react';
import {localizeReelConfig} from './reel-language.js';
export const LanguageContext=createContext({uiLanguage:'pl',reelLanguage:'pl'});
export const localeFor=language=>language==='en'?'en-GB':'pl-PL';
export function readLanguages(storage){try{const saved=JSON.parse(storage.getItem('plotwist-languages-v1'));return {uiLanguage:saved?.uiLanguage==='en'?'en':'pl',reelLanguage:saved?.reelLanguage==='en'?'en':'pl'};}catch{return {uiLanguage:'pl',reelLanguage:'pl'};}}
export function LanguageProvider({children}){
 const [languages,setLanguages]=useState(()=>{try{return readLanguages(globalThis.localStorage);}catch{return readLanguages(null);}});
 useEffect(()=>{document.documentElement.lang=languages.uiLanguage;try{localStorage.setItem('plotwist-languages-v1',JSON.stringify(languages));}catch{/* The controls remain usable when browser storage is disabled. */}},[languages]);
 const value=useMemo(()=>({...languages,setUiLanguage:uiLanguage=>setLanguages(old=>({...old,uiLanguage})),setReelLanguage:reelLanguage=>setLanguages(old=>({...old,reelLanguage}))}),[languages]);
 return React.createElement(LanguageContext.Provider,{value},children);
}
export const useLanguages=()=>useContext(LanguageContext);
export function useReelLanguage(config){const {reelLanguage}=useLanguages();return useMemo(()=>localizeReelConfig(config,reelLanguage),[config,reelLanguage]);}
