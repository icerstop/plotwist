// Complete WDI histories, never a fixed date window or a sample of countries.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {loadWorldBank} from '../src/data.js';
const root=new URL('../',import.meta.url),read=async p=>JSON.parse(await fs.readFile(new URL(p,root),'utf8'));
const directory='research/world-bank';await fs.mkdir(new URL(directory+'/',root),{recursive:true});
const now=new Date().toISOString(),hash=b=>createHash('sha256').update(b).digest('hex');
async function retry(fn){for(let attempt=0;;attempt++){try{return await fn();}catch(error){if(attempt===3)throw error;await new Promise(r=>setTimeout(r,1000*(attempt+1)));}}}
async function fetchJson(url){return retry(async()=>{const r=await fetch(url,{signal:AbortSignal.timeout(120000)});if(!r.ok)throw Error(`${r.status}: ${url}`);const json=await r.json();if(!Array.isArray(json[1]))throw Error(`Invalid World Bank response: ${url}`);return json;});}
async function save(p,value){await fs.writeFile(new URL(p,root),JSON.stringify(value,null,2)+'\n');}
const countryUrl='https://api.worldbank.org/v2/country?format=json&per_page=400',rawCountries=await fetchJson(countryUrl);
if(Number(rawCountries[0].pages)!==1||rawCountries[1].length!==Number(rawCountries[0].total))throw Error('Incomplete country catalog');
await save(directory+'/countries-source.json',rawCountries);
const aggregates={WLD:['Świat','World'],EUU:['Unia Europejska','European Union'],OED:['OECD','OECD members'],EAS:['Azja Wschodnia i Pacyfik','East Asia & Pacific'],ECS:['Europa i Azja Centralna','Europe & Central Asia'],LCN:['Ameryka Łacińska i Karaiby','Latin America & Caribbean'],MEA:['Bliski Wschód, Afryka Północna, Afganistan i Pakistan','Middle East, North Africa, Afghanistan & Pakistan'],NAC:['Ameryka Północna','North America'],SAS:['Azja Południowa','South Asia'],SSF:['Afryka Subsaharyjska','Sub-Saharan Africa']};
const pl=new Intl.DisplayNames(['pl'],{type:'region',fallback:'none'}),en=new Intl.DisplayNames(['en'],{type:'region',fallback:'none'});
const entries=rawCountries[1].filter(c=>c.region.id!=='NA'||aggregates[c.id]).map(c=>{
 const aggregate=c.region.id==='NA',names=aggregate?aggregates[c.id]:c.id==='CHI'?['Wyspy Normandzkie','Channel Islands']:[pl.of(c.iso2Code),en.of(c.iso2Code)];
 if(names.some(n=>!n))throw Error('Missing country translation: '+c.id);
 return {id:c.id,iso2:c.iso2Code,pl:names[0],en:names[1],sourceName:c.name,aggregate,region:aggregate?'aggregates':c.region.id,incomeLevel:c.incomeLevel.id};
}).sort((a,b)=>Number(a.aggregate)-Number(b.aggregate)||a.pl.localeCompare(b.pl,'pl'));
const allowed=new Set(entries.map(c=>c.id)),indicators=await read('src/world-bank-indicators.json');
const results=new Array(indicators.length);let cursor=0;
async function worker(){while(cursor<indicators.length){const i=cursor++,indicator=indicators[i];
 const rawPages=[];
 const snapshot=await retry(()=>loadWorldBank(indicator.id,AbortSignal.timeout(180000),{onPage:(data,url,page)=>{rawPages[page-1]={url,data};}}));
 const metadata=await fetchJson(`https://api.worldbank.org/v2/indicator/${indicator.id}?format=json&source=2`);
 const match=metadata[1].find(d=>d.id===indicator.id);if(!match)throw Error('Missing indicator metadata: '+indicator.id);
 const sourceRows=snapshot.rows.length;snapshot.rows=snapshot.rows.filter(r=>allowed.has(r.country));
 if(snapshot.rows.some(r=>!Number.isInteger(r.year)||r.year<1||r.year>new Date().getUTCFullYear()||(r.value!==null&&!Number.isFinite(r.value))))throw Error('Invalid value/date: '+indicator.id);
 const rows=snapshot.rows.filter(r=>Number.isFinite(r.value));if(!rows.length)throw Error('Empty indicator: '+indicator.id);
 const byCountry=entries.map(c=>{const values=rows.filter(r=>r.country===c.id).map(r=>r.year).sort((a,b)=>a-b);return {country:c.id,count:values.length,first:values[0]??null,last:values.at(-1)??null,missingWithin:values.length?values.at(-1)-values[0]+1-values.length:0};});
 const body=JSON.stringify(snapshot),raw=Buffer.from(JSON.stringify({metadata,pages:rawPages}));
 await fs.writeFile(new URL(`${directory}/${indicator.id}.json.gz`,root),gzipSync(raw));
 results[i]={indicator,snapshot,body,receipt:{id:indicator.id,name:match.name,sourceNote:match.sourceNote,sourceOrganization:match.sourceOrganization,sourceUpdated:snapshot.lastUpdated,retrievedAt:snapshot.retrievedAt,sourceRows,retainedRows:snapshot.rows.length,observations:rows.length,requestUrls:snapshot.requests,sha256:hash(body),rawSha256:hash(raw),coverage:byCountry}};
 console.log(`${indicator.id}: ${rows.length} observations, ${byCountry.filter(c=>c.count).length} entities; PL ${byCountry.find(c=>c.country==='POL').first}–${byCountry.find(c=>c.country==='POL').last}`);
}}
await Promise.all([worker(),worker(),worker()]);
// Do not replace published snapshots until all source downloads validate.
await save('src/world-bank-countries.json',entries);
for(const r of results)await fs.writeFile(new URL(`public/data/${r.indicator.id}.json`,root),r.body);
const receipt={retrievedAt:now,countrySource:{url:countryUrl,sha256:hash(JSON.stringify(rawCountries))},countryCount:entries.filter(c=>!c.aggregate).length,aggregateCount:entries.filter(c=>c.aggregate).length,indicatorCount:indicators.length,observations:results.reduce((n,r)=>n+r.receipt.observations,0),indicators:results.map(r=>r.receipt)};
await save(directory+'/receipt.json',receipt);await save('public/data/world-bank-coverage.json',receipt);
console.log(JSON.stringify({countries:receipt.countryCount,aggregates:receipt.aggregateCount,indicators:receipt.indicatorCount,observations:receipt.observations}));
