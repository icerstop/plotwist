import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeMystery,mysteryFrame,mysteryRole,renderMysteryFrame} from '../src/reel-mystery.js';
import {motionPreset,normalizeMotion} from '../src/reel-motion.js';
import {normalizeDesign} from '../src/reel-design.js';
import {drawReel} from '../src/render.js';
import {annotateAiBrands,aiBrands} from '../src/ai-brands.js';
import {buildAiBrandHistory} from '../src/ai-brand-history.js';
import {captureTheme,exportTheme,importTheme} from '../src/custom-themes.js';

function recorder(){
 const log=[],stack=[],keys=['font','globalAlpha','fillStyle','textAlign','textBaseline','shadowBlur','lineWidth'];
 const ctx=new Proxy({font:'30px Arial',globalAlpha:1,textAlign:'left',fillStyle:'#000',shadowBlur:0,lineWidth:1,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),measureText:s=>({width:Array.from(String(s)).length*16}),save(){stack.push(Object.fromEntries(keys.map(k=>[k,this[k]])));},restore(){assert.ok(stack.length);Object.assign(this,stack.pop());}},{get:(o,k)=>k in o?o[k]:(...args)=>{args.forEach(n=>{if(typeof n==='number')assert.ok(Number.isFinite(n),`${String(k)} ${args}`);});log.push({op:k,args,alpha:o.globalAlpha});}});
 const canvas={width:1080,height:1920,getContext:()=>ctx};ctx.canvas=canvas;return {canvas,ctx,log,stack};
}
const config=()=>({duration:12,fontId:'arial',title:'What is this?',subtitle:'Secret units',metricCaption:'Secret metric',source:'Source receipt',series:[{name:'Secret series',countryCode:'POL',points:[{x:2020,y:11},{x:2025,y:77}]}],visuals:{logo:{type:'monogram'},design:normalizeDesign({motion:motionPreset('mystery'),chart:{endLabels:true,endLabelNames:true}})}});
const visibleText=log=>log.filter(e=>e.op==='fillText'&&e.alpha>0).map(e=>String(e.args[0]));

test('mystery timings are ordered, finish before the final hold and survive theme backup',async()=>{
 assert.equal(normalizeMotion().mystery.enabled,false);
 for(const chartAt of [-1,0,.3,9,NaN])for(const answerAt of [-1,.1,.8,9,NaN])for(const fade of [-1,.08,9,NaN]){
  const m=normalizeMystery({enabled:true,chartAt,answerAt,fade});assert.ok(m.answerAt>=m.chartAt+m.fade+.12-1e-10);assert.ok(m.answerAt+m.fade<=.9+1e-10);assert.deepEqual(normalizeMystery(m),m);
 }
 const c=config(),motion=c.visuals.design.motion;
 assert.deepEqual(normalizeMotion(JSON.parse(JSON.stringify(motion))),motion);
 assert.equal(normalizeMotion({...motion,typing:{enabled:true}}).typing.enabled,false);
 assert.equal(normalizeMotion({...motion,mystery:{enabled:false},typing:{enabled:true}}).typing.enabled,true);
 const theme=captureTheme({name:'Mystery',visuals:c.visuals,fontId:c.fontId}),restored=await importTheme(new File([await exportTheme(theme)],'theme.json'));
 assert.deepEqual(restored.appearance.design.motion,motion);
 for(const duration of [6,12,20,30]){const cfg={...c,duration};assert.equal(mysteryFrame(cfg,0).chart.p,0);assert.equal(mysteryFrame(cfg,duration*.5).chart.p,1);assert.equal(mysteryFrame(cfg,duration*.5).answer.p,0);assert.equal(mysteryFrame(cfg,duration*.9).answer.p,1);}
});

test('regular and AI variants show only title, then shapes, then the chosen details without shifting layout',()=>{
 const rows=annotateAiBrands([{id:'a',modelId:'a',model:'GPT first',organization:'OpenAI',date:'2024-01-01',score:40},{id:'b',modelId:'b',model:'Claude last',organization:'Anthropic',date:'2025-01-01',score:60}]),brands=aiBrands.filter(b=>['openai','anthropic'].includes(b.id)),history=buildAiBrandHistory(rows,{brandIds:brands.map(b=>b.id)}),benchmark={id:'test',name:'Secret benchmark',unit:'pts',source:'Source receipt',retrievedAt:'2026-09-30',baseline:{name:'Human baseline',score:50,note:'Reference'}};
 const variants=['line','area','bar','ranking','cards'].map(chart=>({chart}));
 for(const mode of ['timeline','ranking','records','scatter','duel'])variants.push({ai:{rows,benchmark,mode,basis:'observed'}});
 for(const mode of ['timeline','ranking','records'])variants.push({ai:{rows,benchmark,mode,basis:'observed',brands,history,groupBy:'brand',showBrandLogos:false}});
 for(const variant of variants){
  const c={...config(),...variant},original=JSON.stringify(c),{canvas,ctx,log,stack}=recorder();
  const frame=(fraction,extra={})=>{log.length=0;drawReel(canvas,{...c,...extra},fraction,fraction*c.duration);assert.equal(stack.length,0);assert.equal(ctx.globalAlpha,1);return structuredClone(log);};
  for(const fraction of [0,.08,.5,.69]){const painted=frame(fraction);assert.deepEqual([...new Set(visibleText(painted))],['What is this?'],`${variant.ai?.mode||variant.chart} leaked text at ${fraction}`);}
  const middle=frame(.5),final=frame(1);assert.ok(visibleText(final).some(t=>t.includes('Source receipt')));assert.ok(visibleText(final).some(t=>t.includes('Secret units')||t.includes('Secret benchmark')));
  assert.ok(middle.filter(e=>e.alpha>0&&['stroke','fill','fillRect'].includes(e.op)).length>1,'chart geometry is visible during guessing');
  assert.deepEqual(frame(.5),middle,'backward seeking is deterministic');
  assert.ok(visibleText(frame(0,{editorPreview:true})).some(t=>t.includes('Source receipt')),'direct manipulation reveals all elements');
  assert.equal(JSON.stringify(c),original);
 }
 // Masking does not rebuild the plot with a different legend or label width.
 const c=config(),{canvas,log}=recorder();drawReel(canvas,c,.8,9.6);const revealed=log.filter(e=>['moveTo','lineTo','rect'].includes(e.op));
 log.length=0;const withoutMask={...c,visuals:{...c.visuals,design:{...c.visuals.design,motion:{...c.visuals.design.motion,mystery:{...c.visuals.design.motion.mystery,enabled:false}}}}};drawReel(canvas,withoutMask,.8,9.6);
 assert.deepEqual(log.filter(e=>['moveTo','lineTo','rect'].includes(e.op)),revealed);
});

test('images cannot reveal the answer early, disabled settings stay disabled, and paint hooks restore after errors',()=>{
 const c=config(),{ctx,canvas,log}=recorder();
 const render=()=>{ctx.drawImage('background',0,0,10,10);let end=mysteryRole(ctx,'content');ctx.drawImage('flag',0,0,10,10);ctx.fillText('secret',0,0);ctx.stroke();end();end=mysteryRole(ctx,'title');ctx.fillText('Question',0,0);end();};
 renderMysteryFrame(canvas,c,.5,6,render);assert.equal(log.filter(e=>e.op==='drawImage').length,0);assert.deepEqual(visibleText(log),['Question']);assert.ok(log.some(e=>e.op==='stroke'));
 log.length=0;renderMysteryFrame(canvas,c,1,12,render);assert.equal(log.filter(e=>e.op==='drawImage').length,2);
 assert.throws(()=>renderMysteryFrame(canvas,c,0,0,()=>{throw new Error('encoder failed');}),/encoder failed/);
 assert.equal(Object.hasOwn(ctx,'fillText'),false);log.length=0;ctx.fillText('Restored',0,0);assert.deepEqual(visibleText(log),['Restored']);
 c.visuals.design.chart.legend=false;c.visuals.design.chart.endLabelNames=false;log.length=0;drawReel(canvas,c,1,12);assert.ok(!visibleText(log).includes('Secret series'));
});
