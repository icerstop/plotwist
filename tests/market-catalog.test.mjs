import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {marketStories} from '../src/market-stories.js';
import {buildComparison} from '../src/comparison.js';
import {fromDay} from '../src/market.js';
const json=path=>JSON.parse(readFileSync(new URL(`../public/${path}`,import.meta.url),'utf8'));
const market=json('market/manifest.json'),extras=json('commodities/manifest.json'),fx=json('market/fx-pln.json');
const catalog=[...market.stocks.map(s=>({...s,kind:'stock'})),...extras.assets];
const assets=Object.fromEntries(catalog.map(item=>[item.symbol,json(`${item.kind==='stock'?'market':'commodities'}/${item.file||item.symbol+'.json'}`)]));

test('every selectable instrument has source-backed daily history with matching units and dates',()=>{
 assert.equal(new Set(catalog.map(a=>a.symbol)).size,catalog.length);
 for(const item of catalog){
  const a=assets[item.symbol];
  assert.equal(a.symbol,item.symbol);assert.equal(a.currency,item.currency);assert.ok(a.sourceUrl.startsWith('https://finance.yahoo.com/quote/'));
  assert.equal(a.rows.length,item.observations,item.symbol);assert.equal(a.rows[0][0],item.firstDate);assert.equal(a.rows.at(-1)[0],item.lastDate);
  let previous='';let consecutive=0;
  for(const [d,p] of a.rows){assert.ok(d>previous&&d<a.retrievedAt.slice(0,10),`${item.symbol}: ordered completed sessions`);assert.ok(Number.isFinite(p));if(a.kind!=='futures')assert.ok(p>0);if(previous&&Date.parse(d)-Date.parse(previous)===86400000)consecutive++;previous=d;}
  assert.ok(consecutive>a.rows.length/2,`${item.symbol}: history must be daily, not resampled monthly`);
 }
});

test('all historical presets produce aligned real prices in their advertised period',()=>{
 for(const story of marketStories){
  const entries=story.symbols.map(symbol=>({id:symbol,kind:'asset',symbol}));
  const r=buildComparison({entries,assets,fx,start:story.start,end:story.end,mode:'prices',scale:story.scale||'index'});
  assert.equal(r.series.length,story.symbols.length);assert.ok(r.series[0].points.length>50,story.id);
  assert.ok(r.baseDate>=story.start&&r.endDate<=story.end);
  for(const series of r.series){const original=new Map(assets[series.id].rows.map(row=>[row[0],row[1]]));for(const p of series.points)assert.equal(p.raw,original.get(fromDay(p.x)));}
 }
});

test('WTI retains its negative 20 April 2020 close and cent-denominated futures use USD',()=>{
 assert.ok(assets['CL=F'].rows.find(r=>r[0]==='2020-04-20')[1]<0);
 for(const symbol of ['ZC=F','ZW=F','ZS=F','KC=F','SB=F','CT=F']){assert.equal(assets[symbol].quoteCurrency,'USX');assert.equal(assets[symbol].quoteScale,.01);assert.equal(assets[symbol].currency,'USD');}
 const corn=assets['ZC=F'].rows.find(r=>r[0]==='2020-01-02')[1];assert.ok(corn>1&&corn<10,'Corn is dollars per bushel, not hundreds of cents');
});

test('Polish and international ETFs support recurring investments and an expense comparator',()=>{
 for(const symbol of ['ETFBW20TR.WA','ETFBM40TR.WA','ETFBS80TR.WA','SPY','VWCE.DE']){
  const r=buildComparison({entries:[{id:'fund',kind:'asset',symbol},{id:'drink',kind:'expense',name:'Napój',amount:3,frequency:'weekly'}],assets,fx,start:'2024-01-02',end:'2024-12-30',mode:'dca',investmentAmount:5,investmentFrequency:'weekly'});
  assert.equal(r.summaries.fund.contributions,260);assert.equal(r.series[1].points.at(-1).y,156);assert.ok(r.summaries.fund.portfolio>0);
 }
});
