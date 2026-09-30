import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateReleases,selectReleases,groupReleases,releaseCount,releaseFrame,releaseMonths,releaseDay,releaseDate,releaseCsv} from '../src/ai-releases.js';
const data=JSON.parse(readFileSync(new URL('../public/ai/releases.json',import.meta.url))),rows=data.rows;
test('release catalogue has unique, sorted, source-linked dates within its declared scope',()=>{
 assert.equal(validateReleases(data),true);assert.equal(data.coverage.complete,false);
 assert.throws(()=>validateReleases({...data,rows:[rows[0],rows[0]]}));
 assert.throws(()=>validateReleases({...data,rows:[{...rows[0],date:'2024-02-30'}]}));
});
test('September has seven named entries, six producer-date launches and five distinct dates',()=>{
 const september=selectReleases(rows,{start:'2026-09-01',end:'2026-09-30'});
 assert.equal(releaseCount(september),7);assert.equal(releaseCount(september,'launches'),6);assert.equal(new Set(september.map(r=>r.date)).size,5);
 assert.equal(selectReleases(september,{publishers:['openai']}).length,4);
 assert.equal(selectReleases(september,{publishers:[]}).length,0);
 assert.equal(groupReleases(september).find(g=>g.date==='2026-09-22'&&g.publisher==='openai').models.length,2);
});
test('frames use uniform UTC calendar time, reveal no future events and preserve simultaneous launches',()=>{
 const september=selectReleases(rows,{start:'2026-09-01',end:'2026-09-30'});
 const middle=releaseFrame(september,'2026-09-01','2026-09-30',.5);
 assert.equal(middle.date,'2026-09-15');assert.equal(middle.total,2);assert.ok(middle.visible.every(r=>r.date<=middle.date));
 const busy=releaseFrame(september,'2026-09-01','2026-09-30',21/29);
 assert.equal(busy.date,'2026-09-22');assert.equal(busy.latest.length,3);assert.equal(busy.gap,19);
 const final=releaseFrame(september,'2026-09-01','2026-09-30',1);
 assert.equal(final.total,7);assert.equal(final.gap,1);assert.equal(final.latest[0].name,'GPT-6.1 Sol');
 assert.deepEqual(releaseFrame(september,'2026-09-01','2026-09-30',1),releaseFrame(september,'2026-09-01','2026-09-30',1));
});
test('empty months are explicit within the requested interval, boundary months flagged partial',()=>{
 const months=releaseMonths(rows,'2026-07-15','2026-09-29');
 assert.equal(months.length,3);assert.equal(months[1].count,0);assert.equal(months[1].partial,false);assert.equal(months[0].partial,true);assert.equal(months[2].partial,true);
 assert.equal(releaseMonths(rows,'2026-09-01','2026-09-30','launches')[0].count,6);
 assert.deepEqual(releaseMonths(rows,'2026-09-30','2026-09-01'),[]);
});
test('first availability differs from API or announcement dates; omitted modes cannot inflate counters',()=>{
 for(const [name,date] of [['o1','2024-12-05'],['Claude 3.5 Sonnet','2024-06-20'],['Claude 3.5 Haiku','2024-11-04'],['GPT-5.2-Codex','2025-12-18'],['GPT-5.5','2026-04-23']])assert.equal(rows.find(r=>r.name===name).date,date);
 assert.ok(rows.every(r=>!r.name.includes('Mythos')&&!r.name.includes('Ultrafast')));
 assert.equal(selectReleases(rows,{categories:['revision']}).length,1);
});
test('UTC days round-trip across DST and leap days; single-day ranges and empty frames are safe',()=>{
 for(const date of ['2024-02-29','2026-03-29','2026-10-25'])assert.equal(releaseDate(releaseDay(date)),date);
 const day=releaseFrame(selectReleases(rows,{start:'2026-09-22',end:'2026-09-22'}),'2026-09-22','2026-09-22',.5);
 assert.equal(day.total,3);assert.equal(day.gap,null);
 assert.equal(releaseFrame([],'2026-08-01','2026-08-31',.5).since,null);
 assert.match(releaseCsv([{name:'A, "B"'}]),/"A, ""B"""/);
});
