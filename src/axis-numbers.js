const powers={thousand:3,million:6,billion:9,trillion:12};
const prefixes={pl:['','tys.','mln','mld','bln'],en:['','k','m','bn','tn']};
const sourcePowers={'tys':3,'tys.':3,thousand:3,thousands:3,k:3,mln:6,million:6,millions:6,m:6,mld:9,billion:9,billions:9,bn:9,bln:12,trillion:12,trillions:12,tn:12};

// Only a leading numerator prefix (or currency + prefix) changes the magnitude.
// "USD / million tokens" and "applications / million people" must stay intact.
export function axisSourceUnit(unit=''){
 const text=String(unit).trim(),match=text.match(/^(?:(USD|EUR|PLN|GBP|JPY|CHF|CNY)\s+)?(tys\.?|mln|mld|bln|thousands?|millions?|billions?|trillions?|bn|tn|k|m)(?=\s|$)\s*/i);
 if(!match||!match[1]&&['m','k'].includes(match[2].toLowerCase()))return {power:0,base:text,original:text};
 return {power:sourcePowers[match[2].toLowerCase()],base:[match[1],text.slice(match[0].length)].filter(Boolean).join(' '),original:text};
}

export function axisNumberFormat(config={},reference={min:0,max:1},ticks=[],{minimumAutoDecimals=0}={}){
 const s=config.visuals?.design?.chart||{},language=config.language==='en'?'en':'pl',locale=language==='en'?'en-GB':'pl-PL';
 const source=axisSourceUnit(config.ai?.benchmark?.unit??config.unit),mode=s.axisNumbers||'auto',placement=s.axisUnitPosition||'caption';
 const magnitude=Math.max(Math.abs(reference.min||0),Math.abs(reference.max||0));
 // One prefix for the whole reel, independent of its current animation frame.
 const autoPower=magnitude>0?Math.max(source.power,Math.min(12,Math.max(0,Math.floor((Math.log10(magnitude)+source.power)/3)*3))):source.power;
 const power=mode==='auto'?autoPower:powers[mode]??source.power,divisor=10**(power-source.power),prefix=prefixes[language][power/3];
 const unit=mode==='full'||mode==='scientific'?source.original:[prefix,source.base].filter(Boolean).join(' ');
 const scaled=ticks.map(v=>v/divisor).filter(Number.isFinite).sort((a,b)=>a-b),gaps=scaled.slice(1).map((v,i)=>v-scaled[i]).filter(v=>v>0);
 const step=gaps.length?Math.min(...gaps):Math.abs(magnitude/divisor)||1;
 const autoDecimals=mode==='scientific'?2:Math.min(20,Math.max(minimumAutoDecimals,2-Math.floor(Math.log10(step))));
 const decimals=s.axisDecimals==='auto'||s.axisDecimals==null?autoDecimals:Number(s.axisDecimals);
 const number=new Intl.NumberFormat(locale,{notation:mode==='scientific'?'scientific':'standard',useGrouping:s.axisGrouping!==false,maximumFractionDigits:Math.min(20,Math.max(0,decimals))});
 const threshold=10**-decimals;
 const format=value=>{
  const n=value/divisor;
  if(!Number.isFinite(n))return '—';
  // User-selected coarse precision never turns a nonzero value into a fake zero.
  const text=n!==0&&Math.abs(n)<threshold/2&&mode!=='scientific'?(n<0?'>−':'<')+number.format(threshold):number.format(Object.is(n,-0)?0:n);
  return text+(placement==='ticks'&&prefix&&!['full','scientific'].includes(mode)?` ${prefix}`:'');
 };
 const custom=String(s.axisUnitLabel||'').trim();
 const caption=placement==='caption'?(custom||(unit?`${language==='en'?'Y axis':'Oś Y'}: ${unit}`:'')):'';
 return {format,caption,unit,divisor,power,decimals};
}

// Preserve the chosen notation. Fit the label instead of switching to scientific.
export function drawAxisNumber(ctx,text,x,y,width){
 ctx.save();const font=ctx.font,match=font.match(/([\d.]+)px/),size=match?Number(match[1]):25;
 const measured=ctx.measureText(text).width;
 if(measured>width)ctx.font=font.replace(/([\d.]+)px/,`${Math.max(15,size*width/measured)}px`);
 ctx.fillText(text,x,y,width);ctx.restore();
}

// Give the unit priority; secondary camera/scale information has its own space.
export function drawAxisCaption(ctx,unit,scale,x,y,width){
 ctx.save();ctx.textAlign='left';
 if(unit&&scale){
  const font=ctx.font;ctx.font=font.replace(/([\d.]+)px/,(_,size)=>`${Number(size)*.75}px`);
  const scaleWidth=Math.min(width*.46,ctx.measureText(scale).width);
  ctx.textAlign='right';ctx.fillText(scale,x+width,y,scaleWidth);
  ctx.textAlign='left';ctx.font=font;ctx.fillText(unit,x,y,width-scaleWidth-24);
 }else if(unit||scale)ctx.fillText(unit||scale,x,y,width);
 ctx.restore();
}
