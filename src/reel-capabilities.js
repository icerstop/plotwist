// Shared editor contract. Renderers opt into features; panels never invent a
// chart type when the current renderer is not a Cartesian plot.
export const reelElementDefinitions={
 mark:{name:'Logo rolki'},title:{name:'Tytuł'},subtitle:{name:'Opis pod tytułem'},metric:{name:'Wspólny wskaźnik'},
 content:{name:'Wykres i legenda'},date:{name:'Data / rok'},source:{name:'Źródła i metodologia'},signature:{name:'Podpis autora'},
 summary:{name:'Liczniki i podsumowanie',textRole:'values',textRoles:['labels','values']},plot:{name:'Oś czasu / kalendarz',textRole:'labels',textRoles:['labels']},
 distribution:{name:'Słupki miesięczne',textRole:'labels',textRoles:['labels']},detail:{name:'Karta ostatniego zdarzenia',textRole:'labels',textRoles:['labels']}
};
export function reelCapabilities(config={}){
 const release=!!config.releases,mode=release?config.releases.mode:config.ai?.mode||config.chart||'line';
 const plot=!release&&['line','area','bar','records','scatter'].includes(mode);
 const ids=[...(config.visuals?.logo?.type&&config.visuals.logo.type!=='none'?['mark']:[]),'title','subtitle',...(!release&&config.metricCaption?['metric']:[]),'content','date','source','signature',...(release?['summary','plot',...(mode==='pulse'?['distribution']:[]),'detail']:[])];
 return {
  elements:ids.map(id=>({id,...reelElementDefinitions[id],...(release&&id==='plot'?{name:({cards:'Historia kart',heatmap:'Mapa aktywności',gaps:'Odstępy między premierami'})[mode]||reelElementDefinitions.plot.name}:{})})),
  motionElements:ids.filter(id=>id!=='source'&&(id!=='mark'||config.visuals?.logo?.type&&config.visuals.logo.type!=='none')),
  plot,line:release?mode==='pulse':['line','area','records'].includes(mode),
  bars:release?['pulse','gaps'].includes(mode):['bar','ranking'].includes(mode),cards:release||['cards','duel'].includes(mode)||config.ai?.groupBy==='brand'&&mode==='timeline',
  scaleCaption:!release,modelLabels:!!config.ai,
  legend:!release&&plot&&(!config.ai||config.ai.groupBy==='brand'&&mode==='records'),
  legendOptions:!release&&!config.ai,
  endLabels:!release&&(!config.ai&&['line','area'].includes(mode)||config.ai?.groupBy==='brand'&&mode==='records'),
  plotDimensions:plot,mode
 };
}
