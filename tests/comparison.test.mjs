import test from 'node:test';
import assert from 'node:assert/strict';
import {buildComparison,comparisonRange} from '../src/comparison.js';
const stock=(symbol,currency,rows)=>({symbol,name:symbol,currency,retrievedAt:'2024-01-12T00:00:00Z',rows});
const a=stock('A','PLN',[['2024-01-04',5],['2024-01-05',10],['2024-01-08',20],['2024-01-09',30]]);
const b=stock('B','USD',[['2024-01-05',40],['2024-01-09',20]]);
const entries=[{id:'a',kind:'asset',symbol:'A',color:'#fff'},{id:'b',kind:'asset',symbol:'B',color:'#000'}];
const fx={rows:[{date:'2024-01-04',USD:4},{date:'2024-01-05',USD:4},{date:'2024-01-08',USD:4}]};
const run=overrides=>buildComparison({entries,assets:{A:a,B:b},fx,start:'2024-01-05',end:'2024-01-09',...overrides});
test('price comparison has a common actual session base; never pairs future prices',()=>{
 const r=run();assert.equal(r.baseDate,'2024-01-05');assert.deepEqual(r.series.map(s=>s.points.map(p=>p.y)),[[100,300],[100,50]]);assert.equal(r.series[0].points.length,2);
 assert.deepEqual(run({scale:'percent'}).series.map(s=>s.points.map(p=>p.y)),[[0,200],[0,-50]]);
});
test('different currencies and commodity units cannot share a nominal price axis',()=>{
 assert.throws(()=>run({scale:'price'}),/różne waluty/);
 assert.throws(()=>run({scale:'price',assets:{A:{...a,currency:'USD'},B:{...b,kind:'futures',unit:'USD / baryłka'}}}),/jednostki/);
 assert.equal(run({scale:'price',assets:{A:a,B:{...b,currency:'PLN'}}}).unit,'PLN');
});
test('every investment receives the full budget and comparators stay in PLN',()=>{
 const r=run({mode:'dca',entries:[...entries,{id:'coffee',kind:'expense',amount:'3',name:'Kawa'},{id:'goal',kind:'goal',amount:'100',name:'Cel'}]});
 assert.equal(r.summaries.a.contributions,25);assert.equal(r.summaries.b.contributions,25);
 assert.equal(r.series[2].points.at(-1).y,15);assert.ok(r.series[3].points.every(p=>p.y===100));assert.equal(r.series[3].dashed,true);
});
test('unsupported comparisons and unavailable dates fail instead of inventing data',()=>{
 assert.throws(()=>run({mode:'dca',assets:{A:a,B:{...b,kind:'futures'}}}),/fundusz/);
 assert.throws(()=>run({end:'2024-01-10'}),/Wspólna historia/);
 assert.throws(()=>run({entries:[...entries,{id:'g',kind:'goal',amount:10}]}),/wymagają trybu/);
 assert.throws(()=>run({mode:'dca',entries:[...entries,{id:'g',kind:'expense',amount:0.001}]}),/kwotę/);
 assert.deepEqual(comparisonRange([a,b],fx,'dca'),{start:'2024-01-05',end:'2024-01-09'});
});
test('negative futures prices are retained after a positive price base',()=>{
 const r=run({assets:{A:a,B:{...b,kind:'futures',rows:[['2024-01-05',40],['2024-01-09',-20]]}}});assert.equal(r.series[1].points.at(-1).y,-50);
});
