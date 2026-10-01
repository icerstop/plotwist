import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {graphicConfig,graphicGroups,graphicRows,graphicCsv,readGraphicSettings} from '../src/graphic-data.js';
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
