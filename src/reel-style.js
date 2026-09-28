export const reelFonts = [
 {id:'arial',name:'Arial · prosta',family:'Arial, Helvetica, sans-serif'},
 {id:'georgia',name:'Georgia · redakcyjna',family:'Georgia, "Times New Roman", serif'},
 {id:'verdana',name:'Verdana · czytelna',family:'Verdana, Geneva, sans-serif'},
 {id:'trebuchet',name:'Trebuchet MS · miękka',family:'"Trebuchet MS", Arial, sans-serif'},
 {id:'impact',name:'Impact · wyrazista',family:'Impact, "Arial Narrow", sans-serif'},
 {id:'courier',name:'Courier New · maszynowa',family:'"Courier New", Courier, monospace'}
];
export const reelFont = id => (reelFonts.find(f=>f.id===id)||reelFonts[0]).family;

// Shared by the preview, PNG cover and video frames in all three studios.
export function drawSignature(ctx,width,height,fontId,dark){
 const family=reelFont(fontId);
 ctx.save();ctx.globalAlpha=1;ctx.textAlign='center';ctx.textBaseline='alphabetic';
 ctx.fillStyle=dark?'#e5e9e2':'#343d32';ctx.font=`bold 28px ${family}`;
 ctx.fillText('Jakub Bilski',width/2,height-60);
 ctx.fillStyle=dark?'#adb5af':'#616a62';ctx.font=`24px ${family}`;
 ctx.fillText('X: @jakub_bilski  ·  IG: jakub__bilski',width/2,height-27);
 ctx.restore();
}
