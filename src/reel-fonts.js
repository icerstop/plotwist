import {bundledFonts} from './font-catalog.js';
export const reelFontGroups=[{id:'sans',name:'Proste · bezszeryfowe'},{id:'serif',name:'Szeryfowe · redakcyjne'},{id:'display',name:'Tytułowe · wyraziste'},{id:'handwriting',name:'Odręczne · pisane'},{id:'mono',name:'Maszynowe · techniczne'}];
export const reelFonts = [
 {id:'arial',name:'Arial · prosta',family:'Arial, Helvetica, sans-serif',group:'sans'},
 {id:'georgia',name:'Georgia · redakcyjna',family:'Georgia, "Times New Roman", serif',group:'serif'},
 {id:'libre-baskerville',name:'Libre Baskerville',family:'"Libre Baskerville", Georgia, serif',face:'Libre Baskerville',file:'/fonts/libre-baskerville/LibreBaskerville-Variable.ttf',weight:'400 700',group:'serif'},
 {id:'verdana',name:'Verdana · czytelna',family:'Verdana, Geneva, sans-serif',group:'sans'},
 {id:'trebuchet',name:'Trebuchet MS · miękka',family:'"Trebuchet MS", Arial, sans-serif',group:'sans'},
 {id:'impact',name:'Impact · wyrazista',family:'Impact, "Arial Narrow", sans-serif',group:'display'},
 {id:'courier',name:'Courier New · maszynowa',family:'"Courier New", Courier, monospace',group:'mono'},
 ...bundledFonts
];
export const reelFont = id => (reelFonts.find(f=>f.id===id)||reelFonts[0]).family;

export const fontWeightNames={100:'Cienka',200:'Bardzo lekka',300:'Lekka',400:'Zwykła',500:'Średnia',600:'Półgruba',700:'Pogrubiona',800:'Bardzo gruba',900:'Ciężka',1000:'Maksymalna'};
export function normalizeFontWeight(value){
 if(value==='normal')return 400;if(value==='bold')return 700;
 if((typeof value==='number'||typeof value==='string'&&/^\d+$/.test(value))&&Number.isInteger(Number(value))&&Number(value)>=100&&Number(value)<=1000)return Number(value);
 return 'auto';
}
// Offer only weights present in the bundled faces. System fonts use regular/bold.
const weightsByFont=new Map(reelFonts.map(font=>{
 const ranges=(font.files||[{weight:font.weight||'400 700'}]).map(file=>String(file.weight||400).split(/\s+/).map(Number));
 const weights=font.file||font.files?.length?[...new Set(ranges.flatMap(([min,max=min])=>[min,...Object.keys(fontWeightNames).map(Number).filter(w=>w>=min&&w<=max),max]))].sort((a,b)=>a-b):[400,700];
 return [font.id,weights];
}));
export const fontWeights=id=>weightsByFont.get(id)||weightsByFont.get('arial');
export function nearestFontWeight(id,value){
 const weight=normalizeFontWeight(value);if(weight==='auto')return weight;
 return fontWeights(id).reduce((best,next)=>Math.abs(next-weight)<Math.abs(best-weight)?next:best);
}

