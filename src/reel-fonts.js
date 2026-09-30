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

