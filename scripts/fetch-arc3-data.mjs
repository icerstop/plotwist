import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {arc3Datasets,arc3SourceUrl} from './arc3-datasets.mjs';
const directory=new URL('../research/ai/',import.meta.url);
const receiptPath=new URL('arc-agi-3-receipt.json',directory);
const previous=JSON.parse(await fs.readFile(receiptPath,'utf8'));
const response=await fetch(arc3SourceUrl,{signal:AbortSignal.timeout(30000)});
if(!response.ok)throw new Error(`ARC download failed: ${response.status}`);
const bytes=Buffer.from(await response.arrayBuffer()),snapshot=JSON.parse(bytes.toString('utf8'));
const retrievedAt=new Date().toISOString(),day=retrievedAt.slice(0,10);
const receipt={...previous,file:`arc-agi-3-${day}.json`,url:arc3SourceUrl,retrievedAt,sha256:createHash('sha256').update(bytes).digest('hex')};
const datasets=arc3Datasets(snapshot,receipt); // Validate before replacing the active receipt.
await fs.writeFile(new URL(receipt.file,directory),bytes);
await fs.writeFile(receiptPath,JSON.stringify(receipt,null,2)+'\n');
console.log(JSON.stringify({file:receipt.file,sourceGeneratedAt:snapshot.generatedAt,sets:datasets.map(d=>({id:d.id,count:d.rows.length}))}));
