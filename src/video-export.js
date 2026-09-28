import {BufferTarget,CanvasSource,Mp4OutputFormat,Output,Quality,WebMOutputFormat,canEncodeVideo} from 'mediabunny';
import {checkExportAbort,renderVideoFrames} from './video-timeline.js';

export async function encodeReel({canvas,draw,duration,fps,onProgress=()=>{},signal}) {
 checkExportAbort(signal);
 if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined')throw new Error('Ta przeglądarka nie obsługuje eksportu klatka po klatce. Użyj aktualnego Chrome lub Edge albo pobierz PNG.');
 const quality=new Quality({bitrate:fps===60?16000000:10000000});
 let codec;
 for(const candidate of ['avc','vp9','vp8']) {
  if(await canEncodeVideo(candidate,{width:canvas.width,height:canvas.height,frameRate:fps,quality,latencyMode:'quality'})){codec=candidate;break;}
  checkExportAbort(signal);
 }
 checkExportAbort(signal);
 if(!codec)throw new Error('Brak obsługi kodowania wideo w tym rozmiarze. Spróbuj 30 fps lub aktualnego Chrome/Edge.');
 const format=codec==='avc'?new Mp4OutputFormat({fastStart:'in-memory'}):new WebMOutputFormat();
 const target=new BufferTarget(),output=new Output({format,target});
 let encodedFrames=0,cancellation;
 const source=new CanvasSource(canvas,{codec,quality,latencyMode:'quality',keyFrameInterval:2,onEncodedPacket:()=>{encodedFrames++;}});
 output.addVideoTrack(source,{frameRate:fps});
 const cancel=()=>{cancellation??=output.cancel().catch(()=>{});};
 signal?.addEventListener('abort',cancel,{once:true});
 try {
  checkExportAbort(signal);
  await output.start();
  const frameCount=await renderVideoFrames({duration,fps,draw,write:(time,length)=>source.add(time,length),onProgress:p=>onProgress(p*.95),signal});
  onProgress(.96);
  source.close();
  await output.finalize();
  checkExportAbort(signal);
  if(encodedFrames!==frameCount||!target.buffer?.byteLength)throw new Error('Eksport nie zawiera wszystkich klatek. Spróbuj ponownie.');
  onProgress(1);
  return {blob:new Blob([target.buffer],{type:format.mimeType}),extension:format.fileExtension.replace(/^\./,''),fps,frameCount,codec};
 } catch(error) {
  cancel();await cancellation;
  checkExportAbort(signal);
  throw error;
 } finally {
  signal?.removeEventListener('abort',cancel);
 }
}
