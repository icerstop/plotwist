import test from 'node:test';
import assert from 'node:assert/strict';
import {recurringDays,periodAmount} from '../src/recurrence.js';
import {simulateInvestment,toDay,fromDay} from '../src/market.js';
import {buildComparison} from '../src/comparison.js';
import {localizeReelConfig} from '../src/reel-language.js';

const dates=(start,end,f)=>[...recurringDays(toDay(start),toDay(end),f)].map(fromDay);
function constantStock(){
 const rows=[];
 for(let d=toDay('2024-01-29');d<=toDay('2024-05-02');d++){
  const date=fromDay(d),weekday=new Date(date+'T00:00:00Z').getUTCDay();
  if(weekday!==0&&weekday!==6)rows.push([date,10,10]);
 }
 return {symbol:'TEST',name:'Test',currency:'PLN',retrievedAt:'2024-05-03T00:00:00Z',rows};
}
const stock=constantStock();
const run=overrides=>simulateInvestment({stock,start:'2024-01-31',end:'2024-05-01',investmentAmount:100,expenseAmount:3,investmentFrequency:'monthly',expenseFrequency:'weekly',...overrides});

test('daily and weekly schedules include the start, exact end and calendar days',()=>{
 assert.deepEqual(dates('2024-02-28','2024-03-01','daily'),['2024-02-28','2024-02-29','2024-03-01']);
 assert.deepEqual(dates('2023-12-31','2024-01-14','weekly'),['2023-12-31','2024-01-07','2024-01-14']);
 assert.deepEqual(dates('2024-03-24','2024-04-07','weekly'),['2024-03-24','2024-03-31','2024-04-07']);
});

test('monthly dates clamp February without drifting later months',()=>{
 assert.deepEqual(dates('2024-01-31','2024-05-01','monthly'),['2024-01-31','2024-02-29','2024-03-31','2024-04-30']);
 assert.deepEqual(dates('2023-01-31','2023-03-31','monthly'),['2023-01-31','2023-02-28','2023-03-31']);
 assert.deepEqual(dates('2024-01-30','2024-03-30','monthly'),['2024-01-30','2024-02-29','2024-03-30']);
});

test('quarters use three calendar months, anchored to the chosen start',()=>{
 assert.deepEqual(dates('2024-08-31','2025-05-31','quarterly'),['2024-08-31','2024-11-30','2025-02-28','2025-05-31']);
 assert.deepEqual(dates('2024-02-15','2024-05-14','quarterly'),['2024-02-15']);
 assert.throws(()=>dates('2024-01-01','2024-02-01','yearly'),/częstotliwość/);
});

test('monthly investments and weekly purchases only charge their own scheduled dates',()=>{
 const r=run();
 assert.equal(r.summary.contributions,400);assert.equal(r.summary.expenses,42);
 assert.equal(r.summary.depositCount,4);assert.equal(r.summary.expenseCount,14);
 assert.equal(r.summary.portfolio,400);assert.equal(r.summary.profit,0);
 assert.deepEqual(r.ledger.filter(r=>r.deposit>0).map(r=>r.date),['2024-01-31','2024-02-29','2024-03-31','2024-04-30']);
 assert.equal(r.ledger.find(r=>r.date==='2024-03-31').cash,100);
 assert.equal(r.ledger.find(r=>r.date==='2024-04-01').purchase,100);
 assert.equal(r.ledger.find(r=>r.date==='2024-04-01').deposit,0);
 assert.equal(r.ledger.find(r=>r.date==='2024-02-01').expenses,3);
 assert.equal(r.ledger.find(r=>r.date==='2024-02-07').expenses,6);
 assert.equal(r.schedule.investmentFrequency,'monthly');
 assert.equal(r.ledger.at(-1).expenseFrequency,'weekly');
});

test('weekend contributions remain in cash if the range ends before the next session',()=>{
 const r=run({end:'2024-03-31',expenseFrequency:'quarterly'});
 assert.equal(r.summary.contributions,300);assert.equal(r.summary.cash,100);
 assert.equal(r.summary.expenses,3);assert.equal(r.summary.trades,2);
});

test('multiple portfolios get the full scheduled amount; expense schedules are independent and goals fixed',()=>{
 const entries=[{id:'a',kind:'asset',symbol:'TEST'},{id:'b',kind:'asset',symbol:'B'},
  {id:'drink',kind:'expense',amount:'3',frequency:'weekly',name:'Coca-Cola'},
  {id:'quarter',kind:'expense',amount:'50',frequency:'quarterly',name:'Zakup'},
  {id:'goal',kind:'goal',amount:'10000',name:'Cel'}];
 const result=buildComparison({entries,assets:{TEST:stock,B:{...stock,symbol:'B'}},start:'2024-01-31',end:'2024-05-01',mode:'dca',investmentAmount:100,investmentFrequency:'monthly'});
 assert.equal(result.summaries.a.contributions,400);assert.equal(result.summaries.b.contributions,400);
 assert.equal(result.series[2].points.at(-1).y,42);assert.equal(result.series[3].points.at(-1).y,100);
 assert.ok(result.series[4].points.every(p=>p.y===10000));assert.equal(result.series[4].schedule,undefined);
 assert.equal(result.series[0].schedule.frequency,'monthly');assert.equal(result.series[2].schedule.frequency,'weekly');
 assert.equal(result.series[2].points.reduce((n,p)=>n+p.expense,0),42);
 assert.throws(()=>buildComparison({entries:[entries[0],{...entries[2],frequency:'bad'}],assets:{TEST:stock},start:'2024-01-31',end:'2024-05-01',mode:'dca'}),/częstotliwość/);
});

test('scheduled labels follow reel language, retain custom names, and state amount per period',()=>{
 const base={title:'5 zł co miesiąc w NVIDIA.',subtitle:'NVIDIA: 5 zł/mies. vs Coca-Cola: 3 zł/tydz.',series:[{name:'Mój zakup',nameIsCustom:true,schedule:{amount:3,frequency:'weekly'},points:[]} ]};
 const en=localizeReelConfig(base,'en');
 assert.equal(en.title,'PLN 5 a month in NVIDIA.');assert.equal(en.subtitle,'NVIDIA: PLN 5/month vs Coca-Cola: PLN 3/week');
 assert.equal(en.series[0].name,'Mój zakup');assert.equal(en.series[0].scheduleText,'PLN 3/week');
 assert.equal(periodAmount(12.5,'quarterly','pl'),'12,5 zł/kw.');
});
