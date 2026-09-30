import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {build} from 'esbuild';
import {Miniflare,FormData} from 'miniflare';
import {captureTheme} from '../src/custom-themes.js';

let mf;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+Xb0sAAAAASUVORK5CYII=','base64');
const theme=(name='My theme',id=crypto.randomUUID(),image=false)=>captureTheme({name,id,fontId:'caveat',visuals:{design:{theme:'paper'},logo:{type:'none'},background:image?{type:'image',assetId:'image'}:{type:'color',color:'#123456'}},files:image?{image:new File([png],'background.png',{type:'image/png'})}:{}});
const headers=owner=>({...owner?{'oai-authenticated-user-id':owner}:{},'X-Plotwist-Write':'1',Origin:'http://site.test'});
const req=(path='',owner='alice',options={})=>mf.dispatchFetch('http://site.test/api/themes'+path,{...options,headers:{...headers(owner),...options.headers}});
function save(t,revision=0,owner='alice'){
 const body=new FormData();body.append('metadata',JSON.stringify({...t,files:undefined,revision}));for(const [id,file] of Object.entries(t.files))body.append(id,file,file.name);
 return req('/'+t.id,owner,{method:'PUT',body});
}
before(async()=>{
 const compiled=await build({entryPoints:['worker/index.js'],bundle:true,format:'esm',platform:'browser',write:false});
 mf=new Miniflare({cf:false,workers:[{name:'themes-test',modules:true,script:compiled.outputFiles[0].text,compatibilityDate:'2026-07-01',d1Databases:['DB'],r2Buckets:['BUCKET'],serviceBindings:{ASSETS:()=>new Response('static asset')}}]});
 const db=await mf.getD1Database('DB'),sql=await readFile('drizzle/0000_spooky_daimon_hellstrom.sql','utf8');for(const statement of sql.split('--> statement-breakpoint'))await db.prepare(statement.trim()).run();
});
after(async()=>{await mf?.dispose();});
test('account themes: identity, ownership, asset storage, conflicts, rename and delete',async()=>{
 assert.equal((await req('',null)).status,401);assert.equal((await mf.dispatchFetch('http://site.test/data/file.json')).status,200);
 const source=theme('Owned look',undefined,true),createdResponse=await save(source);assert.equal(createdResponse.status,201,await createdResponse.clone().text());const created=await createdResponse.json();assert.equal(created.revision,1);assert.equal(created.appearance.fontId,'caveat');assert.equal(created.assets[0].type,'image/png');assert.equal(created.assets[0].key,undefined);
 const alice=(await (await req()).json()).themes;assert.ok(alice.some(t=>t.id===source.id));assert.equal((await (await req('','bob')).json()).themes.length,0);
 assert.equal((await req('/'+source.id,'bob')).status,404);assert.equal((await req('/'+source.id+'/assets/image','bob')).status,404);assert.equal((await req('/'+source.id+'/assets/image',null)).status,401);
 const asset=await req('/'+source.id+'/assets/image');assert.equal(asset.headers.get('cache-control'),'private, no-store');assert.deepEqual(Buffer.from(await asset.arrayBuffer()),png);
 assert.equal((await save(theme('owned LOOK'))).status,409);assert.equal((await save(theme('Owned look'),0,'bob')).status,201);
 assert.equal((await req('/'+source.id,'bob',{method:'DELETE',body:JSON.stringify({revision:1})})).status,404);
 assert.equal((await req('/'+source.id,'alice',{method:'PATCH',headers:{Origin:'https://evil.example'},body:JSON.stringify({name:'Hijacked',revision:1})})).status,403);
 assert.equal((await req('/'+source.id,'alice',{method:'PATCH',headers:{'X-Plotwist-Write':''},body:JSON.stringify({name:'Hijacked',revision:1})})).status,403);
 const updates=await Promise.all([save({...source,name:'Updated look'},1),save({...source,name:'Other update'},1)]);assert.deepEqual(updates.map(r=>r.status).sort(),[200,409]);
 const current=await (await req('/'+source.id)).json();assert.equal(current.revision,2);assert.equal((await save(source,1)).status,409);assert.equal((await req('/'+source.id+'/assets/image')).status,200);
 const renamed=await req('/'+source.id,'alice',{method:'PATCH',body:JSON.stringify({name:'Renamed look',revision:2})});assert.equal(renamed.status,200);assert.equal((await renamed.json()).revision,3);
 assert.equal((await req('/'+source.id,'alice',{method:'DELETE',body:JSON.stringify({revision:2})})).status,409);
 assert.equal((await req('/'+source.id,'alice',{method:'DELETE',body:JSON.stringify({revision:3})})).status,200);assert.equal((await req('/'+source.id)).status,404);assert.equal((await req('/'+source.id+'/assets/image')).status,404);
});
test('rejects malformed uploads without replacing a saved appearance',async()=>{
 const original=theme('Keep me'),created=await save(original);assert.equal(created.status,201);
 const invalid={...original,appearance:{...original.appearance,background:{type:'image',assetId:'image'}},files:{image:new File(['<svg onload=evil>'],'fake.png',{type:'image/png'})}};
 assert.equal((await save(invalid,1)).status,400);const unchanged=await (await req('/'+original.id)).json();assert.equal(unchanged.revision,1);assert.equal(unchanged.appearance.background.type,'color');
 const missing={...invalid,files:{}};assert.equal((await save(missing,1)).status,400);
 const body=new FormData();body.append('metadata',JSON.stringify({version:99,name:'bad',appearance:{},revision:0}));assert.equal((await req('/invalid','alice',{method:'PUT',body})).status,400);
 const oversized=new FormData();oversized.append('metadata','{}');oversized.append('image',new Blob([Buffer.alloc(26*1024*1024)]),'large.png');
 assert.equal((await req('/too-big','alice',{method:'PUT',body:oversized})).status,413);
});

