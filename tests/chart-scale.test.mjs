import test from 'node:test';
import assert from 'node:assert/strict';
import {bounds,visibleSeriesBounds,visibleAiBounds,createAxis,resolveScale,scaleCaption,formatAxisTick} from '../src/chart-scale.js';
import {localizeReelConfig} from '../src/reel-language.js';
import {drawReel} from '../src/render.js';

const series=[{name:'A',points:[{x:0,y:1},{x:1,y:2},{x:10,y:10000}]},{name:'B',points:[{x:0,y:2},{x:1,y:3},{x:10,y:20000}]}];
test('expanding scale reveals small early differences and only follows the drawn segment',()=>{
 assert.deepEqual(visibleSeriesBounds(series,0),{min:1,max:2});
 assert.deepEqual(visibleSeriesBounds(series,.5),{min:1,max:2.5});
 const early=createAxis(visibleSeriesBounds(series,.5),{dynamic:true});
 const fixed=createAxis(bounds(series.flatMap(s=>s.points.map(p=>p.y))),{fixedDomain:[0,20000]});
 assert.ok(early.position(2)-early.position(1)>.3);
 assert.ok(fixed.position(2)-fixed.position(1)<.0001);
 assert.deepEqual(visibleSeriesBounds(series,10),{min:1,max:20000});
 assert.deepEqual(visibleSeriesBounds(series,.5),{min:1,max:2.5},'seeking backwards is deterministic');
 const before=visibleSeriesBounds(series,.999999),after=visibleSeriesBounds(series,1.000001);
 assert.ok(Math.abs(after.max-before.max)<.003,'continuous at observation boundaries');
});
test('gaps, delayed starts, declines, negative and all-zero data keep honest bounds',()=>{
 const s=[{points:[{x:0,y:-5},{x:1,y:null},{x:2,y:100},{x:3,y:0}]},{points:[{x:4,y:200}]}];
 assert.deepEqual(visibleSeriesBounds(s,1.5),{min:-5,max:-5});
 assert.deepEqual(visibleSeriesBounds(s,3),{min:-5,max:100});
 for(const r of [bounds([]),bounds([0,0]),bounds([-5,-5]),bounds([1e-8,2e-8])]){
  const axis=createAxis(r,{dynamic:true});assert.ok(axis.max>axis.min);assert.ok(axis.ticks.every(Number.isFinite));
 }
});
test('log geometry preserves ratios, raw values, tiny values and visible line interpolation',()=>{
 const original=structuredClone(series),axis=createAxis({min:.01,max:10000},{log:true});
 assert.ok(Math.abs((axis.position(100)-axis.position(10))-(axis.position(10)-axis.position(1)))<1e-12);
 assert.deepEqual(visibleSeriesBounds([{points:[{x:0,y:1},{x:2,y:100}]}],1,true),{min:1,max:Math.exp(Math.log(100)/2)});
 assert.deepEqual(series,original);
 assert.notEqual(formatAxisTick(.00001),formatAxisTick(.00002));
});
test('log never drops zero or negative data, uncertainty bounds or the human baseline',()=>{
 const config={series,chart:'line',axisScale:'log',axisRange:'dynamic'};
 assert.equal(resolveScale(config).log,true);
 for(const chart of ['bar','area','ranking'])assert.equal(resolveScale({...config,chart}).log,false);
 for(const y of [0,-1])assert.equal(resolveScale({...config,series:[{points:[{x:0,y}]}]}).fallback,true);
 const ai={mode:'scatter',rows:[{date:'2020-01-01',score:2,stderr:3}],benchmark:{}};
 assert.equal(resolveScale({...config,ai}).log,false);
 assert.equal(resolveScale({...config,ai:{...ai,rows:[{score:2}],benchmark:{baseline:{score:0}}}}).log,false);
 assert.equal(resolveScale({...config,chart:'cards'}).hasAxis,false);
});
test('AI axis expands smoothly before a discrete observation, preserving earlier uncertainty',()=>{
 const rows=[{date:'2020-01-01',score:10,low:8,high:12},{date:'2021-01-01',score:100,low:90,high:110},{date:'2022-01-01',score:20,low:18,high:22}];
 const first=Date.parse(rows[0].date),last=Date.parse(rows.at(-1).date),time=Date.parse(rows[1].date);
 assert.equal(visibleAiBounds(rows,first,first,last).max,12);
 const moving=visibleAiBounds(rows,time-(last-first)*.02,first,last);
 assert.ok(moving.max>12&&moving.max<110);
 assert.equal(visibleAiBounds(rows,time,first,last).max,110);
 assert.equal(visibleAiBounds(rows,last,first,last).max,110);
 assert.equal(visibleAiBounds(rows,time-1,first,last,20,0).max,12);
});
test('preview/export renderer respects both scale options and the chosen reel language',()=>{
 const drawn=[];const ctx=new Proxy({measureText:t=>({width:String(t).length*10}),fillText:t=>drawn.push(t),globalAlpha:1},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v),`${String(k)} must have finite coordinates`);}});
 const canvas={width:1080,height:1920,getContext:()=>ctx};
 const config=localizeReelConfig({series,chart:'line',title:'Test',subtitle:'Test',source:'Test',unit:'USD',axisRange:'dynamic',axisScale:'log'},'en');
 drawReel(canvas,config,.05,.6);assert.ok(drawn.includes('Expanding range · Log scale'));
 assert.equal(scaleCaption({...config,language:'pl'}),'Zakres rosnący · Skala logarytmiczna');
 for(const chart of ['line','area','bar','ranking','cards'])for(const p of [0,.001,.5,1])drawReel(canvas,{...config,chart},p,p*12);
 const rows=[{id:'a',modelId:'a',model:'A',date:'2020-01-01',score:-10,low:-12,high:-8},{id:'b',modelId:'b',model:'B',date:'2021-01-01',score:100,low:90,high:110}];
 for(const mode of ['ranking','scatter','records'])for(const p of [0,.25,.5,1])drawReel(canvas,{...config,ai:{rows,mode,basis:'release',benchmark:{unit:'pts',name:'Test',id:'eci',source:'Test',retrievedAt:'2026-01-01'}}},p,p*12);
});
