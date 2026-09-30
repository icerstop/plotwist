import flags from './series-flags.json' with {type:'json'};
import companies from './series-company-logos.json' with {type:'json'};

const aggregateAliases={WLD:'world',World:'world','Świat':'world',EUU:'eu',EU:'eu','European Union':'eu','Unia Europejska':'eu'};
const aggregateBadges={world:{kind:'logo',path:'/logos/regions/world.svg'},eu:{kind:'flag',path:'/logos/flags/eu.svg'}};
// Resolve metadata only. Renaming a line never changes its country or brand.
export function seriesBadge(series){
 if(Object.hasOwn(series,'logo'))return series.logo?{kind:'logo',path:series.logo}:null;
 const entity=series.countryCode||series.entity,aggregate=aggregateBadges[aggregateAliases[entity]];
 if(aggregate)return aggregate;
 const flag=flags[entity];
 if(flag)return {kind:'flag',path:`/logos/flags/${flag}.svg`};
 const symbol=series.symbol||({apple:'AAPL',nvidia:'NVDA'}[series.topicId]);
 const path=companies[symbol]||(series.topicId==='cloud'?{amazon:companies.AMZN,alphabet:companies.GOOGL,microsoft:companies.MSFT}[series.entity?.toLowerCase()]:null);
 return path?{kind:'logo',path}:null;
}
