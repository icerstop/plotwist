import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {graphicConfig,graphicGroups,graphicRows,graphicCsv,readGraphicSettings,graphicPage,scopeRows,graphicRegions} from '../src/graphic-data.js';
import {staticFrameConfig} from '../src/static-frame.js';
import {drawReel} from '../src/render.js';
import {normalizeDesign} from '../src/reel-design.js';
import {reelCopyFields} from '../src/reel-copy.js';
import {reelElements} from '../src/reel-elements.js';
import {reelCapabilities} from '../src/reel-capabilities.js';
import {reelAssetPaths} from '../src/reel-assets.js';
const file=p=>readFileSync(new URL('../'+p,import.meta.url)),json=p=>JSON.parse(file(p)),dataset=json('public/graphics/fertility-conscription.json');

test('EU27 cross-section matches all original 2024 WDI observations and historical classification without missing joins',()=>{
 const raw=json('research/conscription-fertility/world-bank-2024.json'),classification=json('research/conscription-fertility/classification.json'),receipt=json('research/conscription-fertility/receipt.json');
 assert.equal(createHash('sha256').update(file('research/conscription-fertility/world-bank-2024.json')).digest('hex'),receipt.sha256);
 assert.equal(dataset.rows.length,27);assert.equal(new Set(dataset.rows.map(r=>r.id)).size,27);
 for(const row of dataset.rows){assert.equal(row.year,row.statusYear);assert.equal(row.year,2024);assert.equal(row.value,raw[1].find(r=>r.countryiso3code===row.id).value);assert.ok(classification[row.group].includes(row.id));assert.ok(Number.isFinite(row.value));}
 assert.equal(dataset.rows.find(r=>r.id==='POL').group,'inactive');assert.equal(dataset.rows.find(r=>r.id==='HRV').group,'inactive');assert.equal(dataset.rows.find(r=>r.id==='LVA').group,'active');
 const groups=graphicGroups(dataset.rows);assert.deepEqual(groups.map(g=>g.n),[9,18]);assert.ok(Math.abs(groups[0].value-1.29)<1e-12);assert.ok(Math.abs(groups[1].value-1.3733333333333333)<1e-12);
 assert.deepEqual(graphicGroups(dataset.rows,'median').map(g=>g.value),[1.25,1.41]);
});
test('country filters, empty groups, median parity and imports never convert absence to zero or weight by population',()=>{
 const s=readGraphicSettings({selected:['POL','POL','DNK','UNKNOWN'],format:'invalid',activeColor:'bad',decimals:10},dataset.rows);
 assert.deepEqual(s.selected,['POL','DNK']);assert.equal(s.format,'4:5');assert.equal(s.decimals,2);
 const rows=graphicRows(dataset,s);assert.equal(rows.length,2);assert.equal(graphicGroups(rows)[0].value,rows.find(r=>r.id==='DNK').value);
 assert.equal(graphicGroups(rows.filter(r=>r.id==='POL'))[0].value,null);
 assert.deepEqual(graphicGroups([]).map(g=>g.n),[0,0]);assert.equal(graphicGroups([{group:'active',value:1},{group:'active',value:3}],'median')[0].value,2);
 assert.equal(graphicCsv(dataset,s).split('\r\n').length,3);assert.ok(graphicConfig(dataset,s,'arial').subtitle.includes('wybrane kraje'));
});
function recorder(){
 const drawn=[],stack=[],canvas={width:0,height:0};const ctx=new Proxy({canvas,font:'24px Arial',fillStyle:'#000000',globalAlpha:1,textAlign:'left',getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),save(){stack.push({font:this.font,fillStyle:this.fillStyle,globalAlpha:this.globalAlpha,textAlign:this.textAlign});},restore(){Object.assign(this,stack.pop());},measureText(t){return {width:String(t).length*(parseFloat(this.font.match(/[\d.]+px/)?.[0])||24)*.5};},fillText(t,x,y){drawn.push({text:String(t),font:this.font,color:this.fillStyle,x,y});}},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v));}});canvas.getContext=()=>ctx;return {canvas,drawn,stack};
}
test('all graphic layouts and formats render every country, expose shared text editing, preload flags and disable only output motion',()=>{
 for(const format of ['4:5','1:1','9:16'])for(const layout of ['groups','ranking','distribution'])for(const language of ['pl','en']){
  const settings=readGraphicSettings({format,layout},dataset.rows),base=graphicConfig(dataset,settings,'arial',language);
  const config={...base,visuals:{design:normalizeDesign({theme:'light',text:{title:{color:'#123456'},labels:{fontId:'georgia'},signature:{color:'#654321'}},motion:{enabled:true,preset:'typewriter'}})}};
  const original=structuredClone(config),r=recorder();drawReel(r.canvas,config,0,0);
  assert.deepEqual(config,original,'static rendering does not mutate the saved theme');assert.equal(r.stack.length,0);
  for(const row of dataset.rows)assert.ok(r.drawn.some(t=>t.text===row.name[language]),row.id);
  assert.equal(r.drawn.filter(t=>t.color==='#123456').map(t=>t.text).join(' '),config.title);assert.ok(r.drawn.some(t=>t.text==='Jakub Bilski'&&t.color==='#654321'));
  assert.equal(reelAssetPaths(config).length,27);assert.ok(reelCopyFields(r.canvas).some(f=>f.id==='graphic.country.POL'));
  assert.ok(reelElements(r.canvas).some(r=>r.id==='content'));assert.ok(!reelCapabilities(config).elements.some(e=>e.id==='date'));
  assert.equal(staticFrameConfig(config).visuals.design.motion.enabled,false);
 }
});
test('flags, names, values and group summary remain independent controls',()=>{
 const s=readGraphicSettings({names:false,values:false,flags:true,summary:false},dataset.rows),config=graphicConfig(dataset,s,'arial');config.visuals={design:normalizeDesign()};
 const r=recorder();drawReel(r.canvas,config);assert.equal(reelAssetPaths(config).length,27);assert.ok(!r.drawn.some(t=>t.text==='Polska'));assert.ok(!reelCopyFields(r.canvas).some(f=>f.id.startsWith('graphic.value.')));
 config.graphic.flags=false;assert.equal(reelAssetPaths(config).length,0);
});

test('statistic label can be hidden independently of result and sample count in both languages',()=>{
 for(const language of ['pl','en'])for(const statistic of ['mean','median']){
  const config=graphicConfig(dataset,readGraphicSettings({statistic,statisticLabel:false},dataset.rows),'arial',language),r=recorder();drawReel(r.canvas,config);
  assert.ok(!r.drawn.some(t=>/Średnia|Mediana|Mean|Median/.test(t.text)));
  assert.ok(r.drawn.some(t=>t.text==='n = 9'));assert.ok(r.drawn.some(t=>t.text===(language==='pl'?'1,29':'1.29')||t.text===(language==='pl'?'1,25':'1.25')));
  config.graphic.counts=false;const hidden=recorder();drawReel(hidden.canvas,config);assert.ok(!hidden.drawn.some(t=>t.text.includes('n =')));
  assert.ok(!reelCopyFields(hidden.canvas).some(f=>f.id.startsWith('graphic.statistic.')));
 }
});

const world=json('public/graphics/fertility-conscription-world.json');
test('world joins use real WDI values and frozen source evidence; ambiguous countries never enter means',()=>{
 const raw=json('research/conscription-fertility/world-bank-2024.json'),archive=json('research/conscription-fertility/factbook-2024.json');
 assert.equal(world.rows.length,173);assert.equal(world.excluded.length,19);assert.equal(new Set(world.rows.map(r=>r.id)).size,173);
 assert.equal(archive.date.slice(0,10),'2024-12-26');
 for(const r of world.rows){assert.equal(r.value,raw[1].find(p=>p.countryiso3code===r.id).value);assert.equal(r.year,r.statusYear);assert.ok(r.statusEvidence);assert.ok(r.eu||r.statusSource.includes(archive.commit));assert.ok(graphicRegions[r.region]);assert.ok(!world.excluded.some(e=>e.id===r.id));}
 assert.deepEqual(graphicGroups(world.rows).map(g=>g.n),[57,116]);assert.deepEqual(graphicGroups(scopeRows(world.rows,'EU')).map(g=>g.n),[9,18]);
 assert.equal(scopeRows(world.rows,'EU').length,27);assert.ok(world.excluded.some(r=>r.id==='CHN'));assert.ok(world.excluded.some(r=>r.id==='UKR'));
 assert.equal(graphicGroups(scopeRows(world.rows,'Oceania'))[0].value,null);
 for(const [code,group] of [['USA','inactive'],['CAN','inactive'],['KOR','active'],['SGP','active'],['ISR','active'],['BRA','active'],['IND','inactive']])assert.equal(world.rows.find(r=>r.id===code).group,group);
});

test('every world country is reachable through pagination with stable full-selection statistics',()=>{
 for(const format of ['1:1','4:5','9:16'])for(const layout of ['groups','ranking','distribution']){
  const s=readGraphicSettings({format,layout},world.rows),rows=graphicRows(world,s),seen=new Set(),pages=graphicPage(rows,s).pages;
  for(let page=0;page<pages;page++){const p=graphicPage(rows,{...s,page});assert.ok(p.columns.every(r=>r.length<=p.limit));p.columns.flat().forEach(r=>{assert.ok(!seen.has(r.id));seen.add(r.id);});const cfg=graphicConfig(world,{...s,page},'arial');assert.equal(cfg.graphic.rows.length,173);}
  assert.equal(seen.size,173);assert.equal(graphicPage(rows,{...s,page:999}).page,pages-1);
 }
});

test('world overviews and pages render all formats without invalid geometry; Oceania empty group stays missing',()=>{
 for(const format of ['1:1','4:5','9:16'])for(const layout of ['regions','overview','groups','ranking','distribution'])for(const language of ['pl','en']){
  const cfg=graphicConfig(world,readGraphicSettings({format,layout,page:4},world.rows),'arial',language),r=recorder();drawReel(r.canvas,cfg);assert.equal(r.stack.length,0);assert.ok(!r.drawn.some(t=>t.text.includes('NaN')));
  if(layout==='regions')assert.ok(r.drawn.some(t=>t.text==='—'));
 }
 const s=readGraphicSettings({scope:'Asia',layout:'regions'},world.rows);assert.ok(graphicRows(world,s).every(r=>r.region==='Asia'));assert.equal(graphicCsv(world,s).split('\r\n').length,39);
});
