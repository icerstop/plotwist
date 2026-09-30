// Original, deterministic synthesized effects shared by preview and export.
export const releaseSounds=[
 {id:'pop',pl:'Miękkie pyk',en:'Soft pop',length:.16,f:520,end:160,decay:32},
 {id:'click',pl:'Suchy klik',en:'Dry click',length:.07,f:1800,end:700,decay:85,noise:.65},
 {id:'wood',pl:'Drewniane stuknięcie',en:'Wood tap',length:.12,f:760,end:420,decay:48,noise:.15},
 {id:'bell',pl:'Dzwonek',en:'Bell',length:.65,f:880,end:880,decay:9,harmonic:2.76},
 {id:'ping',pl:'Szklany ping',en:'Glass ping',length:.4,f:1480,end:1480,decay:15,harmonic:3.1},
 {id:'digital',pl:'Cyfrowy impuls',en:'Digital pulse',length:.18,f:660,end:1320,decay:22,harmonic:2},
 {id:'bubble',pl:'Bąbelek',en:'Bubble',length:.23,f:220,end:820,decay:20},
 {id:'chime',pl:'Dwuton',en:'Two-tone chime',length:.55,f:660,end:660,decay:12,second:990},
];
export function normalizeReleaseSound(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 return {enabled:raw.enabled===true,preset:releaseSounds.some(s=>s.id===raw.preset)?raw.preset:'pop',volume:Number.isFinite(Number(raw.volume))?Math.max(0,Math.min(100,Number(raw.volume))):45};
}
export function synthesizeReleaseSound(id,sampleRate=48000){
 const s=releaseSounds.find(s=>s.id===id)||releaseSounds[0],data=new Float32Array(Math.ceil(s.length*sampleRate));let seed=17;
 for(let i=0;i<data.length;i++){
  const t=i/sampleRate,phase=2*Math.PI*(s.f*t+(s.end-s.f)*t*t/(2*s.length));
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  let wave=Math.sin(phase)+(s.harmonic ? .3*Math.sin(phase*s.harmonic):0)+(s.noise||0)*(seed/2147483648-1);
  let value=wave*Math.exp(-s.decay*t);
  if(s.second&&t>.09)value+=.65*Math.sin(2*Math.PI*s.second*(t-.09))*Math.exp(-s.decay*(t-.09))*Math.min(1,(t-.09)/.003);
  data[i]=value*.55*Math.min(1,t/.002)*Math.min(1,(s.length-t)/.015);
 }
 return data;
}
// Chunk boundaries and overlaps use sample indices, so export speed cannot affect sound.
export function mixReleaseAudio(events,sample,startFrame,frames,volume=45,sampleRate=48000){
 const out=new Float32Array(frames),gain=volume/100;
 for(const event of events){
  const offset=Math.round(event.at*sampleRate)-startFrame,a=Math.max(0,offset),b=Math.min(frames,offset+sample.length);
  for(let i=a;i<b;i++)out[i]+=sample[i-offset]*gain;
 }
 for(let i=0;i<out.length;i++)out[i]=Math.max(-.95,Math.min(.95,out[i]));
 return out;
}
