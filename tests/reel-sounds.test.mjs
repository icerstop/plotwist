import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeReleaseSound,releaseSounds,synthesizeReleaseSound,mixReleaseAudio} from '../src/reel-sounds.js';
import {releaseSoundPlan} from '../src/reel-audio.js';
import {normalizeMotion,reelMotionFrame} from '../src/reel-motion.js';
import {eventPausePlan,eventPauseFrame,datedEvents} from '../src/event-timing.js';
const rows=[{date:'2020-01-01',name:'A'},{date:'2020-06-01',name:'B'},{date:'2020-06-01',name:'C'},{date:'2021-01-01',name:'D'}];
const config=motion=>({duration:24,releases:{rows,start:'2020-01-01',end:'2021-01-01'},visuals:{design:{motion:normalizeMotion({releaseSound:{enabled:true},...motion})}}});
test('sound settings are opt-in, normalized and preserved',()=>{
 assert.equal(normalizeReleaseSound().enabled,false);assert.equal(normalizeReleaseSound(null).preset,'pop');
 assert.equal(normalizeReleaseSound({volume:200}).volume,100);assert.equal(normalizeReleaseSound({volume:-1}).volume,0);
 assert.equal(normalizeMotion({releaseSound:{enabled:true,preset:'bell',volume:30}}).releaseSound.preset,'bell');
 assert.equal(releaseSoundPlan({}).events.length,0);assert.equal(releaseSoundPlan(config({releaseSound:{enabled:false}})).events.length,0);
});
test('every sound is distinct, deterministic, bounded and fades to silence',()=>{
 const signatures=new Set();for(const sound of releaseSounds){const pcm=synthesizeReleaseSound(sound.id);assert.deepEqual(pcm,synthesizeReleaseSound(sound.id));assert.ok(pcm[0]===0);assert.ok(Math.abs(pcm.at(-1))<.001);assert.ok(pcm.every(v=>Number.isFinite(v)&&Math.abs(v)<1));assert.ok(pcm.some(v=>Math.abs(v)>.1));signatures.add(Array.from(pcm.slice(10,100)).join());}assert.equal(signatures.size,8);
});
test('sound onset matches rendered events, intros and compressed/custom pauses in every mode',()=>{
 for(const enabled of [false,true])for(const mode of ['pulse','calendar','cards','heatmap','gaps'])for(const duration of [6,24,600]){
  const c=config({enabled,chartStart:.3,eventPauses:{seconds:10,overrides:{'2020-06-01':2}}});c.duration=duration;c.releases.mode=mode;
  const sound=releaseSoundPlan(c);assert.equal(sound.events.length,3);
  for(const event of sound.events){const motion=reelMotionFrame(c,0,event.at+1e-6),plan=eventPausePlan(datedEvents(rows,c.releases.start,c.releases.end),motion.config.duration*.9,c.visuals.design.motion.eventPauses);assert.equal(eventPauseFrame(plan,motion.dataTime).event,event.id);}
 }
});
test('chunked audio equals full mix with overlapping events and volume zero mutes',()=>{
 const sound=synthesizeReleaseSound('chime'),events=[{at:.9},{at:1},{at:1.01},{at:1.04}];
 const all=mixReleaseAudio(events,sound,0,96000,100),a=mixReleaseAudio(events,sound,0,48000,100),b=mixReleaseAudio(events,sound,48000,48000,100);
 assert.deepEqual(all,Float32Array.from([...a,...b]));assert.ok(all.every(v=>Math.abs(v)<=.951));assert.ok(mixReleaseAudio(events,sound,0,96000,0).every(v=>v===0));
});
