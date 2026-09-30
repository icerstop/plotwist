import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {arc3Datasets} from '../scripts/arc3-datasets.mjs';
import {aiValue,selectAiRows,rankAt} from '../src/ai.js';
import {annotateAiBrands} from '../src/ai-brands.js';
import {buildAiBrandHistory} from '../src/ai-brand-history.js';
const read=path=>JSON.parse(fs.readFileSync(path));
const receipt=read('research/ai/arc-agi-3-receipt.json');
const snapshot=read(`research/ai/${receipt.file}`);

test('ARC-AGI-3 keeps every official configuration, exact score, harness and evidence',()=>{
 const datasets=arc3Datasets(snapshot,receipt);
 assert.equal(datasets.length,2);
 assert.deepEqual(datasets.map(d=>d.rows.length),[48,21]);
 for(const d of datasets){
  const shipped=read(`public/ai/${d.id}.json`);
  assert.deepEqual(shipped.rows,d.rows);
  assert.equal(d.defaultBasis,'observed');assert.equal(d.baseline.score,100);
  assert.equal(shipped.provenance[0].sha256,createHash('sha256').update(fs.readFileSync(`research/ai/${receipt.file}`)).digest('hex'));
  assert.equal(new Set(d.rows.map(r=>r.modelId)).size,d.rows.length);
  for(const r of d.rows){
   const original=snapshot.evaluations.find(e=>e.modelId===r.sourceModelId);
   assert.equal(r.score,original.score*100);assert.equal(r.evaluationCostUsd,original.cost);
   assert.equal(r.observedAt,receipt.retrievedAt.slice(0,10));assert.equal(r.dateKind,'snapshot');
   assert.equal(r.harness,d.id==='arc3'?'Standard':'Provider Adapter');
  }
 }
 const standard=datasets[0],adapter=datasets[1];
 assert.equal(standard.rows.find(r=>r.sourceModelId==='openai-gpt-6-astra-max').score,62.71280210060628);
 assert.ok(Math.abs(adapter.rows.find(r=>r.sourceModelId==='openai-gpt-6-astra-high-provider-adapter').score-99.945712321257)<1e-10);
 assert.ok(!datasets.flatMap(d=>d.rows).some(r=>/6\.1|Sonnet 5\.5|Opus 5\.5/.test(r.model))); // Unreported is not zero.
});

test('ARC import excludes unreported/hidden/non-comparable data, preserves zero, rejects corruption',()=>{
 const row=snapshot.evaluations[0],receiptCopy={...receipt,releaseDateReviews:{}};
 const make=evaluations=>arc3Datasets({...snapshot,evaluations},receiptCopy);
 const d=make([{...row,score:0},{...row,modelId:'missing',score:null},{...row,modelId:'hidden',display:false},{...row,modelId:'public',datasetId:'v3_Public_Demo'}]);
 assert.equal(d[0].rows.length,1);assert.equal(d[0].rows[0].score,0);
 assert.throws(()=>make([{...row,score:NaN}]),/Invalid/);
 assert.throws(()=>make([{...row,score:1.01}]),/Invalid/);
 assert.throws(()=>make([row,row]),/Duplicate/);
 assert.throws(()=>make([]),/No visible/);
});

test('ARC dates stay honest and brand comparisons cannot leak future observations',()=>{
 const d=arc3Datasets(snapshot,receipt)[0];
 assert.equal(d.rows.find(r=>r.sourceModelId==='anthropic-opus-4-6-max-effort').releaseDate,'2026-02-05');
 assert.equal(d.rows.find(r=>r.sourceModelId==='google-gemini-3-1-pro-preview').releaseDate,'2026-02-19');
 const grok=d.rows.find(r=>r.sourceModelId==='xai-grok-4-20-beta-0309-reasoning');
 assert.equal(grok.releaseDate,null);assert.equal(grok.sourceReleaseDate,'2026-03-05');
 const annotated=annotateAiBrands(d.rows),day=receipt.retrievedAt.slice(0,10);
 assert.deepEqual([...new Set(annotated.map(r=>r.brandId))].sort(),['anthropic','google','openai','xai']);
 const observed=selectAiRows(annotated,{basis:'observed'});
 assert.equal(rankAt(observed,'2026-09-29').length,0);
 assert.equal(rankAt(observed,day).length,48);
 const releases=selectAiRows(annotated,{basis:'release'});
 assert.equal(releases.length,47);assert.ok(!releases.some(r=>r.id===grok.id));
 const history=buildAiBrandHistory(observed,{brandIds:['openai','anthropic','google','xai']});
 assert.equal(history.frames.length,1);assert.equal(history.frames[0].leaders.length,4);
 assert.equal(history.frames[0].rank[0].brand.id,'openai');
});

test('ARC precision shows small scores and near-human scores accurately in both languages',()=>{
 assert.equal(aiValue(.01,'pl',2),'0,01');assert.equal(aiValue(.027919,'en',2),'0.03');
 assert.equal(aiValue(99.945712321257,'pl',2),'99,95');
 assert.equal(aiValue(69.77,'en'),'69.8'); // Other benchmarks retain their existing formatting.
});
