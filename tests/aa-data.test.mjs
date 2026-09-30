import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {aaDatasets} from '../scripts/aa-datasets.mjs';
import {classifyAiBrand} from '../src/ai-brands.js';
import {selectAiRows,rankAt} from '../src/ai.js';
const read=id=>JSON.parse(fs.readFileSync(`public/ai/${id}.json`));
const snapshot=JSON.parse(fs.readFileSync('research/ai/aa-2026-09-30.json'));
const sol=d=>d.rows.filter(r=>r.model.startsWith('GPT-6.1 Sol ('));

test('AA preserves all five Sol efforts and actual units against primary-source values',()=>{
 const index=read('aa-index-v432'),rows=sol(index);
 assert.equal(rows.length,5);assert.deepEqual(new Set(rows.map(r=>r.effort)),new Set(['max','xhigh','high','medium','low']));
 assert.equal(rows.find(r=>r.effort==='max').score,51.8332597011541);
 assert.equal(sol(read('aa-terminal4')).find(r=>r.effort==='max').score,0.560606060606061*100);
 assert.equal(sol(read('aa-briefcase-v11')).find(r=>r.effort==='max').score,1564.21);
 assert.equal(sol(read('aa-gdpval-v21')).find(r=>r.effort==='max').score,1575.09);
 assert.equal(sol(read('aa-gdp-pdf')).find(r=>r.effort==='max').score,31);
 assert.equal(sol(read('aa-omniscience-nonhallucination')).find(r=>r.effort==='max').score,(1-0.5426561125769569)*100);
 for(const row of rows){assert.equal(row.releaseDate,'2026-09-29');assert.equal(row.observedAt,'2026-09-30');assert.equal(row.dateKind,'snapshot');assert.equal(classifyAiBrand(row).brand.id,'openai');}
 assert.equal(rankAt(selectAiRows(rows,{basis:'release'}),'2026-09-28').length,0);
 assert.equal(rankAt(selectAiRows(rows,{basis:'observed'}),'2026-09-29').length,0);
 assert.equal(read('aa-gdpval-v21').max,undefined);
});

test('AA importer excludes estimates, retains zero, skips null, rejects incompatible scales',()=>{
 const m=structuredClone(snapshot.models[0]);
 m.intelligenceIndex=0;m.omniscienceAccuracy=null;m.intelligenceIndexEvaluations=[];
 const build=models=>aaDatasets({...snapshot,models});
 const rows=build([m]);assert.equal(rows.find(d=>d.id==='aa-index-v432').rows[0].score,0);
 assert.equal(rows.find(d=>d.id==='aa-omniscience-accuracy').rows.length,0);
 assert.equal(rows.find(d=>d.id==='aa-terminal4').rows.length,0);
 assert.ok(build([{...m,intelligenceIndexIsEstimated:true}]).every(d=>!d.rows.length));
 assert.throws(()=>build([{...m,omniscienceAccuracy:92}]),/Invalid AA score/);
 assert.throws(()=>aaDatasets({...snapshot,indexVersion:'5'}),/methodology/);
});

test('shipped AA datasets reproduce source snapshot and preserve coverage/provenance',()=>{
 const datasets=aaDatasets(snapshot),manifest=read('manifest');
 assert.equal(datasets.length,11);assert.equal(snapshot.models.length,191);
 for(const d of datasets){
  const shipped=read(d.id);
  assert.equal(shipped.rows.length,d.rows.length);
  assert.equal(shipped.provenance[0].sha256,createHash('sha256').update(fs.readFileSync('research/ai/aa-2026-09-30.json')).digest('hex'));
  for(const row of shipped.rows)assert.deepEqual(row,d.rows.find(r=>r.id===row.id));
 }
 assert.equal(manifest.featuredRelease.model,'GPT-6.1 Sol');
 assert.equal(manifest.featuredRelease.benchmarkIds.length,11);
 for(const id of manifest.featuredRelease.missingBenchmarks)assert.ok(!read(id).rows.some(r=>/gpt[ -]?6[.-]1[ -]sol/i.test(r.model)));
 assert.ok(!datasets.some(d=>/scicode|critpt/i.test(d.name)));
 const brands={SpaceXAI:'xai',Kimi:'moonshot',Mistral:'mistral','Z AI':'zai'};
 for(const [organization,id] of Object.entries(brands))assert.equal(classifyAiBrand({model:'Source model',organization}).brand.id,id);
});
