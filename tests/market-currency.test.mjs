import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {priceFxRate,priceQuotes,priceStartDate,quoteUnit} from '../src/market-currency.js';
import {buildComparison,comparisonRange} from '../src/comparison.js';
const fx={rows:[{date:'2024-01-04',USD:4,EUR:4.4},{date:'2024-01-05',USD:5,EUR:4.5},{date:'2024-01-08',USD:2,EUR:4},{date:'2024-01-09',USD:999,EUR:999}]};
const stock=(symbol,currency)=>({symbol,name:symbol,currency,retrievedAt:'2024-01-12T00:00:00Z',rows:[['2024-01-05',20,200],['2024-01-09',30,300]]});
test('USD stock history is unchanged without any FX history, including before 2002',()=>{
 const s={...stock('A','USD'),rows:[['1980-01-02',.25,25],['1981-01-02',.5,50]]};
 const r=priceQuotes(s,null,'1980-01-01','1982-01-01','USD');
 assert.equal(r.converted,false);assert.equal(r.currency,'USD');assert.deepEqual(r.rows.map(r=>[r.close,r.nominal,r.fxRate,r.fxDate]),[[.25,25,1,null],[.5,50,1,null]]);
 assert.equal(priceStartDate(s,fx,'USD'),'1980-01-02');
});
test('PLN and EUR prices convert to USD using the same strictly previous NBP table',()=>{
 const pln=priceQuotes(stock('P','PLN'),fx,'2024-01-05','2024-01-09','USD');
 assert.deepEqual(pln.rows.map(r=>[r.close,r.nominal,r.fxRate,r.fxDate]),[[5,50,.25,'2024-01-04'],[15,150,.5,'2024-01-08']]);
 const eur=priceQuotes(stock('E','EUR'),fx,'2024-01-05','2024-01-09','USD');
 assert.deepEqual(eur.rows.map(r=>r.close),[22,60]);assert.equal(eur.rows[1].originalClose,30);assert.equal(eur.rows[1].sourceCurrency,'EUR');
 assert.equal(priceFxRate(fx,'USD','PLN','2024-01-08').rate,5);
});
test('missing, future-only, zero and stale FX rates never become fabricated prices',()=>{
 assert.throws(()=>priceFxRate(fx,'PLN','USD','2024-01-04'),/Brak kursu/);
 assert.throws(()=>priceFxRate(null,'PLN','USD','2024-01-05'),/Brak kursu/);
 assert.throws(()=>priceFxRate({rows:[{date:'2024-01-04',USD:0}]},'PLN','USD','2024-01-05'),/Brak kursu/);
 assert.throws(()=>priceFxRate(fx,'PLN','USD','2024-01-20'),/zbyt stary/);
 assert.equal(priceStartDate({...stock('P','PLN'),rows:[['1980-01-01',1,1]]},fx,'USD'),'2024-01-05');
});
test('multi-series USD comparison uses converted prices before index or return calculations',()=>{
 const assets={P:stock('P','PLN'),U:stock('U','USD')},entries=Object.keys(assets).map(symbol=>({id:symbol,kind:'asset',symbol}));
 const run=scale=>buildComparison({assets,entries,fx,start:'2024-01-05',end:'2024-01-09',currency:'USD',scale});
 const r=run('price');assert.equal(r.unit,'USD');assert.equal(r.converted,true);assert.deepEqual(r.series.map(s=>s.points.map(p=>p.y)),[[5,15],[20,30]]);
 assert.deepEqual(run('index').series.map(s=>s.points.map(p=>p.y)),[[100,300],[100,150]]);
 assert.deepEqual(run('percent').series.map(s=>s.points.map(p=>p.y)),[[0,200],[0,50]]);
 assert.equal(r.series[0].points[0].raw,20);assert.equal(r.series[0].points[0].fxDate,'2024-01-04');
 assert.equal(r.series[1].points[0].fxDate,null);
 assert.deepEqual(comparisonRange(Object.values(assets),fx,'prices','USD'),{start:'2024-01-05',end:'2024-01-09'});
});
test('USD conversion preserves negative quotes and does not mix physical commodity units',()=>{
 const s={...stock('O','USD'),kind:'futures',unit:'USD / baryłka',rows:[['2024-01-05',20],['2024-01-09',-30]]};
 assert.equal(priceQuotes(s,fx,'2024-01-05','2024-01-09','PLN').rows[1].close,-60);assert.equal(quoteUnit(s,'PLN'),'PLN / baryłka');
 assert.throws(()=>buildComparison({assets:{O:s,P:stock('P','PLN')},entries:[{id:'o',kind:'asset',symbol:'O'},{id:'p',kind:'asset',symbol:'P'}],fx,start:'2024-01-05',end:'2024-01-09',currency:'USD',scale:'price'}),/jednostki/);
});
test('bundled Polish and US stock prices have auditable USD values and common session dates',()=>{
 const read=name=>JSON.parse(fs.readFileSync(new URL(`../public/market/${name}.json`,import.meta.url)));
 const assets={'CDR.WA':read('CDR.WA'),AAPL:read('AAPL')},rates=read('fx-pln'),entries=Object.keys(assets).map(symbol=>({id:symbol,kind:'asset',symbol}));
 const r=buildComparison({assets,entries,fx:rates,start:'2024-01-02',end:'2024-01-31',currency:'USD',scale:'price'});
 assert.ok(r.series[0].points.length>15);assert.deepEqual(r.series[0].points.map(p=>p.x),r.series[1].points.map(p=>p.x));
 for(const p of r.series[0].points){const rate=rates.rows.find(r=>r.date===p.fxDate);assert.ok(Math.abs(p.y-p.raw/rate.USD)<1e-10);}
 for(const p of r.series[1].points)assert.equal(p.y,p.raw);
});
