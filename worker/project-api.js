import {validateProject,projectAssetIds,projectName,PROJECT_DOCUMENT_LIMIT} from '../src/reel-project.js';
const json=(data,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
const fail=(code,status=400)=>{throw Object.assign(Error(code),{code,status});};
const idPattern=/^[a-zA-Z0-9_-]{1,100}$/;
const view=r=>({id:r.id,name:r.name,kind:r.kind,revision:r.revision,createdAt:r.created_at,updatedAt:r.updated_at});
async function bounded(request,limit,form=false){
 if(Number(request.headers.get('Content-Length'))>limit)fail('too_large',413);let size=0;
 const body=request.body?.pipeThrough(new TransformStream({transform(chunk,c){size+=chunk.byteLength;if(size>limit)fail('too_large',413);c.enqueue(chunk);}}));
 try{const r=new Request(request,{body,duplex:'half'});return await(form?r.formData():r.json());}catch(e){if(e.code)throw e;fail('invalid');}
}
function imageType(b){if(b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71)return'image/png';if(b[0]===255&&b[1]===216)return'image/jpeg';const t=String.fromCharCode(...b.slice(0,12));if(/^GIF8[79]a/.test(t))return'image/gif';if(t.startsWith('RIFF')&&t.slice(8)==='WEBP')return'image/webp';fail('invalid_image');}
export async function projectApi(request,env,ctx){
 const cleanup=keys=>{if(keys.length)ctx.waitUntil(env.BUCKET.delete(keys).catch(()=>console.error('Project cleanup failed')));};
 try{
  const url=new URL(request.url),owner=request.headers.get('oai-authenticated-user-id');if(!owner)fail('signin',401);
  if(!['GET','HEAD'].includes(request.method)&&(request.headers.get('X-Plotwist-Write')!=='1'||request.headers.get('Origin')&&request.headers.get('Origin')!==url.origin||request.headers.get('Sec-Fetch-Site')==='cross-site'))fail('forbidden',403);
  if(!env.DB||!env.BUCKET)fail('unavailable',503);
  const sql=(q,...p)=>env.DB.prepare(q).bind(...p),parts=url.pathname.split('/').filter(Boolean),id=parts[2];
  if(parts.length===2&&request.method==='GET'){const list=await sql('SELECT id,name,kind,revision,created_at,updated_at FROM projects WHERE owner_id=? ORDER BY updated_at DESC,id',owner).all();return json({projects:list.results.map(view)});}
  if(!idPattern.test(id||''))fail('not_found',404);
  const old=await sql('SELECT * FROM projects WHERE owner_id=? AND id=?',owner,id).first();
  if(parts.length===5&&parts[3]==='assets'&&request.method==='GET'){
   const asset=old&&JSON.parse(old.assets).find(a=>a.id===parts[4]);if(!asset)fail('not_found',404);
   const blob=await env.BUCKET.get(asset.key);if(!blob)fail('asset_unavailable',503);
   return new Response(blob.body,{headers:{'Content-Type':asset.type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(parts.length!==3)fail('not_found',404);
  if(request.method==='GET'){if(!old)fail('not_found',404);const payload=await env.BUCKET.get(old.document_key);if(!payload)fail('asset_unavailable',503);return json({...view(old),document:await payload.json(),assets:JSON.parse(old.assets).map(({key,...a})=>a)});}
  if(request.method==='PUT'){
   const form=await bounded(request,87*1024*1024,true),meta=form.get('metadata');if(typeof meta!=='string'||meta.length>10000)fail('invalid');let raw;try{raw=JSON.parse(meta);}catch{fail('invalid');}
   const name=projectName(raw.name);if(!Number.isInteger(raw.revision)||raw.revision<0)fail('invalid');if(old?old.revision!==raw.revision:raw.revision!==0)fail('conflict',409);
   const doc=form.get('document');if(!(doc instanceof Blob)||doc.size>PROJECT_DOCUMENT_LIMIT)fail('too_large',413);let document;try{document=validateProject(JSON.parse(await doc.text()));}catch(e){fail(e.message==='too_large'?'too_large':'invalid',e.message==='too_large'?413:400);}
   const ids=projectAssetIds(document),assets=[],prepared=[],keys=[];
   const fields=[...form.keys()];if(new Set(fields).size!==fields.length||fields.some(k=>!['metadata','document',...ids].includes(k)))fail('invalid');
   for(const assetId of ids){const file=form.get(assetId);if(!(file instanceof Blob)||!file.size||file.size>12*1024*1024)fail('invalid');const bytes=new Uint8Array(await file.arrayBuffer()),type=imageType(bytes),asset={id:assetId,key:`projects/${id}/${crypto.randomUUID()}`,name:(file.name||'image').slice(0,200),type,size:file.size};assets.push(asset);prepared.push([asset,bytes]);}
   const documentKey=`projects/${id}/${crypto.randomUUID()}.json`,now=new Date().toISOString();
   try{for(const [a,b] of prepared){keys.push(a.key);await env.BUCKET.put(a.key,b,{httpMetadata:{contentType:a.type}});}keys.push(documentKey);await env.BUCKET.put(documentKey,JSON.stringify(document),{httpMetadata:{contentType:'application/json'}});}catch(e){cleanup(keys);throw e;}
   let result;try{
    result=old?await sql('UPDATE projects SET name=?,kind=?,document_key=?,assets=?,revision=revision+1,updated_at=? WHERE owner_id=? AND id=? AND revision=?',name,document.kind,documentKey,JSON.stringify(assets),now,owner,id,raw.revision).run():await sql('INSERT INTO projects (id,owner_id,name,kind,document_key,assets,revision,created_at,updated_at) SELECT ?,?,?,?,?,?,1,?,? WHERE (SELECT count(*) FROM projects WHERE owner_id=?)<100',id,owner,name,document.kind,documentKey,JSON.stringify(assets),now,now,owner).run();
   }catch(e){if(String(e.message).includes('UNIQUE constraint')){cleanup(keys);fail('conflict',409);}throw e;}
   if(!result.meta.changes){cleanup(keys);fail(old?'conflict':'limit',old?409:400);}if(old)cleanup([old.document_key,...JSON.parse(old.assets).map(a=>a.key)]);
   return json({id,name,kind:document.kind,revision:raw.revision+1,createdAt:old?.created_at||now,updatedAt:now},old?200:201);
  }
  if(!old)fail('not_found',404);
  const raw=await bounded(request,4096);if(!Number.isInteger(raw.revision)||raw.revision<1)fail('invalid');
  if(request.method==='DELETE'){const r=await sql('DELETE FROM projects WHERE owner_id=? AND id=? AND revision=?',owner,id,raw.revision).run();if(!r.meta.changes)fail('conflict',409);cleanup([old.document_key,...JSON.parse(old.assets).map(a=>a.key)]);return json({deleted:true});}
  if(request.method==='PATCH'){const name=projectName(raw.name),now=new Date().toISOString(),r=await sql('UPDATE projects SET name=?,revision=revision+1,updated_at=? WHERE owner_id=? AND id=? AND revision=?',name,now,owner,id,raw.revision).run();if(!r.meta.changes)fail('conflict',409);return json({...view(old),name,revision:raw.revision+1,updatedAt:now});}
  return json({code:'method'},405);
 }catch(e){if(e.code)return json({code:e.code},e.status);if(e.message==='invalid')return json({code:'invalid'},400);console.error('Project request failed',e.message);return json({code:'unavailable'},503);}
}
