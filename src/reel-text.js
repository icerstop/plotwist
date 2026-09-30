import {animateText} from './reel-motion.js';
import {typingRole} from './reel-typing.js';
import {mysteryRole} from './reel-mystery.js';
import {beginElement,textRect} from './reel-elements.js';
import {roundFill} from './chart-appearance.js';

export const textStyleOf=(config,role)=>config?.visuals?.design?.text?.[role]||{};
export function textLines(ctx,value,width,manual=false){
 const lines=[];
 for(const paragraph of String(value??'').split(/\r?\n/)){
  if(manual){lines.push(paragraph);continue;}
  let line='';
  for(const word of paragraph.trim().split(/\s+/).filter(Boolean)){
   const next=line?`${line} ${word}`:word;
   if(ctx.measureText(next).width<=width){line=next;continue;}
   if(line){lines.push(line);line='';}
   for(const char of word){if(line&&ctx.measureText(line+char).width>width){lines.push(line);line='';}line+=char;}
  }
  lines.push(line);
 }
 return lines;
}
const ellipsis=(ctx,text,width)=>{let s=text;while(s&&ctx.measureText(s+'…').width>width)s=s.slice(0,-1);return s+'…';};
export function textLayout(ctx,text,x,y,width,step,maxLines,config,role){
 const s=textStyleOf(config,role),w=width*(s.width??100)/100,lineHeight=step*(s.lineHeight??1);
 const align=s.align&&s.align!=='auto'?s.align:config?.visuals?.design?.layout==='centered'&&['title','subtitle'].includes(role)?'center':(ctx.textAlign||'left');
 const inherited=(!s.align||s.align==='auto')&&!['title','subtitle','metric','source'].includes(role);
 const left=x+(align==='center'?(width-w)/2:align==='right'?width-w:0),anchor=inherited?x:left+(align==='center'?w/2:align==='right'?w:0);
 const all=text?textLines(ctx,text,w,s.wrap==='manual'):[],limit=s.maxLines||maxLines;
 const lines=all.slice(0,limit).map((line,i)=>ctx.measureText(line).width>w||i===limit-1&&all.length>limit?ellipsis(ctx,line,w):line);
 return {lines,width:w,x:anchor,y,step:lineHeight,align,height:lines.length*lineHeight};
}
// Effects live in a saved canvas state: shadows never leak into the chart.
export function paintText(ctx,config,role,lines,x,y,step=0,maxWidth=1000){
 const endRole=typingRole(ctx,role),endMystery=mysteryRole(ctx,role);
 animateText(ctx,config,role,lines,x,y,step,maxWidth,lineIndex=>{
 const s=textStyleOf(config,role);ctx.save();ctx.globalAlpha*=(s.opacity??100)/100;
 if(s.boxColor&&lines.length){
  const box=textRect(ctx,lines,x,y,step,maxWidth),p=s.padding??14;
  ctx.save();ctx.globalAlpha*=(s.boxOpacity??90)/100;ctx.fillStyle=s.boxColor;roundFill(ctx,box.x-p,box.y-p,box.w+p*2,box.h+p*2,s.radius??10);ctx.restore();
 }
 if(s.shadow&&s.shadow!=='none'){ctx.shadowColor=s.shadowColor||'#000000';ctx.shadowBlur=s.shadow==='hard'?0:s.shadowBlur??14;ctx.shadowOffsetX=s.shadow==='glow'?0:s.shadowX??0;ctx.shadowOffsetY=s.shadow==='glow'?0:s.shadowY??6;}
 lines.forEach((line,i)=>{
  if(lineIndex!=null&&i!==lineIndex)return;
  if(s.strokeWidth){ctx.lineWidth=s.strokeWidth;ctx.strokeStyle=s.strokeColor;ctx.lineJoin='round';ctx.strokeText(line,x,y+i*step,maxWidth);}
  ctx.fillText(line,x,y+i*step,maxWidth);
 });ctx.restore();
 });
 endMystery();endRole();
}
export function drawTextBlock(ctx,text,x,y,width,step,maxLines=3,draw=true,config=null,role=null,register=true){
 const layout=textLayout(ctx,text,x,y,width,step,maxLines,config,role);
 if(draw&&layout.lines.length){ctx.save();ctx.textAlign=layout.align;
  const rect=textRect(ctx,layout.lines,layout.x,y,layout.step,layout.width),s=textStyleOf(config,role),p=s.boxColor?s.padding??14:0;
  const end=register&&role?beginElement(ctx,config,role,{x:rect.x-p,y:rect.y-p,w:rect.w+p*2,h:rect.h+p*2}):()=>{};
  paintText(ctx,config,role,layout.lines,layout.x,y,layout.step,layout.width);end();ctx.restore();
 }
 return layout.height;
}
