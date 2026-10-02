import {normalizeSavedTheme,themeName,themeAssetIds} from '../src/custom-themes.js';
import {themeStore} from './theme-store.js';
import {storyCsv} from './story-csv.js';
import {projectApi} from './project-api.js';

const idPattern=/^[a-zA-Z0-9_-]{1,100}$/;
const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
class Problem extends Error {constructor(code,status){super(code);this.code=code;this.status=status;}}
const fail=(code,status)=>{throw new Problem(code,status);};
const view=row=>({version:1,id:row.id,name:row.name,appearance:JSON.parse(row.appearance),revision:row.revision,createdAt:row.created_at,updatedAt:row.updated_at,assets:JSON.parse(row.assets).map(({id,name,type,size})=>({id,name,type,size}))});
function bounded(request,limit){
 if(Number(request.headers.get('Content-Length'))>limit)fail('too_large',413);
 let size=0;
 return new Request(request,{body:request.body?.pipeThrough(new TransformStream({transform(chunk,controller){size+=chunk.byteLength;if(size>limit)throw new Problem('too_large',413);controller.enqueue(chunk);}})),duplex:'half'});
}
async function readJson(request){try{return await bounded(request,65536).json();}catch(e){if(e instanceof Problem)throw e;fail('invalid',400);}}
function revision(value){if(!Number.isInteger(value)||value<1)fail('invalid',400);return value;}
function imageType(bytes){
 if(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)return 'image/png';
 if(bytes[0]===255&&bytes[1]===216)return 'image/jpeg';
 const text=String.fromCharCode(...bytes.slice(0,12));
 if(text.startsWith('GIF87a')||text.startsWith('GIF89a'))return 'image/gif';
 if(text.startsWith('RIFF')&&text.slice(8)==='WEBP')return 'image/webp';
 fail('invalid_image',400);
}
function cleanup(env,ctx,assets){
 if(!assets.length)return;
 const promise=env.BUCKET.delete(assets.map(a=>a.key)).catch(()=>console.error('Theme asset cleanup failed'));
 ctx.waitUntil(promise);
}
async function api(request,env,ctx){
 const url=new URL(request.url),owner=request.headers.get('oai-authenticated-user-id');
 // Only the Sites dispatcher supplies this identity; no client-selected account ID.
 if(!owner)fail('signin',401);
 if(!['GET','HEAD'].includes(request.method)){
  const origin=request.headers.get('Origin');
  if(request.headers.get('X-Plotwist-Write')!=='1'||(origin&&origin!==url.origin)||request.headers.get('Sec-Fetch-Site')==='cross-site')fail('forbidden',403);
 }
 if(!env.DB||!env.BUCKET)fail('unavailable',503);
 const store=themeStore(env.DB,owner),parts=url.pathname.split('/').filter(Boolean),id=parts[2];
 if(parts.length===2&&request.method==='GET')return json({themes:(await store.list()).results.map(view)});
 if(!idPattern.test(id||''))fail('not_found',404);
 const old=await store.get(id);
 if(parts.length===5&&parts[3]==='assets'&&request.method==='GET'){
  const asset=old&&JSON.parse(old.assets).find(a=>a.id===parts[4]);
  if(!asset)fail('not_found',404);
  const object=await env.BUCKET.get(asset.key);if(!object)fail('asset_unavailable',503);
  return new Response(object.body,{headers:{'Content-Type':asset.type,'Content-Length':String(object.size),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
 }
 if(parts.length!==3)fail('not_found',404);
 if(request.method==='GET'){if(!old)fail('not_found',404);return json(view(old));}
 if(request.method==='PUT'){
  let form,raw;
  try{form=await bounded(request,25*1024*1024).formData();const metadata=form.get('metadata');if(typeof metadata!=='string'||metadata.length>65536)fail('invalid',400);raw=JSON.parse(metadata);}catch(e){if(e instanceof Problem)throw e;fail('invalid',400);}
  if(!Number.isInteger(raw.revision)||raw.revision<0)fail('invalid',400);
  if(old?raw.revision!==old.revision:raw.revision!==0)fail('conflict',409);
  const files={};
  for(const [key,file] of form){if(key==='metadata')continue;if(!idPattern.test(key)||!(file instanceof Blob)||files[key]||Object.keys(files).length>=2)fail('invalid',400);files[key]=file;}
  let theme;try{theme=normalizeSavedTheme({...raw,id,files});}catch{fail('invalid',400);}
  if(Object.keys(files).length!==themeAssetIds(theme).length)fail('invalid',400);
  const assets=[],prepared=[];
  for(const [assetId,file] of Object.entries(theme.files)){
   const bytes=new Uint8Array(await file.arrayBuffer()),type=imageType(bytes);
   const asset={id:assetId,key:`themes/${id}/${crypto.randomUUID()}`,name:(file.name||'image').slice(0,200),type,size:file.size};
   prepared.push({asset,bytes});
  }
  try{for(const {asset,bytes} of prepared){assets.push(asset);await env.BUCKET.put(asset.key,bytes,{httpMetadata:{contentType:asset.type}});}}catch(error){cleanup(env,ctx,assets);throw error;}
  const now=new Date().toISOString(),record={id,name:theme.name,appearance:theme.appearance,assets,now};
  let result;
  try{result=await (old?store.update(record,raw.revision):store.create(record));}catch(error){
   // On an ambiguous transport failure, retain objects: the DB write may have committed.
   if(String(error.message).includes('UNIQUE constraint')){cleanup(env,ctx,assets);fail('duplicate',409);}throw error;
  }
  if(!result.meta.changes){cleanup(env,ctx,assets);fail(old?'conflict':'limit',old?409:400);}
  if(old)cleanup(env,ctx,JSON.parse(old.assets));
  return json(view({id,name:theme.name,appearance:JSON.stringify(theme.appearance),assets:JSON.stringify(assets),revision:raw.revision+1,created_at:old?.created_at||now,updated_at:now}),old?200:201);
 }
 if(!old)fail('not_found',404);
 if(request.method==='PATCH'){
  const raw=await readJson(request);let name;try{name=themeName(raw.name);}catch{fail('invalid',400);}
  const now=new Date().toISOString();let result;
  try{result=await store.rename(id,name,revision(raw.revision),now);}catch(error){if(String(error.message).includes('UNIQUE constraint'))fail('duplicate',409);throw error;}
  if(!result.meta.changes)fail('conflict',409);
  return json(view({...old,name,revision:raw.revision+1,updated_at:now}));
 }
 if(request.method==='DELETE'){
  const raw=await readJson(request),result=await store.remove(id,revision(raw.revision));
  if(!result.meta.changes)fail('conflict',409);cleanup(env,ctx,JSON.parse(old.assets));return json({deleted:true});
 }
 return json({code:'method'},405);
}
export default {async fetch(request,env,ctx){
 const path=new URL(request.url).pathname;
 if(path==='/api/projects'||path.startsWith('/api/projects/'))return projectApi(request,env,ctx);
 if(path==='/api/themes'||path.startsWith('/api/themes/')){
  try{return await api(request,env,ctx);}catch(error){if(error instanceof Problem)return json({code:error.code},error.status);console.error('Theme storage request failed',error?.message);return json({code:'unavailable'},503);}
 }
 return await storyCsv(request,env.ASSETS)||env.ASSETS.fetch(request);
}};
