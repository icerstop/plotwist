// This is a curated catalogue, not a claim to cover every listed security.
export const marketUniverse = [
 ['NVDA','NVIDIA','USA','USD'],['AAPL','Apple','USA','USD'],['MSFT','Microsoft','USA','USD'],['GOOGL','Alphabet','USA','USD'],
 ['AMZN','Amazon','USA','USD'],['META','Meta','USA','USD'],['TSLA','Tesla','USA','USD'],['AMD','AMD','USA','USD'],
 ['INTC','Intel','USA','USD'],['KO','Coca-Cola','USA','USD'],['PEP','PepsiCo','USA','USD'],['NFLX','Netflix','USA','USD'],['ORCL','Oracle','USA','USD'],['AVGO','Broadcom','USA','USD'],
 ['SAP.DE','SAP','Niemcy','EUR'],['SIE.DE','Siemens','Niemcy','EUR'],['BMW.DE','BMW','Niemcy','EUR'],['ALV.DE','Allianz','Niemcy','EUR'],
 ['ASML.AS','ASML','Holandia','EUR'],['ADYEN.AS','Adyen','Holandia','EUR'],
 ['MC.PA','LVMH','Francja','EUR'],['OR.PA',"L’Oréal",'Francja','EUR'],['AIR.PA','Airbus','Francja','EUR'],['TTE.PA','TotalEnergies','Francja','EUR'],
 ['SHEL.L','Shell','Wielka Brytania','GBP'],['AZN.L','AstraZeneca','Wielka Brytania','GBP'],['ULVR.L','Unilever','Wielka Brytania','GBP'],
 ['NESN.SW','Nestlé','Szwajcaria','CHF'],['NOVN.SW','Novartis','Szwajcaria','CHF'],['ROG.SW','Roche','Szwajcaria','CHF'],
 ['NOVO-B.CO','Novo Nordisk','Dania','DKK'],['ENEL.MI','Enel','Włochy','EUR'],['RACE.MI','Ferrari','Włochy','EUR'],
 ['SAN.MC','Santander','Hiszpania','EUR'],['ITX.MC','Inditex','Hiszpania','EUR'],
 ['CDR.WA','CD Projekt','Polska','PLN'],['PKO.WA','PKO BP','Polska','PLN'],['PKN.WA','Orlen','Polska','PLN'],
 ['VOLV-B.ST','Volvo','Szwecja','SEK'],['EQNR.OL','Equinor','Norwegia','NOK']
].map(([symbol,name,country,currency])=>({symbol,name,country,currency,region:country==='USA'?'USA':'Europa'}));
