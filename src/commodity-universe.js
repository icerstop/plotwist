// Futures are provider contract histories, not spot prices. US-cent quotes are
// converted to USD on import so dollar and cent denominations never get mixed.
const futures = [
 ['GC=F','Złoto','uncja trojańska','#dba93a'],['SI=F','Srebro','uncja trojańska','#91a8bd'],
 ['CL=F','Ropa WTI','baryłka','#e58c52'],['BZ=F','Ropa Brent','baryłka','#cc6859'],
 ['NG=F','Gaz ziemny Henry Hub','MMBtu','#50c9d8'],['HG=F','Miedź','funt','#cf8656'],
 ['PL=F','Platyna','uncja trojańska','#b8bad2'],['PA=F','Pallad','uncja trojańska','#8fadac'],
 ['ZC=F','Kukurydza','buszel','#f2cc60'],['ZW=F','Pszenica','buszel','#d6af69'],['ZS=F','Soja','buszel','#9fb65d'],
 ['KC=F','Kawa','funt','#bd8b71'],['CC=F','Kakao','tona metryczna','#b28664'],['SB=F','Cukier','funt','#e3becb'],['CT=F','Bawełna','funt','#c6d9de']
].map(([symbol,name,unit,color])=>({symbol,name:`${name} · futures`,kind:'futures',unit:`USD / ${unit}`,color,country:'USA',region:'Świat',currency:'USD'}));
const funds = [
 ['GLD','Złoto · fundusz GLD','#dba93a','https://www.spdrgoldshares.com/usa/gld/'],
 ['SLV','Srebro · fundusz SLV','#91a8bd','https://www.ishares.com/us/products/239855/ishares-silver-trust-fund'],
 ['USO','Ropa WTI · fundusz USO','#e58c52','https://www.uscfinvestments.com/uso'],
 ['UNG','Gaz ziemny · fundusz UNG','#50c9d8','https://www.uscfinvestments.com/ung'],
 ['CPER','Miedź · fundusz CPER','#cf8656','https://www.uscfinvestments.com/cper'],
 ['DBA','Rolnictwo · fundusz DBA','#9fb65d','https://www.invesco.com/us/financial-products/etfs/product-detail?productId=DBA'],
 ['DBC','Koszyk surowców · fundusz DBC','#cbae6b','https://www.invesco.com/us/financial-products/etfs/product-detail?productId=DBC']
].map(([symbol,name,color,productUrl])=>({symbol,name,color,productUrl,kind:'fund',unit:'USD / udział',country:'USA',region:'USA',currency:'USD'}));
const etfs = [
 ['SPY','SPDR S&P 500','USA','USD'],['QQQ','Invesco Nasdaq-100','USA','USD'],['DIA','SPDR Dow Jones Industrial Average','USA','USD'],['IWM','iShares Russell 2000','USA','USD'],
 ['VTI','Vanguard Total Stock Market','USA','USD'],['VT','Vanguard Total World Stock','USA','USD'],['EEM','iShares MSCI Emerging Markets','USA','USD'],['EWJ','iShares MSCI Japan','USA','USD'],['EPOL','iShares MSCI Poland','USA','USD'],
 ['TLT','iShares 20+ Year Treasury Bond','USA','USD'],['IEF','iShares 7–10 Year Treasury Bond','USA','USD'],['AGG','iShares Core US Aggregate Bond','USA','USD'],
 ['XLK','Technology Select Sector SPDR','USA','USD'],['XLF','Financial Select Sector SPDR','USA','USD'],['XLE','Energy Select Sector SPDR','USA','USD'],['XLV','Health Care Select Sector SPDR','USA','USD'],
 ['SMH','VanEck Semiconductor','USA','USD'],['ICLN','iShares Global Clean Energy','USA','USD'],['ARKK','ARK Innovation','USA','USD'],
 ['VWCE.DE','Vanguard FTSE All-World UCITS · Acc','Niemcy','EUR'],['IWDA.AS','iShares Core MSCI World UCITS · Acc','Holandia','EUR'],['SXR8.DE','iShares Core S&P 500 UCITS · Acc','Niemcy','EUR'],
 ['ETFBW20TR.WA','BETA ETF WIG20TR','Polska','PLN'],['ETFBM40TR.WA','BETA ETF mWIG40TR','Polska','PLN'],['ETFBS80TR.WA','BETA ETF sWIG80TR','Polska','PLN']
].map(([symbol,name,country,currency],i)=>({symbol,name,country,currency,kind:'etf',unit:`${currency} / udział`,region:country==='Polska'?'Polska':country==='USA'?'USA':'Europa',color:['#6aa6ff','#b18aff','#50c9d8','#edaa62','#de82b9'][i%5]}));
// Country/region refers to the listing for funds; the name describes exposure.
export const commodityUniverse=[...futures,...funds,...etfs].map(item=>({...item,file:`${item.symbol.replace('=','-')}.json`}));
