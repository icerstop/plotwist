import {applyElementMotion} from './reel-motion.js';
import {typingRole} from './reel-typing.js';
import {mysteryRole} from './reel-mystery.js';
import {reelElementDefinitions} from './reel-capabilities.js';
// The renderer publishes geometry, never editor chrome. Export uses identical transforms.
const frames=new WeakMap();
const suppressed=new WeakMap();
export const elementIds=Object.keys(reelElementDefinitions);
export const identityElement=()=>({x:0,y:0,scale:100,rotation:0,widthScale:100,heightScale:100});
export function resetElements(canvas){frames.set(canvas,[]);}
export const reelElements=canvas=>frames.get(canvas)||[];
export const pointAt=(m,x,y)=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f});
export function regionFromMatrix(id,rect,m,extra={}){
 const corners=[[rect.x,rect.y],[rect.x+rect.w,rect.y],[rect.x+rect.w,rect.y+rect.h],[rect.x,rect.y+rect.h]].map(([x,y])=>pointAt(m,x,y));
 return {id,rect,matrix:{a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f},corners,center:pointAt(m,rect.x+rect.w/2,rect.y+rect.h/2),...extra};
}
export function containsPoint(region,p){
 if(region.clip&&(p.x<region.clip.x||p.y<region.clip.y||p.x>region.clip.x+region.clip.w||p.y>region.clip.y+region.clip.h))return false;
 const m=region.matrix,det=m.a*m.d-m.b*m.c;if(!det)return false;
 const x=(m.d*(p.x-m.e)-m.c*(p.y-m.f))/det,y=(-m.b*(p.x-m.e)+m.a*(p.y-m.f))/det,r=region.hitRect||region.rect;
 return x>=r.x&&x<=r.x+r.w&&y>=r.y&&y<=r.y+r.h;
}
export const hitElement=(regions,p)=>[...regions].reverse().find(r=>containsPoint(r,p));
export function registerElement(ctx,id,rect,extra){
 const list=frames.get(ctx.canvas);if(list&&!suppressed.get(ctx))list.push(regionFromMatrix(id,rect,ctx.getTransform(),extra));
}
export function beginElement(ctx,config,id,rect,extra){
 const endRole=typingRole(ctx,id),endMystery=mysteryRole(ctx,id);
 const t=config.visuals?.design?.elements?.[id]||identityElement(),m=ctx.getTransform();ctx.save();
 const parent=suppressed.get(ctx),hidden=parent||config.visuals?.hidden?.[id]===true;
 suppressed.set(ctx,hidden);
 if(hidden){ctx.globalAlpha=0;ctx.beginPath();ctx.rect(0,0,0,0);ctx.clip();}
 // Store translation as a percentage of the full reel, independent of nested layout scale.
 ctx.setTransform(m.a,m.b,m.c,m.d,m.e+t.x*ctx.canvas.width/100,m.f+t.y*ctx.canvas.height/100);
 ctx.translate(rect.x+rect.w/2,rect.y+rect.h/2);ctx.rotate(t.rotation*Math.PI/180);ctx.scale(t.scale/100*(extra?.geometryResize?1:(t.widthScale??100)/100),t.scale/100*(extra?.geometryResize?1:(t.heightScale??100)/100));ctx.translate(-rect.x-rect.w/2,-rect.y-rect.h/2);
 applyElementMotion(ctx,config,id,rect);registerElement(ctx,id,rect,extra);return ()=>{ctx.restore();if(parent==null)suppressed.delete(ctx);else suppressed.set(ctx,parent);endMystery();endRole();};
}
export function textRect(ctx,lines,x,y,step,maxWidth=Infinity){
 const metrics=lines.map(s=>ctx.measureText(s)),width=Math.min(maxWidth,Math.max(1,...metrics.map(m=>m.width))),size=parseFloat(ctx.font.match(/([\d.]+)px/)?.[1]||30);
 const ascent=Math.max(size*.75,...metrics.map(m=>m.actualBoundingBoxAscent||0)),descent=Math.max(size*.2,...metrics.map(m=>m.actualBoundingBoxDescent||0));
 return {x:x-(ctx.textAlign==='right'?width:ctx.textAlign==='center'?width/2:0)-6,y:y-ascent-6,w:width+12,h:ascent+descent+Math.max(0,lines.length-1)*step+12};
}
// Canvas may be letterboxed by CSS object-fit:contain. Pointer coordinates use pixels only.
export function canvasViewport(box,width,height){
 const scale=Math.min(box.width/width,box.height/height),w=width*scale,h=height*scale;
 return {left:box.left+(box.width-w)/2,top:box.top+(box.height-h)/2,width:w,height:h,scale};
}
