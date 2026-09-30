import {applyElementMotion} from './reel-motion.js';
import {mysteryRole} from './reel-mystery.js';
import {registerElement} from './reel-elements.js';
import {mediaFrame} from './reel-media.js';
import {coverRect,stickerMotion} from './media-timeline.js';
import {themeOf} from './reel-design.js';
import {drawReelOverlays} from './overlay-render.js';

export function drawVisualBackground(ctx,w,h,config,time=0){
 const v=config.visuals,b=v?.background;if(!b)return;
 const {dark,bg}=themeOf(config);ctx.save();
 if(b.type==='color'){ctx.fillStyle=b.color;ctx.fillRect(0,0,w,h);}
 if(b.type==='gradient'){
  const angle=(b.angle+(b.animate?Math.sin(time/3)*20:0))*Math.PI/180;
  const dx=Math.cos(angle)*w/2,dy=Math.sin(angle)*h/2;
  const g=ctx.createLinearGradient(w/2-dx,h/2-dy,w/2+dx,h/2+dy);g.addColorStop(0,b.color);g.addColorStop(1,b.color2);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 }
 if(b.type==='image'){
  const frame=mediaFrame(b.assetId,time,b.speed);if(frame){const r=coverRect(frame.width,frame.height,w,h,b.fit);ctx.globalAlpha=b.opacity;ctx.drawImage(frame,r.x,r.y,r.width,r.height);ctx.globalAlpha=1;}
 }
 if(b.pattern!=='none'){
  ctx.strokeStyle=ctx.fillStyle=dark?'#ffffff':'#000000';ctx.globalAlpha=.075;ctx.lineWidth=1.5;
  if(b.pattern==='grid'){for(let x=0;x<w;x+=60){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<h;y+=60){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}}
  else for(let x=30;x<w;x+=54)for(let y=30;y<h;y+=54){ctx.beginPath();ctx.arc(x,y,2,0,Math.PI*2);ctx.fill();}
  ctx.globalAlpha=1;
 }
 ctx.restore();
 drawVisualOverlays(ctx,w,h,config,time,'behind');
 // Apply the user's readability veil over decorative content, before any data/text.
 if(b.veil>0){ctx.save();ctx.globalAlpha=b.veil;ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);ctx.restore();}
}

export function drawVisualOverlays(ctx,w,h,config,time=0,layer='front'){
 if(layer==='behind')drawReelOverlays(ctx,w,h,config,layer);
 for(const sticker of config.visuals?.stickers||[]){
  if(!sticker.visible||sticker.layer!==layer)continue;
  const frame=mediaFrame(sticker.assetId,time,sticker.speed);if(!frame)continue;
  const motion=stickerMotion(sticker.motion,time),width=w*sticker.size/100*motion.scale,height=width*frame.height/frame.width;
  const safeHeight=h-(config.ai?260:195);
  const endMystery=mysteryRole(ctx,`sticker:${sticker.id}`);
  ctx.save();ctx.beginPath();ctx.rect(0,0,w,safeHeight);ctx.clip();
  ctx.translate(w*sticker.x/100,safeHeight*sticker.y/100+motion.dy);ctx.rotate(sticker.rotation*Math.PI/180);ctx.globalAlpha=sticker.opacity*motion.opacity;
  if(sticker.shadow){ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=24;ctx.shadowOffsetY=10;}
  applyElementMotion(ctx,config,`sticker:${sticker.id}`,{x:-width/2,y:-height/2,w:width,h:height});
  registerElement(ctx,`sticker:${sticker.id}`,{x:-width/2,y:-height/2,w:width,h:height},{stickerId:sticker.id,clip:{x:0,y:0,w,h:safeHeight}});
  ctx.drawImage(frame,-width/2,-height/2,width,height);ctx.restore();endMystery();
 }
}
