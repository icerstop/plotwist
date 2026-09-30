import {countries} from './catalog.js';
export function buildSeries(snapshot,selected,start,end){
 return selected.map((country,index)=>({countryCode:country,name:countries[country]||country,color:['#bcf34a','#b18aff','#2694be','#e48b28','#d95376','#648178'][index%6],points:Array.from({length:end-start+1},(_,i)=>{const year=start+i;const row=snapshot?.rows.find(r=>r.country===country&&r.year===year);return {x:year,y:row?.value??null};})}));
}
export function coffeeSeries(daily=5,coffee=10,rate=7,years=10){
 const dailyRate=(1+rate/100)**(1/365)-1;
 const points=Array.from({length:years+1},(_,year)=>{const n=year*365;return {x:year,y:dailyRate===0?daily*n:daily*Math.expm1(n*Math.log1p(dailyRate))/dailyRate};});
 return [{name:'Portfel (symulacja)',color:'#bcf34a',points},{name:'Wydatki na kawę',color:'#b18aff',points:Array.from({length:years+1},(_,x)=>({x,y:x*365*coffee}))},{name:'Wpłaty',color:'#8fabb6',points:Array.from({length:years+1},(_,x)=>({x,y:x*365*daily}))}];
}
export function normalizeSeries(series){return series.map(s=>{const base=s.points.find(p=>p.y!==null)?.y;if(!base||base<=0)throw new Error('Indeks 100 wymaga dodatniej wartości początkowej w każdej serii.');return {...s,points:s.points.map(p=>({...p,y:p.y===null?null:p.y/base*100}))};});}
export function parseCsv(text){
 const first=text.split(/\r?\n/)[0]; const sep=first.includes(';')?';':',';
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;}else if(c===sep&&!quoted){row.push(cell.trim());cell='';}else if(c==='\n'&&!quoted){row.push(cell.trim());if(row.some(Boolean))rows.push(row);row=[];cell='';}else if(c!=='\r')cell+=c;}
 if(quoted)throw new Error('Nie zamknięto cudzysłowu w CSV.');row.push(cell.trim());if(row.some(Boolean))rows.push(row);
 if(rows.length<3||rows[0].length<2||rows[0].length>4)throw new Error('Podaj nagłówek i co najmniej 2 wiersze: rok oraz 1–3 serie.');
 const headers=rows.shift();if(new Set(headers).size!==headers.length||headers.some(h=>!h))throw new Error('Nagłówki muszą być niepuste i unikalne.');
 const seen=new Set();const parsed=rows.map((r,i)=>{if(r.length!==headers.length)throw new Error(`Wiersz ${i+2}: niewłaściwa liczba kolumn.`);const x=Number(r[0]);if(!r[0]||!Number.isInteger(x)||x<0||x>9999||seen.has(x))throw new Error(`Wiersz ${i+2}: rok musi być unikalną liczbą 0–9999.`);seen.add(x);return {x,values:r.slice(1).map(v=>{if(v==='')return null;const n=Number(v.replace(',','.'));if(!Number.isFinite(n))throw new Error(`Wiersz ${i+2}: nieprawidłowa liczba.`);return n;})};}).sort((a,b)=>a.x-b.x);
 if(parsed.length>300)throw new Error('Maksymalnie 300 wierszy na rolkę.');
 const series=headers.slice(1).map((name,i)=>({name,nameIsCustom:true,color:['#bcf34a','#b18aff','#8fabb6'][i],points:parsed.map(r=>({x:r.x,y:r.values[i]}))}));
 if(series.some(s=>s.points.filter(p=>p.y!==null).length<2))throw new Error('Każda seria potrzebuje co najmniej 2 wartości.');return series;
}
export function downloadBlob(blob,name){const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
export async function loadWorldBank(code,signal,{onPage}={}){
 if(!/^[A-Z0-9_.]{3,80}$/.test(code))throw new Error('Wpisz prawidłowy kod wskaźnika, np. IT.NET.USER.ZS.');
 const url=`https://api.worldbank.org/v2/country/all/indicator/${code}?format=json&source=2&per_page=20000`;
 const rows=[];let pages=1,metadata,name;const requests=[];
 for(let page=1;page<=pages;page++){
  const request=`${url}&page=${page}`;const res=await fetch(request,{signal});if(!res.ok)throw new Error(`World Bank: HTTP ${res.status}`);const data=await res.json();
  if(!Array.isArray(data[1])||!Number.isInteger(Number(data[0]?.pages)))throw new Error('Brak danych dla tego kodu.');
  if(page===1){metadata=data[0];pages=Number(metadata.pages);name=data[1][0]?.indicator.value;}
  if(onPage)await onPage(data,request,page);
  requests.push(request);rows.push(...data[1].map(r=>({country:r.countryiso3code||`WB:${r.country.id}`,year:Number(r.date),value:r.value,...(r.obs_status?{status:r.obs_status}:{}),...(r.footnote?{footnote:r.footnote}:{})})));
 }
 if(!rows.some(r=>Number.isFinite(r.value)))throw new Error('Brak opublikowanych wartości dla wybranych krajów.');
 if(rows.length!==Number(metadata.total)||new Set(rows.map(r=>`${r.country}:${r.year}`)).size!==rows.length)throw new Error('Niepełna lub powielona odpowiedź World Bank. Spróbuj ponownie.');
 return {indicator:code,name,url,requests,source:'World Bank, World Development Indicators',retrievedAt:new Date().toISOString(),lastUpdated:metadata.lastupdated,rows};
}

// Union of observed coverage: a missing country-year stays a gap, never a zero.
export function worldBankRange(snapshot,selected,start,end){
 const coverage=selected.map(country=>{const years=(snapshot?.rows||[]).filter(r=>r.country===country&&Number.isFinite(r.value)&&Number.isInteger(r.year)).map(r=>r.year);return {country,first:years.length?Math.min(...years):null,last:years.length?Math.max(...years):null};});
 const available=coverage.filter(c=>c.first!==null);
 if(!available.length)return {years:[],start:null,end:null,coverage};
 const first=Math.min(...available.map(c=>c.first)),last=Math.max(...available.map(c=>c.last));
 let from=Number.isInteger(start)?Math.max(first,Math.min(start,last)):first;
 let to=Number.isInteger(end)?Math.min(last,Math.max(end,first)):last;
 if(from>=to&&first<last){from=first;to=last;}
 return {years:Array.from({length:last-first+1},(_,i)=>first+i),start:from,end:to,coverage};
}
