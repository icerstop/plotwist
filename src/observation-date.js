import {displayDate} from './market.js';
export function observationPeriod(point,language='pl'){
 if(!point)return '';
 if(point.datePrecision==='year')return point.date.slice(0,4);
 if(point.datePrecision==='fiscal-year')return `FY${point.fiscalYear||point.date.slice(0,4)}`;
 if(point.datePrecision==='quarter')return point.period;
 if(point.datePrecision==='month')return point.date.slice(0,7);
 return point.date;
}
export function timelineDate(day,config={}){
 const dt=new Date(Math.floor(day)*86400000);
 if(config.datePrecision==='year')return String(dt.getUTCFullYear());
 if(config.datePrecision==='fiscal-year')return `FY${dt.getUTCFullYear()}`;
 if(config.datePrecision==='quarter')return `${dt.getUTCFullYear()} Q${Math.floor(dt.getUTCMonth()/3)+1}`;
 if(config.datePrecision==='month')return dt.toISOString().slice(0,7);
 return displayDate(day,config.language);
}
