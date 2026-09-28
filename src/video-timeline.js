export function checkExportAbort(signal) {
 if(signal?.aborted)throw new DOMException('Eksport anulowany.','AbortError');
}

// Video time comes from the frame index, never the speed of rendering or encoding.
export async function renderVideoFrames({duration,fps,draw,write,onProgress=()=>{},signal,yieldTask=()=>new Promise(resolve=>setTimeout(resolve,0))}) {
 const frameCount=duration*fps;
 if(![30,60].includes(fps)||!Number.isFinite(duration)||duration<=0||!Number.isSafeInteger(frameCount))throw new Error('Nieprawidłowa długość lub liczba klatek wideo.');
 checkExportAbort(signal);
 let reported=-1;
 for(let index=0;index<frameCount;index++) {
  checkExportAbort(signal);
  const time=index/fps;
  draw(Math.min(time/(duration*.9),1),time);
  // Await backpressure: a busy encoder slows the export, not the resulting movie.
  await write(time,1/fps);
  checkExportAbort(signal);
  const progress=(index+1)/frameCount,percent=Math.floor(progress*100);
  if(percent!==reported){reported=percent;onProgress(progress);}
  if(index%8===7)await yieldTask();
 }
 checkExportAbort(signal);
 return frameCount;
}
