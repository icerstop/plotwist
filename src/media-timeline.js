// Pure timing helpers: every preview/export frame uses the same reel clock.
export function frameIndexAt(ends,timeSeconds,speed=1){
 const total=ends.at(-1)||1,time=((Math.max(0,timeSeconds)*1000*speed)%total+total)%total;
 let lo=0,hi=ends.length-1;
 while(lo<hi){const mid=(lo+hi)>>1;if(time<ends[mid])hi=mid;else lo=mid+1;}
 return lo;
}
export function stickerMotion(motion,timeSeconds){
 if(motion==='float')return {dy:Math.sin(timeSeconds*Math.PI)*13,scale:1,opacity:1};
 if(motion==='pulse')return {dy:0,scale:1+Math.sin(timeSeconds*Math.PI)*.06,opacity:1};
 if(motion==='enter'){const p=Math.min(1,Math.max(0,timeSeconds/.65));return {dy:(1-p)*28,scale:.9+.1*p,opacity:p};}
 return {dy:0,scale:1,opacity:1};
}
export function coverRect(iw,ih,w,h,fit='cover'){
 const scale=fit==='contain'?Math.min(w/iw,h/ih):Math.max(w/iw,h/ih);
 return {x:(w-iw*scale)/2,y:(h-ih*scale)/2,width:iw*scale,height:ih*scale};
}
