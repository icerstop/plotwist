import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildStoryChart,readStoryProject,storyCsv,storyDefaults,storyProject,storyRows,topicSelection} from '../src/story-data.js';
import {visibleSeriesBounds} from '../src/chart-scale.js';
import {seriesFrame} from '../src/presentation.js';
import {observationPeriod,timelineDate} from '../src/observation-date.js';
const read=name=>JSON.parse(readFileSync(new URL(`../public/stories/${name}.json`,import.meta.url),'utf8'));
const manifest=read('manifest'),topics=manifest.topics.map(t=>read(t.id)),all=topics.flatMap(t=>t.series),byId=new Map(all.map(s=>[s.id,s]));
const config=(ids,options={})=>({...storyDefaults,selected:ids.map(id=>({id})),...options});
test('every inspiration topic has explicit coverage and source-backed chronological data',()=>{
 assert.equal(manifest.topics.length,31);assert.equal(all.length,manifest.series.length);
 assert.equal(manifest.topics.filter(t=>t.seriesCount>0).length,30);
 const sources=new Set(manifest.sources.map(s=>s.id));let count=0;
 for(const s of all){
  assert.equal(new Set(s.points.map(p=>p.date)).size,s.points.length,s.id);
  assert.deepEqual(s.points.map(p=>p.date),s.points.map(p=>p.date).sort(),s.id);
  assert.ok(s.unit&&s.unitKey&&s.notes!==undefined,s.id);
  for(const p of s.points){assert.ok(sources.has(p.sourceId),s.id);assert.ok(p.value===null||Number.isFinite(p.value),s.id);assert.match(p.date,/^\d{4}-\d{2}-\d{2}$/);assert.equal(new Date(p.date).toISOString().slice(0,10),p.date);for(const id of p.additionalSourceIds||[])assert.ok(sources.has(id));}
  const observed=s.points.filter(p=>p.value!==null);assert.equal(observed.length,s.count);assert.equal(observed[0].date,s.start);assert.equal(observed.at(-1).date,s.end);count+=observed.length;
 }
 assert.equal(count,read('quality-report').observations);
 for(const t of manifest.topics){assert.equal(t.count,all.filter(s=>s.topicId===t.id).reduce((n,s)=>n+s.count,0));assert.ok(t.variants.length);for(const id of t.defaults)assert.ok(byId.has(id));}
});
test('all supplied presets build using their declared comparison mode',()=>{
 for(const t of manifest.topics.filter(t=>t.seriesCount)){
  const result=buildStoryChart(t.defaults.map(id=>byId.get(id)),{...storyDefaults,mode:t.defaultMode,selected:topicSelection(t)});
  assert.ok(result.series.length,t.id);
 }
});
test('Apple fiscal data aligns with the last actual trading day and official unit totals',()=>{
 const units=byId.get('apple--iphone-units');assert.equal(units.points.at(-1).value,217.722);assert.equal(units.end,'2018-09-29');
 const revenue=byId.get('apple--iphone-revenue');assert.equal(revenue.points.find(p=>p.fiscalYear===2024).value,201183);
 const prices=byId.get('apple--stock-close'),daily=new Map(prices.points.map(p=>[p.date,p.value]));
 for(const p of byId.get('apple--stock-fiscal-close').points){assert.ok(p.tradingDate<=p.date);assert.equal(p.value,daily.get(p.tradingDate));assert.equal(new Date(p.date).getUTCDay(),6);}
});
test('financial table extraction keeps units and report column order',()=>{
 assert.equal(byId.get('spotify--mau').points.find(p=>p.period==='2017').value,160);
 assert.equal(byId.get('spotify--arpu').points.find(p=>p.period==='2024').value,4.69);
 assert.equal(byId.get('cloud--amazon').points[0].value,4644);
 assert.equal(byId.get('cloud--alphabet').points[0].value,4056);
 const dc=byId.get('nvidia--data-centers-and-ai'),other=byId.get('nvidia--gaming-devices-automotive'),total=byId.get('nvidia--total');
 dc.points.forEach((p,i)=>{assert.equal(p.date,total.points[i].date);assert.ok(Math.abs(p.value+other.points[i].value-total.points[i].value)<1e-7);});
});
test('housing affordability uses all four quarters and the same city-year wage',()=>{
 const topic=read('wages');assert.equal(topic.series.filter(s=>s.unitKey==='pln-month').length,17);
 for(const s of topic.series.filter(s=>s.kind==='derived'))for(const p of s.points){
  assert.ok(Math.abs(p.value-p.annualPrice/p.monthlyGrossWage)<1e-10);
  const market=s.metric,price=topic.series.find(x=>x.entity===s.entity&&x.unitKey==='pln-m2'&&x.id.includes(s.id.includes('-wtorny-')?'-wtorny-':'-pierwotny-'));
  const year=price.points.filter(x=>x.date.startsWith(p.period)&&x.value!==null);assert.equal(year.length,4);
  assert.ok(Math.abs(p.annualPrice-year.reduce((n,x)=>n+x.value,0)/4)<1e-9);
 }
});
test('CPI is chained multiplicatively and purchasing power uses a documented base',()=>{
 const chain=byId.get('inflation--cpi-chain').points,yoy=byId.get('inflation--cpi-yoy').points;
 for(let i=1;i<chain.length;i++)assert.ok(Math.abs(chain[i].value/chain[i-1].value-yoy[i].value/100)<1e-12);
 const power=byId.get('inflation--purchasing-power').points;assert.equal(power[0].value,100);assert.equal(power[0].period,'2000');
});
test('Nintendo sheet formatting is respected and multi-year tails are not assigned to single years',()=>{
 const ds=byId.get('gaming--nintendo-ds-annual');assert.equal(ds.end,'2023-03-31');
 const rounded=ds.points.find(p=>p.rawSpreadsheetValue===-.1);assert.equal(rounded.value,0);assert.equal(rounded.valueQualifier,'approximately');
 assert.equal(byId.get('gaming--nintendo-switch-annual').points[0].value,2.74);
 assert.ok(!byId.has('gaming--family-computer-nes-cumulative'));
});
test('incompatible units are rejected; index bases follow the selected range and preserve gaps',()=>{
 const a=byId.get('apple--iphone-revenue'),b=byId.get('apple--stock-fiscal-close'),ids=[a.id,b.id];
 assert.throws(()=>buildStoryChart([a,b],config(ids)),/różne jednostki/);
 const result=buildStoryChart([a,b],config(ids,{mode:'index',start:'2014-01-01'}));
 assert.equal(result.bases[0].date,'2014-09-27');assert.deepEqual(result.bases.map(b=>b.date),['2014-09-27','2014-09-27']);assert.ok(result.series.every(s=>s.points[0].y===100));
 const sparse={...a,datePrecisions:['year'],points:[{date:'2000-12-31',value:10},{date:'2002-12-31',value:20}]};
 const plotted=buildStoryChart([sparse],config([a.id],{mode:'index'}));assert.equal(plotted.series[0].points[1].y,null);
 assert.throws(()=>buildStoryChart([{...sparse,points:[{date:'2000-12-31',value:0}]}],config([a.id],{mode:'index'})),/dodatniej/);
});
test('thresholds cannot masquerade as exact growth rates and MAU is distinct from WAU',()=>{
 const azure=byId.get('cloud--azure-lower-bound');assert.equal(azure.points[0].valueQualifier,'>');
 assert.throws(()=>buildStoryChart([azure],config([azure.id],{mode:'index'})),/konkretnych/);
 assert.notEqual(byId.get('adoption--facebook-mau').unitKey,byId.get('adoption--chatgpt-wau').unitKey);
 assert.equal(byId.get('adoption--facebook-mau').count,13);
});
test('step series never expands the axis using a future milestone',()=>{
 const points=[{x:0,y:10,valueQualifier:'>'},{x:10,y:100}],series=[{interpolation:'step',points}];
 assert.equal(visibleSeriesBounds(series,5).max,10);
 const frame=seriesFrame(series,.5,12,.65,6);assert.equal(frame.values[0].value,10);assert.equal(frame.values[0].point.valueQualifier,'>');
});
test('exports remain chronological, preserve missing cells and escape provenance',()=>{
 const series=read('storage').series,rows=storyRows(series,'2010-01-01','2015-12-31');
 assert.deepEqual(rows.map(p=>p.date),rows.map(p=>p.date).sort());assert.ok(rows.some(p=>p.value===null));
 const csv=storyCsv(rows,manifest.sources);assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('https://'));assert.ok(csv.includes('"date_precision"'));assert.ok(!csv.includes('undefined'));
});
test('saved variants round-trip and reject unknown data references',()=>{
 const settings=config(['apple--iphone-revenue'],{start:'2010-01-01',mode:'index',title:'My history'});
 assert.equal(readStoryProject(storyProject(settings,manifest.builtAt),manifest).title,'My history');
 const cleared={...settings,selected:[]};assert.deepEqual(readStoryProject(storyProject(cleared,manifest.builtAt),manifest).selected,[]); // Removing the last series must survive a reload.
 assert.throws(()=>readStoryProject(storyProject(config(['../../private']),manifest.builtAt),manifest),/nieznane/);
});
test('date labels retain annual/fiscal precision and original reports match saved receipts',()=>{
 assert.equal(observationPeriod({date:'2018-09-29',datePrecision:'fiscal-year',fiscalYear:2018}),'FY2018');
 assert.equal(timelineDate(Date.parse('2000-12-31')/86400000,{datePrecision:'year'}),'2000');
 for(const name of ['apple-2018.html','nintendo-sales.xlsx','nbp-housing.xlsx','epoch-price-frontier.csv']){
  const path=new URL(`../research/stories/raw/${name}`,import.meta.url),receipt=JSON.parse(readFileSync(new URL(path.href+'.receipt.json'),'utf8'));
  assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),receipt.sha256,name);
 }
});
