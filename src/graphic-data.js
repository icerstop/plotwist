export const graphicDefaults={version:1,layout:'groups',format:'4:5',selected:null,statistic:'mean',order:'value',flags:true,names:true,values:true,summary:true,statisticLabel:true,counts:true,reference:false,decimals:2,activeColor:'#147d92',inactiveColor:'#ae3d69',title:'',subtitle:'',scope:'all',page:0};
export const graphicRegions={Europe:{pl:'Europa',en:'Europe'},Asia:{pl:'Azja',en:'Asia'},Africa:{pl:'Afryka',en:'Africa'},Americas:{pl:'Ameryki',en:'Americas'},Oceania:{pl:'Oceania',en:'Oceania'}};
export function scopeRows(rows,scope='all'){return rows.filter(r=>scope==='all'||(scope==='EU'?r.eu:r.region===scope));}
export function graphicPage(rows,settings){
 const limit=settings.format==='1:1'?10:settings.format==='9:16'?20:14;
 const columns=settings.layout==='ranking'?[rows.slice(0,Math.ceil(rows.length/2)),rows.slice(Math.ceil(rows.length/2))]:graphicGroups(rows).map(g=>g.rows);
 const pages=Math.max(1,...columns.map(r=>Math.ceil(r.length/limit))),page=Math.max(0,Math.min(pages-1,Math.trunc(settings.page)||0));
 return {columns:columns.map(r=>r.slice(page*limit,(page+1)*limit)),page,pages,limit};
}
export const groupLabel=(id,en=false)=>id==='active'?(en?'Active conscription':'Czynny pobór'):(en?'No active conscription':'Bez czynnego poboru');
export function readGraphicSettings(raw={},rows=[]){
 const s={...graphicDefaults},ids=new Set(rows.map(r=>r.id));
 for(const [key,choices] of Object.entries({layout:['groups','ranking','distribution','overview','regions'],format:['1:1','4:5','9:16'],statistic:['mean','median'],order:['value','name'],scope:['all','EU',...Object.keys(graphicRegions)]}))if(choices.includes(raw[key]))s[key]=raw[key];
 for(const key of ['flags','names','values','summary','statisticLabel','counts','reference'])if(typeof raw[key]==='boolean')s[key]=raw[key];
 if(Number.isInteger(raw.page)&&raw.page>=0)s.page=raw.page;
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
 return scopeRows(dataset.rows,settings.scope).filter(r=>selected.has(r.id)).sort((a,b)=>settings.order==='name'?a.name[language].localeCompare(b.name[language],language):b.value-a.value||a.id.localeCompare(b.id));
}
export function graphicConfig(dataset,settings,fontId,language='pl'){
 const en=language==='en',rows=graphicRows(dataset,settings,language),subset=rows.length!==scopeRows(dataset.rows,settings.scope).length,world=dataset.universe!=='EU27';
 const scope=settings.scope==='EU'||!world?(en?'EU27':'UE-27'):graphicRegions[settings.scope]?.[language]||(en?'World sample':'Próba światowa');
 return {outputMode:'image',graphic:{...settings,rows,universe:dataset.universe,total:dataset.rows.length,year:dataset.year,subset},title:settings.title||(en?'Conscription and fertility':'Pobór a dzietność'),titleIsCustom:true,subtitle:settings.subtitle||`${scope} · ${dataset.year} · ${en?'births per woman':'dzieci na kobietę'}${subset?(en?' · selected countries':' · wybrane kraje'):''}`,subtitleIsCustom:true,source:(en?'Source: ':'Źródło: ')+(world?'World Bank (WDI) · CIA archive 2024 / EPRS':'World Bank (WDI) · EPRS, tab. 1 (19.03.2025)'),sourceIsCustom:true,unit:en?'births per woman':'dzieci na kobietę',unitIsCustom:true,format:settings.format,duration:12,fontId,chart:'comparison',series:[],language};
}
export function graphicCsv(dataset,settings){
 const escape=v=>'"'+String(v??'').replaceAll('"','""')+'"';
 return [['iso3','country_pl','country_en','year','births_per_woman','conscription_classification','status_year','fertility_source','status_source','region','evidence_year','status_evidence'],...graphicRows(dataset,settings).map(r=>[r.id,r.name.pl,r.name.en,r.year,r.value,r.group,r.statusYear,r.fertilitySource,r.statusSource,r.region,r.evidenceYear,r.statusEvidence])].map(row=>row.map(escape).join(',')).join('\r\n');
}
