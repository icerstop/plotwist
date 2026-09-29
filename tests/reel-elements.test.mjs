import test from 'node:test';
import assert from 'node:assert/strict';
import {regionFromMatrix,containsPoint,hitElement,canvasViewport,beginElement,resetElements,reelElements} from '../src/reel-elements.js';
import {normalizeDesign} from '../src/reel-design.js';
import {configFontIds} from '../src/reel-style.js';
test('rotated hit regions use the true rectangle, retain stacking order and respect layout scale',()=>{
 const m={a:0,b:.5,c:-.5,d:0,e:500,f:100},r=regionFromMatrix('title',{x:0,y:0,w:200,h:40},m);
 assert.deepEqual(r.center,{x:490,y:150});assert.ok(containsPoint(r,r.center));assert.ok(!containsPoint(r,{x:450,y:150}));
 const top={...r,id:'sticker:1'};assert.equal(hitElement([r,top],r.center).id,top.id);assert.equal(hitElement([r],{x:0,y:0}),undefined);
});
test('pointer viewport removes letterboxing in tall and short preview containers',()=>{
 assert.deepEqual(canvasViewport({left:10,top:20,width:400,height:400},1080,1920),{left:97.5,top:20,width:225,height:400,scale:400/1920});
 const r=canvasViewport({left:0,top:0,width:200,height:500},1080,1350);assert.equal(r.width,200);assert.equal(r.height,250);assert.equal(r.top,125);
});
test('saved edits preserve independent fonts and reject invalid transforms',()=>{
 const d=normalizeDesign({elements:{title:{x:8,y:-3,rotation:17,scale:85},content:{x:Infinity,rotation:999,scale:-5}},text:{title:{fontId:'georgia'},source:{fontId:'unknown'}}});
 assert.deepEqual(d.elements.title,{x:8,y:-3,rotation:17,scale:85});assert.deepEqual(d.elements.content,{x:0,y:0,rotation:180,scale:25});
 assert.equal(d.text.source.fontId,null);assert.deepEqual(configFontIds({fontId:'arial',visuals:{design:d}}),['arial','georgia']);assert.deepEqual(normalizeDesign(JSON.parse(JSON.stringify(d))),d);
});
test('element movement uses full reel pixels under a compact section and restores drawing state',()=>{
 const canvas={width:1080,height:1920},stack=[];let m={a:.5,b:0,c:0,d:.5,e:20,f:50};
 const ctx={canvas,getTransform:()=>({...m}),save:()=>stack.push({...m}),restore:()=>{m=stack.pop();},setTransform:(a,b,c,d,e,f)=>{m={a,b,c,d,e,f};},translate:(x,y)=>{m.e+=m.a*x+m.c*y;m.f+=m.b*x+m.d*y;},scale:(x,y)=>{m.a*=x;m.b*=x;m.c*=y;m.d*=y;},rotate:r=>{const old={...m},c=Math.cos(r),s=Math.sin(r);m.a=old.a*c+old.c*s;m.b=old.b*c+old.d*s;m.c=old.c*c-old.a*s;m.d=old.d*c-old.b*s;}};
 resetElements(canvas);const end=beginElement(ctx,{visuals:{design:normalizeDesign({elements:{title:{x:10,y:5,rotation:90,scale:80}}})}},'title',{x:100,y:200,w:400,h:100});
 const r=reelElements(canvas)[0];assert.ok(Math.abs(r.center.x-(20+150+108))<1e-8);assert.ok(Math.abs(r.center.y-(50+125+96))<1e-8);assert.ok(containsPoint(r,r.center));end();assert.deepEqual(m,{a:.5,b:0,c:0,d:.5,e:20,f:50});
});
