const num=(v,f,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):f;
const hex=(v,f=null)=>/^#[0-9a-f]{6}$/i.test(v||'')?v:f;
export function releaseStockLabels(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 return {endLabels:raw.endLabels!==false,endLabelIcons:raw.endLabelIcons!==false,endLabelNames:raw.endLabelNames===true,endLabelValues:raw.endLabelValues!==false,endLabelDates:raw.endLabelDates===true,endLabelSize:num(raw.endLabelSize??100,100,75,140)};
}
export function normalizeReleaseAppearance(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 return {linkAxes:raw.linkAxes!==false,laneLabelGap:num(raw.laneLabelGap??12,12,0,100),stockLabels:releaseStockLabels(raw.stockLabels),stockLabelPosition:raw.stockLabelPosition==='side'?'side':'above',stockHeight:num(raw.stockHeight??30,30,20,40),stockColor:hex(raw.stockColor,'#76b900'),stockScale:raw.stockScale==='fixed'?'fixed':'growing',timelineHeight:num(raw.timelineHeight??100,100,50,240),timelineWidth:num(raw.timelineWidth??100,100,55,100),windowDays:[0,30,90,180,365,730].includes(raw.windowDays)?raw.windowDays:0,
 pointSize:num(raw.pointSize??7,7,0,18),laneNames:raw.laneNames!==false,laneLogos:raw.laneLogos!==false,axisDates:raw.axisDates!==false,pulses:raw.pulses!==false,
 cardFill:['none','theme','custom'].includes(raw.cardFill)?raw.cardFill:'none',cardColor:hex(raw.cardColor,'#f0f2f5'),cardOpacity:num(raw.cardOpacity??100,100,0,100),cardBorder:num(raw.cardBorder??0,0,0,8),cardBorderColor:hex(raw.cardBorderColor,'#8b949e'),cardRadius:num(raw.cardRadius??12,12,0,60),cardShadow:num(raw.cardShadow??0,0,0,40),cardPadding:num(raw.cardPadding??22,22,0,60),cardWidth:num(raw.cardWidth??100,100,55,100),cardHeight:num(raw.cardHeight??100,100,60,170),rowSpacing:num(raw.rowSpacing??100,100,60,170),cardLogos:raw.cardLogos!==false,cardDateFormat:['long','short','iso'].includes(raw.cardDateFormat)?raw.cardDateFormat:'long',gapFormat:['full','short','number'].includes(raw.gapFormat)?raw.gapFormat:'full'};
}
export function releaseWindow(start,end,current,days=0){
 if(!days)return {first:start,last:end};
 const last=Math.min(end,Math.max(start+days,current));return {first:Math.max(start,last-days),last};
}
// Allocate available height before typography; hiding the summary or histogram
// frees room for lanes without scaling their names or logos.
export function releasePulseLayout(start,end,options,hidden={}){
 const h=end-start,top=start+h*(hidden.summary?.035:.20),cardHeight=h*.24*options.cardHeight/100,
 histogram=hidden.distribution?0:Math.min(100,h*.14),reserve=(hidden.detail?0:cardHeight)+histogram+42,
 maxHeight=Math.max(65,end-top-reserve),height=Math.min(maxHeight,h*.30*options.timelineHeight/100);
 return {top,height,bottom:top+height,histogramBase:top+height+histogram*.64+10,cardTop:end-cardHeight,cardBottom:end-4};
}
export function paintReleasePanel(ctx,rect,s,theme){
 const {x,y,w,h}=rect;ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(s.cardRadius,w/2,h/2));
 if(s.cardFill!=='none'&&s.cardOpacity>0){ctx.save();ctx.globalAlpha*=s.cardOpacity/100;ctx.fillStyle=s.cardFill==='custom'?s.cardColor:theme.panel;ctx.shadowColor='#00000040';ctx.shadowBlur=s.cardShadow;ctx.shadowOffsetY=s.cardShadow/4;ctx.fill();ctx.restore();}
 if(s.cardBorder>0){ctx.strokeStyle=s.cardBorderColor;ctx.lineWidth=s.cardBorder;ctx.stroke();}ctx.restore();
}
