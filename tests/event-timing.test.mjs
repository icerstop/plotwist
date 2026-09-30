import test from 'node:test';
import assert from 'node:assert/strict';
import {datedEvents,eventPausePlan,eventPauseFrame,normalizeEventPauses} from '../src/event-timing.js';
import {releaseFrame} from '../src/ai-releases.js';
const rows=[{date:'2026-09-01',name:'First'},{date:'2026-09-22',name:'A'},{date:'2026-09-22',name:'B'},{date:'2026-09-30',name:'Last'}],events=datedEvents(rows,'2026-09-01','2026-09-30');
test('event clock holds each distinct date and keeps every simultaneous model visible',()=>{
 const plan=eventPausePlan(events,20,{seconds:2});assert.equal(plan.stops.length,3);assert.equal(plan.factor,1);
 for(const stop of plan.stops){for(const age of [.01,.5,1.99]){const p=eventPauseFrame(plan,stop.at+age);assert.equal(p.paused,true);const f=releaseFrame(rows,'2026-09-01','2026-09-30',p.progress);assert.equal(f.date,stop.id);assert.equal(f.latest.length,stop.id==='2026-09-22'?2:1);}}
 assert.equal(eventPauseFrame(plan,20).progress,1);
});
test('pause scaling, per-date skipping, disabling, single-day ranges and seek order are deterministic',()=>{
 const short=eventPausePlan(events,2,{seconds:2});assert.equal(short.factor,.25);assert.equal(short.moving,.5);
 const selected=eventPausePlan(events,20,{seconds:0,overrides:{'2026-09-22':3}});assert.equal(selected.stops[1].hold,3);assert.equal(selected.stops[0].hold,0);
 const off=eventPausePlan(events,20,{enabled:false});for(const time of [0,7,20])assert.equal(eventPauseFrame(off,time).progress,time/20);
 const single=eventPausePlan(datedEvents(rows,'2026-09-22','2026-09-22'),4,{seconds:2});assert.equal(single.stops.length,1);assert.equal(eventPauseFrame(single,1).paused,true);
 const checks=[0,1,3,7,15,20].map(t=>eventPauseFrame(selected,t));for(let i=checks.length-1;i>=0;i--)assert.deepEqual(eventPauseFrame(selected,[0,1,3,7,15,20][i]),checks[i]);
 assert.equal(normalizeEventPauses({seconds:Infinity,overrides:{bad:5,'2026-09-22':100}}).overrides['2026-09-22'],10);
});
