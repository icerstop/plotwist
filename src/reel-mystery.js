// Reveal uses absolute frame time; seeking and offline export produce identical masks.
const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
const number=(v,f,a,b)=>clamp(v!=null&&Number.isFinite(Number(v))?Number(v):f,a,b);
export function normalizeMystery(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 const chartAt=number(raw.chartAt,.16,.05,.45),fade=number(raw.fade,.08,.02,.15);
 return {enabled:raw.enabled===true,chartAt,answerAt:number(raw.answerAt,.7,chartAt+fade+.12,Math.min(.82,.9-fade)),fade};
}
export function mysteryFrame(config,time=config._motionFrame?.time){
 const motion=config.visuals?.design?.motion;
 if(!motion?.enabled||!motion.mystery?.enabled||config.editorPreview||!Number.isFinite(time))return null;
 const m=motion.mystery,duration=config._motionFrame?.duration||config.duration||12,fraction=time/duration;
 const state=start=>{const p=clamp((fraction-start)/m.fade);return {effect:'fade',p,eased:p*p*(3-2*p)};};
 return {chart:state(m.chartAt),answer:state(m.answerAt)};
}
const roles=new WeakMap(),active=new WeakSet();
export function mysteryRole(ctx,id){const previous=roles.get(ctx);roles.set(ctx,id);return ()=>{if(previous==null)roles.delete(ctx);else roles.set(ctx,previous);};}

// Text measurements and layout run unchanged. Mask actual paint calls instead of
// toggling chart settings, so the reveal cannot move axes, legends or label cards.
export function renderMysteryFrame(canvas,config,progress,time,render){
 const frame=mysteryFrame(config,time),ctx=canvas.getContext('2d');
 if(!frame||active.has(ctx))return false;
 const methods=['fillText','strokeText','drawImage','fill','stroke','fillRect','strokeRect'],saved=methods.map(key=>({key,descriptor:Object.getOwnPropertyDescriptor(ctx,key),original:ctx[key]}));
 active.add(ctx);
 try{
  for(const {key,original} of saved)ctx[key]=function(...args){
   const role=roles.get(this),detail=role==='labels'||role==='values'||role==='content'&&['fillText','strokeText','drawImage'].includes(key)||role==null&&key==='drawImage';
   const alpha=detail?frame.answer.eased:1;
   if(alpha===0)return;
   if(alpha===1)return original.apply(this,args);
   this.save();try{this.globalAlpha*=alpha;return original.apply(this,args);}finally{this.restore();}
  };
  render(canvas,config,progress,time);
 }finally{
  for(const {key,descriptor} of saved){if(descriptor)Object.defineProperty(ctx,key,descriptor);else delete ctx[key];}
  active.delete(ctx);roles.delete(ctx);
 }
 return true;
}
