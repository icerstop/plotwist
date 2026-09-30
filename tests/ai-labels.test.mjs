import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {aiIdentity,layoutAiIdentity,aiRankingLayout} from '../src/ai-labels.js';
import {normalizeDesign} from '../src/reel-design.js';
import {normalizeChart} from '../src/chart-appearance.js';
import {aiEvents} from '../src/presentation.js';
import {selectAiRows} from '../src/ai.js';
import {drawAiReel} from '../src/ai-render.js';
import {captureTheme,exportTheme,importTheme,applySavedTheme} from '../src/custom-themes.js';

const model='Claude Opus 5.5 (Adaptive Reasoning, Max Effort, Default Fallback)';
function canvasRecorder(){
 const text=[],stack=[],ctx={canvas:{width:1080,height:1920},font:'24px Arial',fillStyle:'#000',textAlign:'left',globalAlpha:1,
  measureText(t){return {width:String(t).length*(Number(this.font.match(/([\d.]+)px/)?.[1])||24)*.52};},
  save(){stack.push({font:this.font,fillStyle:this.fillStyle,textAlign:this.textAlign,globalAlpha:this.globalAlpha});},restore(){Object.assign(this,stack.pop());},
  fillText(value,x,y){if(this.globalAlpha>0)text.push({value:String(value),x,y,font:this.font});},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})};
 const proxy=new Proxy(ctx,{get:(o,k)=>k in o?o[k]:()=>{}}),canvas={width:1080,height:1920,getContext:()=>proxy};ctx.canvas=canvas;return {ctx:proxy,canvas,text};
}
const config=chart=>({fontId:'inter',visuals:{design:normalizeDesign({chart})}});
test('model identity separates complete settings, shortens effort, and keeps original source text',()=>{
 const row={model,effort:'max'};assert.deepEqual(aiIdentity(row),{name:'Claude Opus 5.5',details:'Adaptive Reasoning, Max, Default Fallback',source:model});assert.equal(row.model,model);
 for(const effort of ['Max','High','Xhigh','Medium','Low'])assert.equal(aiIdentity({model:`Model (${effort} Effort)`}).details,effort);
 assert.deepEqual(aiIdentity({model:'Model (context (32K)) (High Effort)',effort:'high'}),{name:'Model',details:'context (32K) · High',source:'Model (context (32K)) (High Effort)'});
 assert.equal(aiIdentity({model:'Model (unfinished'}).name,'Model (unfinished');
 assert.equal(aiIdentity({model:'Model (Xhigh)',effort:'high'}).details,'Xhigh · High');
 assert.equal(aiIdentity({model:'Model',modelId:'model_32K',harness:'Standard'}).details,'32K · Harness: Standard');
});
test('long settings wrap without losing configuration words, even with a previous one-line label limit',()=>{
 const {ctx}=canvasRecorder(),c=config();c.visuals.design.text.labels.maxLines=1;
 const row={model,effort:'max'},layout=layoutAiIdentity(ctx,c,row,{width:230,nameWidth:200});
 assert.ok(layout.blocks.flatMap(b=>b.lines).length>3);assert.equal(layout.blocks[1].lines.join(' '),'Adaptive Reasoning, Max, Default Fallback');
 for(const b of layout.blocks){ctx.font=b.font;assert.ok(b.lines.every(l=>ctx.measureText(l).width<=b.width));}
 c.visuals.design.chart.aiLabelStyle='source';assert.equal(layoutAiIdentity(ctx,c,row,{width:230}).blocks.flatMap(b=>b.lines).join(' '),model);
});
test('ranking reserves dates and bars, adapts row count, stays fixed during seeking, and invalidates font/bar settings',()=>{
 const {ctx}=canvasRecorder(),c=config(),rows=Array.from({length:6},(_,i)=>({id:String(i),modelId:String(i),model:'Model '+i,date:'2026-01-01',score:100-i})),frames=aiEvents(rows);
 const short=aiRankingLayout(ctx,c,frames);assert.equal(short.count,6);
 const long=aiRankingLayout(ctx,c,aiEvents(rows.map(r=>({...r,model:`Long model ${r.model} (Adaptive Reasoning, Max Effort, Default Fallback, extended token budget, official agent framework)`}))));assert.ok(long.count<short.count);assert.ok(long.count*long.stride<=814+.001);
 assert.equal(aiRankingLayout(ctx,c,frames),short);
 c.visuals.design.chart.barWidth=95;assert.notEqual(aiRankingLayout(ctx,c,frames).barHeight,short.barHeight);
 c.visuals.design.chart.aiRankCount=3;assert.equal(aiRankingLayout(ctx,c,frames).count,3);
 c.visuals.design.text.labels.size=140;assert.ok(aiRankingLayout(ctx,c,frames).labelHeight>short.labelHeight);
});
test('real AA ranking distinguishes Max, Xhigh and High, keeps exact scores, and has no truncated model rows',()=>{
 const data=JSON.parse(fs.readFileSync('public/ai/aa-index-v432.json','utf8')),rows=selectAiRows(data.rows,{basis:'release'}),{canvas,text}=canvasRecorder();
 const c={...config(),duration:12,ai:{rows,benchmark:data,basis:'release',mode:'ranking'}};drawAiReel(canvas,c,1,12);
 const labels=text.filter(t=>t.y>=802&&t.y<1620).map(t=>t.value);assert.ok(labels.some(t=>/Adaptive Reasoning, Max, Default Fallback/.test(t)));assert.ok(labels.some(t=>/Adaptive Reasoning, Xhigh, Default Fallback/.test(t)));assert.ok(labels.some(t=>/Adaptive Reasoning, High, Default Fallback/.test(t)));
 assert.ok(labels.every(t=>!t.includes('…')&&!t.includes('Effort')));assert.ok(labels.includes('57,6'));
 const snapshot=JSON.stringify(text);text.length=0;drawAiReel(canvas,c,0,0);assert.ok(!text.some(t=>t.value==='Claude Opus 5.5'));text.length=0;drawAiReel(canvas,c,1,12);assert.equal(JSON.stringify(text),snapshot);
});
test('AI label preferences are validated and survive portable custom themes',async()=>{
 assert.equal(normalizeChart().aiLabelStyle,'structured');assert.equal(normalizeChart({aiRankCount:99,aiLabelStyle:'bad'}).aiRankCount,6);assert.equal(normalizeChart({aiRankCount:-1}).aiRankCount,2);
 const visuals={fontId:'inter',design:normalizeDesign({chart:{aiLabelStyle:'source',aiRankCount:3}}),background:{type:'theme'},logo:{type:'none'},stickers:[]};
 const theme=await importTheme(new File([await exportTheme(captureTheme({name:'AI labels',visuals}))],'theme.json'));
 const restored=applySavedTheme({...visuals,title:'Keep data'},theme);assert.equal(restored.title,'Keep data');assert.equal(restored.design.chart.aiRankCount,3);assert.equal(restored.design.chart.aiLabelStyle,'source');
});
