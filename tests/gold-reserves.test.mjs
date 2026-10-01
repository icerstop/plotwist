import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildStoryChart,topicSelection,storyDefaults} from '../src/story-data.js';
import {storySeriesName} from '../src/story-labels.js';
const json=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const {topic,series}=json('public/stories/poland-gold.json'),get=key=>series.find(s=>s.id==='poland-gold--'+key),at=(s,p)=>s.points.find(x=>x.period===p)?.value;
test('gold quantity follows IMF observations and NBP form dates without rounding ECB ounces into tonnes',()=>{
 const source=json('research/gold-reserves/raw/imf-dbnomics-volume.json').series.docs[0];
 for(let i=0;i<source.period.length;i++)if(Number.isFinite(source.value[i]))assert.ok(Math.abs(at(get('tonnes'),source.period[i])-source.value[i]*31.1034768)<1e-9);
 const latest=get('tonnes').points.at(-1);assert.equal(latest.date,'2026-07-31');assert.equal(latest.sourceValue,20.583);assert.ok(Math.abs(latest.value-640.2028629744)<1e-8);
 assert.ok(Math.abs(at(get('monthly-change'),'2026-07')-7.7758692)<1e-8);
 assert.notEqual(latest.value,21*31.1034768);
});
test('known missing months stay null, including month-on-month calculations across the gap',()=>{
 const q=json('research/gold-reserves/quality.json');assert.equal(q.missingVolumeMonths.length,10);
 for(const p of q.missingVolumeMonths){assert.equal(at(get('tonnes'),p),null);assert.equal(at(get('monthly-change'),p),null);}
 assert.equal(at(get('monthly-change'),'2026-06'),null);
 const chart=buildStoryChart([get('tonnes')],{...storyDefaults,selected:topicSelection(topic)});
 assert.equal(chart.series[0].points.filter(p=>p.y===null).length,10);
 assert.ok(chart.series[0].points.at(-1).y>640);
});
test('gold share uses same-month same-currency valuations, and bilingual labels preserve distinct measures',()=>{
 for(const p of get('share').points)if(p.value!==null)assert.ok(Math.abs(p.value-100*at(get('gold-pln'),p.period)/at(get('reserves-pln'),p.period))<1e-9);
 for(const key of ['gold-pln','gold-eur','reserves-pln','share'])assert.equal(at(get(key),'2014-05'),null);
 assert.equal(series.length,6);assert.equal(get('tonnes').countryCode,'POL');
 assert.equal(storySeriesName(get('tonnes'),'en'),'Poland · Gold reserves');
 assert.equal(storySeriesName(get('tonnes'),'pl'),'Polska · Rezerwy złota');
 for(const name of ['imf-dbnomics-volume.json','un-gold-poland.html','964irfcl-21-07-2026.xlsx','gus-nbp-2026-08.xlsx','ecb-reserves.csv']){
  const path='research/gold-reserves/raw/'+name,receipt=json(path+'.receipt.json');
  assert.equal(createHash('sha256').update(readFileSync(new URL('../'+path,import.meta.url))).digest('hex'),receipt.sha256);
 }
});
