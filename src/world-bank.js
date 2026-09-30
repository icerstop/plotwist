import countries from './world-bank-countries.json' with {type:'json'};
export const countryByCode=new Map(countries.map(c=>[c.id,c]));
export const comparisonGroups=[
 {id:'central-europe',pl:'Europa Środkowa',en:'Central Europe',codes:['POL','CZE','SVK','HUN','ROU','BGR']},
 {id:'poland-west',pl:'Polska i Zachód',en:'Poland and the West',codes:['POL','DEU','AUT','FRA','GBR','ESP']},
 {id:'asia',pl:'Gospodarki azjatyckie',en:'Asian economies',codes:['CHN','JPN','KOR','SGP','VNM','IND']},
 {id:'baltics',pl:'Polska i kraje bałtyckie',en:'Poland and the Baltics',codes:['POL','EST','LVA','LTU','FIN','SWE']}
];
export const regions=[
 ['ECS','Europa i Azja Centralna','Europe & Central Asia'],['EAS','Azja Wschodnia i Pacyfik','East Asia & Pacific'],['SAS','Azja Południowa','South Asia'],['NAC','Ameryka Północna','North America'],['LCN','Ameryka Łacińska i Karaiby','Latin America & Caribbean'],['MEA','Bliski Wschód i Afryka Północna, Afganistan i Pakistan','Middle East & North Africa, Afghanistan & Pakistan'],['SSF','Afryka Subsaharyjska','Sub-Saharan Africa'],['aggregates','Agregaty World Bank','World Bank aggregates'],['historical','Historyczne państwa i regiony','Historical states and regions']
];
export function filterGeographicSeries(series,{region='',group='',year=''}={}){
 const codes=comparisonGroups.find(g=>g.id===group)?.codes;
 return series.filter(s=>(!region||s.region===region)&&(!codes||codes.includes(s.countryCode))&&(!year||s.observationYears?.includes(Number(year))));
}
export function countryCoverage(snapshot){
 const result=new Map();
 for(const r of snapshot?.rows||[])if(Number.isFinite(r.value)){const previous=result.get(r.country);result.set(r.country,{first:Math.min(r.year,previous?.first??r.year),last:Math.max(r.year,previous?.last??r.year)});}
 return result;
}
