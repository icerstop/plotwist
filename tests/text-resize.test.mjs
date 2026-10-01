import test from 'node:test';
import assert from 'node:assert/strict';
import {draggedTextWidth,textResizeTranslation} from '../src/reel-text-resize.js';
import {pointAt} from '../src/reel-elements.js';
import {normalizeDesign} from '../src/reel-design.js';
test('text width follows local horizontal drag at rotation, zoom and width limits',()=>{
 const r={matrix:{a:0,b:2,c:-2,d:0,e:30,f:50}};
 assert.equal(draggedTextWidth(r,{x:0,y:0},{x:100,y:100},'right',500,100),110);
 assert.equal(draggedTextWidth(r,{x:0,y:0},{x:100,y:100},'left',500,100),90);
 assert.equal(draggedTextWidth(r,{x:0,y:0},{x:0,y:99999},'right',500,100),200);
});
test('opposite top corner stays fixed as built-in rotated text reflows vertically',()=>{
 for(const rotation of [0,30,90,-90,180])for(const scale of [50,100,150])for(const side of ['left','right']){
  const o={x:5,y:4,scale,rotation},old={x:70,y:100,w:600,h:200},next={x:70,y:100,w:800,h:100};
  const rad=rotation*Math.PI/180,a=Math.cos(rad)*scale/100,b=Math.sin(rad)*scale/100,c=-b,d=a;
  // Include a scaled and translated parent, as in the reel header layouts.
  const matrix=r=>({a:a*.8,b:b*.8,c:c*.8,d:d*.8,e:25+o.x*10.8+.8*((r.x+r.w/2)*(1-a)-c*(r.y+r.h/2)),f:80+o.y*19.2+.8*((r.y+r.h/2)*(1-d)-b*(r.x+r.w/2))});
  const m=matrix(old),position=textResizeTranslation({rect:old,matrix:m},next,o,side,1080,1920),n=matrix(next);
  n.e+=(position.x-o.x)*10.8;n.f+=(position.y-o.y)*19.2;
  const p=pointAt(m,old.x+(side==='left'?old.w:0),old.y),q=pointAt(n,next.x+(side==='left'?next.w:0),next.y);
  assert.ok(Math.hypot(p.x-q.x,p.y-q.y)<1e-9);
 }
});
test('manual reflow and locked title fit survive theme serialization',()=>{
 const d=normalizeDesign({text:{title:{width:160,autoHeight:true,fitRatio:.72}}});
 assert.equal(d.text.title.width,160);assert.equal(d.text.title.fitRatio,.72);
 assert.deepEqual(normalizeDesign(JSON.parse(JSON.stringify(d))),d);
 assert.equal(normalizeDesign().text.title.fitRatio,null);
});
