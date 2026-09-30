import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeReleaseAppearance,releasePulseLayout,releaseWindow} from '../src/release-appearance.js';
import {normalizeDesign,textStyle} from '../src/reel-design.js';
import {normalizeHidden} from '../src/reel-overlays.js';
import {reelCapabilities} from '../src/reel-capabilities.js';
test('release appearance persists through the shared design contract and rejects invalid styles',()=>{
 const value=normalizeDesign({chart:{release:{cardFill:'custom',cardColor:'#abcdef',cardOpacity:42,timelineHeight:180,windowDays:365}}});
 assert.deepEqual(normalizeDesign(JSON.parse(JSON.stringify(value))),value);
 assert.equal(value.chart.release.cardColor,'#abcdef');assert.equal(value.chart.release.windowDays,365);
 const bad=normalizeReleaseAppearance({cardFill:'url(x)',cardColor:'red',pointSize:-5,cardWidth:900,windowDays:15});
 assert.equal(bad.cardFill,'none');assert.equal(bad.cardColor,'#f0f2f5');assert.equal(bad.pointSize,0);assert.equal(bad.cardWidth,100);assert.equal(bad.windowDays,0);
 assert.equal(normalizeDesign().chart.release.cardFill,'none');
});
test('lane spacing consumes freed height and reserves room for card and histogram',()=>{
 const s=normalizeReleaseAppearance(),small=releasePulseLayout(430,1145,s),large=releasePulseLayout(430,1145,{...s,timelineHeight:200});
 assert.ok(large.height>small.height);assert.ok(large.histogramBase+30<large.cardTop);
 const freed=releasePulseLayout(430,1145,{...s,timelineHeight:200},{summary:true,distribution:true});
 const hidden=releasePulseLayout(430,1145,{...s,timelineHeight:240},{summary:true,distribution:true,detail:true});assert.ok(hidden.cardBottom>hidden.cardTop);assert.ok(hidden.height>freed.height);
 assert.ok(freed.height>large.height);assert.ok(freed.bottom<freed.cardTop);
 for(const h of [565,715,1000])for(const cardHeight of [60,100,170]){const p=releasePulseLayout(0,h,{...s,cardHeight,timelineHeight:240});assert.ok(p.height>0);assert.ok(p.cardBottom>p.cardTop);assert.ok(p.bottom<p.cardTop);}
});
test('time windows follow the current date without changing the underlying selected range',()=>{
 assert.deepEqual(releaseWindow(100,1000,200,0),{first:100,last:1000});
 assert.deepEqual(releaseWindow(100,1000,200,30),{first:170,last:200});
 assert.deepEqual(releaseWindow(100,1000,105,30),{first:100,last:130});
 assert.deepEqual(releaseWindow(100,110,105,365),{first:100,last:110});
});
test('card contents use shared visibility, transforms and inherited typography independently',()=>{
 const ids=['detailDate','detailModels','detailGap'];assert.deepEqual(Object.keys(normalizeHidden(Object.fromEntries(ids.map(id=>[id,true])))),ids);
 for(const mode of ['pulse','calendar','cards','heatmap','gaps'])for(const id of ids)assert.ok(reelCapabilities({releases:{mode}}).elements.some(e=>e.id===id));
 const design=normalizeDesign({elements:{detailGap:{x:5}},text:{'detail:labels':{color:'#123456'},'detailModels:labels':{color:'#abcdef'}}});
 assert.equal(textStyle({visuals:{design},_textElement:'detailDate'},'labels').color,'#123456');assert.equal(textStyle({visuals:{design},_textElement:'detailModels'},'labels').color,'#abcdef');assert.equal(design.elements.detailGap.x,5);
});
