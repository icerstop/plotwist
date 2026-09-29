// Editor-only geometry in reel pixels. Never used by the video renderer.
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function elementBounds(region){
 const xs=region.corners.map(p=>p.x),ys=region.corners.map(p=>p.y);
 const left=Math.min(...xs),right=Math.max(...xs),top=Math.min(...ys),bottom=Math.max(...ys);
 return {x:[left,(left+right)/2,right],y:[top,(top+bottom)/2,bottom]};
}

export function alignmentTargets(regions,selectedId,width,height){
 const targets={x:[],y:[]};
 for(const [axis,size] of [['x',width],['y',height]]){
  // Frame edges match the corresponding element edge; symmetric points match its centre.
  for(const fraction of [0,.25,.5,.75,1])targets[axis].push({
   id:`frame:${axis}:${fraction}`,value:size*fraction,anchor:fraction===0?0:fraction===1?2:1,
   kind:fraction===.5?'center':fraction===0||fraction===1?'edge':'quarter',fraction,
  });
 }
 for(const region of regions){
  if(region.id===selectedId)continue;
  const bounds=elementBounds(region);
  if(![...bounds.x,...bounds.y].every(Number.isFinite)||bounds.x[2]<0||bounds.y[2]<0||bounds.x[0]>width||bounds.y[0]>height)continue;
  for(const [axis,size] of [['x',width],['y',height]])bounds[axis].forEach((value,index)=>{
   if(value>=0&&value<=size)targets[axis].push({id:`${region.id}:${axis}:${index}`,value,kind:'element',bounds});
  });
 }
 return targets;
}

// Always calculate from pointer-down geometry, so snapping never accumulates drift.
// Hysteresis keeps one guide attached through tiny pointer jitter and close neighbours.
export function snapTranslation({bounds,delta,targets,scale=1,previous={},limits={}}){
 const unit=Number.isFinite(scale)&&scale>0?scale:1,result={},guides=[],locks={};
 for(const axis of ['x','y']){
  const range=limits[axis]||[-Infinity,Infinity],raw=clamp(delta[axis],...range),candidates=[];
  for(const target of targets[axis])for(const anchor of target.anchor===undefined?[0,1,2]:[target.anchor]){
   const value=target.value-bounds[axis][anchor];
   if(value<range[0]||value>range[1])continue;
   candidates.push({target,anchor,delta:value,distance:Math.abs(value-raw)*unit});
  }
  const held=candidates.find(c=>c.target.id===previous[axis]?.id&&c.anchor===previous[axis]?.anchor&&c.distance<=10);
  const nearest=candidates.filter(c=>c.distance<=6).sort((a,b)=>a.distance-b.distance||priority(a)-priority(b))[0];
  // Give the frame's symmetric points a narrow priority zone beside competing peer edges.
  const frameIntent=candidates.filter(c=>c.target.kind!=='element'&&c.distance<=2).sort((a,b)=>a.distance-b.distance||priority(a)-priority(b))[0];
  const match=frameIntent||held||nearest;
  result[axis]=match?match.delta:raw;
  if(match){
   // An edge alignment can also centre the object. Show the centre explicitly then,
   // even when hysteresis is holding the coincident edge of a neighbouring object.
   const centre=targets[axis].find(t=>t.kind==='center'&&Math.abs(bounds[axis][1]+result[axis]-t.value)<1e-7);
   guides.push({axis,...(centre||match.target)});locks[axis]={id:match.target.id,anchor:match.anchor};
  }
 }
 return {delta:result,guides,locks};
}
function priority(candidate){return candidate.target.kind==='center'?0:candidate.target.kind==='element'?2:1;}

export function movementLimits(original,width,height,isSticker=false){
 const min=isSticker?0:-100;
 return {x:[(min-original.x)*width/100,(100-original.x)*width/100],y:[(min-original.y)*height/100,(100-original.y)*height/100]};
}
