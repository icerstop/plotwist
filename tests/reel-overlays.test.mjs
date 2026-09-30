import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeOverlays,normalizeHidden,newOverlay,overlayLimit,reorderOverlay} from '../src/reel-overlays.js';
import {drawReel} from '../src/render.js';
import {reelElements,resetElements,beginElement} from '../src/reel-elements.js';
import {normalizeDesign} from '../src/reel-design.js';
import {motionPreset,normalizeMotion} from '../src/reel-motion.js';
import {configFontIds} from '../src/reel-style.js';
import {captureTheme,applySavedTheme} from '../src/custom-themes.js';

function recorder(){
 const log=[],stack=[],keys=['font','globalAlpha','fillStyle','textAlign','textBaseline','shadowBlur','lineWidth','clipped'];
 const ctx=new Proxy({font:'30px Arial',globalAlpha:1,textAlign:'left',clipped:false,fillStyle:'#000',getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),measureText:s=>({width:String(s).length*16}),save(){stack.push(Object.fromEntries(keys.map(k=>[k,this[k]])));},restore(){assert.ok(stack.length);Object.assign(this,stack.pop());},rect(x,y,w,h){this.emptyRect=w===0&&h===0;},clip(){this.clipped ||= this.emptyRect;},beginPath(){this.emptyRect=false;}},{get:(o,k)=>k in o?o[k]:(...args)=>{args.forEach(n=>{if(typeof n==='number')assert.ok(Number.isFinite(n),`${String(k)} ${args}`);});log.push({op:k,args,visible:o.globalAlpha>0&&!o.clipped});}});
 const canvas={width:1080,height:1920,getContext:()=>ctx};ctx.canvas=canvas;return {canvas,ctx,log,stack};
}
const config=()=>({duration:12,language:'pl',fontId:'arial',title:'Title to hide',subtitle:'Subtitle to hide',source:'Source to hide',series:[{name:'Series',points:[{x:2020,y:10},{x:2025,y:20}]}],visuals:{background:{type:'theme',pattern:'none',veil:0},hidden:{},overlays:normalizeOverlays([{id:'back',kind:'text',layer:'behind',text:{pl:'Behind chart',en:'English behind'}},{id:'front',kind:'text',fontId:'georgia',text:{pl:'Front text',en:'English front'}}]),design:normalizeDesign()}});
const visibleText=log=>log.filter(e=>e.op==='fillText'&&e.visible).map(e=>String(e.args[0]));

test('overlay drafts reject corrupt IDs, bound geometry, deduplicate and preserve old projects',()=>{
 assert.deepEqual(normalizeOverlays(null),[]);assert.deepEqual(normalizeHidden({title:true,date:false,bogus:true}),{title:true});
 const raw=[{id:'bad:',kind:'text'},{id:'a',kind:'text',x:Infinity,width:999,rotation:-999,text:{pl:'a'.repeat(2000)},fontId:'missing'},{id:'a',kind:'arrow'},{id:'b',kind:'bogus'},...Array.from({length:30},(_,i)=>({id:'valid'+i,kind:'ellipse'}))],result=normalizeOverlays(raw);
 assert.equal(result.length,overlayLimit);assert.equal(result[0].x,50);assert.equal(result[0].width,100);assert.equal(result[0].rotation,-180);assert.equal(result[0].text.pl.length,1500);assert.equal(result[0].fontId,null);assert.deepEqual(normalizeOverlays(JSON.parse(JSON.stringify(result))),result);
 assert.notEqual(newOverlay('text').id,newOverlay('text').id);
 const list=normalizeOverlays([{id:'a',kind:'text'},{id:'b',kind:'text',layer:'behind'},{id:'c',kind:'text'}]);assert.deepEqual(reorderOverlay(list,'c',-1).map(o=>o.id),['c','b','a']);assert.equal(reorderOverlay(list,'b',1),list);
});

test('hidden elements suppress nested drawing and hit targets even if inner paint resets alpha',()=>{
 const {ctx,canvas,log}=recorder();resetElements(canvas);const c=config();c.visuals.hidden={content:true};const rect={x:0,y:0,w:100,h:100};
 const outer=beginElement(ctx,c,'content',rect);ctx.globalAlpha=1;const inner=beginElement(ctx,c,'metric',rect);ctx.fillText('hidden',0,0);inner();outer();ctx.fillText('visible',0,0);
 assert.deepEqual(reelElements(canvas),[]);assert.deepEqual(visibleText(log),['visible']);
});

test('shared regular and AI renderer respects removals, custom layers, languages and export fonts',()=>{
 const ai={rows:[{id:'m',modelId:'m',model:'Example model',date:'2025-01-01',score:60}],benchmark:{id:'test',name:'Test benchmark',unit:'pts',source:'Source to hide'},mode:'ranking',basis:'observed'};
 for(const variant of [{chart:'line'},{ai}]){
  const c={...config(),...variant},before=JSON.stringify(c),{canvas,log,stack}=recorder();drawReel(canvas,c,1,12);
  const texts=visibleText(log);assert.ok(texts.indexOf('Behind chart')<texts.indexOf('Title to hide'));assert.equal(texts.at(-1),'Front text');assert.ok(reelElements(canvas).some(r=>r.id==='overlay:front'));assert.equal(stack.length,0);assert.equal(JSON.stringify(c),before);
  c.visuals.hidden={title:true,subtitle:true,source:true,signature:true,content:true,date:true};log.length=0;drawReel(canvas,c,1,12);assert.deepEqual(visibleText(log),['Behind chart','Front text']);assert.ok(reelElements(canvas).every(r=>r.id.startsWith('overlay:')));
  c.language='en';log.length=0;drawReel(canvas,c,1,12);assert.deepEqual(visibleText(log),['English behind','English front']);
  c.visuals.overlays[1].visible=false;assert.ok(!configFontIds(c).includes('georgia'));log.length=0;drawReel(canvas,c,1,12);assert.deepEqual(visibleText(log),['English behind']);
 }
});

test('new shapes are finite, mystery animation keeps overlays secret and seeking is deterministic',()=>{
 const c=config(),{canvas,log,stack}=recorder();c.visuals.overlays.push(...normalizeOverlays(['rectangle','ellipse','line','arrow'].map(kind=>({id:kind,kind,rotation:27,scale:75,fill:false,shadow:true}))));
 c.visuals.design=normalizeDesign({motion:motionPreset('mystery')});drawReel(canvas,c,0,0);assert.deepEqual([...new Set(visibleText(log))],['Title to hide']);
 log.length=0;drawReel(canvas,c,1,12);const final=structuredClone(log);assert.ok(visibleText(log).includes('Front text'));assert.ok(log.some(e=>e.op==='ellipse'&&e.visible));log.length=0;drawReel(canvas,c,.5,6);log.length=0;drawReel(canvas,c,1,12);assert.deepEqual(log,final);assert.equal(stack.length,0);
});

test('themes preserve reel composition without copying authored content or its motion tracks',()=>{
 const v=config().visuals;v.hidden={title:true};v.design.motion=normalizeMotion({tracks:{'overlay:front':{effect:'typewriter',start:0,duration:1}}});
 const theme=captureTheme({name:'Clean style',visuals:v,fontId:'arial'});assert.equal(theme.appearance.overlays,undefined);assert.equal(theme.appearance.hidden,undefined);assert.equal(theme.appearance.design.motion.tracks['overlay:front'],undefined);
 const applied=applySavedTheme(v,theme);assert.deepEqual(applied.overlays,v.overlays);assert.deepEqual(applied.hidden,v.hidden);assert.deepEqual(applied.design.motion.tracks['overlay:front'],v.design.motion.tracks['overlay:front']);
});
