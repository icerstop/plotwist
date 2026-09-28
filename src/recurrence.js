const DAY=86_400_000;
export const frequencies=[
 {id:'daily',label:'Codziennie',phrase:'dziennie',short:'dzień',en:'day'},
 {id:'weekly',label:'Raz w tygodniu',phrase:'co tydzień',short:'tydz.',en:'week'},
 {id:'monthly',label:'Raz w miesiącu',phrase:'co miesiąc',short:'mies.',en:'month'},
 {id:'quarterly',label:'Raz na kwartał',phrase:'co kwartał',short:'kw.',en:'quarter'}
];
export const frequencyPhrase=id=>(frequencies.find(f=>f.id===id)||frequencies[0]).phrase;
export const scheduleRule='Pierwszy termin to data początkowa. Tydzień = 7 dni, miesiąc = 1 miesiąc kalendarzowy, kwartał = 3 miesiące. Jeśli brakuje dnia miesiąca, wybieramy jego ostatni dzień, bez przesuwania kolejnych terminów.';
export function recurringDays(first,last,frequency='daily'){
 if(!frequencies.some(f=>f.id===frequency))throw new Error('Nieprawidłowa częstotliwość.');
 if(!Number.isInteger(first)||!Number.isInteger(last)||last<first)throw new Error('Nieprawidłowy zakres harmonogramu.');
 const days=new Set();
 if(frequency==='daily'||frequency==='weekly'){
  for(let day=first;day<=last;day+=frequency==='weekly'?7:1)days.add(day);
 }else{
  const anchor=new Date(first*DAY),step=frequency==='quarterly'?3:1;
  for(let i=0;;i++){
   const target=new Date(first*DAY);target.setUTCDate(1);target.setUTCMonth(anchor.getUTCMonth()+step*i);
   const monthEnd=new Date(target);monthEnd.setUTCMonth(target.getUTCMonth()+1,0);
   target.setUTCDate(Math.min(anchor.getUTCDate(),monthEnd.getUTCDate()));
   const day=target.getTime()/DAY;if(day>last)break;days.add(day);
  }
 }
 return days;
}
export function periodAmount(amount,frequency='daily',language='pl'){
 const f=frequencies.find(f=>f.id===frequency)||frequencies[0];
 const n=Number(amount).toLocaleString(language==='en'?'en-GB':'pl-PL',{maximumFractionDigits:2});
 return language==='en'?`PLN ${n}/${f.en}`:`${n} zł/${f.short}`;
}
