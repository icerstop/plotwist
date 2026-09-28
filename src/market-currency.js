const DAY=86400000;
export const priceCurrencyRule='Przeliczenie według ostatniej tabeli A NBP opublikowanej przed dniem sesji. To cena przeliczona, a nie notowanie na innym rynku.';
export function quoteCurrency(stock,choice='native'){
 if(!['native','USD','PLN'].includes(choice))throw new Error('Nieobsługiwana waluta prezentacji.');
 return choice==='native'?stock.currency:choice;
}
export function quoteUnit(stock,choice='native'){
 const currency=quoteCurrency(stock,choice);
 return stock.kind==='futures'?(stock.unit||`${stock.currency} / kontrakt`).replace(stock.currency,currency):currency;
}
export function priceFxRate(fx,from,to,date){
 if(from===to)return {rate:1,date:null};
 const rows=fx?.rows||[];let lo=0,hi=rows.length;
 while(lo<hi){const mid=(lo+hi)>>>1;if(rows[mid].date<date)lo=mid+1;else hi=mid;}
 const row=rows[lo-1],source=from==='PLN'?1:row?.[from],target=to==='PLN'?1:row?.[to];
 if(!row||!Number.isFinite(source)||source<=0||!Number.isFinite(target)||target<=0)throw new Error(`Brak kursu ${from}/${to} dostępnego przed ${date}.`);
 if((Date.parse(date)-Date.parse(row.date))/DAY>10)throw new Error(`Kurs NBP jest zbyt stary dla ${date}. Odśwież dane.`);
 return {rate:source/target,date:row.date};
}
export function priceStartDate(stock,fx,choice='native'){
 const first=stock?.rows?.[0]?.[0];if(!first)return '';
 const target=quoteCurrency(stock,choice);if(target===stock.currency)return first;
 const row=fx?.rows?.find(r=>[stock.currency,target].every(c=>c==='PLN'||Number.isFinite(r[c])&&r[c]>0));
 if(!row)return first; // The calculation returns a specific missing-rate error.
 return [first,new Date(Date.parse(row.date)+DAY).toISOString().slice(0,10)].sort().at(-1);
}
export function priceQuotes(stock,fx,start,end,choice='native'){
 const currency=quoteCurrency(stock,choice),converted=currency!==stock.currency;
 const rows=stock.rows.filter(r=>r[0]>=start&&r[0]<=end).map(row=>{
  const conversion=priceFxRate(fx,stock.currency,currency,row[0]);
  return {date:row[0],close:row[1]*conversion.rate,nominal:Number.isFinite(row[2])?row[2]*conversion.rate:null,originalClose:row[1],originalNominal:row[2]??null,sourceCurrency:stock.currency,currency,fxRate:conversion.rate,fxDate:conversion.date};
 });
 return {rows,currency,converted,unit:quoteUnit(stock,choice),methodology:converted?priceCurrencyRule:'Ceny w oryginalnej walucie notowania. Bez przeliczenia walutowego.'};
}
