import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {readFileSync} from 'node:fs';
import {LanguageContext,readLanguages} from '../src/language-context.js';
import {localizedJsx,localizedProps} from '../src/locale-jsx.js';
import {localizeReelConfig} from '../src/reel-language.js';
import {translate} from '../src/translations.js';
import {drawReel,formatValue} from '../src/render.js';
import {aiValue,selectAiRows,timelineSelection} from '../src/ai.js';
import {displayDate,toDay} from '../src/market.js';
import {parseCsv} from '../src/data.js';
import {matchIdeas} from '../src/catalog.js';

const points=[{x:2020,y:12.5},{x:2021,y:null},{x:2022,y:29}];
const config={title:'Internet zmienił wszystko.',subtitle:'Osoby korzystające z internetu · % populacji',source:'Źródło: World Bank',unit:'% populacji',series:[{name:'Polska',points}],format:'9:16'};

test('menu and reel language are independent in all four combinations',()=>{
 for(const uiLanguage of ['pl','en'])for(const reelLanguage of ['pl','en']){
  const reel=localizeReelConfig(config,reelLanguage);
  const html=renderToStaticMarkup(React.createElement(LanguageContext.Provider,{value:{uiLanguage,reelLanguage}},localizedJsx('button',null,'Eksportuj wideo')));
  assert.ok(html.includes(uiLanguage==='en'?'Export video':'Eksportuj wideo'));
  assert.equal(reel.title,reelLanguage==='en'?'The internet changed everything.':config.title);
  assert.equal(reel.series[0].points,points);
 }
});

test('language preferences survive storage and malformed storage falls back safely',()=>{
 assert.deepEqual(readLanguages({getItem:()=>'{"uiLanguage":"en","reelLanguage":"pl"}'}),{uiLanguage:'en',reelLanguage:'pl'});
 assert.deepEqual(readLanguages({getItem:()=>'{"uiLanguage":"xx","reelLanguage":"en"}'}),{uiLanguage:'pl',reelLanguage:'en'});
 for(const storage of [null,{getItem:()=>'{broken'},{getItem:()=>{throw Error('blocked');}}])assert.deepEqual(readLanguages(storage),{uiLanguage:'pl',reelLanguage:'pl'});
});

test('translated controls retain option values, callbacks, refs and custom input',()=>{
 const callback=()=>{},ref={current:null};
 assert.deepEqual(localizedProps('option',{},['Wszystkie'],'en'),{props:{value:'Wszystkie'},children:['All']});
 const input=localizedProps('input',{value:'Polska',placeholder:'Szukaj instrumentu',onChange:callback,ref},[],'en');
 assert.equal(input.props.value,'Polska');assert.equal(input.props.onChange,callback);assert.equal(input.props.ref,ref);
 assert.equal(localizedProps('option',{value:'custom'},['Wszystkie'],'en').props.value,'custom');
 assert.equal(localizedProps('span',{translate:'no'},['Polska'],'en').children[0],'Polska');
 assert.equal(localizedProps('textarea',{},['Polska'],'en').children[0],'Polska');
 assert.equal(localizedProps('input',{translate:'no',placeholder:'Polska'},[],'en').props.placeholder,'Polska');
});

test('custom titles and CSV labels, units and citations are never rewritten',()=>{
 const series=parseCsv('rok;Polska\n2020;5\n2021;8');
 const custom={...config,titleIsCustom:true,series,unit:'lata',unitIsCustom:true,subtitleParts:[{text:'Własne dane'},{text:'lata',custom:true}],source:'Źródło: Polska',sourceIsCustom:true};
 const english=localizeReelConfig(custom,'en');
 assert.equal(english.title,config.title);assert.equal(english.series[0].name,'Polska');assert.equal(english.unit,'lata');
 assert.equal(english.source,'Source: Polska');assert.ok(english.subtitle.endsWith(' · lata'));
 assert.equal(localizeReelConfig({...config,series:[{name:'Mój cel',nameIsCustom:true,points}]},'en').series[0].name,'Mój cel');
});

test('English numeric and date formatting leaves values unchanged',()=>{
 assert.equal(formatValue(1234567,'en'),'1.2 m');assert.equal(formatValue(1234567,'pl'),'1,2 mln');
 assert.equal(aiValue(69.7,'en'),'69.7');assert.equal(aiValue(69.7),'69,7');
 assert.equal(displayDate(toDay('2024-03-02'),'en'),'02/03/2024');
 assert.equal(displayDate(toDay('2024-03-02'),'pl'),'2.03.2024');
 assert.ok(matchIdeas('battery').some(i=>i.id==='battery'));
 assert.equal(translate('constructor','en'),'constructor');
 assert.equal(translate('toString','en'),'toString');
});

function rendered(config){
 const text=[];
 const ctx=new Proxy({globalAlpha:1,measureText:s=>({width:String(s).length*8}),fillText:s=>text.push(String(s))},{get:(target,key)=>key in target?target[key]:()=>{}});
 drawReel({getContext:()=>ctx},config,1,20);
 return text.join('\n');
}

test('every series renderer burns English labels into the shared preview/export canvas',()=>{
 for(const chart of ['line','area','bar','ranking','cards']){
  const text=rendered(localizeReelConfig({...config,chart},'en'));
  assert.ok(text.includes('Poland'),chart);assert.ok(text.includes('Source: World Bank'),chart);
  assert.ok(!text.includes('Polska'),chart);assert.ok(text.includes('Jakub Bilski'),chart);
 }
});

test('AI forms translate context without changing scores, dates or observations',()=>{
 const benchmark=JSON.parse(readFileSync(new URL('../public/ai/gpqa.json',import.meta.url)));
 const rows=selectAiRows(benchmark.rows,{basis:'release',end:'9999'});
 for(const mode of ['timeline','ranking','records','scatter','duel']){
  const story={title:'Jak szybko rozwija się AI?',ai:{benchmark,rows:mode==='timeline'?timelineSelection(rows):rows,basis:'release',mode}};
  const translated=localizeReelConfig(story,'en');
  assert.equal(translated.ai.rows,story.ai.rows);assert.equal(translated.ai.benchmark.baseline.score,69.7);
  const text=rendered(translated);
  assert.ok(text.includes('How fast is AI'),mode);assert.ok(!text.includes('Wg premier'),mode);
  if(mode==='duel')assert.ok(text.includes('PhD domain experts'));
 }
 const custom=localizeReelConfig({title:'Jak szybko rozwija się AI?',titleIsCustom:true,ai:{benchmark,rows:timelineSelection(rows),basis:'release',mode:'timeline'}},'en');
 assert.ok(rendered(custom).includes('Jak szybko rozwija się AI?'));
});

test('bundled benchmark metadata and human references have English translations',()=>{
 const manifest=JSON.parse(readFileSync(new URL('../public/ai/manifest.json',import.meta.url)));
 for(const entry of manifest.benchmarks){
  const b=JSON.parse(readFileSync(new URL(`../public/ai/${entry.id}.json`,import.meta.url)));
  for(const key of ['description','caveat','category'])assert.notEqual(translate(b[key],'en'),b[key],`${entry.id}.${key}`);
  if(b.baseline)assert.notEqual(translate(b.baseline.note,'en'),b.baseline.note);
 }
});
