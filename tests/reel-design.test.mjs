import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDesign,reelThemes,reelLayouts,sectionTransform} from '../src/reel-design.js';
import {drawReel} from '../src/render.js';

test('preset foreground and secondary text remain readable on every theme background',()=>{
 const luminance=hex=>hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
 for(const theme of reelThemes)for(const text of [theme.fg,theme.muted]){
  const a=luminance(text),b=luminance(theme.bg);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,theme.id);
 }
});

test('section movement and scaling stay on canvas and clear of attribution in all formats',()=>{
 for(const height of [1080,1350,1920])for(const ai of [false,...height===1920?[true]:[]])for(const layout of reelLayouts)for(const section of ['header','content'])for(const x of [0,50,100])for(const y of [-20,0,20])for(const scale of [65,100]){
  const config={ai:ai?{}:undefined,visuals:{design:normalizeDesign({layout:layout.id,positions:{[section]:{x,y,scale}}})}};
  const t=sectionTransform(config,section,1080,height);
  assert.ok(t.x>=31.99&&t.y>=31.99);assert.ok(t.x+t.base.w*t.scale<=1048.01);assert.ok(t.y+t.base.h*t.scale<=t.footerTop+.01);
 }
});

function recorder(){
 const drawn=[],stack=[];
 const ctx=new Proxy({font:'24px Arial',fillStyle:'#000000',globalAlpha:1,textAlign:'left',save(){stack.push({font:this.font,fillStyle:this.fillStyle,globalAlpha:this.globalAlpha,textAlign:this.textAlign});},restore(){Object.assign(this,stack.pop());},measureText(t){return {width:String(t).length*(parseFloat(this.font.match(/[\d.]+px/)?.[0])||24)*.5};},fillText(t,x,y){drawn.push({text:String(t),font:this.font,color:this.fillStyle,x,y});}}, {get:(o,k)=>k in o?o[k]:(...args)=>{for(const v of args)if(typeof v==='number')assert.ok(Number.isFinite(v));}});
 return {drawn,canvas:{width:1080,height:1920,getContext:()=>ctx},stack};
}
const base={title:'Title',subtitle:'Subtitle',source:'Source',fontId:'arial',series:[{name:'Series',points:[{x:2020,y:10},{x:2021,y:20}]}]};
const rows=[{id:'a',modelId:'a',model:'Model A',date:'2020-01-01',score:10},{id:'b',modelId:'b',model:'Model B',date:'2021-01-01',score:20}];
const benchmark={id:'eci',name:'Benchmark',unit:'pts',source:'Source',retrievedAt:'2026-01-01',baseline:{name:'Human',score:12,note:'Reference'}};
test('line, area and column legends smoothly swap complete rows and remain repeatable on seek',()=>{
 const series=[{name:'Alpha',color:'#ff0000',customColor:true,points:[{x:0,y:20},{x:1,y:5},{x:2,y:4}]},{name:'Beta',color:'#0000ff',customColor:true,points:[{x:0,y:10},{x:1,y:30},{x:2,y:40}]}];
 const original=structuredClone(series);
 for(const chart of ['line','area','bar']){
  const positions=(p,time=p*10.8)=>{const {canvas,drawn}=recorder();drawReel(canvas,{...base,series,chart,duration:12},p,time);return ['Alpha','Beta'].map(name=>drawn.find(t=>t.text===name).y);};
  const start=positions(0),boundary=positions(.5),mid=positions(.53),end=positions(1,12);
  assert.ok(start[0]<start[1]);assert.deepEqual(boundary,start,'new measurement starts at the preceding positions');
  assert.ok(end[0]>end[1]);
  assert.ok(mid[0]>start[0]&&mid[0]<end[0]);assert.ok(mid[1]<start[1]&&mid[1]>end[1]);
  assert.deepEqual(positions(.53),mid,'backwards seeking matches export at the same timestamp');
 }
 assert.deepEqual(series,original,'sorting does not reorder data or change series colours');
});
test('shared PNG/video renderer applies independent text styles in series and AI presentations',()=>{
 const visuals={design:normalizeDesign({theme:'light',text:{title:{size:70,color:'#123456'},values:{size:140,color:'#654321'},signature:{size:120,color:'#234567'}}})};
 const configs=['line','bar','area','ranking','cards'].map(chart=>({...base,chart,visuals})).concat(['timeline','records','ranking','scatter','duel'].map(mode=>({...base,visuals,ai:{rows,benchmark,mode,basis:'release'}})));
 for(const config of configs){const {canvas,drawn,stack}=recorder();drawReel(canvas,config,1,20);
  assert.ok(drawn.some(t=>t.text==='Title'&&t.color==='#123456'));
  assert.ok(drawn.some(t=>t.text==='Jakub Bilski'&&t.color==='#234567'&&t.font.includes('33.6px')));
  if(config.ai?.mode!=='scatter')assert.ok(drawn.some(t=>t.color==='#654321'),config.chart||config.ai.mode);
  assert.equal(stack.length,0,'canvas transformations are balanced');
 }
});
test('larger title settings change real rendered font size and bad saved settings fall back',()=>{
 const size=scale=>{const {canvas,drawn}=recorder();drawReel(canvas,{...base,visuals:{design:normalizeDesign({text:{title:{size:scale}}})}});return parseFloat(drawn.find(t=>t.text==='Title').font.match(/[\d.]+px/)[0]);};
 assert.ok(size(130)>size(70));
 const d=normalizeDesign({theme:'missing',layout:'missing',text:{title:{size:999,color:'bad'}},positions:{header:{scale:-10,y:100}}});
 assert.equal(d.theme,'dark');assert.equal(d.layout,'classic');assert.equal(d.text.title.size,140);assert.equal(d.text.title.color,null);assert.equal(d.positions.header.scale,65);assert.equal(d.positions.header.y,20);
});
