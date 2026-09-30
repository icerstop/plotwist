import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {buildStoryChart,storyDefaults,topicSelection} from '../src/story-data.js';
import {seriesFrame} from '../src/presentation.js';
import {formatValue} from '../src/render.js';
import {translate} from '../src/translations.js';

const data=id=>JSON.parse(readFileSync(new URL(`../public/stories/${id}.json`,import.meta.url),'utf8'));
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);

test('six cost decline estimates preserve historical windows and compound quarterly rates',()=>{
 const {topic,series}=data('technology-costs');
 assert.equal(topic.defaultChart,'ranking');assert.equal(topic.defaults.length,6);assert.equal(series.length,18);
 for(const s of series){
  assert.equal(s.points.length,1);const p=s.points[0];
  assert.equal(p.dateMeaning,'publication');assert.equal(p.date,'2026-09-22');assert.ok(s.name.includes(p.comparisonPeriod));
  if(s.id.endsWith('-quarterly'))near(p.value,p.quarterlyRate*100);
  else if(s.id.endsWith('-annual'))near(p.value,100*(1-(1-p.quarterlyRate)**4));
  else near(p.value,(1-p.quarterlyRate)**-4);
 }
 const ai=series.find(s=>s.id==='technology-costs--ai-quarterly');near(ai.points[0].value,47);
 assert.equal(series.find(s=>s.id==='technology-costs--dna-quarterly').points[0].comparisonPeriod,'2001–22');
});

test('AI frontier preserves actual model records, adjusted thresholds and monotonically falling costs',()=>{
 const {series}=data('ai-task-cost');assert.equal(series.length,7);assert.equal(series.reduce((n,s)=>n+s.count,0),40);
 for(const s of series){
  assert.equal(s.unitKey,'usd-nominal-per-task');assert.equal(s.interpolation,'step');
  s.points.forEach((p,i)=>{
   assert.ok(p.model&&p.benchmark);assert.ok(p.value>0);assert.ok(p.score>=p.threshold);
   assert.equal(p.dateMeaning,'model-release-as-reported');assert.equal(p.scoreDefinition,'guessing-adjusted');
   if(i){assert.ok(p.date>s.points[i-1].date);assert.ok(p.value<s.points[i-1].value);}
   near(p.rawThreshold,p.guessingFloor+(1-p.guessingFloor)*p.threshold);
  });
 }
 const gpqa=series.find(s=>s.id==='ai-task-cost--gpqa-75');
 near(gpqa.points[0].rawThreshold,.8125);near(gpqa.points[0].value,.298906);near(gpqa.points.at(-1).value,.000412);
 assert.equal(gpqa.points.at(-1).date,'2026-07-09');
 assert.notEqual(data('ai-cost').series[0].unitKey,gpqa.unitKey);
});

test('chip aggregate uses spending weights and all 57 source rows',()=>{
 const {series}=data('ai-chip-value');assert.equal(series.length,18);
 const raw=readFileSync(new URL('../research/stories/raw/epoch-chip-performance.csv',import.meta.url),'utf8').trim().split(/\r?\n/).slice(1).map(line=>{const [quarter,chip,performance,spending]=line.split(',');return {quarter:quarter.replace(' ','-'),chip,performance:Number(performance),spending:Number(spending)};});
 assert.equal(raw.length,57);
 const avg=series.find(s=>s.id.endsWith('--all-weighted')),totals=series.find(s=>s.id.endsWith('--all-spending'));
 assert.equal(avg.count,12);
 for(const p of avg.points){const rows=raw.filter(r=>r.quarter===p.period),sum=rows.reduce((n,r)=>n+r.spending,0);near(p.value,rows.reduce((n,r)=>n+r.performance*r.spending,0)/sum);near(totals.points.find(v=>v.period===p.period).value,sum);}
 const a100=series.find(s=>s.id.endsWith('--a100-performance')),h100=series.find(s=>s.id.endsWith('--h100-h200-performance'));
 const chart=buildStoryChart([a100,h100],{...storyDefaults,selected:[{id:a100.id},{id:h100.id}]});
 assert.equal(chart.series[0].points.at(-1).y,null,'A100 must not be carried beyond its last separate source row');
 assert.equal(seriesFrame(chart.series,1,12,.65,12).values[0].value,null);
 const mixed=buildStoryChart([avg,totals],{...storyDefaults,selected:[{id:avg.id},{id:totals.id}]});assert.equal(mixed.independentAxes,true);assert.deepEqual(mixed.series.map(s=>s.unit),[avg.unit,totals.unit]);
});

test('NHGRI retains monthly precision, nominal dollars and original sheet references',()=>{
 const {topic,series}=data('dna-cost');assert.equal(series.length,2);assert.equal(topic.count,156);
 for(const s of series){assert.equal(s.count,78);assert.equal(s.start,'2001-09-30');assert.equal(s.end,'2022-05-31');for(const p of s.points){assert.equal(p.datePrecision,'month');assert.equal(p.inflationAdjusted,false);assert.ok(p.sourceRow>=2);assert.equal(p.sourceSheet,'Data Table');}}
 const genome=series.find(s=>s.id.endsWith('--genome'));near(genome.points[0].value,95263071.9227537);near(genome.points.at(-1).value,524.6246837058089);
 assert.notEqual(series[0].unitKey,series[1].unitKey);
});

test('tiny costs stay nonzero in both reel languages and source files match their receipts',()=>{
 assert.equal(formatValue(.000412,'en'),'0.000412');assert.equal(formatValue(.000412,'pl'),'0,000412');
 assert.equal(formatValue(0,'pl'),'0');assert.notEqual(formatValue(.000000031,'en'),'0');
 assert.equal(translate('GPQA · próg 75%','en'),'GPQA · 75% threshold');
 for(const name of ['epoch-thought-figure1.csv','epoch-thought-figure2.csv','epoch-chip-performance.csv','nhgri-sequencing-costs.xls']){
  const path=new URL(`../research/stories/raw/${name}`,import.meta.url),receipt=JSON.parse(readFileSync(new URL(path.href+'.receipt.json'),'utf8'));
  assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),receipt.sha256);
 }
});
