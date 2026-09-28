import { mkdir, writeFile, rename } from 'node:fs/promises';
import { datasets } from '../src/catalog.js';
import { loadWorldBank } from '../src/data.js';
await mkdir('public/data',{recursive:true});
for(const {id:code} of datasets.filter(d=>d.id!=='coffee')){
 const result=await loadWorldBank(code,AbortSignal.timeout(120000));
 await writeFile(`public/data/${code}.json.tmp`,JSON.stringify(result));
 await rename(`public/data/${code}.json.tmp`,`public/data/${code}.json`);
 const rows=result.rows.filter(r=>Number.isFinite(r.value));
 console.log(`${code}: ${rows.length} observations, ${Math.min(...rows.map(r=>r.year))}–${Math.max(...rows.map(r=>r.year))}`);
}
