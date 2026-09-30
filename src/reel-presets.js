import {normalizeDesign} from './reel-design.js';

export const reelPresets=[
 {id:'journal',name:'Dziennik',description:'Szeryfowy tytuł, biel i granat',font:'georgia',theme:'light',layout:'classic',chart:{palette:'ocean',lineWidth:5,gridOpacity:60},text:{title:{size:90,weight:'normal'}}},
 {id:'terminal',name:'Terminal',description:'Zieleń, techniczny krój i kreski',font:'courier',theme:'terminal',layout:'compact',chart:{palette:'original',lineWidth:4,grid:'both',gridStyle:'dashed',gridOpacity:40},text:{title:{size:90},date:{color:'#81efae'}}},
 {id:'paper',name:'Notatnik',description:'Ciepły papier i ziemiste barwy',font:'lora',theme:'paper',layout:'inset',chart:{palette:'earth',lineWidth:5,gridStyle:'dotted',gridOpacity:70},text:{title:{size:90,italic:true}}},
 {id:'neon',name:'Po zmroku',description:'Świetliste linie na granatowym tle',font:'manrope',theme:'navy',layout:'compact',chart:{palette:'electric',lineWidth:7,glow:18,gridOpacity:35,fillStyle:'fade',fillOpacity:30},text:{title:{size:95,shadow:'glow',shadowColor:'#557ecc',shadowBlur:20}}},
 {id:'poster',name:'Plakat',description:'Mocny tytuł, grube linie, bez siatki',font:'inter',theme:'plum',layout:'classic',chart:{palette:'jewel',lineWidth:12,grid:'none',ticks:3,radius:18},text:{title:{fontId:'impact',size:115,shadow:'hard',shadowColor:'#100c1f',shadowX:5,shadowY:6}}},
 {id:'minimal',name:'Esencja',description:'Dużo miejsca dla danych',font:'inter',theme:'light',layout:'minimal',chart:{palette:'mono-blue',lineWidth:4,gridOpacity:35,ticks:4},text:{title:{size:90,weight:'normal'},subtitle:{size:90}}},
 {id:'pastel',name:'Lawenda',description:'Symetria, miękkie tło i kolory',font:'manrope',theme:'lavender',layout:'centered',chart:{palette:'jewel',lineWidth:6,radius:24,gridOpacity:45,plotPanel:true},text:{title:{size:90},subtitle:{size:90}}},
 {id:'news',name:'Serwis',description:'Kontrastowa oprawa informacji',font:'manrope',theme:'editorial',layout:'classic',chart:{palette:'accessible',lineWidth:6,gridOpacity:60,radius:8},text:{title:{size:85},date:{color:'#ffffff',boxColor:'#173b65',padding:14,radius:4}}},
];
// Presets replace appearance only. Data, language, chart type and media stay intact.
export function applyReelPreset(visuals,id){
 const p=reelPresets.find(p=>p.id===id);if(!p)return visuals;
 return {...visuals,fontId:p.font,design:normalizeDesign({theme:p.theme,layout:p.layout,chart:p.chart,text:p.text,preset:p.id,metricLabels:visuals.design.metricLabels,legendMode:visuals.design.legendMode}),background:{...visuals.background,type:'theme',veil:0,pattern:'none',animate:false}};
}
