import { mkdir, writeFile } from 'node:fs/promises';
const indicators = ['IT.NET.USER.ZS','NY.GDP.PCAP.KD','SP.DYN.LE00.IN','IT.CEL.SETS.P2','GB.XPD.RSDV.GD.ZS','EG.ELC.ACCS.ZS','SP.URB.TOTL.IN.ZS','NE.EXP.GNFS.ZS'];
const countries = 'POL;WLD;USA;CHN;DEU;IND;KOR;JPN;GBR;FRA;BRA;EST';
await mkdir('public/data',{recursive:true});
for(const code of indicators){
 const url = `https://api.worldbank.org/v2/country/${countries}/indicator/${code}?format=json&date=2000:2023&per_page=1000`;
 const res=await fetch(url,{signal:AbortSignal.timeout(60000)}); if(!res.ok)throw new Error(`${code}: ${res.status}`);
 const json=await res.json(); if(!Array.isArray(json[1]))throw new Error(`Missing data: ${code}`);
 const result={indicator:code,source:'World Bank, World Development Indicators',url,retrievedAt:new Date().toISOString(),lastUpdated:json[0].lastupdated,rows:json[1].map(r=>({country:r.countryiso3code,year:Number(r.date),value:r.value}))};
 await writeFile(`public/data/${code}.json`,JSON.stringify(result)); console.log(`${code}: ${result.rows.filter(r=>r.value!==null).length} observations`);
}
