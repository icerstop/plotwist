import {beginElement} from './reel-elements.js';
import {paintText,textLines} from './reel-text.js';
import {themeOf} from './reel-design.js';
import {reelFont,nearestFontWeight} from './reel-fonts.js';
import {roundFill} from './chart-appearance.js';

export function drawReelOverlays(ctx,w,h,config,layer='front'){
 for(const o of config.visuals?.overlays||[]){
  if(!o.visible||o.layer!==layer)continue;
  const id=`overlay:${o.id}`,width=w*o.width/100,theme=themeOf(config),font=o.fontId||config.fontId;
  ctx.save();ctx.translate(w*o.x/100,h*o.y/100);ctx.rotate(o.rotation*Math.PI/180);ctx.scale(o.scale/100,o.scale/100);ctx.globalAlpha*=o.opacity/100;
  ctx.font=`${o.italic?'italic ':''}${nearestFontWeight(font,o.weight==='auto'?700:o.weight)} ${o.fontSize}px ${reelFont(font)}`;
  const head=Math.min(width*.3,Math.max(20,o.strokeWidth*4));
  const lines=o.kind==='text'?textLines(ctx,o.text[config.language==='en'?'en':'pl'],width):[],step=o.fontSize*o.lineHeight,height=o.kind==='text'?Math.max(o.fontSize,lines.length*step):o.kind==='line'?Math.max(24,o.strokeWidth+16):o.kind==='arrow'?head*1.3+16:h*o.height/100;
  const rect={x:-width/2,y:-height/2,w:width,h:height},end=beginElement(ctx,config,id,rect);
  ctx.fillStyle=ctx.strokeStyle=o.color||(o.kind==='text'?theme.fg:theme.colors[0]);ctx.lineWidth=o.strokeWidth;ctx.lineJoin=ctx.lineCap='round';ctx.setLineDash([]);
  if(o.shadow){ctx.shadowColor='#00000066';ctx.shadowBlur=20;ctx.shadowOffsetY=8;}
  if(o.kind==='text'){
   ctx.textAlign=o.align;ctx.textBaseline='alphabetic';
   paintText(ctx,config,id,lines,o.align==='left'?-width/2:o.align==='right'?width/2:0,-height/2+o.fontSize*.85,step,width);
  }else if(o.kind==='rectangle'){
   if(o.fill)roundFill(ctx,rect.x,rect.y,width,height,o.radius);
   else {ctx.beginPath();ctx.roundRect(rect.x,rect.y,width,height,Math.min(o.radius,width/2,height/2));ctx.stroke();}
  }else if(o.kind==='ellipse'){
   ctx.beginPath();ctx.ellipse(0,0,width/2,height/2,0,0,Math.PI*2);o.fill?ctx.fill():ctx.stroke();
  }else{
   ctx.beginPath();ctx.moveTo(-width/2,0);ctx.lineTo(width/2,0);ctx.stroke();
   if(o.kind==='arrow'){ctx.beginPath();ctx.moveTo(width/2-head,-head*.65);ctx.lineTo(width/2,0);ctx.lineTo(width/2-head,head*.65);ctx.stroke();}
  }
  end();ctx.restore();
 }
}
