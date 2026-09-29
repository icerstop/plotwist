import {writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const args=process.argv.slice(2);
for(let i=0;i<args.length;i+=2){
 const [name,url]=args.slice(i,i+2);
 if(!/^[a-zA-Z0-9._-]+$/.test(name)||!url?.startsWith('https://'))throw Error('Expected filename and https URL pairs');
 try{
  const r=await fetch(url,{signal:AbortSignal.timeout(60000)});if(!r.ok)throw Error(`HTTP ${r.status}`);
  const b=Buffer.from(await r.arrayBuffer());await writeFile(`research/stories/raw/${name}`,b);
  await writeFile(`research/stories/raw/${name}.receipt.json`,JSON.stringify({url,retrievedAt:new Date().toISOString(),bytes:b.length,sha256:createHash('sha256').update(b).digest('hex')},null,2));
  console.log(`${name}: ${b.length} bytes`);
 }catch(e){console.log(`${name}: ${e.message}`);process.exitCode=1;}
}
