import {readFile,writeFile} from 'node:fs/promises';
import {aiBrands,aiBrandRuleVersion,annotateAiBrands} from '../src/ai-brands.js';
const read=async path=>JSON.parse(await readFile(path,'utf8'));
const manifest=await read('public/ai/manifest.json'),benchmarks=[];
for(const entry of manifest.benchmarks){
 const data=await read(`public/ai/${entry.id}.json`),rows=annotateAiBrands(data.rows),models=new Map();
 for(const r of rows)models.set(JSON.stringify([r.modelId,r.organization]),{modelId:r.modelId,model:r.model,sourceOrganization:r.organization,brandId:r.brandId,publisher:r.brand?.publisher||null,method:r.brandMethod,sourceUrl:r.sourceUrl});
 benchmarks.push({id:data.id,observations:rows.length,unassigned:rows.filter(r=>!r.brand).length,models:[...models.values()]});
}
await writeFile('public/ai/brand-audit.json',JSON.stringify({rulesVersion:aiBrandRuleVersion,generatedAt:new Date().toISOString(),policy:'Source organizations take precedence. Explicit family aliases only fill missing organizations. Third-party fine-tunes and joint publishers remain separate. Unknown names remain unresolved. Brand attribution does not verify the version behind an API alias.',references:['https://github.com/deepseek-ai/DeepSeek-R1','https://github.com/QwenLM/QwQ','https://deepmind.google/models/gemma/','https://mimo.xiaomi.com/','https://github.com/lobehub/lobe-icons','https://www.lmsys.org/blog/2023-03-30-vicuna/','https://github.com/openlm-research/open_llama','https://github.com/InternLM/InternLM','https://huggingface.co/upstage/solar-pro-preview-pretrained','https://huggingface.co/BAAI/AquilaChat2-34B','https://huggingface.co/xverse/XVERSE-13B'],brands:aiBrands,benchmarks},null,2));
console.log(JSON.stringify({benchmarks:benchmarks.length,unassigned:benchmarks.reduce((n,b)=>n+b.unassigned,0),assigned:benchmarks.reduce((n,b)=>n+b.observations-b.unassigned,0)}));
