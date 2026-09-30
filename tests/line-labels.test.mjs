import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {lineEndpoint,lineLabelGeometry,arrangeLineLabels,endpointLabelText,drawLineLabels} from '../src/line-labels.js';
import {normalizeChart} from '../src/chart-appearance.js';
import {normalizeDesign} from '../src/reel-design.js';
import {seriesBadge} from '../src/series-identity.js';
import {captureTheme,applySavedTheme,exportTheme,importTheme} from '../src/custom-themes.js';
import {reelAssetPaths,preloadReelAssets,isReelLogoReady} from '../src/reel-assets.js';
import {drawReel} from '../src/render.js';
import {aiBrands} from '../src/ai-brands.js';
import {buildAiBrandHistory} from '../src/ai-brand-history.js';
import {drawAiReel} from '../src/ai-render.js';
const config=(chart={})=>({fontId:'arial',visuals:{design:normalizeDesign({theme:'light',chart:{endLabels:true,...chart}})}});

test('line tips match linear, log and step geometry; gaps, delayed starts, zero and ended histories stay honest',()=>{
 const s={points:[{x:1,y:10,date:'2001-12-31',datePrecision:'year'},{x:3,y:1000}]};
 assert.equal(lineEndpoint(s,0),null);assert.equal(lineEndpoint(s,1).y,10);
 assert.equal(lineEndpoint(s,2).y,505);assert.ok(Math.abs(lineEndpoint(s,2,true).y-100)<1e-10);
 assert.equal(lineEndpoint({...s,interpolation:'step'},2).y,10);
 assert.equal(lineEndpoint(s,4).x,3);assert.equal(lineEndpoint(s,4).ended,true);
 const gap={points:[{x:1,y:0},{x:2,y:null},{x:3,y:5}]};
 assert.equal(lineEndpoint(gap,1).y,0);assert.equal(lineEndpoint(gap,1.5),null);assert.equal(lineEndpoint(gap,2.5),null);
 assert.equal(lineEndpoint(gap,3).y,5);
 const t=lineEndpoint(s,2),fmt=n=>String(n);
 assert.equal(endpointLabelText(t,config(),fmt).value,'≈ 505');
 assert.equal(endpointLabelText(t,config({endLabelValue:'observed'}),fmt).value,'10');
 assert.equal(endpointLabelText(lineEndpoint(s,1),config(),fmt).value,'10');
 const bound={x:0,y:0,valueQualifier:'>'};assert.equal(endpointLabelText({point:bound,y:0},config(),fmt).value,'>0');
});

test('six crowded or crossing labels fit inside the plot and never overlap in any supported geometry',()=>{
 for(const height of [50,100,180,400,1000])for(const size of [75,100,140])for(const names of [false,true])for(const values of [false,true])for(const dates of [false,true])for(const width of [460,765]){
  const c=config({endLabelSize:size,endLabelNames:names,endLabelValues:values,endLabelDates:dates}),bounds={left:135,right:135+width,top:400,bottom:400+height};
  const geometry=lineLabelGeometry(c,{...bounds,count:6,hasDates:true});
  assert.ok(geometry.right>bounds.left);assert.ok(geometry.height>0);assert.ok(geometry.size>0);
  for(const anchors of [[0,0,0,0,0,0],[height,height,height,height,height,height],[height/2,height/2+1,height/2-1,height/2,height/2,height/2],[0,height/4,height/2,height/2,height*.75,height]]){
   const items=anchors.map((y,index)=>({index,anchorY:bounds.top+y})),x=geometry.right+20,layout=arrangeLineLabels(items,geometry,{...bounds,x});
   assert.equal(layout.length,6);assert.deepEqual(arrangeLineLabels(items,geometry,{...bounds,x}),layout);
   for(const a of layout){assert.ok(a.y-a.height/2>=bounds.top-1e-8);assert.ok(a.y+a.height/2<=bounds.bottom+1e-8);assert.ok(a.x+a.width<=geometry.outerRight+1e-8);
    for(const b of layout){if(a===b)continue;assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height/2<=b.y-b.height/2+1e-8||b.y+b.height/2<=a.y-a.height/2+1e-8);}}
  }
 }
});

test('badges come from stable metadata; unknown names and regional aggregates never acquire national flags',()=>{
 assert.equal(seriesBadge({countryCode:'POL',name:'My renamed line'}).path,'/logos/flags/pl.svg');
 assert.equal(seriesBadge({entity:'United States'}).path,'/logos/flags/us.svg');
 assert.equal(seriesBadge({entity:'South Korea'}).path,'/logos/flags/kr.svg');
 assert.equal(seriesBadge({name:'Polska'}),null);assert.equal(seriesBadge({entity:'Europe'}),null);
 assert.equal(seriesBadge({symbol:'NVDA'}).path,'/logos/companies/nvda.svg');
 assert.equal(seriesBadge({symbol:'NVDA',logo:undefined}),null);
 assert.equal(seriesBadge({topicId:'cloud',entity:'amazon'}).path,'/logos/companies/amzn.svg');
 const flags=JSON.parse(readFileSync(new URL('../src/series-flags.json',import.meta.url)));
 for(const id of new Set(Object.values(flags))){const file=new URL(`../public/logos/flags/${id}.svg`,import.meta.url);assert.ok(existsSync(file));const svg=readFileSync(file,'utf8');assert.match(svg,/<svg/);assert.doesNotMatch(svg,/<script|<foreignObject|(?:href|src)=["'](?:https?:|\/\/|data:)|\son\w+\s*=/i);}
 assert.ok(existsSync(new URL('../public/logos/flags/LICENSE',import.meta.url)));
});

test('world and EU badges use stable metadata, local assets and keep explicit visibility overrides',()=>{
 for(const entity of ['WLD','World','Świat'])assert.deepEqual(seriesBadge({entity,name:'My own caption'}),{kind:'logo',path:'/logos/regions/world.svg'});
 for(const countryCode of ['EUU','EU','European Union','Unia Europejska'])assert.deepEqual(seriesBadge({countryCode}),{kind:'flag',path:'/logos/flags/eu.svg'});
 assert.equal(seriesBadge({name:'World'}),null);assert.equal(seriesBadge({entity:'WLD',logo:null}),null);assert.equal(seriesBadge({entity:'Europe'}),null);
 const c={...config(),series:[{countryCode:'WLD'},{countryCode:'EUU'}]};assert.deepEqual(reelAssetPaths(c),['/logos/regions/world.svg','/logos/flags/eu.svg']);
 for(const asset of reelAssetPaths(c)){const svg=readFileSync(new URL(`../public${asset}`,import.meta.url),'utf8');assert.match(svg,/<svg/);assert.doesNotMatch(svg,/<script|<foreignObject|(?:href|src)=["'](?:https?:|\/\/|data:)|\son\w+\s*=/i);}
});

test('trailing missing years keep the final real endpoint and date without filling internal gaps or inventing observations',()=>{
 const series={points:[{x:2020,y:null},{x:2021,y:3},{x:2022,y:null},{x:2023,y:0,date:'2023-12-31',datePrecision:'year'},{x:2024,y:null},{x:2025,y:null}]},original=structuredClone(series);
 assert.equal(lineEndpoint(series,2020),null);assert.equal(lineEndpoint(series,2022.5),null);
 for(const current of [2023,2023.01,2024,2024.99,2025,2030]){
  const tip=lineEndpoint(series,current);assert.equal(tip.x,2023);assert.equal(tip.y,0);assert.equal(tip.estimated,false);assert.equal(tip.ended,current>2023);
  assert.equal(endpointLabelText(tip,config(),String).date,current>2023?'2023':'');
 }
 assert.equal(lineEndpoint({points:[{x:2020,y:null},{x:2025,y:null}]},2025),null);assert.equal(lineEndpoint({points:[]},2025),null);assert.deepEqual(series,original);
});

test('final preview and export frames retain country, company, world and EU icons with end dates',async()=>{
 const series=[{countryCode:'POL'},{symbol:'NVDA'},{countryCode:'WLD'},{countryCode:'EUU'}].map((s,i)=>({...s,name:`Series ${i}`,points:[{x:2020,y:i+1},{x:2024,y:i+5},{x:2025,y:i===2?10:null}]})),original=structuredClone(series);
 const c={...config({legend:false,endLabelNames:false,endLabelValues:false,endLabelDates:true,axisLabels:false}),title:'Chart',series};
 const Image=globalThis.Image;globalThis.Image=class{set src(path){this.path=path;this.naturalWidth=40;this.naturalHeight=30;queueMicrotask(()=>this.onload());}};
 try{await preloadReelAssets(c);}finally{globalThis.Image=Image;}
 for(const chart of ['line','area'])for(const independentAxes of [false,true])for(const progress of [.8,.9,.99,1]){
  const {canvas,log,stack}=canvasRecorder();drawReel(canvas,{...c,chart,independentAxes},progress,progress*12);
  assert.equal(log.filter(e=>e.op==='drawImage').length,4,JSON.stringify({chart,independentAxes,progress}));assert.equal(stack.length,0);
  if(progress===1)assert.equal(log.filter(e=>e.op==='fillText'&&e.args[0]==='2024').length,3,'last dates remain available even with padded trailing nulls');
 }
 assert.deepEqual(series,original);
});

test('appearance keeps the feature opt-in and persists settings; icons are loaded for preview and export',async()=>{
 assert.equal(normalizeChart().endLabels,false);assert.equal(normalizeChart({endLabelSize:999}).endLabelSize,140);
 const c={...config({endLabelNames:true}),series:[{entity:'Poland'},{symbol:'NVDA'}]};
 assert.deepEqual(normalizeDesign(JSON.parse(JSON.stringify(c.visuals.design))),c.visuals.design);
 assert.deepEqual(reelAssetPaths(c),['/logos/flags/pl.svg','/logos/companies/nvda.svg']);
 assert.deepEqual(reelAssetPaths({...c,visuals:{design:normalizeDesign()}}),[]);
 const original=globalThis.Image,loaded=[];
 globalThis.Image=class{set src(value){loaded.push(value);this.naturalWidth=40;this.naturalHeight=30;queueMicrotask(()=>this.onload());}};
 try{const missing=reelAssetPaths(c).filter(path=>!isReelLogoReady(path));await preloadReelAssets(c);assert.deepEqual(loaded,missing);assert.ok(reelAssetPaths(c).every(isReelLogoReady));}finally{globalThis.Image=original;}
});

function canvasRecorder(){
 const stack=[],log=[];const ctx=new Proxy({font:'20px Arial',globalAlpha:1,textBaseline:'alphabetic',textAlign:'left',fillStyle:'#000',strokeStyle:'#000',lineWidth:1,measureText(t){return {width:String(t).length*(parseFloat(this.font.match(/[\d.]+px/)?.[0])||20)*.53};},save(){stack.push({font:this.font,fillStyle:this.fillStyle,strokeStyle:this.strokeStyle,textBaseline:this.textBaseline,textAlign:this.textAlign,globalAlpha:this.globalAlpha});},restore(){assert.ok(stack.length);Object.assign(this,stack.pop());},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a),String(k));log.push({op:k,args,font:o.font});}});
 const canvas={width:1080,height:1920,getContext:()=>ctx};ctx.canvas=canvas;return {canvas,ctx,stack,log};
}

test('AI endpoint labels show exact historical scores, including zero, without future brands or interpolated results',()=>{
 const brands=aiBrands.slice(0,2),row=(i,date,score)=>({id:`${i}-${date}`,modelId:`model-${i}`,model:`Test ${i}`,brandId:brands[i].id,brand:brands[i],date,score});
 const rows=[row(0,'2024-01-01',0),row(0,'2024-01-11',99),row(1,'2024-01-11',98)];
 const c={...config({legend:false,endLabelNames:true}),title:'Test',duration:12,language:'en',ai:{rows,history:buildAiBrandHistory(rows,{brandIds:brands.map(b=>b.id)}),brands,mode:'records',groupBy:'brand',showBrandLogos:false,showLeaderNames:false,benchmark:{id:'test',name:'Test',unit:'pts',source:'Test',retrievedAt:'2026-09-30'}}};
 for(const progress of [0,.25,.5,.99,1]){
  const {canvas,log,stack}=canvasRecorder();drawAiReel(canvas,c,progress,progress*12);
  const text=log.filter(e=>e.op==='fillText').map(e=>String(e.args[0]));
  assert.equal(stack.length,0);assert.ok(text.includes(progress===1?'99':'0'));
  assert.equal(text.includes('98'),progress===1);assert.equal(text.includes(brands[1].name),progress===1);
  assert.ok(!text.some(t=>t.startsWith('≈ ')));
 }
});
test('renderer places labels in transformed chart content, independently of legends, at every animation frame',()=>{
 const series=Array.from({length:6},(_,i)=>({id:String(i),name:`Series ${i}`,points:[{x:2000,y:i},{x:2010,y:10-i}]}));
 for(const format of ['9:16','4:5','1:1'])for(const chart of ['line','area'])for(const legend of [false,true])for(const progress of [0,.25,.5,.51,1]){
  const {canvas,ctx,stack,log}=canvasRecorder();drawReel(canvas,{...config({legend,endLabelSize:140,endLabelNames:true}),title:'History',series,format,chart},progress,12*progress);
  assert.equal(stack.length,0);assert.equal(ctx.textBaseline,'alphabetic');assert.ok(log.filter(l=>l.op==='fillText').some(l=>l.args[0].includes('Series')));
 }
 const {ctx}=canvasRecorder(),g=lineLabelGeometry(config(),{left:135,right:900,top:200,bottom:600,count:1});
 const items=[{index:0,anchorX:500,anchorY:250,series:{name:'A'},value:'100',color:'#00ff00'}];
 const first=drawLineLabels(ctx,config(),items,g,{top:200,bottom:600,x:520,fg:'#000'});
 assert.equal(first[0].y,250);assert.equal(ctx.textBaseline,'alphabetic');
});

test('all label content switches are independent, including duplicate flags, ended series and missing badges',async()=>{
 const original=globalThis.Image;
 globalThis.Image=class{set src(_value){this.naturalWidth=40;this.naturalHeight=30;queueMicrotask(()=>this.onload());}};
 try{await preloadReelAssets({...config(),series:[{countryCode:'POL'}]});}finally{globalThis.Image=original;}
 const items=[0,1,2].map(index=>({index,anchorX:500,anchorY:300,series:{name:`Unique ${index}`,countryCode:index<2?'POL':undefined},value:`42.${index}75`,date:'1989',color:'#123456'}));
 const bounds={left:135,right:900,top:200,bottom:600,count:3,hasDates:true};
 for(const icons of [false,true])for(const names of [false,true])for(const values of [false,true])for(const dates of [false,true]){
  const c=config({endLabelIcons:icons,endLabelNames:names,endLabelValues:values,endLabelDates:dates}),g=lineLabelGeometry(c,bounds),{ctx,log,stack}=canvasRecorder();
  const layout=drawLineLabels(ctx,c,items,g,{...bounds,x:(g?.right??900)+20,fg:'#000'}),texts=log.filter(e=>e.op==='fillText').map(e=>e.args[0]);
  assert.equal(!!g,icons||names||values||dates);
  assert.equal(layout.length,names||values||dates?3:icons?2:0);
  for(const item of items){assert.equal(texts.includes(item.series.name),names);assert.equal(texts.includes(item.value),values);}
  assert.equal(texts.filter(t=>t==='1989').length,dates?3:0);
  assert.equal(log.filter(e=>e.op==='drawImage').length,icons?2:0);assert.equal(stack.length,0);
 }
 const onlyIcons=config({endLabelNames:false,endLabelValues:false,endLabelDates:false}),g=lineLabelGeometry(onlyIcons,bounds);
 assert.ok(g.right>lineLabelGeometry(config(),bounds).right,'icon-only labels give space back to the plot');
 assert.equal(lineLabelGeometry(config({endLabelIcons:false,endLabelNames:false,endLabelValues:false,endLabelDates:true}),{...bounds,hasDates:false}),null);
 const missing={...items[0],series:{name:'Never force this name',logo:'/logos/missing.svg'}};
 const {ctx,log}=canvasRecorder();assert.deepEqual(drawLineLabels(ctx,onlyIcons,[missing],g,{...bounds,x:800,fg:'#000'}),[]);assert.equal(log.filter(e=>e.op==='fillText').length,0);
 // Full renderer used to turn names on for duplicate/missing icons and earlier endings.
 const series=items.map((item,index)=>({...item.series,id:String(index),points:[{x:1980,y:10+index},{x:index?1990:1989,y:20+index}]}));
 for(const chart of ['line','area'])for(const names of [false,true]){
  const {canvas,log}=canvasRecorder();drawReel(canvas,{...config({legend:false,endLabelNames:names}),title:'Chart',series,chart},1,12);
  const text=log.filter(e=>e.op==='fillText').map(e=>e.args[0]);for(const item of items)assert.equal(text.some(t=>String(t).includes(item.series.name)),names);
 }
});

test('label settings survive saved themes and AI endpoint logos are independent from legend logos',async()=>{
 assert.equal(normalizeChart().endLabelValues,true);assert.equal(normalizeChart().endLabelDates,true);
 const source=config({endLabelNames:false,endLabelValues:false,endLabelDates:false,endLabelIcons:true});
 const saved=captureTheme({name:'Icons only',visuals:source.visuals,fontId:'arial'}),restored=await importTheme(new File([await exportTheme(saved)],'theme.json'));
 const applied=applySavedTheme(config().visuals,restored);assert.deepEqual(applied.design.chart,source.visuals.design.chart);
 const brands=aiBrands.slice(0,1),row={id:'result',modelId:'model',model:'Model',brandId:brands[0].id,brand:brands[0],date:'2024-01-01',score:87};
 const c={...source,title:'Benchmark',duration:12,language:'en',ai:{rows:[row],history:buildAiBrandHistory([row],{brandIds:brands.map(b=>b.id)}),brands,mode:'records',groupBy:'brand',showBrandLogos:false,showLeaderNames:false,benchmark:{id:'test',name:'Test',unit:'pts',source:'Test'}}};
 c.visuals.design.chart.legend=false;c.visuals.design.chart.axisLabels=false;
 assert.deepEqual(reelAssetPaths(c),brands.map(b=>b.logo));
 const original=globalThis.Image;globalThis.Image=class{set src(_value){this.naturalWidth=40;this.naturalHeight=30;queueMicrotask(()=>this.onload());}};
 try{await preloadReelAssets(c);}finally{globalThis.Image=original;}
 const {canvas,log}=canvasRecorder();drawAiReel(canvas,c,1,12);
 assert.equal(log.filter(e=>e.op==='drawImage').length,1);
 assert.ok(!log.filter(e=>e.op==='fillText').some(e=>[brands[0].name,'87'].includes(e.args[0])));
});
