import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseStockSeries,releaseStockFrame} from '../src/release-stock.js';
import {releaseDay as day} from '../src/ai-releases.js';
import {normalizeDesign} from '../src/reel-design.js';
import {reelCapabilities} from '../src/reel-capabilities.js';
import {reelAssetPaths} from '../src/reel-assets.js';
const stock={rows:[['2024-06-07',120,1200],['2024-06-10',122,122],['2024-06-11',121,121]],currency:'USD'};
test('release price uses actual close, split basis, previous session and no lookahead',()=>{
 const series=releaseStockSeries(stock,'2024-06-08','2024-06-11');
 assert.equal(series.points[0].date,'2024-06-07');
 const at=d=>releaseStockFrame(series,day(d)+.75,series.start,series.end);
 assert.equal(at('2024-06-08').point.y,120);assert.equal(at('2024-06-09').point.y,120);
 assert.equal(at('2024-06-10').point.y,122);assert.equal(at('2024-06-11').point.y,121);
 assert.equal(at('2024-06-09').range.max,120);
 assert.equal(releaseStockSeries(stock,'2024-06-08','2024-06-11','raw').points[0].y,1200);
});
test('price stops at source coverage and seeks deterministically, including pauses',()=>{
 const s=releaseStockSeries(stock,'2024-06-01','2024-06-30'),f=d=>releaseStockFrame(s,day(d),s.start,s.end);
 assert.equal(f('2024-06-01').point,undefined);
 assert.equal(f('2024-06-30').x,day('2024-06-11'));assert.equal(f('2024-06-30').point.date,'2024-06-11');
 const first=f('2024-06-10');f('2024-06-30');assert.deepEqual(f('2024-06-10'),first);
 assert.deepEqual(f('2024-06-10'),f('2024-06-10'));
 assert.equal(releaseStockFrame(s,day('2024-06-10'),day('2024-06-09'),s.end).path[0].date,'2024-06-07');
});
test('optional stock joins the shared editor, saved theme and asset preloader in every view',()=>{
 for(const mode of ['pulse','calendar','cards','heatmap','gaps']){
  const c={releases:{mode,stock:releaseStockSeries(stock,'2024-06-01','2024-06-30')}};
  assert.ok(reelCapabilities(c).endLabels);assert.ok(reelCapabilities(c).line);
  assert.ok(reelCapabilities(c).elements.some(e=>e.id==='stock'));assert.ok(reelAssetPaths(c).includes('/logos/companies/nvda.svg'));
  assert.equal(reelCapabilities({releases:{mode}}).endLabels,false);
 }
 const d=normalizeDesign({chart:{release:{stockHeight:34,stockColor:'#aabbcc',stockScale:'fixed'}},elements:{stock:{x:4}},text:{'stock:labels':{color:'#123456'}}});
 assert.deepEqual(normalizeDesign(JSON.parse(JSON.stringify(d))),d);assert.equal(d.elements.stock.x,4);
 assert.equal(d.chart.release.stockHeight,34);assert.equal(d.text['stock:labels'].color,'#123456');
});
