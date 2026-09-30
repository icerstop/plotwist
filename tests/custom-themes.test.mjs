import test from 'node:test';
import assert from 'node:assert/strict';
import {captureTheme,applySavedTheme,normalizeSavedTheme,exportTheme,importTheme,duplicateThemeName,uniqueThemeName,remapThemeAssets} from '../src/custom-themes.js';
import {normalizeDesign} from '../src/reel-design.js';
import {motionPreset} from '../src/reel-motion.js';

const visuals=()=>({fontId:null,design:normalizeDesign({theme:'paper',chartHeight:86,chart:{lineWidth:7,palette:'ocean'},elements:{title:{x:7,y:12,rotation:8,scale:120}},text:{title:{fontId:'caveat',shadow:true,color:'#aabbcc'}},motion:motionPreset('typing-retro'),metricLabels:{gdp:{pl:'Mój opis PKB',en:'My GDP label'}}}),background:{type:'gradient',color:'#112233',color2:'#445566',angle:75,pattern:'dots'},logo:{type:'monogram',color:'#123456'},stickers:[{id:'my-gif',assetId:'sticker-only'}]});
test('theme captures full appearance, resolves inherited font, preserves destination data and content',()=>{
 const source=visuals();source.design.motion.tracks['sticker:my-gif']={effect:'pop',start:.4,duration:.1};
 const saved=captureTheme({name:'  Mój   motyw ',visuals:source,fontId:'libre-baskerville'});
 assert.equal(saved.name,'Mój motyw');assert.equal(saved.appearance.fontId,'libre-baskerville');assert.deepEqual(saved.appearance.design.metricLabels,{});assert.equal(saved.appearance.design.motion.tracks['sticker:my-gif'],undefined);assert.deepEqual(saved.files,{});
 const current={...visuals(),design:normalizeDesign({theme:'dark',metricLabels:{internet:{pl:'Użytkownicy internetu'}},motion:{tracks:{'sticker:destination':{effect:'rise',start:.3,duration:.1}}}}),title:'Inny tytuł',series:[{name:'Polska',values:[1,2,3]}],stickers:[{id:'destination'}]};
 const before=structuredClone(current),applied=applySavedTheme(current,saved);
 assert.deepEqual(current,before);assert.equal(applied.fontId,'libre-baskerville');assert.equal(applied.design.theme,'paper');assert.equal(applied.design.chartHeight,86);assert.equal(applied.design.chart.lineWidth,7);assert.equal(applied.design.elements.title.y,12);assert.equal(applied.design.text.title.fontId,'caveat');assert.equal(applied.design.motion.typing.style,'retro');assert.deepEqual(applied.design.metricLabels,current.design.metricLabels);assert.deepEqual(applied.design.motion.tracks['sticker:destination'],current.design.motion.tracks['sticker:destination']);assert.equal(applied.stickers,current.stickers);assert.equal(applied.series,current.series);assert.equal(applied.title,current.title);
});
test('portable backup round trips GIF background, transparent logo and attribution with fresh asset IDs',async()=>{
 const file=new File([new Uint8Array([71,73,70,56,57,97,1,2,3])],'background.gif',{type:'image/gif'}),logo=new File(['png-bytes'],'logo.png',{type:'image/png'}),v=visuals();v.background={...v.background,type:'image',assetId:'bg',source:{provider:'GifSnap',url:'https://example.org/gif',title:'Original title'}};v.logo={type:'custom',assetId:'logo',name:'logo.png'};
 const saved=captureTheme({name:'Z plikami',visuals:v,files:{bg:file,logo,unused:new Blob(['unused'])}}),content=await exportTheme(saved),restored=await importTheme(new File([content],'theme.json'));
 assert.notEqual(restored.id,saved.id);assert.notEqual(restored.appearance.background.assetId,'bg');assert.deepEqual(new Uint8Array(await restored.files[restored.appearance.background.assetId].arrayBuffer()),new Uint8Array(await file.arrayBuffer()));assert.equal(restored.appearance.logo.name,'logo.png');assert.equal(restored.appearance.background.source.provider,'GifSnap');assert.equal(Object.keys(restored.files).length,2);assert.equal(remapThemeAssets(saved).files.bg,undefined);assert.equal(saved.appearance.background.assetId,'bg');
});
test('invalid themes fail without silently dropping missing assets or unknown versions',async()=>{
 const v=visuals();v.background={type:'image',assetId:'missing'};assert.throws(()=>captureTheme({name:'Missing',visuals:v}),/Brakuje/);
 const saved=captureTheme({name:'Valid',visuals:visuals()});assert.throws(()=>normalizeSavedTheme({...saved,version:2}),/Nieprawidłowy/);assert.throws(()=>captureTheme({name:'   ',visuals:visuals()}),/nazwę/);await assert.rejects(importTheme(new File(['not json'],'x.json')),/Nieprawidłowy/);
 assert.equal(duplicateThemeName([{id:'1',name:'Żółty motyw'}],'żółty motyw'),true);assert.equal(uniqueThemeName([{id:'1',name:'Żółty motyw'}],'Żółty motyw'),'Żółty motyw (2)');
});
