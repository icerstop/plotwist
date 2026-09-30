import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {drawAiReel} from '../src/ai-render.js';
import {aiFrameLayout} from '../src/ai-layout.js';
import {normalizeDesign,sectionTransform} from '../src/reel-design.js';
import {aiRankingLayout} from '../src/ai-labels.js';
import {aiEvents} from '../src/presentation.js';
import {selectAiRows} from '../src/ai.js';
import {annotateAiBrands,aiBrands} from '../src/ai-brands.js';
import {buildAiBrandHistory} from '../src/ai-brand-history.js';
import {resetElements,reelElements,pointAt} from '../src/reel-elements.js';

function recorder(){
 const text=[],stack=[],identity=()=>({a:1,b:0,c:0,d:1,e:0,f:0});let matrix=identity();
 const ctx={font:'24px Arial',globalAlpha:1,textAlign:'left',fillStyle:'#000',
  measureText(value){return {width:String(value).length*(Number(this.font.match(/([\d.]+)px/)?.[1])||24)*.5};},
  getTransform:()=>({...matrix}),setTransform(a,b,c,d,e,f){matrix={a,b,c,d,e,f};},
  translate(x,y){matrix.e+=matrix.a*x+matrix.c*y;matrix.f+=matrix.b*x+matrix.d*y;},scale(x,y){matrix.a*=x;matrix.b*=x;matrix.c*=y;matrix.d*=y;},rotate(angle){assert.equal(angle,0);},
  save(){stack.push({matrix:{...matrix},font:this.font,globalAlpha:this.globalAlpha,textAlign:this.textAlign,fillStyle:this.fillStyle});},
  restore(){assert.ok(stack.length,'canvas restore must match a save');const saved=stack.pop();matrix=saved.matrix;for(const k of ['font','globalAlpha','textAlign','fillStyle'])this[k]=saved[k];},
  fillText(value,x,y){if(this.globalAlpha>0)text.push({value:String(value),...pointAt(matrix,x,y),size:Number(this.font.match(/([\d.]+)px/)?.[1])||24});}
 };
 const proxy=new Proxy(ctx,{get:(o,k)=>k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),String(k));}});
 const canvas={width:1080,height:1920,getContext:()=>proxy};ctx.canvas=canvas;
 return {ctx:proxy,canvas,text,stack};
}
const benchmark=JSON.parse(fs.readFileSync('public/ai/aa-index-v432.json','utf8'));
const rows=selectAiRows(annotateAiBrands(benchmark.rows),{basis:'release'});

test('AI formats use native pixel dimensions, retain portrait geometry and fit editor regions',()=>{
 for(const [format,height] of [['9:16',1920],['4:5',1350],['1:1',1080]]){
  const f=aiFrameLayout(format);assert.equal(f.height,height);assert.ok(f.start<f.end&&f.end<height-150);
  const c={format,ai:{},visuals:{design:normalizeDesign()}};
  const content=sectionTransform(c,'content',1080,height);assert.equal(content.base.y,f.start);assert.equal(content.base.h,f.end-f.start);assert.equal(content.scale,1);
  if(format==='9:16')for(const y of [690,815,1190,1690])assert.equal(f.y(y),y);
 }
 assert.equal(aiFrameLayout('invalid').height,1920);
});

test('all AI presentations draw inside each format with balanced canvas state and usable editing regions',()=>{
 const brands=aiBrands.filter(b=>['openai','anthropic','google','alibaba','xai','deepseek'].includes(b.id));
 const history=buildAiBrandHistory(rows,{brandIds:brands.map(b=>b.id)});
 for(const format of ['9:16','4:5','1:1'])for(const groupBy of ['model','brand'])for(const mode of groupBy==='brand'?['timeline','ranking','records']:['timeline','ranking','records','scatter','duel']){
  const {canvas,text,stack}=recorder();
  const config={format,duration:12,fontId:'arial',title:'AI over time',ai:{rows,mode,groupBy,brands,history,showBrandLogos:false,basis:'release',benchmark:{...benchmark,baseline:{name:'Human reference',score:40,note:'Reference sample'}}},visuals:{design:normalizeDesign()}};
  for(const progress of [0,.5,1]){text.length=0;resetElements(canvas);drawAiReel(canvas,config,progress,progress*12);assert.equal(stack.length,0);assert.deepEqual([canvas.width,canvas.height],[1080,aiFrameLayout(format).height]);}
  for(const t of text)assert.ok(Number.isFinite(t.x)&&Number.isFinite(t.y)&&t.y>0&&t.y<=canvas.height,`${format} ${groupBy}/${mode}: ${JSON.stringify(t)}`);
  const elements=reelElements(canvas);assert.ok(elements.some(e=>e.id==='content'));assert.ok(elements.some(e=>e.id==='source'));assert.ok(elements.some(e=>e.id==='title'));
  for(const e of elements)for(const p of e.corners)assert.ok(Number.isFinite(p.x)&&Number.isFinite(p.y));
  assert.ok(text.some(t=>t.value==='Jakub Bilski'));assert.ok(text.some(t=>t.value.includes(benchmark.source)));
 }
});

test('short-format rankings reduce visible rows before dates or settings collide',()=>{
 const {ctx}=recorder(),frames=aiEvents(rows),results=[];
 for(const format of ['9:16','4:5','1:1']){
  const f=aiFrameLayout(format),config={format,fontId:'arial',_aiTextScale:f.textScale,visuals:{design:normalizeDesign()}};
  const layout=aiRankingLayout(ctx,config,frames,f.gap(814));results.push(layout);
  assert.ok(layout.count*layout.stride<=f.gap(814)+.001);
  assert.ok(layout.stride>=layout.labelHeight+layout.barHeight+layout.dateSize);
 }
 assert.ok(results[0].count>results[2].count);
});
