import test from 'node:test';
import assert from 'node:assert/strict';
import {fontWeights,normalizeFontWeight} from '../src/reel-fonts.js';
import {normalizeDesign,textWeight,reelTextFont} from '../src/reel-design.js';
import {captureTheme,exportTheme,importTheme,applySavedTheme} from '../src/custom-themes.js';
import {drawReel} from '../src/render.js';
import {annotateAiBrands,aiBrands} from '../src/ai-brands.js';
import {buildAiBrandHistory} from '../src/ai-brand-history.js';

test('weight choices use bundled ranges and faces, migrate old bold/normal, and preserve unsupported intent',()=>{
 assert.deepEqual(fontWeights('inter'),[100,200,300,400,500,600,700,800,900]);assert.deepEqual(fontWeights('libre-baskerville'),[400,500,600,700]);assert.deepEqual(fontWeights('barlowcondensed'),[400,700]);assert.deepEqual(fontWeights('anton'),[400]);assert.deepEqual(fontWeights('arial'),[400,700]);
 const d=normalizeDesign({fontWeight:'600',text:{title:{weight:'normal'},date:{weight:'bold'},values:{weight:900}}});assert.equal(d.text.title.weight,400);assert.equal(d.text.date.weight,700);assert.equal(d.fontWeight,600);
 for(const invalid of [null,'',true,'light',0,1200,Infinity])assert.equal(normalizeFontWeight(invalid),'auto');
 const config={fontId:'libre-baskerville',visuals:{design:d}};assert.equal(textWeight(config,'values'),700);assert.equal(d.text.values.weight,900);assert.equal(textWeight({...config,fontId:'inter'},'values'),900);assert.equal(textWeight(config,'title','bold'),400);assert.equal(textWeight(config,'subtitle'),600);assert.equal(reelTextFont(config,'subtitle',38),'600 38px "Libre Baskerville", Georgia, serif');
 const legacy={fontId:'inter',visuals:{design:normalizeDesign()}};assert.equal(textWeight(legacy,'title','bold'),700);assert.equal(textWeight(legacy,'subtitle'),400);
});

test('weights persist through custom theme capture, portable file, and application without changing content',async()=>{
 const visuals={fontId:'inter',design:normalizeDesign({fontWeight:300,text:{title:{weight:900},signature:{weight:500}}}),background:{type:'theme'},logo:{type:'none'},stickers:[]};
 const theme=captureTheme({name:'Typography',visuals});const imported=await importTheme(new File([await exportTheme(theme)],'theme.json'));const applied=applySavedTheme({...visuals,title:'Keep this title',design:normalizeDesign()},imported);
 assert.equal(applied.design.fontWeight,300);assert.equal(applied.design.text.title.weight,900);assert.equal(applied.design.text.signature.weight,500);assert.equal(applied.title,'Keep this title');
});

function recorder(){
 const drawn=[],stack=[],state={font:'20px Arial',textAlign:'left',globalAlpha:1,fillStyle:'#000',strokeStyle:'#000',lineWidth:1};
 const ctx=new Proxy({...state,canvas:{width:1080,height:1920},measureText:t=>({width:String(t).length*10}),getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),save(){stack.push(Object.fromEntries(Object.keys(state).map(k=>[k,this[k]])));},restore(){Object.assign(this,stack.pop());},fillText(text){drawn.push({text:String(text),font:this.font});},createLinearGradient(){return {addColorStop(){}};}},{get:(o,k)=>k in o?o[k]:()=>{}});
 const canvas={width:1080,height:1920,getContext:()=>ctx};ctx.canvas=canvas;return {drawn,canvas};
}
test('all standard charts draw titles, legend, fitted cards, axes and signature using the selected weight',()=>{
 for(const chart of ['line','area','bar','ranking','cards']){
  const {drawn,canvas}=recorder(),config={title:'Title',subtitle:'Subtitle',source:'Source',fontId:'inter',format:'9:16',chart,series:[{name:'First',points:[{x:2020,y:20},{x:2025,y:40}]}],visuals:{design:normalizeDesign({fontWeight:600}),background:{},logo:{type:'monogram'},stickers:[]}};
  drawReel(canvas,config,1,12);assert.ok(drawn.length>8);assert.ok(drawn.every(x=>x.font.startsWith('600 ')),JSON.stringify({chart,wrong:drawn.filter(x=>!x.font.startsWith('600 '))}));
  config.visuals.design.text.title.weight=900;config.visuals.design.text.signature.weight=300;drawn.length=0;drawReel(canvas,config,1,12);assert.ok(drawn.find(x=>x.text==='Title').font.startsWith('900 '));assert.ok(drawn.find(x=>x.text==='Jakub Bilski').font.startsWith('300 '));
 }
});
test('AI model and brand modes use the same weight in big scores, leader names and axes',()=>{
 const rows=annotateAiBrands([{id:'a',modelId:'a',model:'GPT Alpha',organization:'OpenAI',date:'2024-01-01',score:40},{id:'b',modelId:'b',model:'Claude Beta',organization:'Anthropic',date:'2024-03-01',score:60},{id:'c',modelId:'c',model:'GPT Gamma',organization:'OpenAI',date:'2025-01-01',score:80}]);
 const brands=aiBrands.filter(b=>['openai','anthropic'].includes(b.id)),history=buildAiBrandHistory(rows,{brandIds:brands.map(b=>b.id)}),benchmark={id:'test',name:'Test',unit:'pts',source:'Source',retrievedAt:'2026-09-30',baseline:{name:'Human',score:50,note:'Baseline'}};
 for(const groupBy of ['model','brand'])for(const mode of groupBy==='brand'?['records','ranking','timeline']:['records','scatter','timeline','ranking','duel']){
  const {drawn,canvas}=recorder();drawReel(canvas,{title:'AI history',fontId:'inter',duration:12,visuals:{design:normalizeDesign({fontWeight:600}),background:{},stickers:[]},ai:{rows,brands,history,groupBy,mode,benchmark,showBrandLogos:false}},1,12);
  assert.ok(drawn.length>8);assert.ok(drawn.every(x=>x.font.startsWith('600 ')),JSON.stringify({groupBy,mode,wrong:drawn.filter(x=>!x.font.startsWith('600 '))}));
 }
});
