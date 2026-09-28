import {mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {aiBrands,aiBrandRuleVersion} from '../src/ai-brands.js';
const version='1.95.1',root=`https://unpkg.com/@lobehub/icons-static-svg@${version}`,dir='public/logos/ai';
await mkdir(dir,{recursive:true});
async function download(url){const r=await fetch(url,{signal:AbortSignal.timeout(45000)});if(!r.ok)throw new Error(`HTTP ${r.status}: ${url}`);return r.text();}
const meta=JSON.parse(await download(root+'/?meta')),entries=[];
for(const b of aiBrands.filter(b=>b.icon)){
 const file='/icons/'+b.icon+'.svg',info=meta.files.find(f=>f.path===file);if(!info)throw new Error('Missing icon '+file);
 const original=await download(root+file),hash=createHash('sha256').update(original).digest('base64');
 if('sha256-'+hash!==info.integrity)throw new Error('Integrity mismatch '+file);
 if(!original.includes('<svg')||/<script|<foreignObject|(?:href|src)=["']https?:|\son\w+=/i.test(original))throw new Error('Unsafe SVG '+file);
 // Monochrome icons inherit a deterministic dark fill on their white badge.
 const svg=original.replaceAll('currentColor','#17211b');
 await writeFile(`${dir}/${b.id}.svg`,svg);
 entries.push({id:b.id,name:b.name,publisher:b.publisher,path:b.logo,sourceUrl:root+file,version,sha256:createHash('sha256').update(svg).digest('hex'),originalIntegrity:info.integrity,modifications:'currentColor replaced with #17211b for a white badge; geometry unchanged'});
}
const licenseUrl='https://raw.githubusercontent.com/lobehub/lobe-icons/master/LICENSE';
const license=await download(licenseUrl);if(!license.includes('MIT License'))throw new Error('Unexpected license');
await writeFile(dir+'/LICENSE.txt',license);
await writeFile(dir+'/manifest.json',JSON.stringify({retrievedAt:new Date().toISOString(),provider:'Lobe Icons',license:'MIT',licenseUrl,version,classificationRules:aiBrandRuleVersion,notes:'Brand marks belong to their owners. Colour marks identify model brands; chart colours are adapted for legibility. Services such as Bing remain separate from foundation-model producers.',entries},null,2));
console.log(JSON.stringify({logos:entries.length,version}));
