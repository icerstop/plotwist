import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {aiBrands,annotateAiBrands,classifyAiBrand} from '../src/ai-brands.js';
import {buildAiBrandHistory,aiBrandMotion,aiModelLabel} from '../src/ai-brand-history.js';
import {selectAiRows} from '../src/ai.js';
import {drawAiReel} from '../src/ai-render.js';
import {preloadReelAssets} from '../src/reel-assets.js';

test('producer aliases combine but base-model names do not steal third-party fine-tunes',()=>{
 const brand=(model,organization='TrackingAI · alias modelu')=>classifyAiBrand({model,modelId:model,organization}).brand?.id;
 for(const model of ['ChatGPT-4','GPT4 Omni (Vision)','GPT-5-Thinking','o1-pro','o3-mini-high','o4-mini'])assert.equal(brand(model),'openai');
 for(const organization of ['Google','Google DeepMind','Google Research','DeepMind','Google,Google DeepMind'])assert.equal(brand('Gemma',organization),'google');
 assert.equal(brand('QwQ-32B'),'alibaba');assert.equal(brand('Qwen3'),'alibaba');assert.equal(brand('Claude-3.7'),'anthropic');
 assert.equal(brand('DeepSeek-R1-Distill-Llama-70B'),'deepseek');assert.equal(brand('DeepSeek-R1-Distill-Qwen-32B','DeepSeek'),'deepseek');
 assert.equal(brand('Llama-Tulu','Allen Institute for AI,University of Washington'),'ai2');
 assert.equal(brand('Qwen fine-tune','Independent Lab'),'organization:independent lab');
 assert.notEqual(brand('Hermes-2-Theta-Llama-3-70B','Nous Research,Arcee AI'),'meta');
 assert.equal(brand('GPT-NeoX 20B',''),'eleuther');assert.equal(brand('Bing'),'bing');
 assert.equal(brand('OpenLLaMA-7B',''),'openlm');assert.equal(brand('vicuna-13b-v1.1',''),'lmsys');
 assert.equal(brand('InternLM (104B)',''),'internlm');assert.equal(brand('Solar Pro',''),'upstage');
 assert.equal(brand('AquilaChat2 34B',''),'baai');assert.equal(brand('XVERSE-13B',''),'xverse');
 assert.notEqual(brand('Perplexity'),'openai');assert.equal(brand('unknown model',''),undefined);
});
const source=annotateAiBrands([
 {id:'g1',modelId:'GPT-A',model:'GPT-4',organization:'OpenAI',date:'2024-01-01',score:80,protocol:'P'},
 {id:'g2',modelId:'GPT-B',model:'GPT-4o',organization:'OpenAI',date:'2024-01-02',score:90,protocol:'P'},
 {id:'c1',modelId:'Claude-A',model:'Claude-3',organization:'Anthropic',date:'2024-01-02',score:85,protocol:'P'},
 {id:'g3',modelId:'GPT-B',model:'GPT-4o',organization:'OpenAI',date:'2024-01-03',score:60,protocol:'P'},
 {id:'q1',modelId:'Qwen-A',model:'Qwen2',organization:'Alibaba',date:'2024-01-04',score:0,protocol:'P'},
 {id:'g4',modelId:'GPT-A',model:'GPT-4',organization:'OpenAI',date:'2024-01-05',score:50,protocol:'P'}
]);
const options={brandIds:['openai','anthropic','alibaba']};
test('brand leader uses latest variant scores, can fall, and records are a distinct method',()=>{
 const h=buildAiBrandHistory(source,options),record=buildAiBrandHistory(source,{...options,method:'record'});
 assert.equal(h.frames[2].leaders.find(l=>l.brand.id==='openai').winner.id,'g1');
 assert.equal(h.frames.at(-1).leaders.find(l=>l.brand.id==='openai').winner.id,'g3');
 assert.equal(record.frames.at(-1).leaders.find(l=>l.brand.id==='openai').winner.id,'g2');
 assert.equal(h.frames[0].leaders.length,1);assert.equal(h.frames[1].leaders.length,2);
 assert.equal(h.frames.at(-1).leaders.find(l=>l.brand.id==='alibaba').score,0);
});
test('a date crop retains earlier leaders, and seeking never reveals later models or invents zeros',()=>{
 const h=buildAiBrandHistory(source,{...options,start:'2024-01-03',end:'2024-01-04'});
 assert.equal(h.frames[0].date,'2024-01-03');assert.equal(h.frames[0].leaders.find(l=>l.brand.id==='anthropic').winner.id,'c1');
 assert.equal(new Set(h.times).size,h.times.length);assert.equal(h.frames[0].leaders.find(l=>l.brand.id==='openai').winner.id,'g1');
 const carry=buildAiBrandHistory(source.filter(r=>r.brandId==='anthropic'),{brandIds:['anthropic'],start:'2024-01-04',end:'2024-01-05'});assert.equal(carry.frames[0].leaders[0].winner.date,'2024-01-02');
 assert.equal(h.frames[0].leaders.some(l=>l.brand.id==='alibaba'),false);
 const all=buildAiBrandHistory(source,options),first=aiBrandMotion(all,0,20,.65,0);
 assert.deepEqual(first.frame.leaders.map(l=>l.winner.id),['g1']);
 const mid=aiBrandMotion(all,.5,20,.65,9);aiBrandMotion(all,1,20,.65,20);assert.deepEqual(aiBrandMotion(all,.5,20,.65,9),mid);
 for(const frame of all.frames)for(const leader of frame.leaders)assert.ok(leader.winner.date<=frame.date);
 assert.equal(buildAiBrandHistory(source,{...options,start:'2025-01-01'}).frames.length,0);
 assert.equal(buildAiBrandHistory(source,{brandIds:[]}).frames.length,0);
});
test('protocols remain separate when choosing representatives and in release retrospectives',()=>{
 const input=annotateAiBrands([{...source[0],id:'p1',score:90,protocol:'one',releaseDate:'2024-01-01',observedAt:'2024-02-01'},{...source[0],id:'p2',score:70,protocol:'two',releaseDate:'2024-01-01',observedAt:'2024-03-01'}]);
 const r=selectAiRows(input,{basis:'release',separateProtocols:true});assert.equal(r.length,2);
 assert.equal(buildAiBrandHistory(r,{brandIds:['openai']}).frames[0].leaders[0].score,90);
 assert.equal(selectAiRows(input,{basis:'observed',end:'2024-02-15'})[0].score,90);
 assert.equal(aiModelLabel({model:'Claude Opus 4',modelId:'claude-opus-4_32K'}),'Claude Opus 4 · 32K');
});
test('all brand presentation modes and toggle combinations render finite positions and historical labels',()=>{
 const h=buildAiBrandHistory(source,options),drawn=[],images=[];
 const ctx=new Proxy({canvas:{width:1080,height:1920},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),measureText:t=>({width:String(t).length*10}),fillText:t=>drawn.push(t),drawImage:(...args)=>images.push(args),globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),String(k));}});
 const canvas={width:1080,height:1920,getContext:()=>ctx};
 for(const mode of ['records','ranking','timeline'])for(const method of ['latest','record'])for(const p of [0,.1,.5,1]){
  const config={title:'Test',duration:20,language:'en',ai:{rows:source,groupBy:'brand',mode,basis:'observed',history:buildAiBrandHistory(source,{...options,method}),brands:options.brandIds.map(id=>aiBrands.find(b=>b.id===id)),benchmark:{id:'test',name:'Test',unit:'pts',source:'Test',retrievedAt:'2026-09-28'}}};
  for(const axisRange of ['fixed','dynamic'])for(const showLeaderNames of [true,false]){
   drawn.length=0;drawAiReel(canvas,{...config,axisRange,ai:{...config.ai,showLeaderNames,showBrandLogos:false}},p,p*20);
   if(!showLeaderNames)assert.ok(!drawn.includes('GPT-4')&&!drawn.includes('Claude-3'));
   if(p===0)assert.ok(!drawn.includes('Claude-3')&&!drawn.includes('Qwen2'));
  }
 }
 assert.equal(images.length,0);
});
test('export preloads the selected AI logos and honours the logo toggle',async()=>{
 const old=globalThis.Image,loads=[];
 globalThis.Image=class{set src(path){loads.push(path);this.onload();}};
 try{
  const config={ai:{groupBy:'brand',brands:aiBrands.filter(b=>['openai','alibaba'].includes(b.id)),showBrandLogos:false}};
  await preloadReelAssets(config);assert.equal(loads.length,0);
  await preloadReelAssets({...config,ai:{...config.ai,showBrandLogos:true}});assert.deepEqual(loads.sort(),['/logos/ai/alibaba.svg','/logos/ai/openai.svg']);
 }finally{globalThis.Image=old;}
});

test('AI line legends animate descending ranks in both column and grid layouts',()=>{
 for(const count of [3,6]){
  const brands=aiBrands.slice(0,count),rows=brands.flatMap((brand,i)=>['2024-01-01','2024-01-02','2024-01-03'].map((date,day)=>({id:`${i}-${day}`,modelId:String(i),model:`Model ${i}`,brandId:brand.id,brand,date,score:day===0?count-i:i+1})));
  const history=buildAiBrandHistory(rows,{brandIds:brands.map(b=>b.id)});
  const config={title:'Test',duration:12,ai:{rows,history,brands,mode:'records',groupBy:'brand',showBrandLogos:false,showLeaderNames:false,benchmark:{id:'test',name:'Test',unit:'pts',source:'Test',retrievedAt:'2026-09-29'}}};
  const positions=p=>{const drawn=[];const ctx=new Proxy({canvas:{width:1080,height:1920},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),measureText:t=>({width:String(t).length*10}),fillText:(text,x,y)=>drawn.push({text,x,y}),globalAlpha:1},{get:(o,k)=>k in o?o[k]:()=>{}});drawAiReel({width:1080,height:1920,getContext:()=>ctx},config,p,p===1?12:p*10.8);return brands.map(b=>drawn.find(t=>t.text===b.name));};
  const start=positions(0),mid=positions(.53),end=positions(1);
  const order=points=>points.toSorted((a,b)=>a.y-b.y||a.x-b.x).map(p=>p.text);
  assert.deepEqual(order(start),brands.map(b=>b.name));assert.deepEqual(order(end),brands.map(b=>b.name).reverse());
  assert.ok(mid[0].y>start[0].y&&mid[0].y<end[0].y);assert.deepEqual(positions(.53),mid);
 }
});
test('shipped attribution audit matches data and local logos are safe self-contained SVGs',()=>{
 const audit=JSON.parse(fs.readFileSync('public/ai/brand-audit.json')),manifest=JSON.parse(fs.readFileSync('public/ai/manifest.json'));
 assert.equal(audit.benchmarks.length,manifest.benchmarks.length);
 for(const b of audit.benchmarks){const rows=annotateAiBrands(JSON.parse(fs.readFileSync('public/ai/'+b.id+'.json')).rows);assert.equal(b.unassigned,rows.filter(r=>!r.brand).length);for(const r of rows){const a=b.models.find(m=>m.modelId===r.modelId&&m.sourceOrganization===r.organization);assert.equal(a.brandId,r.brandId);assert.equal(a.method,r.brandMethod);}}
 for(const brand of aiBrands.filter(b=>b.logo)){const svg=fs.readFileSync('public'+brand.logo,'utf8');assert.match(svg,/<svg/);assert.doesNotMatch(svg,/<script|<foreignObject|(?:href|src)=["']https?:|\son\w+=/i);}
});
