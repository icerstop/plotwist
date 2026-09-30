import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {parseCsv,trackingDate,trackingIq} from './ai-csv.mjs';
import {trackingConfig,trackingRankings} from './tracking-iq.mjs';

const root=new URL('../research/ai/',import.meta.url),host='https://www.trackingai.org/',checkedAt=new Date().toISOString();
const files=[['tracking-iq.csv','app/database/proj_IQ/score_logs/iq/daily_logs.csv'],['tracking-config-latest.js','assets/js/config.js'],['tracking-formula-latest.js','assets/js/charts/charts_IQ.js']];
const downloads=await Promise.all(files.map(async([file,path])=>{const url=host+path,response=await fetch(url+'?v='+Date.now(),{signal:AbortSignal.timeout(45000)});if(!response.ok)throw new Error(`${response.status}: ${url}`);const bytes=Buffer.from(await response.arrayBuffer());return {file,url,bytes,sha256:createHash('sha256').update(bytes).digest('hex')};}));
const data=parseCsv(downloads[0].bytes.toString('utf8')),config=trackingConfig(downloads[1].bytes.toString('utf8'));
const invalid=data.filter(r=>['Mensa Norway','Offline Test'].includes(r.test_source)&&(!trackingDate(r.date_time)||trackingIq(r)===null));
if(invalid.length)throw new Error(`Refusing update: ${invalid.length} invalid IQ runs`);
const ranking=trackingRankings(data,config,checkedAt);
const receipt={checkedAt,sourceRows:data.length,validIndividualRuns:data.filter(r=>trackingIq(r)!==null).length,latestRunAt:data.map(r=>trackingDate(r.date_time)).filter(Boolean).sort().at(-1),config,downloads:downloads.map(({bytes,...entry})=>entry)};
// All downloads and parsing finish before the current evidence is replaced.
for(const d of downloads)await fs.writeFile(new URL(d.file,root),d.bytes);
await fs.writeFile(new URL('tracking-receipt.json',root),JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({checkedAt,rows:data.length,latestRunAt:receipt.latestRunAt,rankings:ranking.map(d=>({id:d.id,count:d.rows.length}))}));
