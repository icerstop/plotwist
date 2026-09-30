import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {loadWorldBank,buildSeries} from '../src/data.js';
import {countryCoverage,filterGeographicSeries,comparisonGroups} from '../src/world-bank.js';
import {buildStoryChart,storyDefaults} from '../src/story-data.js';
import {storyLabelParts} from '../src/story-labels.js';
const file=p=>new URL('../'+p,import.meta.url),read=p=>JSON.parse(fs.readFileSync(file(p),'utf8'));
const receipt=read('research/world-bank/receipt.json'),countries=read('src/world-bank-countries.json'),manifest=read('public/stories/manifest.json');
test('WDI country/year observations match archived API including nulls and zero',()=>{
 assert.equal(countries.filter(c=>!c.aggregate).length,217);assert.equal(countries.filter(c=>c.aggregate).length,10);
 assert.equal(new Set(countries.map(c=>c.id)).size,countries.length);
 const allowed=new Set(countries.map(c=>c.id));let total=0;
 for(const item of receipt.indicators){
  const bytes=fs.readFileSync(file(`public/data/${item.id}.json`));assert.equal(createHash('sha256').update(bytes).digest('hex'),item.sha256);
  const rawBytes=gunzipSync(fs.readFileSync(file(`research/world-bank/${item.id}.json.gz`)));assert.equal(createHash('sha256').update(rawBytes).digest('hex'),item.rawSha256);
  const raw=JSON.parse(rawBytes),snapshot=JSON.parse(bytes),input=raw.pages.flatMap(p=>p.data[1]);
  assert.equal(input.length,Number(raw.pages[0].data[0].total));assert.equal(raw.pages.length,Number(raw.pages[0].data[0].pages));
  assert.ok(raw.pages.every(p=>new URL(p.url).pathname.includes('/country/all/')&&!new URL(p.url).searchParams.has('date')));
  const expected=input.filter(r=>allowed.has(r.countryiso3code)).map(r=>({country:r.countryiso3code,year:Number(r.date),value:r.value}));
  assert.deepEqual(snapshot.rows.map(({country,year,value})=>({country,year,value})),expected,item.id);
  assert.equal(new Set(snapshot.rows.map(r=>r.country+':'+r.year)).size,snapshot.rows.length);
  assert.equal(snapshot.rows.filter(r=>r.value!==null).length,item.observations);total+=item.observations;
  for(const s of read(`public/stories/${item.id}.json`).series){assert.deepEqual(s.observationYears,expected.filter(r=>r.country===s.countryCode&&r.value!==null).map(r=>r.year).sort((a,b)=>a-b));assert.ok(storyLabelParts(s).metric.en);}
 }
 assert.equal(receipt.indicators.length,36);assert.equal(total,346983);
});
test('source aggregates without ISO3 remain distinct',async t=>{
 t.mock.method(globalThis,'fetch',async()=>({ok:true,json:async()=>[{pages:1,total:2},['XD','XM'].map(id=>({countryiso3code:'',country:{id},date:'1980',value:1,indicator:{value:'Test'}}))]}));
 assert.deepEqual((await loadWorldBank('SP.POP.TOTL')).rows.map(r=>r.country),['WB:XD','WB:XM']);
});
test('availability requires a real observation, not merely endpoints',()=>{
 const series=[{id:'gap',countryCode:'POL',region:'ECS',observationYears:[1970,1990]},{id:'observed',countryCode:'DEU',region:'ECS',observationYears:[1980]},{id:'asia',countryCode:'JPN',region:'EAS',observationYears:[1980]}];
 assert.deepEqual(filterGeographicSeries(series,{region:'ECS',year:'1980'}).map(s=>s.id),['observed']);
 assert.deepEqual(filterGeographicSeries(series,{group:'poland-west',year:'1970'}).map(s=>s.id),['gap']);
 const snapshot={rows:[{country:'POL',year:1960,value:0},{country:'POL',year:2025,value:null}]};assert.deepEqual(countryCoverage(snapshot).get('POL'),{first:1960,last:1960});
 assert.equal(new Set(buildSeries(snapshot,['POL','DEU','JPN','CHN','USA','FRA'],1960,1961).map(s=>s.color)).size,6);
});
test('Maddison is separate from WDI and preserves earlier Poland and gaps',()=>{
 const topic=read('public/stories/maddison-gdp.json'),pol=topic.series.find(s=>s.entity==='Poland'),wdi=read('public/stories/NY.GDP.PCAP.PP.KD.json').series.find(s=>s.entity==='POL');
 assert.equal(pol.start,'1400-12-31');assert.equal(pol.end,'2022-12-31');assert.equal(pol.kind,'estimate');assert.notEqual(pol.unitKey,wdi.unitKey);
 assert.ok(pol.observationYears.includes(1950)&&pol.observationYears.includes(1989));assert.ok(!pol.observationYears.includes(1401));
 const mixed=buildStoryChart([pol,wdi],{...storyDefaults,selected:[{id:pol.id},{id:wdi.id}],mode:'native'});assert.equal(mixed.independentAxes,true);assert.deepEqual(mixed.series.map(s=>s.unit),[pol.unit,wdi.unit]);
 assert.equal(topic.topic.defaultStart,'1950-01-01');assert.ok(pol.metricLabels.en.includes('Maddison'));
 assert.equal(topic.series.find(s=>s.entity==='Taiwan').region,'EAS');
 for(const g of comparisonGroups){const selected=g.codes.map(c=>topic.series.find(s=>s.countryCode===c)).filter(Boolean);assert.ok(selected.length>=4);assert.equal(buildStoryChart(selected,{...storyDefaults,start:'1950-01-01',selected:selected.map(s=>({id:s.id}))}).series.length,selected.length);}
});
test('Polish GDP coverage differs from health and demographic history',()=>{
 const range=id=>receipt.indicators.find(i=>i.id===id).coverage.find(c=>c.country==='POL');
 assert.equal(range('NY.GDP.PCAP.KD').first,1990);assert.equal(range('SP.DYN.LE00.IN').first,1960);assert.equal(range('FP.CPI.TOTL.ZG').first,1971);assert.ok(range('SI.POV.GINI').missingWithin>0);
 assert.equal(manifest.topics.filter(t=>t.family==='world-bank').length,36);
});
