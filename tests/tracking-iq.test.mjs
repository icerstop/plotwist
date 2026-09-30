import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {parseCsv,trackingDate,trackingIq} from '../scripts/ai-csv.mjs';
import {trackingConfig,trackingRankings} from '../scripts/tracking-iq.mjs';
const read=path=>JSON.parse(fs.readFileSync(path,'utf8'));
const raw=parseCsv(fs.readFileSync('research/ai/tracking-iq.csv','utf8')),receipt=read('research/ai/tracking-receipt.json');

test('TrackingAI accepts one-digit source dates/hours without timezone shifts and rejects impossible dates',()=>{
 assert.equal(trackingDate('03/26/2026 1:25:00'),'2026-03-26T01:25:00');assert.equal(trackingDate('6/11/2026 20:50:00'),'2026-06-11T20:50:00');assert.equal(trackingDate('2/29/2024 0:00:00'),'2024-02-29T00:00:00');
 for(const date of ['02/29/2026 12:00:00','13/01/2026 12:00:00','04/31/2026 12:00:00','01/01/2026 24:00:00','01/01/2026 12:60:00','not a date'])assert.equal(trackingDate(date),null);
});
test('every source IQ run, including 33 formerly skipped dates, is represented once in historical datasets',()=>{
 const rows=['iq-mensa','iq-mensa-vision','iq-offline','iq-offline-vision'].flatMap(id=>read(`public/ai/${id}.json`).rows),byId=new Map(rows.map(r=>[r.id,r]));
 const accepted=raw.map((r,i)=>({r,id:`tracking-${i}`})).filter(({r})=>trackingIq(r)!==null);assert.equal(rows.length,accepted.length);assert.equal(byId.size,rows.length);
 for(const {r,id} of accepted){assert.equal(byId.get(id)?.score,trackingIq(r));assert.equal(byId.get(id)?.observedAt,trackingDate(r.date_time));}
 const formerlySkipped=accepted.filter(({r})=>!/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(r.date_time));assert.equal(formerlySkipped.length,33);assert.ok(formerlySkipped.every(r=>byId.has(r.id)));
 const sha=createHash('sha256').update(fs.readFileSync('research/ai/tracking-iq.csv')).digest('hex');assert.equal(sha,receipt.downloads.find(d=>d.file==='tracking-iq.csv').sha256);
});
test('snapshot reproduces all 25 Mensa scores in the supplied TrackingAI screenshot',()=>{
 const expected={'GPT-Astra-Ultra-Vision':151,'Claude-Fable':147,'Claude-Fable-Vision':145,'GPT-Sol-Ultra':145,'Claude-5-Opus':144,'Claude-5-Opus-Max':144,'GPT-Astra-Ultra':144,Qwen:143,'Gemini Thinking':142,'GPT-Terra-Ultra':142,'Grok-4-5':142,'GPT-Terra-Ultra-Vision':141,'GPT-Luna-Max':140,'GPT-Luna-Max-Vision':139,'Kimi-K3-Vision':139,'Claude-5-Opus-Vision':138,'Claude-5-Sonnet':136,'GPT-Sol-Ultra-Vision':136,'Grok-4-5-Vision':133,'Meta-Think':130,Manus:118,'Claude-5-Sonnet-Vision':108,'deepseek-v3':103,Perplexity:97,Bing:92};
 const dataset=read('public/ai/tracking-mensa-ranking.json');assert.equal(dataset.rows.length,25);assert.deepEqual(Object.fromEntries(dataset.rows.map(r=>[r.modelId,r.score])),expected);
 const sol=dataset.rows.find(r=>r.modelId==='GPT-Sol-Ultra');assert.equal(sol.latestScore,139);assert.equal(sol.recordScore,151);assert.equal(sol.sampleCount,7);assert.equal(sol.model,'GPT 6.1 Sol Ultra');assert.equal(sol.releaseDate,null);assert.equal(sol.modelVersionUnverified,true);
 const fable=dataset.rows.find(r=>r.modelId==='Claude-Fable');assert.equal(fable.latestScore,151);assert.equal(fable.sampleCount,2);
});
test('snapshot averages rounded runs per alias and test, includes partial windows, excludes retired aliases and retains evidence',()=>{
 for(const dataset of trackingRankings(raw,receipt.config,receipt.checkedAt)){
  const saved=read(`public/ai/${dataset.id}.json`);assert.deepEqual(saved.rows.toSorted((a,b)=>a.id.localeCompare(b.id)),dataset.rows.toSorted((a,b)=>a.id.localeCompare(b.id)));
  for(const r of dataset.rows){assert.ok(!receipt.config.excludedAliases.includes(r.modelId));assert.equal(r.score,Math.round(r.runs.reduce((s,p)=>s+p.score,0)/r.runs.length));assert.equal(r.sampleCount,r.runs.length);assert.ok(r.sampleCount<=r.windowLimit);assert.equal(r.observedAt,receipt.checkedAt.slice(0,10));assert.equal(r.lastRunAt,r.runs[0].date);assert.equal(r.firstRunInAverage,r.runs.at(-1).date);assert.ok(r.runs.every(p=>p.date<=r.lastRunAt));}
 }
});
test('only literal source configuration is parsed; overrides and exclusions are respected without executing JS',()=>{
 const source=`var historedAIs = ['Old'];var prospectAIs = [];var completedDeletedAIs = ['Deleted']\nvar VisionAIs = ['Vision'];var renameAI = {'A':'Current A'};var aiMaxLengths = { // 'A': 99\n 'A':2 };`;
 const config=trackingConfig(source);assert.equal(config.windowByAlias.A,2);assert.equal(config.displayNames.A,'Current A');assert.deepEqual(config.excludedAliases,['Old','Deleted']);
 assert.throws(()=>trackingConfig(source.replace("'A':2","'A': (()=>{throw new Error()})()")),/Unsupported object/);
 const input=[5,10,35].map((score,i)=>({test_source:'Mensa Norway',ai_name:'A',test_score:String(score),valid_test_score:String(score),total_possible_score:'35',date_time:`01/0${i+1}/2026 0:00:00`}));
 const r=trackingRankings(input,config,'2026-02-01T12:00:00Z')[0].rows[0];assert.equal(r.sampleCount,2);assert.deepEqual(r.runs.map(r=>r.rawScore),[35,10]);assert.equal(r.score,Math.round((151+76)/2));
});
