import {mkdir,writeFile,readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root='research/stories/raw';
await mkdir(root,{recursive:true});
const slugs=process.argv.slice(2);
for(const slug of slugs){
 for(const ext of ['csv','metadata.json']){
  const url=`https://ourworldindata.org/grapher/${slug}.${ext}`;
  try{
   const r=await fetch(url,{signal:AbortSignal.timeout(90000)});
   if(!r.ok)throw new Error(`HTTP ${r.status}`);
   const body=await r.text();
   if(body.trim().startsWith('<'))throw new Error('Unexpected HTML');
   await writeFile(`${root}/${slug}.${ext}`,body);
   const receipt={url,retrievedAt:new Date().toISOString(),bytes:Buffer.byteLength(body),sha256:createHash('sha256').update(body).digest('hex')};
   await writeFile(`${root}/${slug}.${ext}.receipt.json`,JSON.stringify(receipt,null,2));
   console.log(`${slug}.${ext}: ${receipt.bytes} bytes`);
  }catch(e){console.log(`${slug}.${ext}: FAILED ${e.message}`);process.exitCode=1;}
 }
}
