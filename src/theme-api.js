import {normalizeSavedTheme,themeAssetIds} from './custom-themes.js';

const messages={
 signin:'Zaloguj się, aby korzystać z motywów na koncie.',
 local:'Motywy na koncie są dostępne na opublikowanej stronie.',
 unavailable:'Nie udało się połączyć z kontem. Spróbuj ponownie. Wygląd rolki pozostał bez zmian.',
 conflict:'Motyw zmienił się na innym urządzeniu. Odśwież listę przed ponownym zapisem.',
 duplicate:'Masz już motyw o tej nazwie. Wybierz inną nazwę lub zaktualizuj istniejący motyw.',
 not_found:'Ten motyw został usunięty. Odśwież listę motywów.',
 limit:'Na koncie można zapisać do 100 motywów. Usuń niepotrzebny motyw.',
 too_large:'Motyw jest zbyt duży. Tło i logo mogą mieć do 12 MB każde.',
 invalid:'Nieprawidłowy motyw. Sprawdź nazwę, tło i logo.',
 invalid_image:'Obsługiwane pliki: PNG, JPG, WebP i animowany GIF.',
 asset_unavailable:'Nie udało się pobrać tła lub logo. Spróbuj wczytać motyw ponownie.',
 forbidden:'Sesja konta wygasła lub żądanie zostało odrzucone. Odśwież stronę.',
};
export class ThemeError extends Error {constructor(code){super(messages[code]||messages.unavailable);this.code=code;}}
async function request(path='',options={},binary=false){
 let response;try{response=await fetch(`/api/themes${path}`,{...options,credentials:'same-origin',cache:'no-store',headers:{...(options.method&&options.method!=='GET'?{'X-Plotwist-Write':'1'}:{}),...options.headers},signal:options.signal||AbortSignal.timeout(60000)});}catch{throw new ThemeError('unavailable');}
 if(response.status===401||response.redirected)throw new ThemeError('signin');
 if(!response.ok){let body;try{body=await response.json();}catch{}throw new ThemeError(body?.code);}
 if(binary)return response.blob();
 if(!response.headers.get('content-type')?.includes('application/json'))throw new ThemeError('unavailable');
 return response.json();
}
export const listThemes=async()=>{const result=await request();if(!Array.isArray(result.themes))throw new ThemeError('unavailable');return result.themes;};
export async function loadTheme(id){
 const theme=await request(`/${encodeURIComponent(id)}`),files={};
 await Promise.all(themeAssetIds(theme).map(async assetId=>{const meta=theme.assets.find(a=>a.id===assetId);if(!meta)throw new ThemeError('asset_unavailable');const blob=await request(`/${encodeURIComponent(id)}/assets/${encodeURIComponent(assetId)}`,{},true);files[assetId]=new File([blob],meta.name,{type:meta.type});}));
 return {...normalizeSavedTheme({...theme,files}),revision:theme.revision};
}
export async function saveTheme(raw,revision=0){
 const theme=normalizeSavedTheme(raw),form=new FormData();
 form.append('metadata',JSON.stringify({version:1,name:theme.name,appearance:theme.appearance,revision}));
 for(const [id,file] of Object.entries(theme.files))form.append(id,file,file.name||'theme-image');
 return request(`/${encodeURIComponent(theme.id)}`,{method:'PUT',body:form});
}
export const renameTheme=(theme,name)=>request(`/${encodeURIComponent(theme.id)}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,revision:theme.revision})});
export const deleteTheme=theme=>request(`/${encodeURIComponent(theme.id)}`,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({revision:theme.revision})});
