import test from 'node:test';
import assert from 'node:assert/strict';
import {resizeEdge,stickerDimensions} from '../src/reel-resize.js';
import {normalizeDesign} from '../src/reel-design.js';
import {pointAt,regionFromMatrix} from '../src/reel-elements.js';

test('each edge keeps its opposite fixed with rotated, stretched and nested elements',()=>{
 for(const edge of ['left','right','top','bottom'])for(const degrees of [0,27,90,-135]){
  const a=degrees*Math.PI/180,m={a:Math.cos(a)*1.7,b:Math.sin(a)*1.7,c:-Math.sin(a)*.6,d:Math.cos(a)*.6,e:123,f:200},rect={x:10,y:40,w:500,h:300};
  const horizontal=edge==='left'||edge==='right',sign=['left','top'].includes(edge)?-1:1;
  const start={x:280,y:300},current={x:start.x+sign*(horizontal?m.a:m.c)*80,y:start.y+sign*(horizontal?m.b:m.d)*80};
  const r=resizeEdge(regionFromMatrix('content',rect,m),start,current,edge);
  const size=horizontal?rect.w:rect.h;assert.ok(Math.abs(r.ratio-(size+80)/size)<1e-12);
  const cx=rect.x+rect.w/2,cy=rect.y+rect.h/2,anchor={x:cx+(horizontal?-sign*rect.w/2:0),y:cy+(!horizontal?-sign*rect.h/2:0)};
  const n={...m,a:m.a*(horizontal?r.ratio:1),b:m.b*(horizontal?r.ratio:1),c:m.c*(horizontal?1:r.ratio),d:m.d*(horizontal?1:r.ratio)};
  n.e+=r.dx+(m.a-n.a)*cx+(m.c-n.c)*cy;n.f+=r.dy+(m.b-n.b)*cx+(m.d-n.d)*cy;
  const before=pointAt(m,anchor.x,anchor.y),after=pointAt(n,anchor.x,anchor.y);
  assert.ok(Math.hypot(before.x-after.x,before.y-after.y)<1e-9);
 }
});
test('crossing the opposite edge clamps without flipping or drifting',()=>{
 const region={matrix:{a:1,b:0,c:0,d:1,e:0,f:0},rect:{w:200,h:100}};
 const clamped=resizeEdge(region,{x:0,y:0},{x:-1000,y:100},'right',.2,2);
 assert.equal(clamped.ratio,.2);assert.equal(clamped.dx,-80);assert.ok(Math.abs(clamped.dy)===0);
 assert.deepEqual(resizeEdge(region,{x:0,y:0},{x:1000,y:0},'right',.2,2),{ratio:2,dx:100,dy:0});
});
test('old designs retain their proportions; independent dimensions survive saving',()=>{
 const d=normalizeDesign({elements:{plot:{widthScale:137,heightScale:224},detail:{heightScale:150}}});
 assert.equal(normalizeDesign().elements.content.widthScale,100);
 assert.equal(d.elements.plot.widthScale,137);assert.equal(d.elements.plot.heightScale,224);
 assert.deepEqual(normalizeDesign(JSON.parse(JSON.stringify(d))),d);
 assert.equal(normalizeDesign({elements:{content:{widthScale:999,heightScale:-10}}}).elements.content.widthScale,300);
});
test('media frames preserve existing size and track motion while resizing independently',()=>{
 const frame={width:400,height:200},s={size:20};
 assert.deepEqual(stickerDimensions(s,frame,1000),{width:200,height:100});
 assert.deepEqual(stickerDimensions({...s,widthScale:150,heightScale:80},frame,1000,1.1),{width:330.00000000000006,height:88.00000000000001});
});
