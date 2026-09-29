import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {storyLabelParts,storySeriesName,commonSeriesMetric} from '../src/story-labels.js';
import {buildStoryChart,storyDefaults} from '../src/story-data.js';
import {localizeReelConfig} from '../src/reel-language.js';
import {normalizeDesign,seriesPlotLayout,sectionTransform} from '../src/reel-design.js';
import {drawReel} from '../src/render.js';
import {reelElements} from '../src/reel-elements.js';
const read=id=>JSON.parse(readFileSync(new URL(`../public/stories/${id}.json`,import.meta.url),'utf8'));
const metadata=read('manifest').series;
const work=read('work').series;
const productivity=work.filter(s=>s.metric==='Productivity: output per hour worked'&&['Poland','Germany'].includes(s.entity));
const build=(ss,patch={})=>({title:'Test',subtitle:'Unit',source:'Źródło: Data',compactTitle:true,format:'9:16',...buildStoryChart(ss,{...storyDefaults,start:'2000-01-01',mode:'index',selected:ss.map(s=>({id:s.id})),...patch})});

test('every shipped data definition has bilingual labels; benchmark and model proper names stay unchanged',()=>{
 for(const s of metadata){const p=storyLabelParts(s);assert.ok(p.full.pl&&p.full.en,s.id);if(s.topicId!=='ai-cost')assert.ok(p.key&&p.metric?.pl&&p.metric?.en,s.id);else assert.equal(p.full.pl,p.full.en);}
 const algeria=work.find(s=>s.entity==='Algeria');assert.match(storySeriesName(algeria,'pl'),/^Algieria · /);assert.match(storySeriesName(algeria,'en'),/^Algeria · /);
 const mena=metadata.find(s=>s.topicId==='patents'&&s.entity==='MEA');assert.match(storySeriesName(mena,'pl'),/Afganistan i Pakistan/);
});

test('one shared metric is translated independently of the original dataset language',()=>{
 const c=build(productivity),original=structuredClone(c.series);
 for(const lang of ['pl','en']){
  const localized=localizeReelConfig(c,lang);
  assert.equal(localized.metricCaption,lang==='pl'?'Produktywność: PKB na godzinę pracy':'Productivity: GDP per hour worked');
  assert.deepEqual(localized.series.map(s=>s.name).sort(),lang==='pl'?['Niemcy','Polska']:['Germany','Poland']);
  assert.ok(localized.series.every((s,i)=>s.points===c.series[i].points));
 }
 assert.deepEqual(c.series,original);
 const full=localizeReelConfig({...c,visuals:{design:normalizeDesign({legendMode:'full'})}},'en');assert.equal(full.metricCaption,'');assert.ok(full.series.every(s=>s.name.includes('GDP per hour worked')));
});

test('same country with different metrics and same units with different definitions retain full names',()=>{
 const poland=productivity.find(s=>s.entity==='Poland'),internet=read('IT.NET.USER.ZS').series.find(s=>s.entity==='POL');
 const mixed=localizeReelConfig(build([poland,internet]),'pl');assert.equal(mixed.metricCaption,'');assert.match(mixed.series[0].name,/Produktywność/);assert.match(mixed.series[1].name,/internetu/);
 const housing=read('wages').series.filter(s=>s.entity==='Warszawa'&&s.unitKey==='pln-m2');
 const prices=localizeReelConfig(build(housing),'en');assert.equal(prices.metricCaption,'');assert.ok(prices.series.some(s=>s.name.includes('primary market')));assert.ok(prices.series.some(s=>s.name.includes('secondary market')));
 const wages=read('wages').series.filter(s=>s.entity==='Warszawa'&&s.metric==='Cena m² / miesięczna płaca brutto');
 const affordability=localizeReelConfig(build(wages),'pl');assert.ok(affordability.metricCaption);assert.ok(affordability.series.some(s=>s.name.includes('rynek pierwotny')));assert.ok(affordability.series.some(s=>s.name.includes('rynek wtórny')));
});

test('custom labels survive language switches and unknown/duplicate short labels never group',()=>{
 const c=build(productivity);c.series[0]={...c.series[0],name:'Moja nazwa',nameIsCustom:true};
 assert.equal(localizeReelConfig(c,'en').series[0].name,'Moja nazwa');
 assert.equal(commonSeriesMetric([{name:'A'},{name:'B'}]),null);
 assert.equal(commonSeriesMetric([c.series[1],{...c.series[1],id:'another-protocol'}]),null);
 const single=localizeReelConfig(build([productivity[0]]),'pl');assert.equal(single.metricCaption,'');assert.match(single.series[0].name,/Produktywność/);
});

test('caption overrides are scoped by metric and reel language and survive older saved designs',()=>{
 const c=build(productivity),key=commonSeriesMetric(c.series).key;
 const design=normalizeDesign({metricLabels:{[key]:{pl:'Wartość godziny pracy',en:'Value of one working hour'}},text:{metric:{color:'#123456',fontId:'georgia'}},elements:{metric:{x:3,y:2,rotation:8,scale:115}}});
 assert.equal(localizeReelConfig({...c,visuals:{design}},'en').metricCaption,'Value of one working hour');
 assert.equal(localizeReelConfig({...c,visuals:{design}},'pl').metricCaption,'Wartość godziny pracy');
 const internet=read('IT.NET.USER.ZS').series.slice(0,2);assert.notEqual(localizeReelConfig({...build(internet),visuals:{design}},'pl').metricCaption,'Wartość godziny pracy');
 assert.deepEqual(normalizeDesign(JSON.parse(JSON.stringify(design))),design);assert.equal(normalizeDesign({}).legendMode,'auto');assert.deepEqual(normalizeDesign({}).metricLabels,{});
});

test('shared caption renders once and is selectable in every standard chart type and aspect ratio',()=>{
 for(const chart of ['line','area','bar','ranking','cards'])for(const format of ['9:16','4:5','1:1']){
  const texts=[],canvas={width:1080,height:1920};
  const ctx=new Proxy({canvas,font:'32px Arial',globalAlpha:1,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),measureText:s=>({width:String(s).length*12}),fillText:s=>texts.push(String(s))},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v));}});canvas.getContext=()=>ctx;
  const config=localizeReelConfig({...build(productivity),chart,format},'pl');drawReel(canvas,config,1,12);
  assert.equal(texts.filter(s=>s===config.metricCaption).length,1,chart+' '+format);assert.ok(texts.includes('Polska'));assert.ok(texts.includes('Niemcy'));assert.ok(reelElements(canvas).some(r=>r.id==='metric'));
 }
});

test('default shared caption reserves space between the header, chart caption and plot',()=>{
 for(const height of [1080,1350,1920])for(const count of [2,6]){
  const config={metricCaption:'Productivity',compactTitle:true,series:Array(count).fill({}),visuals:{design:normalizeDesign()}};
  const headerEnd=height<1400?430:590,plot=seriesPlotLayout(config,1080,height,headerEnd);
  const h=sectionTransform(config,'header',1080,height),c=sectionTransform(config,'content',1080,height);
  const captionTop=c.y+(plot.top-106-32-c.base.y)*c.scale;
  const headerBottom=h.y+(headerEnd-h.base.y)*h.scale*plot.headerScale;
  assert.ok(captionTop>=headerBottom,`${height}, ${count}`);assert.ok(plot.bottom-plot.top>=190);
 }
});

test('six square cards leave space between labels and values after adding a shared caption',()=>{
 const texts=[],canvas={width:1080,height:1080};
 const ctx=new Proxy({canvas,font:'32px Arial',globalAlpha:1,getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),measureText:s=>({width:String(s).length*10}),fillText(s,x,y){texts.push({text:String(s),x,y,size:Number(this.font.match(/([\d.]+)px/)?.[1])});}},{get:(o,k)=>k in o?o[k]:()=>{}});canvas.getContext=()=>ctx;
 const ss=work.filter(s=>s.metric==='Productivity: output per hour worked').slice(0,6);
 const config=localizeReelConfig({...build(ss),format:'1:1',chart:'cards'},'pl');drawReel(canvas,config,1,12);
 for(const s of config.series){const label=texts.find(t=>t.text===s.name),value=texts.find(t=>t.x===label.x&&t.y>label.y&&/^\d/.test(t.text));assert.ok(value);assert.ok(value.y-value.size*.8>label.y+label.size*.2,s.name);}
});
