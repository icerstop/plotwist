import test from 'node:test';
import assert from 'node:assert/strict';
import {buildStoryChart,storyDefaults,readStoryProject,storyProject,storyRows} from '../src/story-data.js';
import {drawReel} from '../src/render.js';
import {normalizeDesign} from '../src/reel-design.js';
import {localizeReelConfig} from '../src/reel-language.js';
import {seriesFrame} from '../src/presentation.js';

const data=[
 {id:'gdp',name:'Polska · PKB',unit:'USD',unitKey:'gdp',values:[1e9,2e9,3e9]},
 {id:'inflation',name:'Polska · Inflacja',unit:'% rocznie',unitKey:'inflation',values:[4,null,-2]},
 {id:'internet',name:'Polska · Internet',unit:'% populacji',unitKey:'internet',values:[null,50,90]},
].map(s=>({...s,entity:'Polska',topicId:s.id,metric:s.name,kind:'observed',frequency:'annual',datePrecisions:['year'],points:s.values.map((value,i)=>({date:`${2000+i}-12-31`,datePrecision:'year',period:String(2000+i),value}))}));
const settings={...storyDefaults,selected:data.map(s=>({id:s.id}))};

test('different metrics keep originals, units, gaps and a shared observation clock',()=>{
 const original=JSON.stringify(data),r=buildStoryChart(data,settings);
 assert.equal(r.independentAxes,true);assert.equal(r.unit,'');assert.deepEqual(r.series.map(s=>s.unit),['USD','% rocznie','% populacji']);
 assert.equal(r.series[1].points[1].y,null);assert.equal(r.series[1].points[2].y,-2);
 assert.equal(seriesFrame(r.series,0,12,.65,0).values[2].value,null);
 assert.equal(seriesFrame(r.series,1,12,.65,12).values[2].value,90);
 assert.equal(JSON.stringify(data),original);assert.ok(storyRows(data).some(p=>p.value===null));
 const same=buildStoryChart([data[0],{...data[0],id:'gdp2'}],settings);assert.equal(same.independentAxes,false);
 // Same unit wording is insufficient when measurement types differ.
 assert.equal(buildStoryChart([data[1],{...data[2],unit:'% rocznie'}],settings).independentAxes,true);
});

test('range normalization handles signed, zero, constant and sparse data without changing source values',()=>{
 const r=buildStoryChart(data,{...settings,mode:'range'});assert.equal(r.independentAxes,false);assert.equal(r.unit,'zakres 0–100');
 assert.deepEqual(r.series[0].points.map(p=>p.y),[0,50,100]);assert.deepEqual(r.series[1].points.map(p=>p.y),[100,null,0]);assert.equal(r.series[1].points.at(-1).value,-2);
 const constant={...data[0],points:data[0].points.map(p=>({...p,value:0}))};assert.ok(buildStoryChart([constant],{...settings,mode:'range'}).series[0].points.every(p=>p.y===50));
 const cropped=buildStoryChart(data,{...settings,mode:'range',start:'2001-01-01'});assert.equal(cropped.series[0].points[0].y,0);assert.equal(cropped.series[1].points.at(-1).y,50);
 const index=buildStoryChart(data,{...settings,mode:'index'});assert.equal(index.series[1].points.at(-1).y,-50);assert.ok(index.series.every(s=>s.unit==='indeks 100'));
 const manifest={series:data,topics:data.map(s=>({id:s.id}))};for(const mode of ['native','index','range'])assert.equal(readStoryProject(storyProject({...settings,mode}),manifest).mode,mode);
 assert.throws(()=>buildStoryChart([{...constant,kind:'lower-bound'}],{...settings,mode:'range'}),/konkretnych/);
});

function recorder(){
 const text=[],stack=[];const ctx=new Proxy({font:'30px Arial',globalAlpha:1,textAlign:'left',getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),measureText:s=>({width:String(s).length*12}),fillText(s){if(this.globalAlpha>0)text.push(String(s));},save(){stack.push({font:this.font,globalAlpha:this.globalAlpha,textAlign:this.textAlign});},restore(){Object.assign(this,stack.pop());}},{get:(o,k)=>k in o?o[k]:(...args)=>args.forEach(n=>{if(typeof n==='number')assert.ok(Number.isFinite(n),`${String(k)}: ${args}`);})});
 const canvas={width:1080,height:1920,getContext:()=>ctx};ctx.canvas=canvas;return {canvas,text,stack};
}
test('native panels and cards render original units, localized labels and finite geometry across formats',()=>{
 for(const chart of ['line','area','bar','cards'])for(const format of ['9:16','1:1','4:5']){
  const c=localizeReelConfig({...buildStoryChart(data,settings),chart,format,duration:12,title:'Mixed data',source:'Source',subtitle:'Separate scales',xType:'date',visuals:{design:normalizeDesign({chart:{endLabels:true}})}},'en');
  const {canvas,text,stack}=recorder();for(const p of [0,.5,1])drawReel(canvas,c,p,p*12);
  assert.equal(stack.length,0);assert.ok(text.some(t=>t.includes('% of population')));assert.ok(text.some(t=>t.includes('USD')));assert.ok(text.some(t=>t.includes('−2')||t.includes('-2')));
 }
 const six=[...data,...data.map(s=>({...s,id:s.id+'2'}))],c={...buildStoryChart(six,{...settings,selected:six.map(s=>({id:s.id}))}),chart:'line',format:'1:1',visuals:{design:normalizeDesign({chart:{endLabels:true}})}};
 const {canvas,stack}=recorder();drawReel(canvas,c,1);assert.equal(stack.length,0);
});
