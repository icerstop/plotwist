import {datedEvents,eventPausePlan} from './event-timing.js';
import {normalizeMotion} from './reel-motion.js';
import {normalizeReleaseSound,synthesizeReleaseSound,mixReleaseAudio} from './reel-sounds.js';

export function releaseSoundPlan(config,duration=config.duration||24){
 const m=normalizeMotion(config.visuals?.design?.motion),sound=normalizeReleaseSound(m.releaseSound);
 if(!config.releases||!sound.enabled||!sound.volume)return {...sound,events:[]};
 const start=m.enabled?duration*m.chartStart:0;
 const events=config.timelineEvents||datedEvents(config.releases.rows,config.releases.start,config.releases.end);
 const plan=eventPausePlan(events,duration*.9-start,m.eventPauses);
 return {...sound,events:plan.stops.map(s=>({id:s.id,at:start+s.at})),duration};
}
let context;
export async function unlockReelAudio(){
 const AudioContext=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(!AudioContext)throw new Error('Przeglądarka nie obsługuje dźwięku.');
 context??=new AudioContext();
 await context.resume();return context;
}
// A cancelable session: changing settings, pausing, or leaving the editor cancels all scheduled audio.
export function createReleaseAudioPlayer(){
 let generation=0,nodes=[];
 const stop=()=>{generation++;for(const node of nodes){try{node.stop();}catch{}node.disconnect();}nodes=[];};
 return {stop,async start(plan,from=0){
  stop();const token=generation,ctx=await unlockReelAudio();if(token!==generation)return null;
  const origin=ctx.currentTime+.04,sample=synthesizeReleaseSound(plan.preset,ctx.sampleRate);
  // Mix in one-second chunks to limit memory even for long reels and dense release dates.
  for(let t=from;t<plan.duration;t+=1){
   const frames=Math.min(ctx.sampleRate,Math.round((plan.duration-t)*ctx.sampleRate));
   const data=mixReleaseAudio(plan.events.filter(e=>e.at>=from-1e-7),sample,Math.round(t*ctx.sampleRate),frames,plan.volume,ctx.sampleRate);
   if(!data.some(v=>v!==0))continue;
   const buffer=ctx.createBuffer(1,frames,ctx.sampleRate);buffer.copyToChannel(data,0);
   const node=ctx.createBufferSource();node.buffer=buffer;node.connect(ctx.destination);node.start(origin+t-from);nodes.push(node);
  }
  return ()=>from+Math.max(0,ctx.currentTime-origin);
 },async audition(preset,volume){return this.start({preset,volume,events:[{at:0}],duration:1});}};
}
