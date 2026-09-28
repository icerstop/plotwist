import {mkdir,writeFile} from 'node:fs/promises';
import {commodityUniverse} from '../src/commodity-universe.js';
const dir='public/commodities',retrievedAt=new Date().toISOString();
await mkdir(dir,{recursive:true});
async function json(url){const r=await fetch(url,{headers:{'User-Agent':'plotwist-history-research/1.0'},signal:AbortSignal.timeout(45000)});if(!r.ok)throw new Error(`HTTP ${r.status}: ${url}`);return r.json();}
const date=(t,tz)=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(t*1000));return ['year','month','day'].map(k=>p.find(v=>v.type===k).value).join('-');};
const assets=[];
for(const item of commodityUniverse){
 const endpoint=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}`;
 const info=(await json(`${endpoint}?range=1d&interval=1d`)).chart.result[0];
 if(!Number.isFinite(info.meta.firstTradeDate))throw new Error(`No first date: ${item.symbol}`);
 const result=(await json(`${endpoint}?period1=${info.meta.firstTradeDate-86400}&period2=${Math.floor(Date.now()/1000)}&interval=1d&events=splits%2Cdiv`)).chart.result[0];
 const tz=result.meta.exchangeTimezoneName,today=date(Date.now()/1000,tz);
 if(result.meta.dataGranularity!=='1d'||result.meta.currency!==item.currency)throw new Error(`Unexpected units: ${item.symbol}`);
 const splits=Object.values(result.events?.splits||{}).map(s=>({date:date(s.date,tz),ratio:s.numerator/s.denominator}));
 const close=result.indicators.quote[0].close;
 // Futures can have negative prices (WTI, April 2020); retain real observations.
 const rows=result.timestamp.map((t,i)=>{const d=date(t,tz),v=close[i];if(d>=today||!Number.isFinite(v))return null;const factor=splits.filter(s=>s.date>d).reduce((n,s)=>n*s.ratio,1);return [d,v,v*factor];}).filter(Boolean);
 if(rows.length<2||new Set(rows.map(r=>r[0])).size!==rows.length)throw new Error('Invalid history');
 const data={...item,source:'Yahoo Finance',sourceUrl:`https://finance.yahoo.com/quote/${encodeURIComponent(item.symbol)}/history/`,retrievedAt,exchange:result.meta.fullExchangeName,timeZone:tz,splits,rows,columns:['date','splitAdjustedClose','reconstructedUnadjustedClose'],priceMethod:item.kind==='futures'?'Provider futures history; contract rolls may affect changes. Not spot prices or an investable total return.':'Exchange closing share price adjusted for splits; fund fees already affect prices, dividends excluded.'};
 await writeFile(`${dir}/${item.file}`,JSON.stringify(data));
 assets.push({...item,sourceUrl:data.sourceUrl,firstDate:rows[0][0],lastDate:rows.at(-1)[0],observations:rows.length});
 console.log(`${item.symbol}: ${rows.length} rows, ${rows[0][0]} – ${rows.at(-1)[0]}`);
}
await writeFile(`${dir}/manifest.json`,JSON.stringify({retrievedAt,assets,totalObservations:assets.reduce((n,a)=>n+a.observations,0)}));
