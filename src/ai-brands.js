// Producer identity is separate from the upstream organization and model alias.
// Known source organizations take precedence over model-family names; third-party
// fine-tunes are never assigned to the base-model vendor by substring matching.
const definitions = [
 ['openai','OpenAI','GPT / o','#6bd5b4','openai',['OpenAI']],
 ['anthropic','Anthropic','Claude','#efa17f','claude-color',['Anthropic']],
 ['google','Google DeepMind','Gemini / Gemma','#77aaff','gemini-color',['Google','Google DeepMind','Google Research','DeepMind']],
 ['alibaba','Alibaba','Qwen / QwQ','#b394fa','qwen-color',['Alibaba','Alibaba Cloud','Qwen']],
 ['deepseek','DeepSeek','DeepSeek','#68a4ff','deepseek-color',['DeepSeek']],
 ['xai','xAI','Grok','#c7cedb','grok',['xAI']],
 ['meta','Meta','Meta AI','#72bcff','meta-color',['Meta','Meta AI']],
 ['mistral','Mistral AI','Mistral','#ffb45e','mistral-color',['Mistral AI']],
 ['moonshot','Moonshot AI','Kimi','#9b9dff','kimi-color',['Moonshot','Moonshot AI']],
 ['zai','Z.ai / Zhipu AI','GLM','#92aaff','zhipu-color',['Z.ai (Zhipu AI)','Zhipu AI','Z.ai']],
 ['microsoft','Microsoft','Microsoft','#a8cb72','microsoft-color',['Microsoft','Microsoft Research']],
 ['minimax','MiniMax','MiniMax','#fa91bf','minimax-color',['MiniMax']],
 ['nvidia','NVIDIA','Nemotron','#97ca4f','nvidia-color',['Nvidia','NVIDIA']],
 ['cohere','Cohere','Command','#d3b58e','cohere-color',['Cohere','Cohere Labs (formerly Cohere for AI)']],
 ['ai2','Allen Institute for AI','OLMo / Tulu','#8ec3be','ai2-color',['Allen Institute for AI','Ai2']],
 ['01ai','01.AI','Yi','#b2ba81','yi-color',['01.AI']],
 ['amazon','Amazon','Nova','#f3b663',null,['Amazon']],
 ['ibm','IBM','Granite','#a9aaf2','ibm',['IBM']],
 ['bytedance','ByteDance','Seed','#6dd1df','bytedance-color',['ByteDance']],
 ['xiaomi','Xiaomi','MiMo','#ffa36d',null,['Xiaomi']],
 ['baichuan','Baichuan','Baichuan','#ffc288','baichuan-color',['Baichuan']],
 ['stability','Stability AI','StableLM','#ccabe8','stability-color',['Stability AI']],
 ['databricks','Databricks','DBRX','#ee9276',null,['Databricks']],
 ['mosaicml','MosaicML','MPT','#c5a5dc',null,['MosaicML']],
 ['tii','Technology Innovation Institute','Falcon','#a9c4b7',null,['Technology Innovation Institute']],
 ['ai21','AI21 Labs','Jamba','#dfb1dc','ai21',['AI21','AI21 Labs']],
 ['eleuther','EleutherAI','GPT-NeoX / GPT-J','#c5b591',null,['EleutherAI']],
 ['snowflake','Snowflake','Arctic','#8ac8eb','snowflake-color',['Snowflake']],
 ['writer','Writer','Palmyra','#deb7dd',null,['Writer']],
 ['inflection','Inflection AI','Inflection','#d5b494','inflection',['Inflection AI']],
 ['cerebras','Cerebras Systems','Cerebras','#eb9a79',null,['Cerebras Systems']],
 ['salesforce','Salesforce','Salesforce','#7cd4ed',null,['Salesforce']],
 ['thinking-machines','Thinking Machines','Thinking Machines','#b4cbb8',null,['Thinking Machines']],
 ['lmsys','LMSYS','Vicuna','#c4b29b',null,['LMSYS','LMSYS Org']],
 ['openlm','OpenLM Research','OpenLLaMA','#a7c5a8',null,['OpenLM Research']],
 ['internlm','InternLM','InternLM','#b1aff0',null,['InternLM']],
 ['upstage','Upstage','Solar','#eaba8c',null,['Upstage']],
 ['baai','BAAI','Aquila','#d5adce',null,['BAAI','Beijing Academy of Artificial Intelligence']],
 ['xverse','XVERSE Technology','XVERSE','#a2b9dc',null,['XVERSE','XVERSE Technology']],
 ['perplexity','Perplexity','Perplexity','#7ec5cb','perplexity-color',['Perplexity']],
 ['manus','Manus','Manus','#c2ccd4','manus',['Manus']],
 ['bing','Microsoft Bing','Bing','#c2c5ee','microsoft-color',[]],
];
export const aiBrands=definitions.map(([id,publisher,name,color,icon,organizations])=>({id,publisher,name,color,logo:icon?`/logos/ai/${id}.svg`:null,icon,organizations,label:name===publisher?name:`${name} · ${publisher}`}));
const byId=new Map(aiBrands.map(b=>[b.id,b]));
const norm=value=>String(value||'').trim().toLowerCase().replace(/\s+/g,' ');
const organizationIds=new Map(aiBrands.flatMap(b=>b.organizations.map(o=>[norm(o),b.id])));
const collaborations=new Map([
 ['Allen Institute for AI,University of Washington','ai2'],
 ['DeepSeek,Peking University','deepseek'],
 ['Z.ai (Zhipu AI),Tsinghua University','zai'],
].map(([org,id])=>[norm(org),id]));
const aliases=[
 ['eleuther',/^(?:gpt[- ]?neox|gpt[- ]?j)(?:\b|[- ])/i],
 ['deepseek',/^deepseek(?:\b|[- ])/i],
 ['alibaba',/^(?:qwen|codeqwen|qwq|qvq)(?:\d|\b|[- ])/i],
 ['openai',/^(?:chatgpt|gpt(?:[- ]?\d|[- ](?:sol|luna|terra|astra))|o[134](?:\b|[-_ ])|codex(?:\b|[- ]))/i],
 ['anthropic',/^claude(?:\b|[- ])/i],
 ['google',/^(?:gemini|gemma|palm)(?:\d|\b|[- ])/i],
 ['meta',/^(?:meta[- ]llama|llama|opt[- ]\d|meta(?:$|[- ]think))(?:\d|\b|[- ])/i],
 ['xai',/^grok(?:\b|[- ])/i],
 ['mistral',/^(?:open[- ])?(?:mistral|mixtral|ministral|codestral|magistral)(?:\b|[- ])/i],
 ['moonshot',/^kimi(?:\b|[- ])/i],['zai',/^(?:chatglm|glm)(?:\d|\b|[- ])/i],
 ['microsoft',/^(?:phi|wizardlm)(?:\b|[- ])/i],['minimax',/^minimax(?:\b|[- ])/i],
 ['ibm',/^granite(?:\b|[- ])/i],['bytedance',/^seed[- ]oss(?:\b|[- ])/i],
 ['xiaomi',/^mimo(?:\b|[- ])/i],['cohere',/^(?:c4ai[- ])?command(?:\b|[- ])/i],
 ['ai2',/^(?:olmo|tulu)(?:\b|[- ])/i],['01ai',/^yi[- ]\d/i],
 ['ai21',/^jamba(?:\b|[- ])/i],['stability',/^stablelm(?:\b|[- ])/i],
 ['databricks',/^dbrx(?:\b|[- ])/i],['snowflake',/^arctic(?:\b|[- ])/i],
 ['writer',/^palmyra(?:\b|[- ])/i],['baichuan',/^baichuan(?:\d|\b|[- ])/i],
 ['lmsys',/^vicuna[- ]\d/i],['openlm',/^open[-_ ]?llama[-_ ]\d/i],
 ['internlm',/^internlm(?:\d|\b|[- ])/i],['upstage',/^solar[- ]pro(?:\b|[- ])/i],
 ['baai',/^aquila(?:chat)?2(?:\b|[- ])/i],['xverse',/^xverse[- ]\d/i],
 ['bing',/^bing(?:$|[ (])/i],['perplexity',/^perplexity(?:$|[ (])/i],['manus',/^manus(?:$|[ (])/i],
];
export const aiBrandRuleVersion='2026-09-28.1';
export function classifyAiBrand(row){
 const organization=norm(row.organization);
 if(organization&&!['nie podano','trackingai · alias modelu'].includes(organization)){
  const explicit=collaborations.get(organization)||organizationIds.get(organization);
  if(explicit)return {brand:byId.get(explicit),method:'source-organization'};
  const parts=organization.split(',').map(p=>organizationIds.get(p.trim()));
  if(parts.every(Boolean)&&new Set(parts).size===1)return {brand:byId.get(parts[0]),method:'source-organization'};
  // Keep collaborations and other publishers separate, including fine-tuners.
  return {brand:{id:`organization:${organization}`,name:row.organization.replaceAll(',', ' / '),publisher:row.organization,label:row.organization.replaceAll(',', ' / '),color:'#bec8ac',logo:null},method:'source-organization'};
 }
 const name=String(row.model||row.modelId||'').trim();
 for(const [id,pattern] of aliases)if(pattern.test(name))return {brand:byId.get(id),method:'curated-family-alias'};
 return {brand:null,method:'unresolved'};
}
export function annotateAiBrands(rows){return rows.map(r=>{const {brand,method}=classifyAiBrand(r);return {...r,brandId:brand?.id||null,brand,brandMethod:method};});}
export function aiBrandOptions(rows){
 const counts=new Map();for(const r of rows){if(!r.brand)continue;const old=counts.get(r.brandId);counts.set(r.brandId,{...r.brand,count:(old?.count||0)+1});}
 return [...counts.values()].sort((a,b)=>{const ai=aiBrands.findIndex(x=>x.id===a.id),bi=aiBrands.findIndex(x=>x.id===b.id);return (ai<0?999:ai)-(bi<0?999:bi)||a.label.localeCompare(b.label);});
}
export const defaultAiBrands=rows=>aiBrandOptions(rows).slice(0,4).map(b=>b.id);
