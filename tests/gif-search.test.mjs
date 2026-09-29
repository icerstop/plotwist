import test from 'node:test';
import assert from 'node:assert/strict';
import {gifMediaUrl,normalizeGifResults,searchGifs,downloadGif} from '../src/gif-search.js';
import {frameIndexAt} from '../src/media-timeline.js';
import {renderVideoFrames} from '../src/video-timeline.js';
const cdn='https://pub-9502c4126a384b90aa92ed45d7f6c379.r2.dev/gifs/money.gif';
const item={id:'money',title:'Money / rain',url:cdn};
test('only provider media can be imported; CDN media use the CORS-safe proxy',()=>{
 const url=gifMediaUrl(cdn);assert.ok(url.startsWith('https://gifsnap.com/api/v1/media/'));assert.equal(gifMediaUrl(url),url);
 for(const unsafe of ['javascript:alert(1)','http://gifsnap.com/api/v1/media/x','https://gifsnap.com.evil.test/api/v1/media/x','https://someone:secret@gifsnap.com/api/v1/media/x','https://127.0.0.1/image.gif','https://gifsnap.com/docs'])assert.equal(gifMediaUrl(unsafe),null);
 const results=normalizeGifResults({data:[item,item,{...item,id:'video',url:cdn.replace('.gif','.mp4')},{...item,id:'webp',url:cdn.replace('.gif','.webp')}],pagination:{has_next:true,next_page:2}});
 assert.equal(results.items.length,1);assert.equal(results.nextPage,2);assert.equal(results.items[0].title,item.title);
});
test('search sends the exact query, caches pages, respects cancellation and reports service failures',async()=>{
 let calls=0;const fetcher=async(url,options)=>{calls++;const q=new URL(url).searchParams;assert.equal(q.get('q'),'pieniądze & robot');assert.equal(q.get('page'),'2');assert.equal(options.credentials,'omit');return Response.json({data:[item],pagination:{has_next:false}});};
 await searchGifs('pieniądze & robot',2,{fetcher});await searchGifs('pieniądze & robot',2,{fetcher});assert.equal(calls,1);
 await assert.rejects(searchGifs('offline',1,{fetcher:async()=>new Response('',{status:429})}),/Za dużo/);
 await assert.rejects(searchGifs('pieniądze & robot',2,{fetcher,signal:AbortSignal.abort()}),{name:'AbortError'});
 assert.throws(()=>normalizeGifResults({error:'upstream'}),/nieprawidłową/);
});
test('remote imports preserve GIF bytes and reject misleading, oversized or failed responses',async()=>{
 const bytes=new TextEncoder().encode('GIF89a test bytes');
 const file=await downloadGif(item,{fetcher:async()=>new Response(bytes)});assert.equal(file.type,'image/gif');assert.equal(file.name,'Money  rain.gif');assert.deepEqual(new Uint8Array(await file.arrayBuffer()),bytes);
 await assert.rejects(downloadGif(item,{fetcher:async()=>new Response('<html>not a GIF')}),/nie zawiera/);
 await assert.rejects(downloadGif(item,{fetcher:async()=>new Response('',{status:503})}),/pobrać/);
 await assert.rejects(downloadGif(item,{fetcher:async()=>new Response(bytes,{headers:{'content-length':String(13*1024*1024)}})}),/12 MB/);
 let cancelled=false;const body=new ReadableStream({start(c){c.enqueue(new Uint8Array(13*1024*1024));},cancel(){cancelled=true;}});
 await assert.rejects(downloadGif(item,{fetcher:async()=>new Response(body)}),/12 MB/);assert.equal(cancelled,true);
});
test('a low-fps GIF holds its frame without reducing exported 30/60-fps timeline',async()=>{
 for(const fps of [30,60]){const gifFrames=[],times=[];
  const count=await renderVideoFrames({duration:2,fps,draw:(_,time)=>gifFrames.push(frameIndexAt([200,400,600,800,1000],time)),write:time=>times.push(time),yieldTask:async()=>{}});
  assert.equal(count,2*fps);assert.equal(times.length,count);assert.equal(new Set(gifFrames).size,5);
  assert.equal(gifFrames.slice(1).filter((frame,i)=>frame!==gifFrames[i]).length,9);
  assert.equal(times[1]-times[0],1/fps);assert.equal(gifFrames[0],gifFrames[1]);
 }
});
