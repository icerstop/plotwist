// Local CLDR country names, matched to identifiers in the archived World Bank data.
// No translation API; unresolved geographical entities fail instead of being guessed.
import fs from 'node:fs';
const root=new URL('../',import.meta.url),read=path=>JSON.parse(fs.readFileSync(new URL(path,root),'utf8'));
const manifest=read('public/stories/manifest.json'),wb=read('research/stories/raw/wb-patents.json')[1];
const pl=new Intl.DisplayNames(['pl'],{type:'region',fallback:'none'}),en=new Intl.DisplayNames(['en'],{type:'region',fallback:'none'});
const known=new Map();
for(let a=65;a<=90;a++)for(let b=65;b<=90;b++){
 const code=String.fromCharCode(a,b),name=en.of(code);if(name){const value={pl:pl.of(code),en:name};for(const key of [name,value.pl,code])known.set(key,value);}
}
const aliases={'South Korea':'KR','North Korea':'KP','Turkey':'TR','Russia':'RU','Vietnam':'VN','Laos':'LA','Taiwan':'TW','Hong Kong':'HK','Macao':'MO','Czechia':'CZ','Palestine':'PS','World':'001','WLD':'001','European Union (27)':'EU','European Union (28)':'EU'};
for(const [name,code] of Object.entries(aliases))known.set(name,{pl:pl.of(code),en:en.of(code)});
for(const [name,code] of Object.entries({'Europe':'150','Congo':'CG','Democratic Republic of Congo':'CD'}))known.set(name,{pl:pl.of(code),en:en.of(code)});
known.set('Rest of World',{pl:'Reszta świata',en:'Rest of World'});
known.set('European Union (27)',{pl:'Unia Europejska (27)',en:'European Union (27)'});
known.set('European Union (28)',{pl:'Unia Europejska (28)',en:'European Union (28)'});
const groups={EAS:['Azja Wschodnia i Pacyfik','East Asia & Pacific'],ECS:['Europa i Azja Centralna','Europe & Central Asia'],LCN:['Ameryka Łacińska i Karaiby','Latin America & Caribbean'],MEA:['Bliski Wschód, Afryka Północna, Afganistan i Pakistan','Middle East, North Africa, Afghanistan & Pakistan'],NAC:['Ameryka Północna','North America'],SAS:['Azja Południowa','South Asia'],SSF:['Afryka Subsaharyjska','Sub-Saharan Africa'],WLD:['Świat','World']};
for(const c of read('src/world-bank-countries.json'))for(const key of [c.id,c.pl,c.en,c.sourceName])known.set(key,{pl:c.pl,en:c.en});
for(const [en,pl] of Object.entries({'Czechoslovakia':'Czechosłowacja','USSR':'ZSRR','Yugoslavia':'Jugosławia','Sudan (former)':'Sudan (dawne granice)','Western Europe (Maddison)':'Europa Zachodnia (Maddison)','Eastern Europe (Maddison)':'Europa Wschodnia (Maddison)','East Asia (Maddison)':'Azja Wschodnia (Maddison)','Latin America (Maddison)':'Ameryka Łacińska (Maddison)','Western offshoots (Maddison)':'Gospodarki osadnicze Zachodu (Maddison)','South and South East Asia (Maddison)':'Azja Południowa i Południowo-Wschodnia (Maddison)','Middle East and North Africa (Maddison)':'Bliski Wschód i Afryka Północna (Maddison)','Sub Saharan Africa (Maddison)':'Afryka Subsaharyjska (Maddison)'}))known.set(en,{pl,en});
for(const [code,[pl,en]] of Object.entries(groups))known.set(code,{pl,en});
for(const r of wb){
 const id=r.countryiso3code,code=r.country.id;
 if(!known.has(id)&&/^[A-Z]{2}$/.test(code)&&en.of(code))known.set(id,{pl:pl.of(code),en:en.of(code)});
 if(known.has(id))known.set(r.country.value,known.get(id));
}
const geographic=new Set(['solar','ev','work','patents','maddison-gdp',...manifest.topics.filter(t=>t.id.includes('.')).map(t=>t.id)]);
const result={},missing=new Set();
for(const s of manifest.series.filter(s=>geographic.has(s.topicId))){
 const value=known.get(s.entity);if(!value){missing.add(s.entity);continue;}
 result[s.entity]=value;
}
if(missing.size)throw Error('Missing country labels: '+[...missing].join('; '));
fs.writeFileSync(new URL('src/story-countries.json',root),JSON.stringify(Object.fromEntries(Object.entries(result).sort()),null,2)+'\n');
console.log('Geographical labels:',Object.keys(result).length);
