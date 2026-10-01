export const graphicDefaults={version:1,layout:'groups',format:'4:5',selected:null,statistic:'mean',order:'value',flags:true,names:true,values:true,summary:true,reference:false,decimals:2,activeColor:'#147d92',inactiveColor:'#ae3d69',title:'',subtitle:''};
export const groupLabel=(id,en=false)=>id==='active'?(en?'Active conscription':'Czynny pobór'):(en?'No active conscription':'Bez czynnego poboru');
export function readGraphicSettings(raw={},rows=[]){
 const s={...graphicDefaults},ids=new Set(rows.map(r=>r.id));
 for(const [key,choices] of Object.entries({layout:['groups','ranking','distribution'],format:['1:1','4:5','9:16'],statistic:['mean','median'],order:['value','name']}))if(choices.includes(raw[key]))s[key]=raw[key];
 for(const key of ['flags','names','values','summary','reference'])if(typeof raw[key]==='boolean')s[key]=raw[key];
 for(const key of ['activeColor','inactiveColor'])if(/^#[0-9a-f]{6}$/i.test(raw[key]))s[key]=raw[key];
 for(const key of ['title','subtitle'])if(typeof raw[key]==='string')s[key]=raw[key].slice(0,300);
 if([0,1,2,3].includes(raw.decimals))s.decimals=raw.decimals;
 s.selected=Array.isArray(raw.selected)?[...new Set(raw.selected.filter(id=>ids.has(id)))]:rows.map(r=>r.id);
 return s;
}
export function graphicGroups(rows,statistic='mean'){
 return ['active','inactive'].map(id=>{const members=rows.filter(r=>r.group===id&&Number.isFinite(r.value)),values=members.map(r=>r.value).sort((a,b)=>a-b),n=values.length;return {id,rows:members,n,value:n?(statistic==='median'?(values[Math.floor(n/2)]+values[Math.ceil(n/2)-1])/2:values.reduce((a,b)=>a+b,0)/n):null};});
}
export function graphicRows(dataset,settings,language='pl'){
 const selected=new Set(settings.selected??dataset.rows.map(r=>r.id));
 return dataset.rows.filter(r=>selected.has(r.id)).sort((a,b)=>settings.order==='name'?a.name[language].localeCompare(b.name[language],language):b.value-a.value||a.id.localeCompare(b.id));
}
export function graphicConfig(dataset,settings,fontId,language='pl'){
 const en=language==='en',rows=graphicRows(dataset,settings,language),subset=rows.length!==dataset.rows.length;
 return {outputMode:'image',graphic:{...settings,rows,universe:dataset.universe,total:dataset.rows.length,year:dataset.year,subset},title:settings.title||(en?'Conscription and fertility':'Pobór a dzietność'),titleIsCustom:true,subtitle:settings.subtitle||(en?`EU27 · ${dataset.year} · births per woman${subset?' · selected countries':''}`:`UE-27 · ${dataset.year} · dzieci na kobietę${subset?' · wybrane kraje':''}`),subtitleIsCustom:true,source:'Źródło: World Bank (WDI) · EPRS, tab. 1 (19.03.2025)',sourceIsCustom:true,unit:en?'births per woman':'dzieci na kobietę',unitIsCustom:true,format:settings.format,duration:12,fontId,chart:'comparison',series:[],language};
}
export function graphicCsv(dataset,settings){
 const escape=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 return [['iso3','country_pl','country_en','year','births_per_woman','peacetime_conscription','status_year','fertility_source','status_source'],...graphicRows(dataset,settings).map(r=>[r.id,r.name.pl,r.name.en,r.year,r.value,r.group,r.statusYear,r.fertilitySource,r.statusSource])].map(row=>row.map(escape).join(',')).join('\r\n');
}
