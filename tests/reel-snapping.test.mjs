import test from 'node:test';
import assert from 'node:assert/strict';
import {regionFromMatrix,canvasViewport} from '../src/reel-elements.js';
import {elementBounds,alignmentTargets,snapTranslation,movementLimits} from '../src/reel-snapping.js';

const rect=(id,x,y,w=120,h=60)=>regionFromMatrix(id,{x,y,w,h},{a:1,b:0,c:0,d:1,e:0,f:0});
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);

test('frame centre catches both axes within six screen pixels at every reel format and preview scale',()=>{
 for(const height of [1920,1350,1080])for(const box of [{left:0,top:0,width:270,height:600},{left:10,top:20,width:600,height:600}]){
  const region=rect('title',110,210),bounds=elementBounds(region),targets=alignmentTargets([region],'title',1080,height),scale=canvasViewport(box,1080,height).scale;
  const result=snapTranslation({bounds,targets,scale,delta:{x:540-bounds.x[1]+5/scale,y:height/2-bounds.y[1]-5/scale}});
  near(bounds.x[1]+result.delta.x,540);near(bounds.y[1]+result.delta.y,height/2);
  assert.deepEqual(result.guides.map(g=>g.kind),['center','center']);
 }
});

test('quarters are symmetric centre anchors; outer edges snap the corresponding edge',()=>{
 const bounds=elementBounds(rect('title',110,210)),targets=alignmentTargets([],'title',1080,1920);
 for(const [value,anchor] of [[0,0],[270,1],[810,1],[1080,2]]){
  const r=snapTranslation({bounds,targets,delta:{x:value-bounds.x[anchor]+3,y:3}});
  near(bounds.x[anchor]+r.delta.x,value);assert.equal(r.guides[0].value,value);
 }
});

test('other elements align edges and centres without snapping to self or invisible objects',()=>{
 const moving=rect('title',100,100),other=rect('subtitle',400,300),outside=rect('offscreen',1300,100),invalid=rect('invalid',NaN,100);
 const targets=alignmentTargets([moving,other,outside,invalid],'title',1080,1920);
 assert.ok(targets.x.every(t=>!t.id.startsWith('title:')&&!t.id.startsWith('offscreen:')&&!t.id.startsWith('invalid:')));
 const bounds=elementBounds(moving);
 for(const [x,anchor] of [[400,0],[460,1],[520,2]]){
  const r=snapTranslation({bounds,targets,delta:{x:x-bounds.x[anchor]+2,y:4}});
  near(bounds.x[anchor]+r.delta.x,x);assert.equal(r.guides[0].kind,'element');
 }
});

test('rotated and scaled objects snap their actual bounds rather than their untransformed rectangle',()=>{
 const angle=Math.PI/6,s=.7,m={a:Math.cos(angle)*s,b:Math.sin(angle)*s,c:-Math.sin(angle)*s,d:Math.cos(angle)*s,e:260,f:350};
 const region=regionFromMatrix('sticker:1',{x:-100,y:-50,w:200,h:100},m),bounds=elementBounds(region);
 near(bounds.x[1],260);near(bounds.y[1],350);
 const r=snapTranslation({bounds,targets:alignmentTargets([],'sticker:1',1080,1920),delta:{x:2-bounds.x[0],y:960-350-3}});
 near(bounds.x[0]+r.delta.x,0);near(bounds.y[1]+r.delta.y,960);
});

test('hysteresis holds a guide through jitter, releases past ten pixels, and never accumulates drift',()=>{
 const bounds={x:[100,160,220],y:[100,130,160]},targets={x:[{id:'centre',value:540,anchor:1,kind:'center'},{id:'nearby',value:546,anchor:1,kind:'element'}],y:[]};
 const first=snapTranslation({bounds,targets,delta:{x:382,y:17}});assert.equal(first.delta.x,380);
 const jitter=snapTranslation({bounds,targets,delta:{x:389,y:17},previous:first.locks});assert.equal(jitter.delta.x,380);
 const released=snapTranslation({bounds,targets,delta:{x:400,y:17},previous:jitter.locks});assert.equal(released.delta.x,400);assert.deepEqual(released.guides,[]);
 const back=snapTranslation({bounds,targets,delta:{x:382,y:17},previous:released.locks});assert.deepEqual(back,first);
});

test('snap distance is independent of the gesture length and each axis can move freely',()=>{
 const bounds=elementBounds(rect('title',30,60)),targets=alignmentTargets([],'title',1080,1920);
 const r=snapTranslation({bounds,targets,delta:{x:449,y:273}});
 assert.equal(r.delta.x,450);assert.equal(r.delta.y,273);assert.deepEqual(r.guides.map(g=>g.axis),['x']);
 const distant=snapTranslation({bounds,targets,delta:{x:90,y:120}});assert.deepEqual(distant.delta,{x:90,y:120});assert.deepEqual(distant.guides,[]);
});

test('a coincident peer edge shows the reel centre when the held alignment also centres the object',()=>{
 const bounds={x:[100,160,220],y:[100,130,160]},targets={x:[{id:'frame',value:540,anchor:1,kind:'center'},{id:'peer',value:480,kind:'element'}],y:[]};
 const r=snapTranslation({bounds,targets,delta:{x:382,y:0},previous:{x:{id:'peer',anchor:0}}});
 assert.equal(r.delta.x,380);assert.equal(r.guides[0].kind,'center');assert.equal(r.guides[0].value,540);
});

test('an existing edge lock cannot trap a wide title a few pixels beside the reel centre',()=>{
 const bounds={x:[72,536.4,1000.8],y:[100,130,160]},targets={x:[{id:'centre',value:540,anchor:1,kind:'center'},{id:'peer',value:72,kind:'element'}],y:[]};
 const r=snapTranslation({bounds,targets,scale:.34,delta:{x:5.6,y:0},previous:{x:{id:'peer',anchor:0}}});
 near(bounds.x[1]+r.delta.x,540);assert.equal(r.guides[0].kind,'center');
});

test('quarters remain reachable next to a held peer alignment on a small preview',()=>{
 const bounds={x:[440,540,640],y:[100,130,160]},targets=alignmentTargets([],'title',1080,1920);
 targets.x.push({id:'peer',value:284,anchor:1,kind:'element'});
 const r=snapTranslation({bounds,targets,scale:300/1080,delta:{x:-269,y:0},previous:{x:{id:'peer',anchor:1}}});
 near(bounds.x[1]+r.delta.x,270);assert.equal(r.guides[0].kind,'quarter');
});

test('snapping respects translation limits and sticker positions use the same protected footer as the renderer',()=>{
 for(const footer of [195,260]){
  const height=1920-footer,original={x:83,y:10},bounds=elementBounds(rect('sticker:1',1080*.83-60,height*.1-30)),limits=movementLimits(original,1080,height,true);
  const r=snapTranslation({bounds,targets:alignmentTargets([],'sticker:1',1080,1920),delta:{x:540-bounds.x[1]+1,y:960-bounds.y[1]+2},limits});
  near(original.x+r.delta.x/1080*100,50);near((original.y+r.delta.y/height*100)*height/100,960);
  const stopped=snapTranslation({bounds,targets:{x:[],y:[]},delta:{x:100000,y:-100000},limits});
  near(original.x+stopped.delta.x/1080*100,100);near(original.y+stopped.delta.y/height*100,0);
 }
 const bounded=snapTranslation({bounds:{x:[0,50,100],y:[0,10,20]},targets:{x:[{id:'impossible',value:54,anchor:1,kind:'center'}],y:[]},delta:{x:3,y:0},limits:{x:[0,3]}});
 assert.equal(bounded.delta.x,3);assert.equal(bounded.guides.length,0);
});
