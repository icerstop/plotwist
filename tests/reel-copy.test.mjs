import test from 'node:test';
import assert from 'node:assert/strict';
import {describeCopy,normalizeCopies,updateCopy,reelCopyFields,normalizeCopyHidden,updateCopyHidden} from '../src/reel-copy.js';
import {drawReel} from '../src/render.js';
import {normalizeDesign} from '../src/reel-design.js';
import {motionPreset} from '../src/reel-motion.js';
import {captureTheme,applySavedTheme} from '../src/custom-themes.js';

function recorder(){
 const text=[],stack=[],props=['font','globalAlpha','fillStyle','textAlign'];
 const ctx=new Proxy({font:'30px Arial',globalAlpha:1,textAlign:'left',getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0}),measureText:s=>({width:String(s).length*12}),fillText(s){if(this.globalAlpha>0)text.push(String(s));},save(){stack.push(Object.fromEntries(props.map(p=>[p,this[p]])));},restore(){Object.assign(this,stack.pop());}},{get:(o,k)=>k in o?o[k]:(...args)=>args.forEach(n=>{if(typeof n==='number')assert.ok(Number.isFinite(n),`${String(k)}: ${args}`);})});
 const canvas={width:1080,height:1920,getContext:()=>ctx};ctx.canvas=canvas;return {canvas,text,stack};
}
const base=()=>({duration:12,language:'pl',title:'Original title',subtitle:'Original subtitle',source:'Original source',metricCaption:'Original metric',unit:'years',axisRange:'dynamic',series:[{name:'Polska',countryCode:'POL',points:[{x:2000,y:50},{x:2025,y:80}]}],visuals:{copy:{},design:normalizeDesign({chart:{endLabels:true,endLabelNames:true}})}});
test('release captions use shared editing and stable dynamic visibility across playback and formats',()=>{
 for(const mode of ['pulse','calendar'])for(const format of ['9:16','4:5','1:1']){
  const c=base();c.format=format;c.releases={mode,start:'2026-09-01',end:'2026-09-30',count:'versions',publishers:['openai','anthropic'],rows:[{id:'a',date:'2026-09-01',publisher:'openai',name:'First'},{id:'b',date:'2026-09-29',publisher:'anthropic',name:'Last'}],verifiedAt:'2026-09-30'};
  const {canvas,text,stack}=recorder();drawReel(canvas,c,1,12);const fields=reelCopyFields(canvas);
  for(const id of ['release.monthCount','release.month','release.total','release.totalLabel','release.activeDate','release.model','release.gap','release.publisher'])assert.ok(fields.some(f=>f.id===id),id);
  const total=fields.find(f=>f.id==='release.totalLabel'),gap=fields.find(f=>f.id==='release.gap');c.visuals.copy=updateCopy({},total.key,'My total caption');c.visuals.copyHidden=updateCopyHidden({},gap.visibilityKey,true);
  for(const p of [.1,.5,1]){text.length=0;drawReel(canvas,c,p,p*12);assert.ok(text.includes('My total caption'));assert.ok(!text.some(t=>t.includes('dni od poprzedniej')));assert.ok(reelCopyFields(canvas).find(f=>f.id==='release.gap').hidden);assert.equal(stack.length,0);}
  c.visuals.hidden={summary:true};text.length=0;drawReel(canvas,c,1,12);assert.ok(!text.includes('My total caption'));assert.ok(text.includes('Last'));
 }
});

test('visibility preserves authored text, restores without data loss and isolates language/data',()=>{
 const c=base(),field=describeCopy(c,'subtitle',c.subtitle);c.visuals.copy=updateCopy({},field.key,'Keep my caption');c.visuals.copyHidden=updateCopyHidden({},field.visibilityKey,true);
 assert.equal(describeCopy(c,'subtitle',c.subtitle).value,'');assert.equal(c.visuals.copy[field.key],'Keep my caption');
 assert.equal(describeCopy({...c,language:'en'},'subtitle',c.subtitle).hidden,false);
 assert.equal(describeCopy({...c,unit:'USD'},'subtitle',c.subtitle).hidden,false);
 const theme=captureTheme({name:'Test',visuals:c.visuals,fontId:'arial'});assert.ok(!JSON.stringify(theme).includes('copyHidden'));assert.deepEqual(applySavedTheme(c.visuals,theme).copyHidden,c.visuals.copyHidden);
 assert.deepEqual(normalizeCopyHidden(JSON.parse(JSON.stringify(c.visuals.copyHidden))),c.visuals.copyHidden);
 assert.deepEqual(normalizeCopyHidden({'[a]':true,'[b]':false,'bad':true,'[c]':'true'}),{'[a]':true});
 c.visuals.copyHidden=updateCopyHidden(c.visuals.copyHidden,field.visibilityKey,false);assert.equal(describeCopy(c,'subtitle',c.subtitle).value,'Keep my caption');
});

test('one uncertainty switch hides every changing CI, keeps other captions and remains restorable',()=>{
 const c=base();c.ai={mode:'records',basis:'release',rows:[{id:'a',modelId:'a',model:'First',date:'2025-01-01',score:40,low:38,high:42},{id:'b',modelId:'b',model:'Second',date:'2026-01-01',score:60,low:57,high:63}],benchmark:{id:'example',name:'Example',unit:'pts',source:'Publisher',caveat:'Methodology',retrievedAt:'2026-09-30'}};
 const {canvas,text}=recorder();drawReel(canvas,c,1,12);const fields=reelCopyFields(canvas),ci=fields.find(f=>f.label==='Niepewność wyniku (CI / SE)'),value=fields.find(f=>f.id==='ai.record.value');assert.ok(ci&&value);
 c.visuals.copyHidden=updateCopyHidden({},ci.visibilityKey,true);
 for(const p of [0,.2,.5,.95,1]){text.length=0;drawReel(canvas,c,p,p*12);assert.ok(!text.some(t=>t.startsWith('90% CI:')));assert.ok(text.includes('Methodology'));const hidden=reelCopyFields(canvas).find(f=>f.visibilityKey===ci.visibilityKey);assert.ok(hidden?.hidden);}
 c.visuals.copyHidden=updateCopyHidden(c.visuals.copyHidden,ci.visibilityKey,false);text.length=0;drawReel(canvas,c,0,0);assert.ok(text.some(t=>t==='90% CI: 38–42'));
});

test('visibility invalidates cached AI identities and restores exactly the chosen model',()=>{
 const c=base();c.ai={mode:'ranking',basis:'release',rows:[{id:'a',modelId:'a',model:'First (High)',date:'2025-01-01',score:40},{id:'b',modelId:'b',model:'Second (High)',date:'2026-01-01',score:60}],benchmark:{id:'example',name:'Example',unit:'pts',source:'Publisher',caveat:'Methodology',retrievedAt:'2026-09-30'}};
 const {canvas,text}=recorder();drawReel(canvas,c,1,12);const field=reelCopyFields(canvas).find(f=>f.id==='ai.model.name'&&f.original==='Second');c.visuals.copyHidden=updateCopyHidden({},field.visibilityKey,true);text.length=0;drawReel(canvas,c,1,12);assert.ok(!text.includes('Second'));assert.ok(text.includes('First'));assert.ok(text.includes('60'));assert.ok(reelCopyFields(canvas).some(f=>f.key===field.key&&f.hidden));
 c.visuals.copyHidden=updateCopyHidden(c.visuals.copyHidden,field.visibilityKey,false);text.length=0;drawReel(canvas,c,1,12);assert.ok(text.includes('Second'));
});

test('copy isolates data and language, restores automatic text, and survives theme changes without contaminating themes',()=>{
 const c=base(),field=describeCopy(c,'source',c.source);c.visuals.copy=updateCopy(c.visuals.copy,field.key,'My methodology');
 assert.equal(describeCopy(c,'source',c.source).value,'My methodology');
 assert.equal(describeCopy({...c,language:'en'},'source',c.source).value,c.source);
 assert.equal(describeCopy({...c,unit:'USD'},'source',c.source).value,c.source);
 assert.equal(describeCopy(c,'source','Updated source').value,'Updated source');
 c.visuals.copy=updateCopy(c.visuals.copy,field.key,'');assert.equal(describeCopy(c,'source',c.source).value,'');
 c.visuals.copy=updateCopy(c.visuals.copy,field.key,null);assert.equal(describeCopy(c,'source',c.source).value,c.source);
 const author=describeCopy(c,'signature.name','Default',{shared:true});c.visuals.copy=updateCopy(c.visuals.copy,author.key,'My author');
 assert.equal(describeCopy({...c,source:'Different source'},'signature.name','Default',{shared:true}).value,'My author');
 const theme=captureTheme({name:'Style',visuals:c.visuals,fontId:'arial'});assert.ok(!JSON.stringify(theme).includes('My author'));assert.deepEqual(applySavedTheme(c.visuals,theme).copy,c.visuals.copy);
 assert.deepEqual(normalizeCopies(JSON.parse(JSON.stringify(c.visuals.copy))),c.visuals.copy);
 assert.equal(Object.keys(normalizeCopies(Object.fromEntries(Array.from({length:220},(_,n)=>[`[${n}]`,'x'])))).length,200);
});

test('editable copy reaches preview/export, wraps source lines, supports empty text and respects mystery masks',()=>{
 const c=base(),original=JSON.stringify(c.series),{canvas,text,stack}=recorder();drawReel(canvas,c,1,12);
 const fields=reelCopyFields(canvas);for(const id of ['title','subtitle','metric','source','date','signature.name','signature.links','axis.unit','axis.scale','series.name'])assert.ok(fields.some(f=>f.id===id),id);
 const set=(id,value)=>{const field=fields.find(f=>f.id===id);c.visuals.copy=updateCopy(c.visuals.copy,field.key,value);};
 set('title','Edited title');set('source','First source line\nSecond source line');set('signature.name','New author');set('series.name','Custom country');set('date','Fixed date');
 text.length=0;drawReel(canvas,c,.5,6);for(const value of ['Edited title','First source line','Second source line','New author','Custom country','Fixed date'])assert.ok(text.includes(value),value);
 assert.ok(!text.includes(c.title));assert.equal(JSON.stringify(c.series),original);assert.equal(stack.length,0);
 set('title','');text.length=0;drawReel(canvas,c,1,12);assert.ok(!text.includes(c.title));assert.ok(!text.includes('Twoja historia.'));assert.ok(reelCopyFields(canvas).some(f=>f.id==='title'&&f.value===''));
 set('title','Edited title');c.visuals.design.motion=motionPreset('mystery');text.length=0;drawReel(canvas,c,.5,6);assert.deepEqual([...new Set(text)],['Edited title']);
 text.length=0;drawReel(canvas,c,1,12);assert.ok(text.includes('First source line'));
});

test('AI methodology and cached model labels can be edited, cleared and restored without changing scores',()=>{
 const c=base();c.ai={mode:'ranking',basis:'release',rows:[{id:'a',modelId:'a',model:'Claude Example (High Effort)',date:'2025-01-01',score:40},{id:'b',modelId:'b',model:'GPT Example (High Effort)',date:'2026-01-01',score:60}],benchmark:{id:'example',name:'Example benchmark',unit:'pts',source:'Original AI source',caveat:'Important methodology',retrievedAt:'2026-09-30'}};
 const original=JSON.stringify(c.ai),{canvas,text,stack}=recorder();drawReel(canvas,c,1,12);
 const fields=reelCopyFields(canvas),source=fields.find(f=>f.element==='source'&&f.original==='Important methodology'),model=fields.find(f=>f.id==='ai.model.name'&&f.original==='GPT Example'),details=fields.find(f=>f.id==='ai.model.details'&&f.context.startsWith('GPT'));assert.ok(source&&model&&details);assert.equal(fields.filter(f=>f.id==='ai.model.details'&&f.original==='High').length,2);
 c.visuals.copy=updateCopy(updateCopy(c.visuals.copy,source.key,'My AI note'),model.key,'My model label');text.length=0;drawReel(canvas,c,1,12);assert.ok(text.includes('My AI note'));assert.ok(text.includes('My model label'));assert.ok(!text.includes('GPT Example'));assert.equal(JSON.stringify(c.ai),original);
 for(const field of [model,details])c.visuals.copy=updateCopy(c.visuals.copy,field.key,'');text.length=0;drawReel(canvas,c,1,12);assert.ok(!text.includes('My model label'));assert.ok(text.includes('60'));assert.ok(text.includes('High'),'another model with identical settings keeps its text');assert.equal(stack.length,0);
 c.visuals.copy=updateCopy(c.visuals.copy,model.key,null);text.length=0;drawReel(canvas,c,1,12);assert.ok(text.includes('GPT Example'));
 assert.ok(reelCopyFields(canvas).some(f=>f.key===model.key),'cached layout still publishes editor fields');
});
