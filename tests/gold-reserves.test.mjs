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
 const latest=get('tonnes').points.at(-1);assert.equal(latest.date,'2026-08-31');assert.equal(latest.sourceValue,20.833);assert.ok(Math.abs(latest.value-647.9787321744)<1e-8);
 assert.ok(Math.abs(at(get('tonnes'),'2026-07')-640.2028629744)<1e-8);
 assert.ok(Math.abs(at(get('monthly-change'),'2026-07')-7.7758692)<1e-8);
 assert.notEqual(latest.value,21*31.1034768);
});
test('all 320 months are source-backed, former gaps retain reported provenance and changes use adjacent observations',()=>{
 const q=json('research/gold-reserves/quality.json');assert.equal(q.missingVolumeMonths.length,0);assert.equal(q.interpolatedObservations,0);
 const reports=json('research/gold-reserves/raw/reported-monthly-volume.json');
 assert.equal(reports.observations.length,11);
 for(const o of reports.observations){
  const p=get('tonnes').points.find(p=>p.period===o.period);
  assert.equal(p.sourceId,o.sourceId);assert.equal(p.sourceValueText,o.value);
  assert.equal(p.evidenceType,'secondary-report-of-NBP-observation');assert.equal(p.interpolated,false);
  assert.ok(Math.abs(p.value-Number(o.value)*31.1034768)<1e-9);
  assert.ok(reports.sources.some(s=>s.id===p.sourceId&&s.url===p.sourceUrl&&s.publishedAt===p.publishedAt));
 }
 const points=get('tonnes').points;assert.equal(points.length,320);
 for(let i=1;i<points.length;i++){
  const prev=points[i-1],curr=points[i],month=p=>Number(p.period.slice(0,4))*12+Number(p.period.slice(5));
  assert.equal(month(curr)-month(prev),1);assert.notEqual(curr.value,null);
  assert.ok(Math.abs(at(get('monthly-change'),curr.period)-(curr.value-prev.value))<1e-9);
 }
 assert.equal(get('monthly-change').points.filter(p=>p.value===null).length,1);
 assert.ok(Math.abs(at(get('tonnes'),'2025-11')-17.469*31.1034768)<1e-9); // Later report, not the 17.479 estimate.
 assert.equal(get('tonnes').points.find(p=>p.period==='2026-03').sourceDecimals,2);
 const chart=buildStoryChart([get('tonnes')],{...storyDefaults,selected:topicSelection(topic)});
 assert.equal(chart.series[0].points.filter(p=>p.y===null).length,0);
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
