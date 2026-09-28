import test from 'node:test';
import assert from 'node:assert/strict';
import { simulateDailyInvestment, toDay, fromDay } from '../src/market.js';
const stock = { name: 'Test', symbol: 'TEST', currency: 'USD', retrievedAt: '2024-01-12T12:00:00Z', rows: [['2024-01-05', 10, 10], ['2024-01-08', 20, 20], ['2024-01-09', 20, 20]] };
const fx = { rows: [{ date: '2024-01-04', USD: 4 }, { date: '2024-01-05', USD: 4 }, { date: '2024-01-08', USD: 8 }, { date: '2024-01-09', USD: 8 }] };
const run = overrides => simulateDailyInvestment({ stock, fx, start: '2024-01-05', end: '2024-01-08', dailyInvestment: 5, dailyExpense: 3, ...overrides });
test('weekend deposits wait for next session and date bounds are inclusive', () => {
 const r = run(); assert.equal(r.summary.contributions, 20); assert.equal(r.summary.expenses, 12);
 assert.equal(r.ledger[2].cash, 10); assert.equal(r.ledger[3].purchase, 15); assert.equal(r.summary.trades, 2);
 assert.equal(r.summary.portfolio, 25); assert.equal(r.summary.profit, 5);
});
test('weekend end retains pending cash in portfolio', () => { const r=run({end:'2024-01-07'});assert.equal(r.summary.portfolio,15);assert.equal(r.summary.cash,10);assert.equal(r.summary.trades,1); });
test('FX uses prior publication, and FX revaluation is included', () => { const r=run({end:'2024-01-09'});assert.equal(r.ledger[3].fxRate,4);assert.equal(r.ledger[4].fxRate,8);assert.equal(r.summary.portfolio,55); });
test('split-adjusted close prevents artificial tenfold loss', () => { const s={...stock,currency:'PLN',rows:[['2024-01-05',10,100],['2024-01-08',10,10]]};const r=run({stock:s,fx:null});assert.equal(r.summary.portfolio,20);assert.equal(r.summary.profit,0); });
test('different budgets have separate baselines',()=>{const r=run({dailyInvestment:10,dailyExpense:3});assert.equal(r.summary.contributions,40);assert.equal(r.summary.expenses,12);});
test('calendar dates handle leap day without timezone drift',()=>{assert.equal(fromDay(toDay('2024-02-28')+1),'2024-02-29');assert.throws(()=>toDay('2023-02-29'));});
test('invalid bounds, insufficient FX and stale quotes fail explicitly',()=>{assert.throws(()=>run({start:'2024-01-08',end:'2024-01-08'}));assert.throws(()=>run({start:'2000-01-01'}));assert.throws(()=>run({fx:{rows:[]}}));assert.throws(()=>run({end:'2024-02-01'}));});
test('fractional cents and zero budgets are rejected',()=>{assert.throws(()=>run({dailyInvestment:0.001}));assert.throws(()=>run({dailyInvestment:0,dailyExpense:0}));});
test('zero investment is allowed with nonzero consumption',()=>{const r=run({dailyInvestment:0});assert.equal(r.summary.portfolio,0);assert.equal(r.summary.simpleReturn,null);});
