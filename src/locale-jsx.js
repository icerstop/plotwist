import React,{useContext} from 'react';
import {LanguageContext} from './language-context.js';
import {translate} from './translations.js';
// Localize React-owned labels before rendering, never mutate the DOM or form state.
// Option values, refs, callbacks, IDs and user input retain their original semantics.
export function localizedProps(tag,props,children,language){
 const next={...props};delete next.key;
 if(tag==='option'&&next.value===undefined&&children.every(c=>typeof c==='string'||typeof c==='number'))next.value=children.join('');
 for(const key of ['aria-label','aria-description','placeholder','title','alt',...(tag==='optgroup'?['label']:[])])if(props?.translate!=='no'&&typeof next[key]==='string')next[key]=translate(next[key],language);
 const protectedText=props?.translate==='no'||['textarea','pre','code','script','style'].includes(tag);
 return {props:next,children:protectedText?children:children.map(c=>typeof c==='string'?translate(c,language):c)};
}
function LocalizedElement({as,elementProps={},children}){
 const {uiLanguage}=useContext(LanguageContext);
 const list=Array.isArray(children)?children:[children];
 const translated=localizedProps(as,elementProps,list,uiLanguage);
 return React.createElement(as,translated.props,...translated.children);
}
export function localizedJsx(type,props,...children){
 if(typeof type!=='string')return React.createElement(type,props,...children);
 return React.createElement(LocalizedElement,{as:type,elementProps:props||{},key:props?.key},...children);
}
