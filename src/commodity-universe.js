export const commodityUniverse = [
  {symbol:'GC=F',name:'Złoto · futures',kind:'futures',unit:'USD / uncja trojańska',color:'#dba93a'},
  {symbol:'SI=F',name:'Srebro · futures',kind:'futures',unit:'USD / uncja trojańska',color:'#91a8bd'},
  {symbol:'CL=F',name:'Ropa WTI · futures',kind:'futures',unit:'USD / baryłka',color:'#e58c52'},
  {symbol:'GLD',name:'Złoto · fundusz GLD',kind:'fund',unit:'USD / udział',color:'#dba93a',productUrl:'https://www.spdrgoldshares.com/usa/gld/'},
  {symbol:'SLV',name:'Srebro · fundusz SLV',kind:'fund',unit:'USD / udział',color:'#91a8bd',productUrl:'https://www.ishares.com/us/products/239855/ishares-silver-trust-fund'},
  {symbol:'USO',name:'Ropa WTI · fundusz USO',kind:'fund',unit:'USD / udział',color:'#e58c52',productUrl:'https://www.uscfinvestments.com/uso'}
].map(item=>({...item,file:`${item.symbol.replace('=','-')}.json`,currency:'USD',country:'USA',region:'Surowce'}));
