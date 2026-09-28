import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseCsv,numeric,trackingDate,trackingIq} from '../scripts/ai-csv.mjs';
import {selectAiRows,rankAt,frameAt,timelineSelection} from '../src/ai.js';
test('CSV preserves multiline notes, quotes, empty cells and zero',()=>{
 const r=parseCsv('model,score,note\r\n"A, B",0,"a\n""quote"""\r\nC,,x');assert.equal(r[0].note,'a\n"quote"');assert.equal(numeric(r[0].score),0);assert.equal(numeric(r[1].score),null);
});
test('TrackingAI dates are month/day; formulas follow author and do not score Overall',()=>{
 assert.equal(trackingDate('05/09/2024 14:42:26'),'2024-05-09T14:42:26');assert.equal(trackingIq({test_source:'Mensa Norway',test_score:'11'}),79);assert.equal(trackingIq({test_source:'Offline Test',valid_test_score:'5'}),77);assert.equal(trackingIq({test_source:'Overall',test_score:40}),null);assert.equal(trackingIq({test_source:'Offline Test',valid_test_score:''}),null);
});
const rows=[{id:'a1',modelId:'a',model:'A',releaseDate:'2023-01-01',observedAt:'2024-01-01',score:90},{id:'a2',modelId:'a',model:'A',releaseDate:'2023-01-01',observedAt:'2024-02-01',score:70},{id:'b',modelId:'b',model:'B',releaseDate:'2024-01-01',observedAt:null,score:80}];
test('release retrospective uses latest run, not maximum; observed axis has no release fallback',()=>{
 assert.equal(selectAiRows(rows,{basis:'release'})[0].score,70);assert.equal(selectAiRows(rows,{basis:'observed'}).length,2);assert.equal(selectAiRows(rows,{basis:'observed',end:'2024-01-31'})[0].score,90);assert.equal(selectAiRows(rows,{basis:'observed',end:'2023-12-31'}).length,0);
});
test('rank shows latest known scores only, with no future leakage',()=>{
 const r=selectAiRows(rows,{basis:'observed'});assert.equal(rankAt(r,'2024-01-15')[0].score,90);assert.equal(rankAt(r,'2024-02-01')[0].score,70);assert.equal(frameAt(r,0).rank[0].score,90);assert.equal(frameAt(r,1).rank[0].score,70);
});
test('timeline samples real record observations, retains first and last, max 8',()=>{
 const r=Array.from({length:50},(_,i)=>({id:i,score:i}));const s=timelineSelection(r);assert.equal(s.length,8);assert.equal(s[0].id,0);assert.equal(s.at(-1).id,49);assert.ok(s.every(x=>r.includes(x)));
});
test('shipped snapshots: unique IDs, finite scores, dates, separate sources and evidence',()=>{
 const m=JSON.parse(fs.readFileSync('public/ai/manifest.json'));let count=0;
 for(const b of m.benchmarks){const d=JSON.parse(fs.readFileSync(`public/ai/${b.id}.json`));count+=d.rows.length;assert.equal(new Set(d.rows.map(r=>r.id)).size,d.rows.length);
 for(const r of d.rows){assert.ok(Number.isFinite(r.score));if(d.max)assert.ok(r.score>=0&&r.score<=d.max);assert.ok(r.sourceUrl.startsWith('https://'));if(r.releaseDate)assert.match(r.releaseDate,/^\d{4}-\d{2}-\d{2}$/);if(r.observedAt)assert.match(r.observedAt,/^\d{4}-\d{2}-\d{2}/);if(b.id==='swe-v2')assert.ok(r.observedAt>='2026-02-12');if(b.id==='swe-v1')assert.ok(r.observedAt<'2026-02-12');if(b.id.startsWith('iq-'))assert.equal(/vision/i.test(r.model),b.id.endsWith('-vision'));}}
 assert.equal(m.totalObservations,count);
});
