export function releaseAxesLinked(config){return !!config.releases?.stock&&config.releases.mode==='pulse'&&!config.visuals?.hidden?.stock&&config.visuals?.design?.chart?.release?.linkAxes!==false;}
// Both plots share the horizontal frame. Their height and vertical position stay independent.
const shared=['x','widthScale','scale','rotation'];
export function releaseElementTransform(config,id){
 const elements=config.visuals?.design?.elements||{},own=elements[id]||{};
 return id==='plot'&&releaseAxesLinked(config)?{...own,...Object.fromEntries(shared.map(key=>[key,elements.stock?.[key]??(key==='x'||key==='rotation'?0:100)]))}:own;
}
export function patchReleaseElement(config,id,patch){
 const elements=config.visuals.design.elements;
 if(id!=='plot'||!releaseAxesLinked(config))return {...elements,[id]:{...elements[id],...patch}};
 const common=Object.fromEntries(Object.entries(patch).filter(([key])=>shared.includes(key))),local=Object.fromEntries(Object.entries(patch).filter(([key])=>!shared.includes(key)));
 return {...elements,stock:{...elements.stock,...common},plot:{...elements.plot,...local}};
}
export function releaseRenderConfig(config){
 if(!releaseAxesLinked(config))return config;
 const design=config.visuals.design,plot={...releaseElementTransform(config,'plot'),widthScale:100};
 return {...config,visuals:{...config.visuals,design:{...design,elements:{...design.elements,plot}}}};
}
