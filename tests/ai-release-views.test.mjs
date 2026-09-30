import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseIntervals,releaseActivity,RELEASE_VIEWS} from '../src/ai-release-views.js';
import {reelCapabilities} from '../src/reel-capabilities.js';
const rows=[{date:'2024-02-28',publisher:'google'},{date:'2024-02-28',publisher:'openai'},{date:'2024-03-01',publisher:'google'},{date:'2024-03-01',publisher:'google'},{date:'2024-03-10',publisher:'anthropic'}];
test('intervals preserve leap days and group simultaneous releases without inventing first gaps',()=>{
 assert.deepEqual(releaseIntervals(rows).map(v=>[v.date,v.days,v.models.length]),[['2024-03-01',2,2],['2024-03-10',9,1]]);
 assert.deepEqual(releaseIntervals([]),[]);assert.deepEqual(releaseIntervals(rows.slice(0,2)),[]);
});
test('activity map reveals only observed events with fixed normalization and both counting units',()=>{
 const before=releaseActivity(rows,'2024-02-15','2024-12-31','2024-02-29');
 assert.equal(before.max,3);assert.equal(before.months.find(m=>m.month==='2024-03').count,0);assert.equal(before.months.find(m=>m.month==='2024-03').future,true);
 const versions=releaseActivity(rows,'2024-02-15','2024-12-31','2024-03-01');
 assert.equal(versions.months.find(m=>m.month==='2024-03').count,2);assert.equal(versions.months[0].partial,true);
 const launches=releaseActivity(rows,'2024-02-15','2024-12-31','2024-03-01','launches');
 assert.equal(launches.months.find(m=>m.month==='2024-03').count,1);
 assert.deepEqual(releaseActivity(rows,'2018-01-01','2026-09-30','2026-09-30').years,[2023,2024,2025,2026]);
});
test('new views share editor sections and expose only relevant controls',()=>{
 assert.equal(RELEASE_VIEWS.length,5);
 for(const mode of ['cards','heatmap','gaps']){
  const c=reelCapabilities({releases:{mode}});
  assert.equal(c.bars,mode==='gaps');assert.equal(c.line,false);assert.equal(c.scaleCaption,false);
  assert.ok(c.elements.some(e=>e.id==='plot'));assert.ok(c.elements.some(e=>e.id==='detail'));
  assert.ok(!c.elements.some(e=>e.id==='distribution'));
 }
});
