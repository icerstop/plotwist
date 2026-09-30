// Coordinates of the AI content band. Fonts scale separately, so switching
// aspect ratio never stretches letters, logos, or the entire canvas.
export function aiFrameLayout(format='9:16'){
 const height=format==='4:5'?1350:format==='1:1'?1080:1920;
 const compact=height<1920,start=height===1350?430:height===1080?310:690,end=compact?height-205:1690,ratio=(end-start)/1000;
 return {height,compact,start,end,textScale:height===1350?.88:height===1080?.78:1,y:value=>start+(value-690)*ratio,gap:value=>value*ratio,titleY:height===1350?120:height===1080?105:304,titleHeight:height===1350?170:height===1080?115:270};
}
