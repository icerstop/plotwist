import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDesign} from '../src/reel-design.js';
import {reelPresets,applyReelPreset} from '../src/reel-presets.js';
import {normalizeChart,axisTicks,plotSides,seriesColor,lineAppearance,plotGrid} from '../src/chart-appearance.js';
import {textLines,textLayout,paintText} from '../src/reel-text.js';
import {drawReel} from '../src/render.js';
import {aiBrands,annotateAiBrands} from '../src/ai-brands.js';
import {buildAiBrandHistory} from '../src/ai-brand-history.js';

function recorder(){
 const log=[],stack=[],state={font:'20px Arial',textAlign:'left',globalAlpha:1,fillStyle:'#000',strokeStyle:'#000',shadowBlur:0,shadowOffsetX:0,shadowOffsetY:0,lineWidth:1};
 const ctx=new Proxy({canvas:{width:1080,height:1920},...state,measureText:t=>({width:String(t).length*10}),getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),save(){stack.push(Object.fromEntries(Object.keys(state).map(k=>[k,this[k]])));},restore(){assert.ok(stack.length);Object.assign(this,stack.pop());},createLinearGradient(){return {addColorStop(){}};}},{get:(o,k)=>k in o?o[k]:(...args)=>{args.forEach(n=>{if(typeof n==='number')assert.ok(Number.isFinite(n),`${String(k)}: ${args}`);});log.push({op:k,args,alpha:o.globalAlpha,shadow:o.shadowBlur,color:o.fillStyle,width:o.lineWidth});}});
 return {ctx,log,stack};
}
test('old drafts retain chart defaults and new settings clamp and round-trip safely',()=>{
 const old=normalizeDesign({theme:'paper',text:{title:{color:'#112233'}}});assert.deepEqual(old.chart,normalizeChart());assert.equal(old.text.title.shadow,'none');assert.equal(old.text.title.wrap,'auto');
 const normalized=normalizeDesign({chart:{lineWidth:999,ticks:1,xTicks:99,width:NaN,palette:'invalid'},text:{title:{width:3,lineHeight:9,shadow:'invalid',boxColor:'red',maxLines:100}}});
 assert.equal(normalized.chart.lineWidth,18);assert.equal(normalized.chart.ticks,3);assert.equal(normalized.chart.xTicks,8);assert.equal(normalized.chart.width,100);assert.equal(normalized.chart.palette,'original');assert.equal(normalized.text.title.width,45);assert.equal(normalized.text.title.lineHeight,1.65);assert.equal(normalized.text.title.maxLines,6);assert.equal(normalized.text.title.boxColor,null);
 assert.deepEqual(normalizeDesign(JSON.parse(JSON.stringify(normalized))),normalized);
});
test('design presets change appearance without changing data, media, captions or language',()=>{
 const visuals={fontId:'arial',logo:{type:'custom',assetId:'logo'},stickers:[{assetId:'gif'}],background:{type:'image',assetId:'photo'},design:normalizeDesign({metricLabels:{key:{pl:'Wskaźnik',en:'Metric'}},legendMode:'full'})};
 const frozen=structuredClone(visuals);
 for(const p of reelPresets){const next=applyReelPreset(visuals,p.id);assert.equal(next.design.preset,p.id);assert.equal(next.design.theme,p.theme);assert.deepEqual(next.stickers,visuals.stickers);assert.deepEqual(next.logo,visuals.logo);assert.equal(next.background.assetId,'photo');assert.deepEqual(next.design.metricLabels,visuals.design.metricLabels);assert.equal(next.design.legendMode,'full');assert.deepEqual(visuals,frozen);}
 assert.equal(applyReelPreset(visuals,'unknown'),visuals);
});
test('wrapping preserves manual breaks, splits long words and never stretches a truncated line',()=>{
 const {ctx}=recorder();assert.deepEqual(textLines(ctx,'Alpha\nBeta gamma',100),['Alpha','Beta gamma']);assert.deepEqual(textLines(ctx,'abcdefghijkl',40),['abcd','efgh','ijkl']);assert.deepEqual(textLines(ctx,'One\n\nTwo',100),['One','','Two']);
 const config={visuals:{design:normalizeDesign({text:{title:{wrap:'manual',width:50,lineHeight:1.5,maxLines:2,align:'center'}}})}};
 const l=textLayout(ctx,'First\nToo much text\nLast',10,30,200,20,3,config,'title');assert.equal(l.height,60);assert.equal(l.x,110);assert.equal(l.width,100);assert.equal(l.lines.length,2);assert.ok(l.lines[1].endsWith('…'));assert.ok(ctx.measureText(l.lines[1]).width<=l.width);
 ctx.textAlign='right';const axis=textLayout(ctx,'100',120,30,100,20,1,{},'labels');assert.equal(axis.x,120,'right aligned axis labels retain their existing anchor');
});
test('text effects and plot effects restore state and do not bleed onto other elements',()=>{
 const {ctx,log,stack}=recorder(),config={visuals:{design:normalizeDesign({chart:{glow:20,lineWidth:12,opacity:50,grid:'both'},text:{title:{shadow:'soft',shadowBlur:25,opacity:50,strokeWidth:3,strokeColor:'#ff0000',boxColor:'#ffffff'}}})}};
 paintText(ctx,config,'title',['One','Two'],0,50,25,200);assert.ok(log.some(l=>l.op==='strokeText'));assert.ok(log.filter(l=>l.op==='fillText').every(l=>l.alpha===.5&&l.shadow===25));assert.equal(ctx.globalAlpha,1);assert.equal(ctx.shadowBlur,0);assert.equal(ctx.lineWidth,1);
 ctx.save();lineAppearance(ctx,config,'#112233');assert.equal(ctx.lineWidth,12);assert.equal(ctx.globalAlpha,.5);ctx.restore();plotGrid(ctx,config,{left:50,right:900,top:200,bottom:1200,ys:[200,700,1200],color:'#ddd',panel:'#fff'});assert.equal(ctx.shadowBlur,0);assert.equal(ctx.globalAlpha,1);assert.equal(stack.length,0);
});
test('plot width and logarithmic ticks preserve coordinates and palette selection is reversible',()=>{
 const config={visuals:{design:normalizeDesign({theme:'light',chart:{width:60,ticks:4,palette:'electric'}})}};
 assert.deepEqual(plotSides(config,100,900),[260,740]);const ticks=axisTicks(config,{min:1,max:1000},true);assert.deepEqual(ticks,[1,10,100,1000]);assert.equal(axisTicks(config,{min:0,max:100},false,30,25).length,2);
 assert.notEqual(seriesColor(config,0,'#abcdef'),'#abcdef');config.visuals.design.chart.palette='original';assert.equal(seriesColor(config,0,'#abcdef'),'#abcdef');
});
test('every design renders all standard chart types and formats with finite geometry and balanced state',()=>{
 const base={title:'Our history\nOur future',subtitle:'Historical observations',source:'Public source',fontId:'arial',series:[{name:'A',points:[{x:2020,y:1},{x:2021,y:3}]},{name:'B',points:[{x:2020,y:3},{x:2021,y:2}]}]};
 for(const p of reelPresets)for(const chart of ['line','area','bar','ranking','cards'])for(const format of ['9:16','4:5','1:1']){
  const {ctx,stack}=recorder(),canvas={width:1080,height:1920,getContext:()=>ctx};ctx.canvas=canvas;
  drawReel(canvas,{...base,format,chart,visuals:applyReelPreset({design:normalizeDesign(),background:{},stickers:[]},p.id)},.6,5);assert.equal(stack.length,0,`${p.id},${chart},${format}`);
 }
});
test('AI modes honor styled lines and every preset without changing historical scores',()=>{
 const rows=annotateAiBrands([{id:'a',modelId:'a',model:'GPT Alpha',organization:'OpenAI',date:'2024-01-01',score:40},{id:'b',modelId:'b',model:'Claude Beta',organization:'Anthropic',date:'2024-03-01',score:60},{id:'c',modelId:'c',model:'GPT Gamma',organization:'OpenAI',date:'2025-01-01',score:80}]);
 const brands=aiBrands.filter(b=>['openai','anthropic'].includes(b.id)),history=buildAiBrandHistory(rows,{brandIds:brands.map(b=>b.id)}),original=JSON.stringify(rows);
 const benchmark={id:'test',name:'Test',unit:'pts',source:'Source',retrievedAt:'2026-09-30',baseline:{name:'Human',score:50,note:'Test baseline'}};
 for(const preset of reelPresets)for(const groupBy of ['model','brand'])for(const mode of groupBy==='brand'?['records','ranking','timeline']:['records','scatter','timeline','ranking','duel']){
  const {ctx,stack,log}=recorder(),canvas={width:1080,height:1920,getContext:()=>ctx};ctx.canvas=canvas;
  const visuals=applyReelPreset({design:normalizeDesign(),background:{},stickers:[]},preset.id);visuals.design.chart.lineWidth=15;visuals.design.chart.glow=20;
  drawReel(canvas,{title:'AI history',fontId:visuals.fontId,visuals,duration:12,ai:{rows,brands,history,groupBy,mode,benchmark,showBrandLogos:false}},1,12);
  assert.equal(stack.length,0);assert.equal(JSON.stringify(rows),original);
  if(mode==='records')assert.ok(log.some(e=>e.op==='stroke'&&e.width===15&&e.shadow===20),`${preset.id}, ${groupBy}`);
 }
});
