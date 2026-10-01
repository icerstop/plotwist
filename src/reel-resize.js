// Edge resizing is measured in local coordinates, even in a rotated parent.
// The opposite edge stays fixed; crossing it clamps instead of flipping the item.
export function resizeEdge(region,start,current,edge,minRatio=.1,maxRatio=3){
 const m=region.matrix,det=m.a*m.d-m.b*m.c,horizontal=edge==='left'||edge==='right';
 const size=horizontal?region.rect.w:region.rect.h;
 if(Math.abs(det)<1e-9||size<=0)return {ratio:1,dx:0,dy:0};
 const dx=current.x-start.x,dy=current.y-start.y;
 const delta=horizontal?(m.d*dx-m.c*dy)/det:(-m.b*dx+m.a*dy)/det;
 const sign=edge==='left'||edge==='top'?-1:1;
 const ratio=Math.max(minRatio,Math.min(maxRatio,1+sign*delta/size));
 const half=sign*size*(ratio-1)/2;
 return {ratio,dx:(horizontal?m.a:m.c)*half,dy:(horizontal?m.b:m.d)*half};
}
export const dimensionScale=value=>Number.isFinite(Number(value))&&value!=null?Math.max(10,Math.min(300,Number(value))):100;
// Resize the coordinate space allocated to a chart, not its drawing context.
// Typography, logos, strokes and dots retain their own sizes.
export function resizedPlotRect(config,id,rect){
 const t=config.visuals?.design?.elements?.[id],w=rect.w*dimensionScale(t?.widthScale)/100,h=rect.h*dimensionScale(t?.heightScale)/100;
 return {x:rect.x+(rect.w-w)/2,y:rect.y+(rect.h-h)/2,w,h};
}
export function stickerDimensions(sticker,frame,canvasWidth,motionScale=1){
 const base=canvasWidth*sticker.size/100*motionScale;
 return {width:base*dimensionScale(sticker.widthScale)/100,height:base*frame.height/frame.width*dimensionScale(sticker.heightScale)/100};
}
