import {frameIndexAt} from './media-timeline.js';
const cache=new Map();
const MAX_FILE=12*1024*1024,MAX_PIXELS=40_000_000;
function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
export const mediaAsset=id=>cache.get(id);
export const mediaFrame=(id,time=0,speed=1)=>{const a=cache.get(id);return a?.frames[frameIndexAt(a.ends,time,speed)];};
export function releaseMedia(id){const a=cache.get(id);if(a){for(const frame of a.frames){frame.width=1;frame.height=1;}cache.delete(id);}}
export function releaseAllMedia(){for(const id of cache.keys())releaseMedia(id);}
function budget(){return MAX_PIXELS-[...cache.values()].reduce((n,a)=>n+a.pixels,0);}
export async function decodeMedia(file,id=crypto.randomUUID()){
 if(cache.has(id))return id;
 if(!file?.size||file.size>MAX_FILE)throw new Error('Wybierz obraz lub GIF do 12 MB.');
 const bytes=new Uint8Array(await file.arrayBuffer());
 const gif=String.fromCharCode(...bytes.slice(0,6));
 const isGif=gif==='GIF87a'||gif==='GIF89a';
 const isImage=(bytes[0]===137&&bytes[1]===80&&bytes[2]===78&&bytes[3]===71)||(bytes[0]===255&&bytes[1]===216)||(String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP');
 if(!isGif&&!isImage)throw new Error('Obsługiwane pliki: PNG, JPG, WebP i animowany GIF.');
 let frames=[],ends=[],width,height,pixels=0;
 try{
  if(isGif){
   const {parseGIF,decompressFrame}=await import('gifuct-js');
   const parsed=parseGIF(bytes.buffer),images=parsed.frames.filter(f=>f.image);
   const iw=parsed.lsd.width,ih=parsed.lsd.height;
   if(!iw||!ih||iw*ih>8_000_000||!images.length||images.length>400)throw new Error('Ten GIF jest za duży. Użyj maks. 400 klatek i 8 mln pikseli na klatkę.');
   if(images.some(f=>f.image.descriptor.width*f.image.descriptor.height>8_000_000))throw new Error('GIF zawiera zbyt dużą klatkę.');
   // Decode one patch at a time; adapt cached resolution to a bounded memory budget.
   const allowance=Math.min(20_000_000,budget()),scale=Math.min(1,900/Math.max(iw,ih),Math.sqrt(allowance/(images.length*iw*ih)));
   if(!Number.isFinite(scale)||scale<=0||(scale<1&&Math.max(iw,ih)*scale<Math.min(100,Math.max(iw,ih))))throw new Error('Za dużo animacji naraz. Usuń jeden GIF lub wybierz krótszy plik.');
   width=Math.max(1,Math.floor(iw*scale));height=Math.max(1,Math.floor(ih*scale));
   const work=canvas(iw,ih),ctx=work.getContext('2d'),patch=canvas(1,1),pc=patch.getContext('2d');
   const bg=parsed.gct?.[parsed.lsd.backgroundColorIndex];
   // Transparent GIFs clear to transparent; opaque GIFs restore their palette background.
   const transparent=images.some(f=>f.gce?.extras?.transparentColorGiven);
   const clear=(x,y,w,h)=>{ctx.clearRect(x,y,w,h);if(!transparent&&bg){ctx.fillStyle=`rgb(${bg.join(',')})`;ctx.fillRect(x,y,w,h);}};
   clear(0,0,iw,ih);let previous=null,restore=null,total=0;
   for(let i=0;i<images.length;i++){
    if(previous?.disposalType===2){const d=previous.dims;clear(d.left,d.top,d.width,d.height);}
    else if(previous?.disposalType===3&&restore)ctx.putImageData(restore,0,0);
    const f=decompressFrame(images[i],parsed.gct,true),d=f.dims;
    if(d.left+d.width>iw||d.top+d.height>ih)throw new Error('Nieprawidłowe wymiary klatki GIF.');
    restore=f.disposalType===3?ctx.getImageData(0,0,iw,ih):null;
    patch.width=d.width;patch.height=d.height;pc.putImageData(new ImageData(f.patch,d.width,d.height),0,0);ctx.drawImage(patch,d.left,d.top);
    const frame=canvas(width,height);frame.getContext('2d').drawImage(work,0,0,width,height);frames.push(frame);
    total+=Math.max(20,f.delay||100);ends.push(total);previous=f;
    if(i%12===0)await new Promise(resolve=>setTimeout(resolve,0));
   }
   work.width=patch.width=1;work.height=patch.height=1;pixels=width*height*frames.length;
  }else{
   const bitmap=await createImageBitmap(file);
   const scale=Math.min(1,1920/Math.max(bitmap.width,bitmap.height));width=Math.max(1,Math.round(bitmap.width*scale));height=Math.max(1,Math.round(bitmap.height*scale));pixels=width*height;
   if(pixels>budget()){bitmap.close();throw new Error('Za dużo dużych dodatków. Usuń obraz lub GIF i spróbuj ponownie.');}
   const frame=canvas(width,height);frame.getContext('2d').drawImage(bitmap,0,0,width,height);bitmap.close();frames=[frame];ends=[1000];
  }
  const thumb=canvas(96,96);const ratio=Math.min(96/width,96/height);thumb.getContext('2d').drawImage(frames[0],(96-width*ratio)/2,(96-height*ratio)/2,width*ratio,height*ratio);
  cache.set(id,{frames,ends,width,height,pixels,type:isGif?'gif':'image',thumbnail:thumb.toDataURL('image/png')});return id;
 }catch(error){for(const f of frames){f.width=f.height=1;}throw new Error(error.message||'Nie udało się odczytać obrazu. Wybierz inny plik.');}
}

let database;
function openDatabase(){return database??=new Promise((resolve,reject)=>{const request=indexedDB.open('plotwist-visuals',1);request.onupgradeneeded=()=>request.result.createObjectStore('draft');request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function loadVisualDraft(){const db=await openDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction('draft','readonly'),r=tx.objectStore('draft').get('current');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
export async function saveVisualDraft(value){const db=await openDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction('draft','readwrite');tx.objectStore('draft').put(value,'current');tx.oncomplete=()=>resolve();tx.onabort=tx.onerror=()=>reject(tx.error);});}
