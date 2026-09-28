import {recurringDays,scheduleRule} from './recurrence.js';
import {fromDay,marketStartDate,simulateInvestment,toDay,validateMarketRange} from './market.js';

export function comparisonRange(assets,fx,mode){
 if(!assets.length||assets.some(a=>!a?.rows?.length))return null;
 return {start:assets.map(a=>marketStartDate(a,fx,mode==='dca'?'dca':'prices')).sort().at(-1),end:assets.map(a=>a.rows.at(-1)[0]).sort()[0]};
}

export function buildComparison({entries,assets,fx,start,end,mode='prices',scale='index',dailyInvestment=5,investmentAmount=dailyInvestment,investmentFrequency='daily'}){
 if(!entries.length||entries.length>6)throw new Error('Dodaj od 1 do 6 serii.');
 const selected=entries.filter(e=>e.kind==='asset');
 if(!selected.length)throw new Error('Dodaj przynajmniej jedną spółkę, ETF lub surowiec.');
 const loaded=selected.map(e=>assets[e.symbol]);
 if(loaded.some(a=>!a))throw new Error('Wczytywanie historii wybranych serii…');
 const first=toDay(start),last=toDay(end);
 loaded.forEach(a=>validateMarketRange(a,start,end));
 const range=comparisonRange(loaded,fx,mode);
 if(start<range.start||end>range.end)throw new Error(`Wspólna historia: ${range.start} – ${range.end}. Dostosuj daty lub wybierz cały wspólny zakres.`);
 const decorate=(entry,data)=>({...data,id:entry.id,nameIsCustom:!!entry.nameIsCustom,color:entry.color,customColor:true,logo:entry.logo});
 if(mode==='dca'){
  if(!Number.isFinite(investmentAmount)||investmentAmount<=0)throw new Error('Podaj dodatnią kwotę wpłaty w złotych.');
  const summaries={};
  const series=entries.map(entry=>{
   if(entry.kind==='asset'){
    const stock=assets[entry.symbol];
    if(stock.kind==='futures')throw new Error(`${stock.name}: do inwestowania wybierz ETF lub fundusz surowcowy. Kontrakty są dostępne w porównaniu cen.`);
    const r=simulateInvestment({stock,fx,start,end,investmentAmount,investmentFrequency,expenseAmount:0});
    summaries[entry.id]=r.summary;
    return decorate(entry,{...r.series[0],name:stock.name});
   }
   const amount=Number(entry.amount);
   if(String(entry.amount).trim()===''||!Number.isFinite(amount)||amount<=0||amount>1e9||(entry.kind==='expense'&&Math.abs(amount*100-Math.round(amount*100))>1e-7))throw new Error(`${entry.name||'Seria'}: podaj dodatnią kwotę${entry.kind==='expense'?' z maksymalnie 2 miejscami po przecinku':''}.`);
   const frequency=entry.frequency||'daily',dates=entry.kind==='expense'?recurringDays(first,last,frequency):null;let totalCents=0;
   const points=Array.from({length:last-first+1},(_,i)=>{const x=first+i,payment=dates?.has(x)?Math.round(amount*100):0;totalCents+=payment;return {x,y:entry.kind==='goal'?amount:totalCents/100,expense:payment/100};});
   return decorate(entry,{name:entry.name||(entry.kind==='goal'?'Cel':'Regularny wydatek'),dashed:entry.kind==='goal',schedule:entry.kind==='expense'?{amount,frequency}:undefined,points});
  });
  return {series,summaries,schedule:{investmentAmount,investmentFrequency,start,end,rule:scheduleRule},unit:'zł',baseDate:start,endDate:end,methodology:'Osobny portfel dla każdego instrumentu. Ta sama kwota i częstotliwość wpłat w PLN na każdy portfel; budżet nie jest dzielony między serie. Ułamkowe udziały kupowane po zamknięciu, środki z dni wolnych czekają na sesję. Kurs NBP z ostatniej tabeli opublikowanej przed wycenianym dniem. Bez dywidend, prowizji i podatków; koszty funduszy są już uwzględnione w ich cenach. Wydatki to narastająca suma zakupów według częstotliwości danej serii, cel to stała kwota.'};
 }
 if(entries.some(e=>e.kind!=='asset'))throw new Error('Cel i regularny wydatek wymagają trybu „Inwestycje w PLN”. Usuń je lub zmień tryb.');
 const denominations=new Set(loaded.map(a=>`${a.currency}/${a.kind==='futures'?a.unit:'udział'}`));
 if(scale==='price'&&denominations.size>1)throw new Error('Ceny mają różne waluty lub jednostki. Wybierz indeks 100 albo zmianę %, aby porównać je na jednej skali.');
 const maps=loaded.map(a=>new Map(a.rows.filter(r=>r[0]>=start&&r[0]<=end).map(r=>[r[0],r[1]])));
 const dates=[...maps[0].keys()].filter(d=>maps.every(m=>m.has(d))).sort();
 if(dates.length<2)throw new Error('Potrzebne są co najmniej dwie wspólne daty notowań. Poszerz zakres.');
 const series=selected.map((entry,i)=>{
  const base=maps[i].get(dates[0]);
  if(scale!=='price'&&base<=0)throw new Error(`${loaded[i].name}: cena bazowa musi być dodatnia. Zmień początek zakresu.`);
  return decorate(entry,{name:loaded[i].name,points:dates.map(d=>{const raw=maps[i].get(d);return {x:toDay(d),y:scale==='price'?raw:scale==='percent'?(raw/base-1)*100:raw/base*100,raw};})});
 });
 return {series,summaries:{},unit:scale==='index'?'pkt':scale==='percent'?'%':loaded[0].kind==='futures'?loaded[0].unit:loaded[0].currency,baseDate:dates[0],endDate:dates.at(-1),methodology:`Wyłącznie wspólne daty rzeczywistych notowań wszystkich serii. Wspólna baza: ${dates[0]}. Bez dopisywania cen na dni wolne. Ceny w walucie instrumentu, po korekcie o splity, bez dywidend i przeliczenia na PLN. Indeks = cena / cena bazowa × 100; zmiana % = (cena / cena bazowa − 1) × 100. Futures to historia kontraktów dostawcy, nie ceny spot ani stopa zwrotu strategii inwestycyjnej; zmiany kontraktów mogą wpływać na serię.`};
}
