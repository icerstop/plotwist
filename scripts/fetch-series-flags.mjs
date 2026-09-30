// Vendored SVGs only: no runtime service or package dependency.
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),version='7.3.2';
const response=await fetch(`https://registry.npmjs.org/flag-icons/${version}`);
if(!response.ok)throw Error(`Flag metadata: ${response.status}`);
const metadata=await response.json(),download=await fetch(metadata.dist.tarball);
if(!download.ok)throw Error(`Flag archive: ${download.status}`);
const compressed=Buffer.from(await download.arrayBuffer());
if(`sha512-${createHash('sha512').update(compressed).digest('base64')}`!==metadata.dist.integrity)throw Error('Flag archive integrity mismatch');
const tar=gunzipSync(compressed),files=new Map();
for(let i=0;i+512<=tar.length;){const header=tar.subarray(i,i+512),name=header.subarray(0,100).toString().replace(/\0.*$/s,''),size=parseInt(header.subarray(124,136).toString().replace(/\0.*$/s,'').trim(),8)||0;if(!name)break;files.set(name,tar.subarray(i+512,i+512+size));i+=512+Math.ceil(size/512)*512;}
const countries=JSON.parse(await readFile(new URL('src/story-countries.json',root),'utf8'));
const en=new Intl.DisplayNames(['en'],{type:'region'}),pl=new Intl.DisplayNames(['pl'],{type:'region'});
const fold=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z]/g,'');
const names=new Map();
for(const path of files.keys()){const match=path.match(/^package\/flags\/4x3\/([a-z]{2})\.svg$/);if(!match)continue;const code=match[1];for(const name of [code,en.of(code.toUpperCase()),pl.of(code.toUpperCase())])names.set(fold(name),code);}
const aliases={'Korea, Rep.':'kr','South Korea':'kr','North Korea':'kp','Korea, Dem. People’s Rep.':'kp','Congo, Dem. Rep.':'cd','Democratic Republic of Congo':'cd','Congo':'cg','Congo, Rep.':'cg','Czech Republic':'cz','Turkey':'tr','Venezuela, RB':'ve','Iran, Islamic Rep.':'ir','Lao PDR':'la','Slovak Republic':'sk','Egypt, Arab Rep.':'eg','Yemen, Rep.':'ye','Gambia, The':'gm','Bahamas, The':'bs','Hong Kong SAR, China':'hk','Macao SAR, China':'mo','West Bank and Gaza':'ps','Timor':'tl','United States of America':'us','USA':'us','United Kingdom':'gb','Korea Płd.':'kr'};
for(const [name,code]of Object.entries(aliases))names.set(fold(name),code);
const mapping={},missing=[];
for(const [key,value]of Object.entries(countries)){const code=names.get(fold(value.en))||names.get(fold(value.pl))||names.get(fold(key));if(code){for(const alias of [key,value.pl,value.en])mapping[alias]=code;}else missing.push({key,...value});}
const directory=new URL('public/logos/flags/',root);await mkdir(directory,{recursive:true});
for(const code of new Set(Object.values(mapping))){const svg=files.get(`package/flags/4x3/${code}.svg`);if(!svg||/<script|<foreignObject|(?:href|src)=["'](?:https?:|\/\/|data:)|\son\w+\s*=/i.test(svg.toString()))throw Error(`Unsafe flag ${code}`);await writeFile(new URL(`${code}.svg`,directory),svg);}
await writeFile(new URL('LICENSE',directory),files.get('package/LICENSE'));
await writeFile(new URL('src/series-flags.json',root),JSON.stringify(mapping,null,2)+'\n');
const logos=JSON.parse(await readFile(new URL('public/logos/manifest.json',root),'utf8'));
await writeFile(new URL('src/series-company-logos.json',root),JSON.stringify(Object.fromEntries(Object.entries(logos.companies).map(([symbol,entry])=>[symbol,entry.path])),null,2)+'\n');
await writeFile(new URL('README.md',directory),`# Series country badges\n\nflag-icons ${version}: https://github.com/lipis/flag-icons/tree/v${version}\nLicense: MIT (LICENSE). Original 4:3 SVGs, unchanged; downloaded from ${metadata.dist.tarball}.\nArchive integrity: ${metadata.dist.integrity}\n\nMatched from explicit country metadata, never an editable series label. Flags identify current countries, not historical flag designs. World and aggregates are not assigned national flags.\nRegenerate: node scripts/fetch-series-flags.mjs\n`);
console.log(JSON.stringify({files:new Set(Object.values(mapping)).size,missing},null,2));
