import {mkdir,readFile,writeFile,rename} from 'node:fs/promises';
import {marketUniverse} from '../src/market-universe.js';
const dir='public/market',start='2005-01-01',retrievedAt=new Date().toISOString(),today=retrievedAt.slice(0,10);
const currencies=['USD','EUR','GBP','CHF','DKK','SEK','NOK'];
const only=process.argv.find(v=>v.startsWith('--symbol='))?.slice(9);
await mkdir(dir,{recursive:true});
const day=86400000,iso=ms=>new Date(ms).toISOString().slice(0,10);
const localDate=(seconds,timeZone)=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(seconds*1000));return ['year','month','day'].map(k=>p.find(v=>v.type===k).value).join('-');};
async function json(url){const r=await fetch(url,{headers:{'User-Agent':'plotwist-history-research/1.0'},signal:AbortSignal.timeout(45000)});if(!r.ok)throw new Error(`HTTP ${r.status}: ${url}`);return r.json();}
async function atomic(name,value){await writeFile(`${dir}/${name}.tmp`,JSON.stringify(value));await rename(`${dir}/${name}.tmp`,`${dir}/${name}`);}
const items=[],failed=[];
for(const item of marketUniverse.filter(s=>!only||s.symbol===only)){
 try{
  const url=`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?period1=${Date.parse(start)/1000}&period2=${Math.floor(Date.now()/1000)}&interval=1d&events=splits%2Cdiv`;
  const payload=await json(url),r=payload.chart?.result?.[0];if(!r?.timestamp?.length)throw new Error(JSON.stringify(payload.chart?.error||'No observations'));
  const quoteCurrency=r.meta.currency,quoteScale=quoteCurrency==='GBp'||quoteCurrency==='GBX'?0.01:1;
  if((quoteScale===0.01?'GBP':quoteCurrency)!==item.currency)throw new Error(`Currency mismatch: ${quoteCurrency}`);
  const timeZone=r.meta.exchangeTimezoneName;if(!timeZone)throw new Error('Missing exchange timezone');
  const splits=Object.values(r.events?.splits||{}).map(s=>({date:localDate(s.date,timeZone),ratio:s.numerator/s.denominator})).sort((a,b)=>a.date.localeCompare(b.date));
  if(splits.some(s=>!Number.isFinite(s.ratio)||s.ratio<=0))throw new Error('Invalid split');
  const closes=r.indicators.quote[0].close,adj=r.indicators.adjclose?.[0]?.adjclose;
  const localToday=localDate(Date.now()/1000,timeZone);
  const rows=r.timestamp.map((t,i)=>{const date=localDate(t,timeZone),close=closes[i];if(date>=localToday||date<start||!Number.isFinite(close)||close<=0)return null;const factor=splits.filter(s=>s.date>date).reduce((a,s)=>a*s.ratio,1);return [date,Number((close*quoteScale).toFixed(8)),Number((close*quoteScale*factor).toFixed(8)),Number.isFinite(adj?.[i])?Number((adj[i]*quoteScale).toFixed(8)):null];}).filter(Boolean);
  if(rows.length<2||new Set(rows.map(r=>r[0])).size!==rows.length)throw new Error('Invalid or duplicate daily observations');
  const data={...item,source:'Yahoo Finance',sourceUrl:`https://finance.yahoo.com/quote/${encodeURIComponent(item.symbol)}/history/`,retrievedAt,exchange:r.meta.fullExchangeName,timeZone,quoteCurrency,quoteScale,columns:['date','splitAdjustedClose','reconstructedUnadjustedClose','dividendAndSplitAdjustedClose'],splits,rows,priceMethod:'Yahoo Close is split-adjusted. Unadjusted prices are reconstructed from reported subsequent split ratios; not a separately verified exchange auction feed. Adj Close is not used in the simulation. Today is always excluded.'};
  await atomic(`${item.symbol}.json`,data);items.push({...item,exchange:data.exchange,firstDate:rows[0][0],lastDate:rows.at(-1)[0],observations:rows.length,splitCount:splits.length});console.log(`${item.symbol}: ${rows.length} closes, ${rows[0][0]} – ${rows.at(-1)[0]}`);
 }catch(e){failed.push({symbol:item.symbol,error:e.message});console.error(`${item.symbol}: ${e.message}`);}
}
if(only){console.log('Single-symbol refresh done; full refresh regenerates manifest.');process.exit(failed.length?1:0);}
// One table request supplies all seven currencies; no need for seven separate calls.
const chunks=[];for(let t=Date.parse('2004-12-15');t<Date.parse(today);t+=90*day){chunks.push([iso(t),iso(Math.min(t+89*day,Date.parse(today)-day))]);}
const fxRows=[],requests=[];let index=0;
await Promise.all(Array.from({length:3},async()=>{while(index<chunks.length){const [from,to]=chunks[index++],url=`https://api.nbp.pl/api/exchangerates/tables/a/${from}/${to}/?format=json`;const tables=await json(url);for(const table of tables){const rates=Object.fromEntries(currencies.map(code=>[code,table.rates.find(r=>r.code===code)?.mid]));if(Object.values(rates).some(v=>!Number.isFinite(v)||v<=0))throw new Error(`Missing FX in NBP table ${table.no}`);fxRows.push({date:table.effectiveDate,...rates});}requests.push(url);console.log(`NBP: ${from} – ${to}`);}}));
fxRows.sort((a,b)=>a.date.localeCompare(b.date));if(new Set(fxRows.map(r=>r.date)).size!==fxRows.length)throw new Error('Duplicate NBP date');
await atomic('fx-pln.json',{source:'Narodowy Bank Polski, tabela A',sourceUrl:'https://api.nbp.pl/',retrievedAt,currencies,unit:'PLN per 1 unit of currency',rows:fxRows,requests});
await atomic('manifest.json',{version:1,retrievedAt,coverage:'Curated selection; not all American or European securities.',refresh:'Snapshot. Run npm run data:markets to update. No automatic background refresh.',stocks:items,failed,fxFirstDate:fxRows[0].date,fxLastDate:fxRows.at(-1).date,totalObservations:items.reduce((a,s)=>a+s.observations,0)});
console.log(JSON.stringify({stocks:items.length,observations:items.reduce((a,s)=>a+s.observations,0),fxRows:fxRows.length,failed}));
if(failed.length)process.exitCode=1;
