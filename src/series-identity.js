import flags from './series-flags.json' with {type:'json'};
import companies from './series-company-logos.json' with {type:'json'};

// Resolve metadata only. Renaming a line never changes its country or brand.
export function seriesBadge(series){
 if(Object.hasOwn(series,'logo'))return series.logo?{kind:'logo',path:series.logo}:null;
 const flag=flags[series.countryCode||series.entity];
 if(flag)return {kind:'flag',path:`/logos/flags/${flag}.svg`};
 const symbol=series.symbol||({apple:'AAPL',nvidia:'NVDA'}[series.topicId]);
 const path=companies[symbol]||(series.topicId==='cloud'?{amazon:companies.AMZN,alphabet:companies.GOOGL,microsoft:companies.MSFT}[series.entity?.toLowerCase()]:null);
 return path?{kind:'logo',path}:null;
}
