import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeDesign} from '../src/reel-design.js';
import {releaseRenderConfig,releaseElementTransform,patchReleaseElement} from '../src/release-axis-link.js';
import {resizedPlotRect} from '../src/reel-resize.js';

const fixture=()=>({releases:{stock:{},mode:'pulse'},visuals:{design:normalizeDesign({chart:{endLabels:false},elements:{stock:{widthScale:85,x:3},plot:{widthScale:140,x:-8,heightScale:150,y:4}}})}});
test('legacy independent transforms no longer multiply linked axis widths; local vertical spacing survives',()=>{
 const c=fixture(),render=releaseRenderConfig(c),stock=resizedPlotRect(render,'stock',{x:225,y:200,w:775,h:150}),plot=resizedPlotRect(render,'plot',{x:stock.x,y:600,w:stock.w,h:100});
 assert.equal(stock.x,plot.x);assert.equal(stock.w,plot.w);
 assert.equal(render.visuals.design.elements.plot.x,3);assert.equal(plot.h,150);
 assert.equal(render.visuals.design.elements.plot.y,4);assert.equal(c.visuals.design.elements.plot.widthScale,140);
 const edit=releaseElementTransform(c,'plot');assert.equal(edit.widthScale,85);
 const elements=patchReleaseElement(c,'plot',{widthScale:95,x:5,y:6,heightScale:175});
 assert.equal(elements.stock.widthScale,95);assert.equal(elements.stock.x,5);
 assert.equal(elements.plot.heightScale,175);assert.equal(elements.plot.y,6);assert.equal(elements.stock.y,0);
 c.visuals.design.chart.release.linkAxes=false;assert.equal(releaseRenderConfig(c),c);assert.equal(releaseElementTransform(c,'plot').widthScale,140);
});
test('NVIDIA has independent visible value/logo defaults and an explicit persistent opt-out',()=>{
 const c=fixture(),r=c.visuals.design.chart.release;
 assert.equal(r.stockLabels.endLabels,true);assert.equal(r.stockLabels.endLabelValues,true);assert.equal(r.stockLabels.endLabelIcons,true);assert.equal(r.stockLabels.endLabelDates,false);assert.equal(r.stockLabelPosition,'above');
 r.stockLabels.endLabels=false;r.laneLabelGap=35;r.linkAxes=false;
 const restored=normalizeDesign(JSON.parse(JSON.stringify(c.visuals.design))).chart.release;
 assert.equal(restored.stockLabels.endLabels,false);assert.equal(restored.laneLabelGap,35);assert.equal(restored.linkAxes,false);
});
