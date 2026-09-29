import {readFile,writeFile,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
for(const [company,cik] of [['apple',320193],['spotify',1639920],['amazon',1018724],['alphabet',1652044],['meta',1326801]]){
 const sub=JSON.parse(await readFile(`research/stories/raw/${company}-submissions.json`));
 const parts=[sub.filings.recent];
 for(const p of sub.filings.files){
  if(p.filingTo<'2010-01-01')continue;
  const url=`https://data.sec.gov/submissions/${p.name}`;
  const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`${url}: ${r.status}`);
  parts.push(await r.json());
 }
 const candidates=parts.flatMap(p=>p.form.map((form,i)=>({form,date:p.reportDate?.[i]||p.filingDate[i],filed:p.filingDate[i],accession:p.accessionNumber[i],doc:p.primaryDocument[i]}))).filter(r=>['10-K','20-F'].includes(r.form));
 const selected=company==='apple'?[2025,2022,2019,2018,2016,2013,2010]:company==='spotify'?[2025,2022,2019]:company==='meta'?Array.from({length:11},(_,i)=>2013+i):[2025,2022,2019,2016];
 for(const year of selected){
  try{await access(`research/stories/raw/${company}-${year}.html`);continue;}catch{}
  const f=candidates.find(r=>r.date.startsWith(String(year)));
  if(!f){console.log(`${company} ${year}: no filing in index`);continue;}
  const url=`https://www.sec.gov/Archives/edgar/data/${cik}/${f.accession.replaceAll('-','')}/${f.doc}`;
  const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`${url}: ${r.status}`);
  const b=Buffer.from(await r.arrayBuffer()),name=`${company}-${year}.html`;
  await writeFile(`research/stories/raw/${name}`,b);
  await writeFile(`research/stories/raw/${name}.receipt.json`,JSON.stringify({url,...f,retrievedAt:new Date().toISOString(),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')},null,2));
  console.log(`${name}: ${b.length} bytes`);
 }
}
