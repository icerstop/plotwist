import test from 'node:test';
import assert from 'node:assert/strict';
import {renderVideoFrames} from '../src/video-timeline.js';

test('30/60 fps exports contain every frame with fixed timestamps despite slow encoding',async()=>{
 for(const fps of [30,60]) {
  const draws=[],frames=[],progress=[];let busy=false;
  const count=await renderVideoFrames({duration:1,fps,draw:(p,t)=>{assert.equal(busy,false);draws.push([p,t]);},write:async(time,duration)=>{
   busy=true;if(frames.length%7===0)await new Promise(r=>setTimeout(r,15));frames.push({time,duration});busy=false;
  },onProgress:p=>progress.push(p)});
  assert.equal(count,fps);assert.equal(frames.length,fps);
  assert.equal(frames[0].time,0);assert.equal(frames.at(-1).time+frames.at(-1).duration,1);
  frames.forEach((frame,i)=>{assert.equal(frame.time,i/fps);assert.equal(frame.duration,1/fps);assert.deepEqual(draws[i],[Math.min(i/fps/.9,1),i/fps]);});
  assert.equal(draws.at(-1)[0],1);assert.equal(progress.at(-1),1);
  assert.ok(progress.every((p,i)=>!i||p>progress[i-1]));
 }
});

test('cancel during encoding stops before the next frame and never reports completion',async()=>{
 const controller=new AbortController();let count=0,lastProgress=0;
 await assert.rejects(renderVideoFrames({duration:12,fps:60,signal:controller.signal,draw:()=>{count++;},write:async()=>{if(count===5)controller.abort();},onProgress:p=>{lastProgress=p;}}),{name:'AbortError'});
 assert.equal(count,5);assert.ok(lastProgress<1);
});

test('encoder errors stop rendering instead of skipping missing frames',async()=>{
 let count=0;
 await assert.rejects(renderVideoFrames({duration:6,fps:30,draw:()=>{count++;},write:async()=>{if(count===3)throw new Error('encoder failed');}}),/encoder failed/);
 assert.equal(count,3);
});

test('invalid timing and already cancelled exports do not draw or encode',async()=>{
 const noWork=()=>assert.fail('Unexpected frame');
 for(const [duration,fps] of [[0,60],[NaN,60],[6,15],[1.01,30]])await assert.rejects(renderVideoFrames({duration,fps,draw:noWork,write:noWork}),/Nieprawidłowa/);
 const controller=new AbortController();controller.abort();
 await assert.rejects(renderVideoFrames({duration:6,fps:60,signal:controller.signal,draw:noWork,write:noWork}),{name:'AbortError'});
});
