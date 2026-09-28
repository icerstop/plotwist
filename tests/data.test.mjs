import test from 'node:test';
import assert from 'node:assert/strict';
import {buildSeries,coffeeSeries,normalizeSeries,parseCsv,worldBankRange,loadWorldBank} from '../src/data.js';
test('CSV accepts Polish decimals and missing values without fabricating zero',()=>{const s=parseCsv('rok;Polska;Świat\n2020;10,5;5\n2021;;8\n2022;15;12');assert.equal(s[0].points[0].y,10.5);assert.equal(s[0].points[1].y,null);});
test('CSV rejects duplicate dates and malformed values',()=>{assert.throws(()=>parseCsv('rok;a\n2020;1\n2020;2'));assert.throws(()=>parseCsv('rok;a\n2020;x\n2021;2'));});
test('CSV supports quoted comma headers and sorted years',()=>{const s=parseCsv('rok,"A, B"\n2021,20\n2020,10');assert.equal(s[0].name,'A, B');assert.equal(s[0].points[0].x,2020);});
test('Investment simulation at zero return equals contributions',()=>{const s=coffeeSeries(5,10,0,10);assert.equal(s[0].points[10].y,18250);assert.equal(s[1].points[10].y,36500);assert.equal(s[2].points[10].y,18250);});
test('Investment formula matches iterative end-of-day deposits',()=>{const s=coffeeSeries(5,10,7,1);const daily=1.07**(1/365)-1;let v=0;for(let i=0;i<365;i++)v=v*(1+daily)+5;assert.ok(Math.abs(v-s[0].points[1].y)<1e-6);});
test('World Bank missing data remain gaps',()=>{const s=buildSeries({rows:[{country:'POL',year:2000,value:10},{country:'POL',year:2002,value:20}]},['POL'],2000,2002);assert.deepEqual(s[0].points.map(p=>p.y),[10,null,20]);});
test('Index normalization keeps gaps and rejects invalid starting base',()=>{assert.deepEqual(normalizeSeries([{points:[{y:null},{y:10},{y:20}]}])[0].points.map(p=>p.y),[null,100,200]);assert.throws(()=>normalizeSeries([{points:[{y:0},{y:20}]}]));});
test('year controls use selected observed coverage, including zero, never null padding',()=>{
 const snapshot={rows:[{country:'POL',year:1960,value:null},{country:'POL',year:1989,value:0},{country:'POL',year:2025,value:20},{country:'USA',year:1960,value:5},{country:'USA',year:2026,value:null}]};
 assert.deepEqual(worldBankRange(snapshot,['POL'],null,null).years,[...Array(37)].map((_,i)=>1989+i));
 const all=worldBankRange(snapshot,['POL','USA'],null,null);assert.equal(all.start,1960);assert.equal(all.end,2025);
 assert.equal(worldBankRange(snapshot,['POL'],2000,2023).start,2000);
 assert.equal(worldBankRange(snapshot,['POL'],1900,2100).end,2025);
 assert.deepEqual(worldBankRange(snapshot,['DEU'],null,null).years,[]);
});
test('World Bank import follows all pages without date truncation',async t=>{
 const calls=[];t.mock.method(globalThis,'fetch',async url=>{calls.push(url);const page=Number(new URL(url).searchParams.get('page'));return {ok:true,json:async()=>[{pages:2,total:2,lastupdated:'2026-09-28'},[{countryiso3code:'POL',date:page===1?'2025':'1960',value:page,indicator:{value:'Test'}}]]};});
 const data=await loadWorldBank('SP.POP.TOTL');assert.deepEqual(data.rows.map(r=>r.year),[2025,1960]);assert.equal(calls.length,2);assert.ok(calls.every(u=>!new URL(u).searchParams.has('date')));
});
