import {periodAmount} from './recurrence.js';
import {translate} from './translations.js';
import {resolveSeriesLabels} from './story-labels.js';
export function localizeReelConfig(config,language='pl'){
 const t=value=>translate(value,language);
 const source=config.sourceIsCustom?`${t('Źródło:')} ${config.source.slice('Źródło:'.length).trimStart()}`:t(config.source);
 const labels=resolveSeriesLabels(config.series,language,config.visuals?.design);
 return {...config,language,title:config.titleIsCustom?config.title:t(config.title),subtitle:config.subtitleParts?config.subtitleParts.map(p=>p.custom?p.text:t(p.text)).join(' · '):config.subtitleIsCustom?config.subtitle:t(config.subtitle),source,
  unit:config.unitIsCustom?config.unit:t(config.unit),commonMetric:labels.commonMetric,metricCaption:labels.metricCaption,metricCaptionIsCustom:labels.metricCaptionIsCustom,series:config.series?labels.series.map(s=>({...s,scheduleText:s.schedule?periodAmount(s.schedule.amount,s.schedule.frequency,language):undefined})):undefined,
  ...(config.ai?{ai:{...config.ai,scope:t(config.ai.scope),benchmark:config.ai.benchmark?{...config.ai.benchmark,name:t(config.ai.benchmark.name),unit:t(config.ai.benchmark.unit),caveat:t(config.ai.benchmark.caveat),baseline:config.ai.benchmark.baseline?{...config.ai.benchmark.baseline,name:t(config.ai.benchmark.baseline.name),note:t(config.ai.benchmark.baseline.note)}:null}:null}}:{})};
}
