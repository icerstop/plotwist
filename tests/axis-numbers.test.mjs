import test from 'node:test';
import assert from 'node:assert/strict';
import {axisSourceUnit,axisNumberFormat} from '../src/axis-numbers.js';
import {normalizeDesign} from '../src/reel-design.js';
import {drawReel} from '../src/render.js';
import {readFileSync} from 'node:fs';
import {buildStoryChart,storyDefaults} from '../src/story-data.js';
import {localizeReelConfig} from '../src/reel-language.js';
const config=(chart={},unit='mln USD / kwartał',language='pl')=>({unit,language,visuals:{design:normalizeDesign({theme:'light',chart})}});

test('axis units convert the numerator once and preserve denominator units in both languages',()=>{
 for(const unit of ['mln USD / kwartał','USD million / quarter']){
  const n=axisNumberFormat(config({axisNumbers:'billion'},unit),{min:0,max:90000},[0,16000,32000]);
  assert.equal(n.divisor,1000);assert.equal(n.format(16000),'16');assert.match(n.caption,/mld USD/);
 }
 assert.equal(axisSourceUnit('mld USD 2025').power,9);
 assert.equal(axisSourceUnit('bn 2025 USD').power,9);
 for(const unit of ['USD / million tokens (3:1)','zgłoszenia / mln osób','applications / million people','m','km','m²','% populacji'])assert.equal(axisSourceUnit(unit).power,0,unit);
 const en=axisNumberFormat(config({axisNumbers:'billion'},'USD million / quarter','en'),{max:96000,min:0},[0,16000]);assert.equal(en.caption,'Y axis: bn USD / quarter');
 assert.equal(axisNumberFormat(config({axisNumbers:'trillion'},'USD','pl'),{min:0,max:1e12},[0,1e12]).format(1e12),'1');
});

test('automatic magnitude is stable across frames, full mode retains source numbers, and explicit scientific is opt-in',()=>{
 const reference={min:1,max:96000},c=config();
 const early=axisNumberFormat(c,reference,[0,50,100]),late=axisNumberFormat(c,reference,[0,16000,32000]);
 assert.equal(early.divisor,1000);assert.equal(early.divisor,late.divisor);assert.equal(early.caption,late.caption);
 const full=axisNumberFormat(config({axisNumbers:'full'}),reference,[0,16000]);assert.equal(full.format(16000).replace(/\s/g,''),'16000');assert.equal(full.unit,'mln USD / kwartał');
 const scientific=axisNumberFormat(config({axisNumbers:'scientific'}),reference);assert.match(scientific.format(16000),/E/);
 const suffix=axisNumberFormat(config({axisNumbers:'billion',axisUnitPosition:'ticks'}),reference,[0,16000]);assert.equal(suffix.format(16000),'16 mld');assert.equal(suffix.caption,'');
 const n=axisNumberFormat(config({axisNumbers:'full',axisGrouping:false,axisDecimals:'1'},'USD','en'),reference,[0,16000]);assert.equal(n.format(16000.125),'16000.1');
});

test('tiny, negative, zero and logarithmic ticks remain distinct without scientific or fake zeros',()=>{
 const ticks=[0,.000001,.00001,.0001,.001,1],n=axisNumberFormat(config({},'USD'),{min:0,max:1},ticks);
 assert.equal(new Set(ticks.map(n.format)).size,ticks.length);assert.ok(ticks.every(v=>!/[eE]/.test(n.format(v))));assert.equal(n.format(0),'0');
 const coarse=axisNumberFormat(config({axisDecimals:'2'},'USD'),{min:-1,max:1},ticks);assert.equal(coarse.format(.00001),'<0,01');assert.equal(coarse.format(-.00001),'>−0,01');assert.equal(coarse.format(-0),'0');
 const huge=axisNumberFormat(config({},'USD'),{min:0,max:2e12},[0,1e12,2e12]);assert.equal(huge.format(2e12),'2');assert.match(huge.caption,/bln/);
});

test('axis settings persist in shared design and custom captions remain literal',()=>{
 const c=config({axisNumbers:'billion',axisDecimals:'3',axisGrouping:false,axisUnitPosition:'caption',axisUnitLabel:'Przychody w miliardach USD'});
 assert.deepEqual(normalizeDesign(JSON.parse(JSON.stringify(c.visuals.design))),c.visuals.design);
 assert.equal(axisNumberFormat(c).caption,'Przychody w miliardach USD');
 const invalid=normalizeDesign({chart:{axisNumbers:'bad',axisDecimals:99,axisUnitPosition:'bad'}}).chart;assert.equal(invalid.axisNumbers,'auto');assert.equal(invalid.axisDecimals,'auto');assert.equal(invalid.axisUnitPosition,'caption');
});

test('NVIDIA source data renders readable axis values with no scientific fallback in preview and export paths',()=>{
 const dataset=JSON.parse(readFileSync(new URL('../public/stories/nvidia.json',import.meta.url))),result=buildStoryChart(dataset.series,{...storyDefaults,selected:dataset.series.map(s=>({id:s.id}))});
 const original=JSON.stringify(result.series),drawn=[];
 const ctx=new Proxy({canvas:{width:1080,height:1920},font:'25px Arial',globalAlpha:1,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),measureText:t=>({width:String(t).length*15}),fillText:(text,x,y)=>drawn.push({text:String(text),x,y}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n));}});const canvas={width:1080,height:1920,getContext:()=>ctx};
 for(const language of ['pl','en'])for(const format of ['9:16','1:1'])for(const chart of ['line','area','bar'])for(const progress of [0,.3,1]){
  drawn.length=0;drawReel(canvas,localizeReelConfig({...result,...config({axisNumbers:'billion',ticks:7}),series:result.series,title:'NVIDIA',axisRange:'dynamic',format,chart,xType:'date'},language),progress,progress*12);
  const yLabels=drawn.filter(t=>t.x===113);assert.ok(yLabels.length>=2);assert.ok(yLabels.every(t=>!/[eE]/.test(t.text)));assert.ok(drawn.some(t=>t.text.includes(language==='en'?'Y axis: bn':'Oś Y: mld')));
 }
 assert.equal(JSON.stringify(result.series),original);
});
