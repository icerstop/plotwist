import test from 'node:test';
import assert from 'node:assert/strict';
import {reelCapabilities} from '../src/reel-capabilities.js';
import {normalizeDesign,textStyle} from '../src/reel-design.js';
import {normalizeHidden} from '../src/reel-overlays.js';
test('shared editor contract exposes only supported chart controls and sections',()=>{
 const pulse=reelCapabilities({releases:{mode:'pulse'}}),calendar=reelCapabilities({releases:{mode:'calendar'}});
 for(const c of [pulse,calendar]){assert.equal(c.plot,false);assert.equal(c.scaleCaption,false);assert.equal(c.legendOptions,false);assert.equal(c.endLabels,false);assert.ok(!c.elements.some(e=>e.id==='metric'));}
 assert.ok(pulse.line&&pulse.bars);assert.ok(!calendar.line&&!calendar.bars);
 assert.ok(pulse.elements.some(e=>e.id==='distribution'));assert.ok(!calendar.elements.some(e=>e.id==='distribution'));
 const regular=reelCapabilities({chart:'line',metricCaption:'Population'});assert.ok(regular.plot&&regular.endLabels&&regular.legendOptions&&regular.elements.some(e=>e.id==='metric'));
 assert.equal(reelCapabilities({ai:{mode:'ranking'}}).plotDimensions,false);
 assert.equal(reelCapabilities({ai:{mode:'records',groupBy:'brand'}}).endLabels,true);
});
test('renderer sections use the common saved transforms, visibility and animation tracks',()=>{
 const d=normalizeDesign({elements:{detail:{x:8,y:2,scale:85,rotation:4}},motion:{tracks:{detail:{effect:'rise',start:.3,duration:.1}}}});
 assert.deepEqual(normalizeDesign(JSON.parse(JSON.stringify(d))),d);assert.equal(d.elements.detail.x,8);assert.equal(d.motion.tracks.detail.effect,'rise');
 assert.deepEqual(normalizeHidden({detail:true,distribution:true,garbage:true}),{distribution:true,detail:true});
});
test('section typography inherits the shared style until an independent override is saved',()=>{
 const config={visuals:{design:normalizeDesign({text:{labels:{color:'#123456'},'detail:labels':{color:'#abcdef',size:120}}})}};
 assert.equal(textStyle({...config,_textElement:'plot'},'labels').color,'#123456');assert.equal(textStyle({...config,_textElement:'detail'},'labels').color,'#abcdef');
 assert.equal(textStyle({...config,_textElement:'detail'},'labels').size,120);
 assert.deepEqual(normalizeDesign(JSON.parse(JSON.stringify(config.visuals.design))),config.visuals.design);
});
