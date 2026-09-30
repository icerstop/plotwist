import {synthesizeReleaseSound,mixReleaseAudio} from './reel-sounds.js';
import {AudioSample,AudioSampleSource,canEncodeAudio,BufferTarget,CanvasSource,Mp4OutputFormat,Output,Quality,WebMOutputFormat,canEncodeVideo} from 'mediabunny';
import {checkExportAbort,renderVideoFrames} from './video-timeline.js';

export async function encodeReel({canvas,draw,duration,fps,audio,onProgress=()=>{},signal}) {
 checkExportAbort(signal);
 if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined')throw new Error('Ta przeglądarka nie obsługuje eksportu klatka po klatce. Użyj aktualnego Chrome lub Edge albo pobierz PNG.');
 const quality=new Quality({bitrate:fps===60?16000000:10000000});
 let codec,audioCodec;
 const withAudio=audio?.events?.length>0;
 for(const candidate of ['avc','vp9','vp8']) {
  if(await canEncodeVideo(candidate,{width:canvas.width,height:canvas.height,frameRate:fps,quality,latencyMode:'quality'})){const ac=candidate==='avc'?'aac':'opus';if(!withAudio||await canEncodeAudio(ac,{sampleRate:48000,numberOfChannels:1})){codec=candidate;audioCodec=withAudio?ac:null;break;}}
  checkExportAbort(signal);
 }
 checkExportAbort(signal);
 if(!codec&&withAudio)throw new Error('Przeglądarka nie obsługuje eksportu z dźwiękiem. Użyj aktualnego Chrome/Edge lub wyłącz dźwięki premier.');
 if(!codec)throw new Error('Brak obsługi kodowania wideo w tym rozmiarze. Spróbuj 30 fps lub aktualnego Chrome/Edge.');
 const format=codec==='avc'?new Mp4OutputFormat({fastStart:'in-memory'}):new WebMOutputFormat();
 const target=new BufferTarget(),output=new Output({format,target});
 let encodedFrames=0,cancellation;
 const source=new CanvasSource(canvas,{codec,quality,latencyMode:'quality',keyFrameInterval:2,onEncodedPacket:()=>{encodedFrames++;}});
 output.addVideoTrack(source,{frameRate:fps});
 const audioSource=withAudio?new AudioSampleSource({codec:audioCodec,quality:new Quality({bitrate:128000})}):null;
 if(audioSource)output.addAudioTrack(audioSource);
 const sound=withAudio?synthesizeReleaseSound(audio.preset):null;let audioFrame=0;
 const writeAudio=async until=>{if(!audioSource)return;const end=Math.min(Math.round(duration*48000),Math.round(until*48000));while(audioFrame<end){checkExportAbort(signal);const count=Math.min(48000,end-audioFrame),sample=new AudioSample({data:mixReleaseAudio(audio.events,sound,audioFrame,count,audio.volume),format:"f32",numberOfChannels:1,sampleRate:48000,timestamp:audioFrame/48000});try{await audioSource.add(sample);}finally{sample.close();}audioFrame+=count;}};
 const cancel=()=>{cancellation??=output.cancel().catch(()=>{});};
 signal?.addEventListener('abort',cancel,{once:true});
 try {
  checkExportAbort(signal);
  await output.start();
  const frameCount=await renderVideoFrames({duration,fps,draw,write:async(time,length)=>{await source.add(time,length);if(time+length>=audioFrame/48000)await writeAudio(Math.min(duration,Math.floor(time)+1));},onProgress:p=>onProgress(p*.95),signal});
  onProgress(.96);
  source.close();
  await writeAudio(duration);audioSource?.close();
  await output.finalize();
  checkExportAbort(signal);
  if(encodedFrames!==frameCount||!target.buffer?.byteLength)throw new Error('Eksport nie zawiera wszystkich klatek. Spróbuj ponownie.');
  onProgress(1);
  return {blob:new Blob([target.buffer],{type:format.mimeType}),extension:format.fileExtension.replace(/^\./,''),fps,frameCount,codec,audioCodec};
 } catch(error) {
  cancel();await cancellation;
  checkExportAbort(signal);
  throw error;
 } finally {
  signal?.removeEventListener('abort',cancel);
 }
}
