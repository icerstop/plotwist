import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMotion,motionPresets,motionPreset,reelMotionFrame,motionState,applyElementMotion,animateText} from '../src/reel-motion.js';
import {normalizeDesign} from '../src/reel-design.js';
import {applyReelPreset} from '../src/reel-presets.js';
import {drawReel} from '../src/render.js';
import {paintText} from '../src/reel-text.js';
import {annotateAiBrands,aiBrands} from '../src/ai-brands.js';
import {buildAiBrandHistory} from '../src/ai-brand-history.js';

const configFor=(id,duration=12)=>({duration,visuals:{design:normalizeDesign({motion:motionPreset(id)})}});
test('all sequences keep the first observation until entrance finishes and reserve the final hold',()=>{
 assert.equal(motionPresets.length,19);assert.equal(new Set(motionPresets.map(p=>p.id)).size,19);
 for(const preset of motionPresets)for(const duration of [6,12,20,30]){
  const config=configFor(preset.id,duration),m=config.visuals.design.motion,start=m.chartStart*duration;
  assert.ok(m.chartStart>=m.tracks.content.start+m.tracks.content.duration-1e-12);
  for(const time of [0,start/2,start])assert.equal(reelMotionFrame(config,.8,time).progress,0);
  const middle=reelMotionFrame(config,0,(start+duration*.9)/2);assert.ok(Math.abs(middle.progress-.5)<1e-10);
  assert.equal(reelMotionFrame(config,0,duration*.9).progress,1);assert.equal(reelMotionFrame(config,0,duration-1/60).progress,1);
  assert.ok(reelMotionFrame(config,0,0).config.duration>0);
  assert.deepEqual(reelMotionFrame(config,0,2),reelMotionFrame(config,.99,2),'time, not an old seek position, controls the frame');
 }
});
test('legacy and disabled motion preserves the old clock; editing reveals stable positions',()=>{
 const old={duration:12};assert.equal(normalizeDesign().motion.enabled,false);
 assert.deepEqual(reelMotionFrame(old,.4,3),{config:old,progress:.4,dataTime:3});
 const config={...configFor('write-story'),editorPreview:true};assert.equal(reelMotionFrame(config,.4,3).config,config);assert.deepEqual(motionState(config,'title'),{effect:'none',p:1,eased:1});
 const visuals=configFor('words').visuals;assert.deepEqual(applyReelPreset(visuals,'journal').design.motion,visuals.design.motion,'visual design does not reset the chosen animation');
});
test('invalid tracks are bounded, text-only effects cannot mask charts, and sticker overrides round-trip',()=>{
 const m=normalizeMotion({enabled:true,chartStart:-3,tracks:{content:{effect:'fade',start:5,duration:10},source:{effect:'fade'},title:{effect:'write',start:NaN,duration:NaN},'sticker:a':{effect:'pop',start:.7,duration:.1}}});
 assert.equal(m.tracks.content.start,.5);assert.ok(m.tracks.content.start+m.tracks.content.duration<=.60000000001);assert.ok(m.chartStart<=.6);assert.ok(m.chartStart>=.6-1e-10);assert.equal(m.tracks.source,undefined);assert.equal(m.tracks.title.start,0);assert.equal(m.tracks.title.duration,.1);assert.deepEqual(normalizeMotion(JSON.parse(JSON.stringify(m))),m);
 assert.equal(normalizeMotion({tracks:{content:{effect:'typewriter'}}}).tracks.content.effect,'none');
});
function recorder(){const log=[],stack=[],keys=['font','globalAlpha','fillStyle','textAlign','shadowBlur','lineWidth'];
 const ctx=new Proxy({font:'30px Arial',globalAlpha:1,textAlign:'left',fillStyle:'#000',shadowBlur:0,lineWidth:1,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),measureText:s=>({width:Array.from(String(s)).length*16}),save(){stack.push(Object.fromEntries(keys.map(k=>[k,this[k]])));},restore(){assert.ok(stack.length);Object.assign(this,stack.pop());}}, {get:(o,k)=>k in o?o[k]:(...args)=>{args.forEach(n=>{if(typeof n==='number')assert.ok(Number.isFinite(n),`${String(k)} ${args}`);});log.push({op:k,args,alpha:o.globalAlpha});}});
 const canvas={width:1080,height:1920,getContext:()=>ctx};ctx.canvas=canvas;return {ctx,canvas,log,stack};}
test('generic entrance effects finish at identity, and sources never disappear',()=>{
 for(const preset of motionPresets){const config=configFor(preset.id),start=reelMotionFrame(config,0,0).config,end=reelMotionFrame(config,1,12).config;
  assert.equal(motionState(start,'source').p,1);assert.equal(motionState(start,'content').p,0);assert.equal(motionState(end,'content').p,1);
  const {ctx,log}=recorder();applyElementMotion(ctx,end,'content',{x:0,y:0,w:900,h:900});assert.equal(log.length,0);assert.equal(ctx.globalAlpha,1);
 }
});
test('writing masks preserve full text metrics and are repeatable when seeking, including Polish and emoji',()=>{
 const config=configFor('write-story'),{ctx,log,stack}=recorder(),text=['Zażółć gęślą','A 👨‍👩‍👧‍👦 é'];let painted=0;
 const frame=time=>{log.length=0;animateText(ctx,reelMotionFrame(config,0,time).config,'title',text,100,200,40,700,()=>painted++);return structuredClone(log);};
 frame(0);assert.equal(painted,0);const mid=frame(1);assert.ok(mid.some(e=>e.op==='clip'));frame(12);assert.deepEqual(frame(1),mid);assert.equal(stack.length,0);assert.equal(ctx.textAlign,'left');
});
test('text reveals never paint a future line through a neighbouring mask',()=>{
 for(const effect of ['write','typewriter','words','lines']){
  const config=configFor('write-story'),{ctx,log}=recorder();config.visuals.design.motion.tracks.title={effect,start:0,duration:.3,easing:'linear'};
  paintText(ctx,reelMotionFrame(config,0,.3).config,'title',['First line','Future line'],100,200,30,700);
  const painted=log.filter(e=>e.op==='fillText').map(e=>e.args[0]);assert.ok(painted.includes('First line'));assert.ok(!painted.includes('Future line'),effect);
 }
});
test('animated AI and regular reels hide data during the intro without losing source attribution',()=>{
 const rows=annotateAiBrands([{id:'a',modelId:'a',model:'GPT first',organization:'OpenAI',date:'2024-01-01',score:40},{id:'b',modelId:'b',model:'Claude last',organization:'Anthropic',date:'2025-01-01',score:60}]),brands=aiBrands.filter(b=>['openai','anthropic'].includes(b.id)),history=buildAiBrandHistory(rows,{brandIds:brands.map(b=>b.id)});
 const base={title:'My title',subtitle:'Subtitle',source:'Source receipt',series:[{name:'Data series',points:[{x:2020,y:1},{x:2025,y:4}]}]},benchmark={id:'test',name:'Test',unit:'pts',source:'Source receipt',retrievedAt:'2026-09-30',baseline:{name:'Human baseline',score:50,note:'Reference'}};
 const variants=['line','area','bar','ranking','cards'].map(chart=>({...base,chart}));
 for(const mode of ['timeline','ranking','records','scatter','duel'])variants.push({...base,ai:{rows,benchmark,mode,basis:'observed'}});
 for(const mode of ['timeline','ranking','records'])variants.push({...base,ai:{rows,benchmark,mode,basis:'observed',brands,history,groupBy:'brand',showBrandLogos:false}});
 for(const variant of variants)for(const preset of motionPresets){
  const cfg={...variant,...configFor(preset.id)},original=JSON.stringify(cfg),{canvas,ctx,log,stack}=recorder();
  drawReel(canvas,cfg,0,0);const visible=log.filter(e=>e.op==='fillText'&&e.alpha>0).map(e=>String(e.args[0]));assert.equal(visible.some(s=>s.includes('Source receipt')),!cfg.visuals.design.motion.typing.enabled,`${preset.id} source`);assert.ok(!visible.some(s=>/Data series|GPT first|Claude last|Human baseline/.test(s)),`${preset.id} ${variant.ai?.mode||variant.chart} leaked data`);
  log.length=0;drawReel(canvas,cfg,0,cfg.visuals.design.motion.chartStart*cfg.duration);assert.ok(log.some(e=>e.op==='fillText'&&e.alpha>0&&String(e.args[0]).includes('Source receipt')),`${preset.id} source before data`);
  for(const time of [1,3,6,12,1])drawReel(canvas,cfg,Math.min(time/10.8,1),time);
  assert.equal(stack.length,0);assert.equal(ctx.globalAlpha,1);assert.equal(JSON.stringify(cfg),original);
 }
});
