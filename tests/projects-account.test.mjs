import {test,before,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {build} from 'esbuild';
import {Miniflare,FormData} from 'miniflare';
import {PROJECT_KINDS} from '../src/reel-project.js';
let mf;
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+Xb0sAAAAASUVORK5CYII=','base64');
const document=kind=>({version:1,kind,editor:{settings:{title:'My saved reel',start:'2018-01-01'},data:{rows:[{date:'2018-06-11',value:3}]}},visuals:{design:{motion:{enabled:true,preset:'typewriter'},elements:{title:{x:12}}},copy:{subtitle:{pl:'Własny tekst'}},stickers:[{id:'s1',assetId:'image',x:20}],background:{type:'theme'},logo:{type:'none'},overlays:[{kind:'text',text:'Hello'}]},presentation:{axisScale:'log',axisRange:'dynamic',transition:1.1},reelLanguage:'en',output:{imageMode:false,progress:.4}});
const req=(id='',owner='alice',options={})=>mf.dispatchFetch('http://site.test/api/projects'+id,{...options,headers:{'X-Plotwist-Write':'1',Origin:'http://site.test',...owner?{'oai-authenticated-user-id':owner}:{},...options.headers}});
function save(id,doc,revision=0,owner='alice',file=png){const body=new FormData();body.append('metadata',JSON.stringify({name:'Saved reel',revision}));body.append('document',new Blob([JSON.stringify(doc)],{type:'application/json'}),'project.json');body.append('image',new Blob([file],{type:'image/png'}),'sticker.png');return req('/'+id,owner,{method:'PUT',body});}
before(async()=>{const code=await build({entryPoints:['worker/index.js'],bundle:true,format:'esm',platform:'browser',write:false});mf=new Miniflare({cf:false,workers:[{name:'projects',modules:true,script:code.outputFiles[0].text,compatibilityDate:'2026-07-01',d1Databases:['DB'],r2Buckets:['BUCKET'],serviceBindings:{ASSETS:()=>new Response('static')}}]});const db=await mf.getD1Database('DB');for(const f of (await readdir('drizzle')).filter(f=>f.endsWith('.sql')).sort())for(const sql of (await readFile('drizzle/'+f,'utf8')).split('--> statement-breakpoint'))await db.prepare(sql.trim()).run();});
after(async()=>{await mf?.dispose();});
test('projects preserve complete documents for every editor and media independently of client storage',async()=>{
 assert.equal((await req('',null)).status,401);
 for(const kind of PROJECT_KINDS){const doc=document(kind),created=await save(kind,doc);assert.equal(created.status,201,await created.clone().text());const restored=await(await req('/'+kind)).json();assert.deepEqual(restored.document,doc);assert.equal(restored.assets[0].key,undefined);assert.equal(Buffer.from(await(await req('/'+kind+'/assets/image')).arrayBuffer()).toString('hex'),png.toString('hex'));}
 assert.equal((await(await req()).json()).projects.length,PROJECT_KINDS.length);assert.deepEqual((await(await req('', 'bob')).json()).projects,[]);
 for(const path of ['/releases','/releases/assets/image'])assert.equal((await req(path,'bob')).status,404);
 assert.equal((await req('/releases','bob',{method:'DELETE',body:'{"revision":1}'})).status,404);
 assert.equal((await req('/releases','alice',{method:'DELETE',headers:{Origin:'https://evil.test'},body:'{"revision":1}'})).status,403);
});
test('conflicts cannot overwrite another device; corrupt uploads leave saved project and media intact',async()=>{
 const doc=document('releases');assert.equal((await save('race',doc)).status,201);
 const updated={...doc,editor:{...doc.editor,title:'New edit'}};assert.equal((await save('race',updated,1)).status,200);assert.equal((await save('race',doc,1)).status,409);
 assert.equal((await save('race',doc,2,'alice',Buffer.from('<svg onload=evil>'))).status,400);assert.deepEqual((await(await req('/race')).json()).document,updated);
 assert.equal((await req('/race','alice',{method:'PATCH',body:JSON.stringify({revision:2,name:'New name'})})).status,200);
 assert.equal((await req('/race','alice',{method:'DELETE',body:'{"revision":2}'})).status,409);assert.equal((await req('/race','alice',{method:'DELETE',body:'{"revision":3}'})).status,200);assert.equal((await req('/race/assets/image')).status,404);
 assert.equal((await save('invalid',{...doc,version:9})).status,400);
});
