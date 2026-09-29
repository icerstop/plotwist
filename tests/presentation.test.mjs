import test from 'node:test';
import assert from 'node:assert/strict';
import {sceneAt,eventAt,seriesFrame,aiEvents,aiMotionFrame,rankMotion} from '../src/presentation.js';

test('legend ranks put missing values last, keep ties stable and preserve series identity',()=>{
 const values=Object.freeze([NaN,-5,null,0,5,5]);
 assert.deepEqual(rankMotion(values,values).map(r=>r.position),[4,3,5,2,0,1]);
 assert.deepEqual(rankMotion([],[]),[]);
 assert.equal(rankMotion([0],[null])[0].position,0);
 const before=Object.freeze([30,20,10]),after=Object.freeze([10,30,20]);
 const frame=rankMotion(before,after,.25);
 assert.deepEqual(frame.map(r=>r.position),[.5,.75,1.75]);
 rankMotion(after,before,1);
 assert.deepEqual(rankMotion(before,after,.25),frame,'seeking does not depend on previously rendered frames');
 assert.deepEqual(rankMotion(before,after,1).map(r=>r.position),[2,0,1]);
});

test('cards crossfade whole observations and leave time to read each exact score',()=>{
 assert.deepEqual(sceneAt(0,.5),{index:-1,previous:-1,mix:1});
 assert.equal(sceneAt(8,0).mix,1);
 const boundary=sceneAt(8,.125);assert.equal(boundary.index,1);assert.equal(boundary.previous,0);assert.equal(boundary.mix,0);
 const during=sceneAt(8,.14);assert.ok(during.mix>0&&during.mix<1);
 assert.equal(sceneAt(8,.2).mix,1);assert.equal(sceneAt(8,1).index,7);assert.equal(sceneAt(8,1).mix,1);
 assert.equal(sceneAt(8,.14,20,0).mix,1);
});
test('last observation animates during the final hold and is exact by export end',()=>{
 const dates=[0,5,10];assert.equal(eventAt(dates,1,20,.65,18).mix,0);
 assert.ok(eventAt(dates,1,20,.65,18.3).mix>0&&eventAt(dates,1,20,.65,18.3).mix<1);
 assert.equal(eventAt(dates,1,20,.65,20).mix,1);
 assert.equal(eventAt(dates,.49,20,.65,8.82).index,0);
});
test('dense events finish transitions before the next event, seeking is deterministic',()=>{
 const dates=[0,4,4.01,10];const p=.4009;
 assert.equal(eventAt(dates,p,6,1.1,p*5.4).mix,1);
 const first=eventAt(dates,.65,20,.65,11.7);eventAt(dates,.1,20,.65,1.8);assert.deepEqual(eventAt(dates,.65,20,.65,11.7),first);
});
test('series preserve nulls, zero, negative values and do not expose future data',()=>{
 const series=[{points:[{x:0,y:0},{x:1,y:null},{x:2,y:-20},{x:3,y:60}]},{points:[{x:2,y:9},{x:3,y:11}]}];
 assert.equal(seriesFrame(series,0,12,.65).values[0].value,0);
 assert.equal(seriesFrame(series,0,12,.65).values[1].value,null);
 assert.equal(seriesFrame(series,.5,12,.65).values[0].value,null);
 assert.equal(seriesFrame(series,.8,12,.65).values[0].value,-20);
 assert.equal(seriesFrame(series,1,12,.65).values[0].value,60);
});
const rows=[
 {id:'a1',modelId:'a',model:'A',date:'2024-01-01',score:60},
 {id:'b1',modelId:'b',model:'B',date:'2024-01-02',score:80},
 {id:'a2',modelId:'a',model:'A',date:'2024-01-03',score:90},
 {id:'a3',modelId:'a',model:'A',date:'2024-01-04',score:50},
];
test('AI ranking uses latest scores, record steps retain real historical maxima',()=>{
 const events=aiEvents(rows);assert.equal(events.length,4);assert.equal(events[0].rank.length,1);
 assert.equal(events[3].rank[0].modelId,'b');assert.equal(events[3].rank[1].score,50);
 assert.equal(events[3].record,rows[2]);assert.ok(events.every(f=>rows.includes(f.record)));
 const frame=aiMotionFrame(rows,.34,20,.65,6.12);assert.equal(frame.frame.rank[0].score,80);assert.equal(frame.before.rank[0].score,60);
 assert.deepEqual(rows.map(r=>r.score),[60,80,90,50]);
});
