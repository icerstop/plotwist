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
 ['VOLV-B.ST','Volvo','Szwecja','SEK'],['EQNR.OL','Equinor','Norwegia','NOK'],
 ['CSCO','Cisco','USA','USD'],['IBM','IBM','USA','USD'],['ADBE','Adobe','USA','USD'],['CRM','Salesforce','USA','USD'],['MU','Micron','USA','USD'],['PLTR','Palantir','USA','USD'],
 ['JPM','JPMorgan Chase','USA','USD'],['BAC','Bank of America','USA','USD'],['C','Citigroup','USA','USD'],['GS','Goldman Sachs','USA','USD'],['BRK-B','Berkshire Hathaway B','USA','USD'],
 ['XOM','Exxon Mobil','USA','USD'],['CVX','Chevron','USA','USD'],['LMT','Lockheed Martin','USA','USD'],['BA','Boeing','USA','USD'],
 ['GME','GameStop','USA','USD'],['ZM','Zoom','USA','USD'],['MRNA','Moderna','USA','USD'],['PFE','Pfizer','USA','USD'],['DAL','Delta Air Lines','USA','USD'],['CCL','Carnival','USA','USD'],['DIS','Walt Disney','USA','USD'],['UBER','Uber','USA','USD'],['ABNB','Airbnb','USA','USD'],['COIN','Coinbase','USA','USD'],
 ['KGH.WA','KGHM','Polska','PLN'],['PZU.WA','PZU','Polska','PLN'],['PEO.WA','Bank Pekao','Polska','PLN'],['LPP.WA','LPP','Polska','PLN'],['DNP.WA','Dino Polska','Polska','PLN'],['ALE.WA','Allegro','Polska','PLN'],
 ['JSW.WA','JSW','Polska','PLN'],['LWB.WA','Bogdanka','Polska','PLN'],['PGE.WA','PGE','Polska','PLN'],['TPE.WA','Tauron','Polska','PLN'],['ENA.WA','Enea','Polska','PLN'],['CCC.WA','CCC','Polska','PLN'],['XTB.WA','XTB','Polska','PLN'],['11B.WA','11 bit studios','Polska','PLN'],['MBK.WA','mBank','Polska','PLN'],
 ['RHM.DE','Rheinmetall','Niemcy','EUR'],['VOW3.DE','Volkswagen · akcje uprzywilejowane','Niemcy','EUR'],['DBK.DE','Deutsche Bank','Niemcy','EUR'],['NOKIA.HE','Nokia','Finlandia','EUR'],['ERIC-B.ST','Ericsson B','Szwecja','SEK'],
 ['TSM','TSMC · ADR','Tajwan','USD'],['BABA','Alibaba · ADR','Chiny','USD'],['SONY','Sony · ADR','Japonia','USD'],['TM','Toyota · ADR','Japonia','USD'],['VALE','Vale · ADR','Brazylia','USD']
].map(([symbol,name,country,currency])=>({symbol,name,country,currency,region:country==='Polska'?'Polska':country==='USA'?'USA':['Tajwan','Chiny','Japonia','Brazylia'].includes(country)?'Świat':'Europa'}));
