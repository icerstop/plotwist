export const PROJECT_KINDS=['studio','market','comparison','ai','releases','stories','graphics'];
export const PROJECT_DOCUMENT_LIMIT=25*1024*1024;
export function projectName(value){const name=typeof value==='string'?value.trim().replace(/\s+/g,' '):'';if(!name||name.length>80)throw Error('invalid');return name;}
export function projectAssetIds(document){const v=document.visuals||{};return [...new Set([v.background?.assetId,v.logo?.assetId,...(v.stickers||[]).map(s=>s.assetId)].filter(Boolean))];}
export function validateProject(raw){
 if(raw?.version!==1||!PROJECT_KINDS.includes(raw.kind)||!raw.editor||typeof raw.editor!=='object'||Array.isArray(raw.editor)||!raw.visuals?.design||!raw.presentation||!['pl','en'].includes(raw.reelLanguage))throw Error('invalid');
 const ids=projectAssetIds(raw);if(ids.length>5||ids.some(id=>['__proto__','constructor','prototype'].includes(id)||typeof id!=='string'||!/^[a-zA-Z0-9_-]{1,100}$/.test(id)))throw Error('invalid');
 const encoded=JSON.stringify(raw);if(new TextEncoder().encode(encoded).length>PROJECT_DOCUMENT_LIMIT)throw Error('too_large');
 return JSON.parse(encoded);
}
export function projectView(kind){return ['ai','releases'].includes(kind)?'ai':['market','comparison'].includes(kind)?'market':kind;}
