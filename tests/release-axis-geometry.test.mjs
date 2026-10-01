import test from 'node:test';
import assert from 'node:assert/strict';
import {resizedPlotRect} from '../src/reel-resize.js';
import {normalizeDesign} from '../src/reel-design.js';
import {aboveLineLabel,lineLabelGeometry} from '../src/line-labels.js';

test('native plot resizing expands around its centre without changing typography settings',()=>{
 const config={visuals:{design:normalizeDesign({elements:{plot:{widthScale:150,heightScale:300}},text:{labels:{size:115}}})}};
 assert.deepEqual(resizedPlotRect(config,'plot',{x:200,y:400,w:600,h:150}),{x:50,y:250,w:900,h:450});
 assert.equal(config.visuals.design.text.labels.size,115);
 const saved=normalizeDesign(JSON.parse(JSON.stringify(config.visuals.design)));
 assert.equal(saved.elements.plot.heightScale,300);
 assert.equal(normalizeDesign({chart:{release:{stockLabelPosition:'above'}}}).chart.release.stockLabelPosition,'above');
 assert.equal(normalizeDesign({chart:{release:{stockLabelPosition:'unknown'}}}).chart.release.stockLabelPosition,'side');
});
test('above-line labels stay within the horizontal plot for first and last observations',()=>{
 for(const names of [false,true])for(const values of [false,true])for(const dates of [false,true]){
  const config={visuals:{design:normalizeDesign({chart:{endLabels:true,endLabelNames:names,endLabelValues:values,endLabelDates:dates}})}};
  const area={left:225,right:1000,top:300,bottom:600};
  const geometry=lineLabelGeometry(config,{...area,count:1,hasDates:true});
  for(const anchorX of [225,230,500,999,1000]){
   const b=aboveLineLabel({anchorX,anchorY:550},geometry,area);
   assert.ok(b.x>=area.left);assert.ok(b.x+b.width<=area.right+1e-8);
   assert.ok(b.y+b.height/2<550);assert.ok(b.y-b.height/2>=area.top);
  }
 }
});
