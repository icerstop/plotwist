// GifSnap's public, keyless API. Download media through its documented CORS proxy.
export const GIF_PROVIDER='GifSnap';
export const GIF_DOCS='https://gifsnap.com/docs';
const API='https://gifsnap.com/api/v1',CDN='pub-9502c4126a384b90aa92ed45d7f6c379.r2.dev';
const MAX_BYTES=12*1024*1024,cache=new Map();
export function gifMediaUrl(value){
 try{
  const url=new URL(value);
  if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
  if(url.hostname==='gifsnap.com'&&url.pathname.startsWith('/api/v1/media/'))return url.href;
  if(url.hostname!==CDN||!/^\/(gifs|thumbnails)\//.test(url.pathname))return null;
  return `${API}/media/${btoa(url.href).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_')}`;
 }catch{return null;}
}
export function normalizeGifResults(payload,page=1){
 if(!Array.isArray(payload?.data))throw new Error('Usługa GIF-ów zwróciła nieprawidłową odpowiedź. Spróbuj ponownie.');
 const seen=new Set(),items=[];
 for(const item of payload.data){
  // Only real GIF renditions: do not silently freeze animated WebP or video results.
  if(!item?.id||seen.has(String(item.id))||/\.(webp|webm|mp4|png|jpe?g)(?:[?#]|$)/i.test(item.url||''))continue;
  const url=gifMediaUrl(item.url);if(!url)continue;
  const id=String(item.id).slice(0,160);seen.add(id);
  items.push({id,title:String(item.title||'GIF').slice(0,180),url,preview:gifMediaUrl(item.preview_url)||url,width:Number(item.width)||200,height:Number(item.height)||200});
 }
 const next=Number(payload.pagination?.next_page);
 return {items,nextPage:payload.pagination?.has_next&&Number.isSafeInteger(next)&&next>page?next:null};
}
export async function searchGifs(query,page=1,{signal,fetcher=fetch}={}){
 const q=query.trim().slice(0,160),key=`${q}|${page}`,hit=cache.get(key);
 if(signal?.aborted)throw new DOMException('Cancelled','AbortError');
 if(hit&&Date.now()-hit.at<300000)return hit.value;
 const params=new URLSearchParams({page:String(page),limit:'18'});if(q)params.set('q',q);
 const response=await fetcher(`${API}/gifs/${q?'search':'trending'}?${params}`,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(20000)]):AbortSignal.timeout(20000),credentials:'omit',referrerPolicy:'no-referrer'});
 if(!response.ok)throw new Error(response.status===429?'Za dużo zapytań do usługi GIF-ów. Spróbuj za chwilę.':'Wyszukiwarka GIF-ów jest chwilowo niedostępna. Spróbuj ponownie.');
 const value=normalizeGifResults(await response.json(),page);
 if(cache.size>=24)cache.delete(cache.keys().next().value);
 cache.set(key,{at:Date.now(),value});return value;
}
export async function downloadGif(item,{fetcher=fetch,signal}={}){
 const url=gifMediaUrl(item.url);if(!url)throw new Error('Nieprawidłowy adres GIF-a. Wybierz inny wynik.');
 const response=await fetcher(url,{signal:signal?AbortSignal.any([signal,AbortSignal.timeout(30000)]):AbortSignal.timeout(30000),credentials:'omit',referrerPolicy:'no-referrer'});
 if(!response.ok)throw new Error('Nie udało się pobrać GIF-a. Spróbuj ponownie lub wybierz inny.');
 if(Number(response.headers.get('content-length'))>MAX_BYTES){await response.body?.cancel();throw new Error('Ten GIF przekracza 12 MB. Wybierz mniejszy.');}
 // Enforce the limit while streaming, even when Content-Length is absent.
 const reader=response.body.getReader(),chunks=[];let size=0;
 try{for(;;){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw new Error('Ten GIF przekracza 12 MB. Wybierz mniejszy.');}chunks.push(value);}}finally{reader.releaseLock();}
 const blob=new Blob(chunks,{type:'image/gif'}),signature=new TextDecoder().decode(await blob.slice(0,6).arrayBuffer());
 if(!['GIF87a','GIF89a'].includes(signature))throw new Error('Ten wynik nie zawiera animacji GIF. Wybierz inny.');
 return new File([blob],`${String(item.title||'GIF').replace(/[\\/:*?"<>|\x00-\x1f]/g,'').slice(0,100)||'GIF'}.gif`,{type:'image/gif'});
}
export function gifError(error){
 if(error?.name==='TimeoutError')return 'Usługa GIF-ów nie odpowiada. Spróbuj ponownie.';
 if(error instanceof TypeError)return 'Nie można połączyć się z usługą GIF-ów. Sprawdź połączenie i spróbuj ponownie.';
 return error?.message||'Nie udało się pobrać GIF-a. Spróbuj ponownie lub wybierz inny.';
}
