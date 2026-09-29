import {beginElement} from './reel-elements.js';
import {mediaFrame} from './reel-media.js';
import {themeOf} from './reel-design.js';
import {reelFont} from './reel-fonts.js';

export const reelLogoOptions=[
 {id:'none',name:'Brak logo'},
 {id:'chart',name:'Słupki wykresu'},
 {id:'trend',name:'Linia trendu'},
 {id:'monogram',name:'Monogram JB'},
 {id:'custom',name:'Własne logo'}
];
export function normalizeLogo(raw){
 return {type:reelLogoOptions.some(o=>o.id===raw?.type)?raw.type:'none',assetId:typeof raw?.assetId==='string'?raw.assetId:null,name:typeof raw?.name==='string'?raw.name:'',color:/^#[0-9a-f]{6}$/i.test(raw?.color||'')?raw.color:null};
}
export function restoreLogo(raw,files){
 const logo=normalizeLogo(raw);
 if(logo.assetId&&!files[logo.assetId])return {...logo,type:logo.type==='custom'?'none':logo.type,assetId:null,name:''};
 return logo;
}
// No logo in old drafts or fresh reels. Only explicitly chosen marks are rendered/exported.
export function drawReelLogo(ctx,config,time,{x=78,y=62,h=56}={}){
 const logo=normalizeLogo(config.visuals?.logo);if(logo.type==='none')return;
 const frame=logo.type==='custom'?mediaFrame(logo.assetId,time):null;
 if(logo.type==='custom'&&!frame)return;
 let w=logo.type==='chart'?h*.82:logo.type==='monogram'?h*1.5:h;
 if(frame){const scale=Math.min(180/frame.width,90/frame.height);w=frame.width*scale;h=frame.height*scale;}
 const end=beginElement(ctx,config,'mark',{x,y,w,h});
 ctx.fillStyle=ctx.strokeStyle=logo.color||themeOf(config).colors[0];
 if(frame)ctx.drawImage(frame,x,y,w,h);
 else if(logo.type==='chart')[.36,.64,1].forEach((size,i)=>ctx.fillRect(x+i*h*.32,y+h*(1-size),h*.18,h*size));
 else if(logo.type==='trend'){
  ctx.lineWidth=h*.09;ctx.lineCap=ctx.lineJoin='round';ctx.beginPath();
  [[.05,.9],[.35,.55],[.6,.68],[.94,.12]].forEach(([a,b],i)=>ctx[i?'lineTo':'moveTo'](x+w*a,y+h*b));ctx.stroke();
 }else{
  ctx.font=`bold ${h*.85}px ${reelFont(config.fontId)}`;ctx.textAlign='left';ctx.textBaseline='alphabetic';ctx.fillText('JB',x,y+h*.84,w);
 }
 end();
}
