import test from 'node:test';
import assert from 'node:assert/strict';
import {buildTypingPlan,typingAt,typingGraphemes,typingStages,typingRoles,typingStyles,renderTypingFrame,typingRole} from '../src/reel-typing.js';
import {motionPreset,normalizeMotion} from '../src/reel-motion.js';
import {normalizeDesign} from '../src/reel-design.js';
import {localizeReelConfig,subtitleText} from '../src/reel-language.js';
import {drawReel} from '../src/render.js';

test('every typing style has only one active text run and completes before data starts',()=>{
 const items=typingRoles.flatMap(([role])=>['Zażółć gęślą.','A 👨‍👩‍👧‍👦 é'].map(text=>({role,text})));
 for(const [style] of typingStyles)for(const start of [.2,.46,.56,.6]){
  const plan=buildTypingPlan(items,start,style);
  for(let f=0;f<=1;f+=1/1800)assert.ok(plan.entries.filter(e=>typingAt(e,f).active).length<=1,`${style}: ${f}`);
  for(const [i,e] of plan.entries.entries()){
   assert.equal(typingAt(e,e.start-1e-5).count,0);
   assert.equal(typingAt(e,e.start+e.duration+1e-5).count,e.chars.length);
   assert.ok(e.start+e.duration<start);if(i)assert.ok(e.start>=plan.entries[i-1].start+plan.entries[i-1].duration);
  }
 }
 assert.deepEqual(typingGraphemes('A👨‍👩‍👧‍👦é'),['A','👨‍👩‍👧‍👦','é']);
 const plans=typingStyles.map(([style])=>buildTypingPlan([{role:'title',text:'Hello, world!'}],.56,style).entries[0].beats);
 assert.equal(new Set(plans.map(JSON.stringify)).size,4);
});

test('old typewriter drafts migrate to sequential text and custom cursor settings persist',()=>{
 const legacy=normalizeMotion({enabled:true,preset:'typewriter',chartStart:.29});
 assert.equal(legacy.typing.enabled,true);assert.equal(legacy.chartStart,.56);
 for(const id of ['typewriter','typing-natural','typing-terminal','typing-retro']){
  const m=motionPreset(id);assert.deepEqual(normalizeMotion(JSON.parse(JSON.stringify(m))),m);
  const custom=normalizeMotion({...m,preset:'custom',chartStart:.4,typing:{...m.typing,cursor:'none',blink:false}});
  assert.equal(custom.typing.cursor,'none');assert.equal(custom.typing.blink,false);assert.equal(custom.chartStart,.4);
 }
 assert.equal(normalizeMotion({}).typing.enabled,false);
 assert.equal(normalizeMotion({typing:{enabled:true,style:'invalid',cursor:'invalid'},chartStart:Infinity}).chartStart,.56);
});

function recorder(){
 const log=[],stack=[],ctx={font:'30px Arial',fillStyle:'#123456',globalAlpha:1,textAlign:'left',shadowBlur:0,shadowOffsetX:0,shadowOffsetY:0,
  save(){stack.push({font:this.font,fillStyle:this.fillStyle,globalAlpha:this.globalAlpha,textAlign:this.textAlign,shadowBlur:this.shadowBlur,shadowOffsetX:this.shadowOffsetX,shadowOffsetY:this.shadowOffsetY});},restore(){Object.assign(this,stack.pop());},
  measureText:s=>({width:typingGraphemes(s).length*15,actualBoundingBoxAscent:24,actualBoundingBoxDescent:6}),
  getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),
  fillText(...args){log.push({type:'fill',args,font:this.font});},strokeText(...args){log.push({type:'stroke',args});},
  fillRect(...args){log.push({type:'rect',args});},translate(...args){log.push({type:'translate',args});},scale(){},
 };
 const proxy=new Proxy(ctx,{get:(o,k)=>k in o?o[k]:()=>{}}),canvas={width:1080,height:1920,getContext:()=>proxy};ctx.canvas=canvas;
 return {canvas,ctx:proxy,log,stack};
}

test('all raw Canvas text, wrapped lines, strokes and cursors share a deterministic sequence',()=>{
 const {canvas,ctx,log,stack}=recorder(),motion=motionPreset('typewriter');motion.typing.blink=false;
 const config={duration:20,visuals:{design:normalizeDesign({motion})}},original=ctx.fillText;
 const items=[['title','Zażółć 👨‍👩‍👧‍👦'],['title','Next line'],['subtitle','Opis (%)'],['content','Axis 1'],['content','Legend'],['source','Source'],['signature','Jakub']];
 const render=()=>{log.length=0;for(const [role,text] of items){const end=typingRole(ctx,role);ctx.textAlign='right';ctx.strokeText(text,800,200,300);ctx.fillText(text,800,200,300);end();}};
 function frame(f){log.length=0;assert.equal(renderTypingFrame(canvas,config,0,f*20,render),true);assert.equal(ctx.fillText,original);assert.equal(stack.length,0);return structuredClone(log);}
 assert.equal(frame(0).filter(e=>e.type==='fill').length,0);
 const mid=frame(.04),visible=mid.filter(e=>e.type==='fill').map(e=>e.args[0]);
 assert.equal(visible.length,1);assert.ok('Zażółć 👨‍👩‍👧‍👦'.startsWith(visible[0]));assert.ok(mid.some(e=>e.type==='rect'),'cursor exists');
 assert.deepEqual(mid.filter(e=>e.type==='stroke').map(e=>e.args[0]),visible);
 assert.ok(mid.some(e=>e.type==='translate'&&e.args[0]===680),'partial right-aligned text retains its full-text left edge');
 frame(.4);assert.deepEqual(frame(.04),mid,'backward seek is identical');
 const sourceStage=typingStages(motion.chartStart).source;
 const beforeSource=frame(sourceStage.start-1e-4).filter(e=>e.type==='fill').map(e=>e.args[0]);
 assert.ok(beforeSource.includes('Legend'));assert.ok(!beforeSource.includes('Source'));assert.ok(!beforeSource.includes('Jakub'));
 const end=frame(.535).filter(e=>e.type==='fill').map(e=>e.args[0]);assert.ok(end.includes('Source'));
 assert.equal(renderTypingFrame(canvas,{...config,editorPreview:true},0,0,render),false);
 assert.equal(renderTypingFrame(canvas,config,1,20,render),false);
});

test('subtitle units use explicit metadata and remain bilingual without rewriting custom text',()=>{
 assert.equal(subtitleText([{text:'Internet'},{text:'% populacji',unit:true}]),'Internet (% populacji)');
 assert.equal(subtitleText([{text:'Internet'},{text:'',unit:true}]),'Internet');
 const cfg={subtitleParts:[{text:'Osoby korzystające z internetu'},{text:'% populacji',unit:true}],series:[]};
 assert.equal(localizeReelConfig(cfg,'en').subtitle,'People using the internet (% of population)');
 assert.equal(localizeReelConfig({...cfg,subtitleParts:[{text:'My · label',custom:true},{text:'my unit',unit:true,custom:true}]},'en').subtitle,'My · label (my unit)');
 const custom='Do not · rewrite this caption';assert.equal(localizeReelConfig({subtitle:custom,subtitleIsCustom:true},'en').subtitle,custom);
 const {canvas,log}=recorder();drawReel(canvas,{title:'Title',subtitle:'Internet (%)',series:[{name:'A',points:[{x:2020,y:1},{x:2021,y:2}]}]},1,12);
 assert.ok(log.some(e=>e.type==='fill'&&e.args[0]==='Internet (%)'&&e.font==='400 38px Arial, Helvetica, sans-serif'));
});
