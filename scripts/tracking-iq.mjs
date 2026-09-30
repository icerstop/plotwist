import {trackingDate,trackingIq} from './ai-csv.mjs';

// Read only the literal configuration tables we need, never execute source JS.
export function trackingConfig(source){
 const body=(name,open,close)=>{
  const match=source.match(new RegExp(`\\bvar\\s+${name}\\s*=\\s*\\${open}([\\s\\S]*?)\\${close}`));
  if(!match)throw new Error(`TrackingAI configuration missing: ${name}`);
  return match[1].replace(/\/\/[^\r\n]*/g,'');
 };
 const token=`(?:"[^"\\\\]*"|'[^'\\\\]*')`,string=value=>value.slice(1,-1);
 const array=name=>{const raw=body(name,'[',']'),matches=[...raw.matchAll(new RegExp(token,'g'))];if(raw.replace(new RegExp(token,'g'),'').replace(/[\s,]/g,''))throw new Error(`Unsupported array: ${name}`);return matches.map(m=>string(m[0]));};
 const object=(name,numbers=false)=>{const raw=body(name,'{','}'),pattern=new RegExp(`(${token})\\s*:\\s*(${numbers?'[0-9]+':token})`,'g'),matches=[...raw.matchAll(pattern)];if(raw.replace(pattern,'').replace(/[\s,]/g,''))throw new Error(`Unsupported object: ${name}`);return Object.fromEntries(matches.map(m=>[string(m[1]),numbers?Number(m[2]):string(m[2])]));};
 return {defaultWindow:7,windowByAlias:object('aiMaxLengths',true),displayNames:object('renameAI'),excludedAliases:[...new Set([...array('historedAIs'),...array('prospectAIs'),...array('completedDeletedAIs')])],visionAliases:array('VisionAIs')};
}

export function trackingRankings(input,config,retrievedAt){
 const sourceUrl='https://www.trackingai.org/home',datasets=[];
 for(const test of ['Mensa Norway','Offline Test']){
  const groups=new Map();
  input.forEach((r,index)=>{
   if(r.test_source!==test||config.excludedAliases.includes(r.ai_name))return;
   const score=trackingIq(r),date=trackingDate(r.date_time);
   if(score===null||!date)throw new Error(`Invalid TrackingAI ranking input: ${index+2}`);
   const run={id:`tracking-${index}`,date,score,rawScore:Number(r.test_score),validScore:Number(r.valid_test_score),total:Number(r.total_possible_score)};
   if(!groups.has(r.ai_name))groups.set(r.ai_name,[]);groups.get(r.ai_name).push(run);
  });
  const rows=[...groups].map(([alias,all])=>{
   // Stable sorting matches the source when timestamps tie. Round each run
   // first, average those integers, then round the displayed average.
   all.sort((a,b)=>b.date.localeCompare(a.date));
   const window=config.windowByAlias[alias]||config.defaultWindow;
   if(!Number.isInteger(window)||window<1)throw new Error('Invalid TrackingAI averaging window');
   const runs=all.slice(0,window),vision=config.visionAliases.includes(alias)||/vision/i.test(alias);
   return {id:`tracking-ranking:${test}:${alias}`,modelId:alias,model:config.displayNames[alias]||alias,sourceAlias:alias,organization:'TrackingAI · alias modelu',releaseDate:null,observedAt:retrievedAt.slice(0,10),dateKind:'snapshot',score:Math.round(runs.reduce((sum,r)=>sum+r.score,0)/runs.length),sampleCount:runs.length,windowLimit:window,latestScore:runs[0].score,recordScore:Math.max(...all.map(r=>r.score)),lastRunAt:runs[0].date,firstRunInAverage:runs.at(-1).date,modality:vision?'vision':'text',runs,modelVersionUnverified:true,protocol:`${test} · ${vision?'Vision':'tekst'} · średnia z maks. ${window} prób`,sourceUrl,notes:`Alias: ${alias}. Current display name as of ${retrievedAt.slice(0,10)}. The alias may span different underlying model versions; dates below describe test runs, not release dates.`};
  }).sort((a,b)=>b.score-a.score||a.model.localeCompare(b.model));
  const key=test==='Mensa Norway'?'mensa':'offline';
  datasets.push({id:`tracking-${key}-ranking`,name:`${test} · ranking TrackingAI`,category:'IQ eksperymentalne',description:'Ranking jak w TrackingAI: zaokrąglona średnia z ostatnich maks. 7 prób każdego aliasu. Tekst i Vision są osobnymi pozycjami. To stan na dzień pobrania, nie historia premier.',unit:'pkt „IQ”',defaultBasis:'observed',defaultMode:'ranking',dateKind:'snapshot',trackingTest:key,aggregation:'tracking-last-n',source:'TrackingAI · Maxim Lott',sourceUrl,retrievedAt:retrievedAt.slice(0,10),checkedAt:retrievedAt,license:'Brak zadeklarowanej otwartej licencji w pobranym CSV; podawaj autora i sprawdź warunki wykorzystania.',caveat:'Quiz TrackingAI nie mierzy psychometrycznego IQ. Średnia obejmuje do 7 prób, nie 7 dni. Aktualne nazwy aliasów mogą obejmować różne wersje modeli; nie są historią premier.',formula:'round(mean(last N rounded run scores per alias and test)); N = min(7, available runs), unless the source config sets an override',rows});
 }
 return datasets;
}
