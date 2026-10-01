import {pointAt} from './reel-elements.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Work in element coordinates, including a rotated/scaled parent composition.
export function draggedTextWidth(region,start,current,side,baseWidth,percent,min=10,max=200){
 const m=region.matrix,det=m.a*m.d-m.b*m.c;
 if(Math.abs(det)<1e-9)return percent;
 const dx=(m.d*(current.x-start.x)-m.c*(current.y-start.y))/det;
 return clamp(percent+(side==='left'?-dx:dx)/baseWidth*100,min,max);
}
// Keep the opposite top corner still even when wrapping changes the height.
export function textResizeTranslation(region,nextRect,original,side,w,h,overlay=false){
 const r=region.rect,m=region.matrix,oldAnchor={x:r.x+(side==='left'?r.w:0),y:r.y},nextAnchor={x:nextRect.x+(side==='left'?nextRect.w:0),y:nextRect.y};
 const before=pointAt(m,oldAnchor.x,oldAnchor.y),after=pointAt(m,nextAnchor.x,nextAnchor.y);
 let cx=nextRect.x+nextRect.w/2-r.x-r.w/2,cy=nextRect.y+nextRect.h/2-r.y-r.h/2;
 if(!overlay){
  const angle=(original.rotation||0)*Math.PI/180,scale=(original.scale||100)/100,c=Math.cos(angle)/scale,s=Math.sin(angle)/scale,sx=(original.widthScale??100)/100,sy=(original.heightScale??100)/100;
  const pa=m.a*c/sx-m.c*s/sy,pb=m.b*c/sx-m.d*s/sy,pc=m.a*s/sx+m.c*c/sy,pd=m.b*s/sx+m.d*c/sy;
  after.x+=(pa-m.a)*cx+(pc-m.c)*cy;after.y+=(pb-m.b)*cx+(pd-m.d)*cy;
 }
 return {x:original.x+(before.x-after.x)/w*100,y:original.y+(before.y-after.y)/h*100};
}
