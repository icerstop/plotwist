export const chartPalettes=[
 {id:'original',name:'Kolory z danych i motywu',colors:[]},
 {id:'jewel',name:'Szlachetne',colors:['#147d92','#ae3d69','#98751b','#6b57a5','#408042','#c06420'],dark:['#55d5e9','#ff8cb7','#edce70','#bba4ff','#8ed784','#ffb275']},
 {id:'electric',name:'Elektryczne',colors:['#244cd8','#bb208a','#00866c','#ac6000','#6348b8','#b33332'],dark:['#6aa7ff','#ff7fce','#57efc3','#ffd26c','#b59cff','#ff9290']},
 {id:'earth',name:'Ziemia',colors:['#a04933','#4d7760','#9c721c','#6c567e','#286e84','#835142'],dark:['#edaa87','#a4cead','#e8c780','#c5acce','#87c2d2','#d6ada0']},
 {id:'ocean',name:'Ocean',colors:['#12477c','#007783','#5d59a0','#ba5b37','#63722e','#a43965'],dark:['#75b7fa','#61d8d0','#baaffe','#ffaf88','#c3d283','#f99dbc']},
 {id:'accessible',name:'Kontrastowe',colors:['#006c99','#ab5700','#00826b','#aa4782','#5747af','#986900'],dark:['#72c7ec','#f6ac50','#65d2b3','#e3a0cf','#b5a4ff','#efd474']},
 {id:'mono-blue',name:'Odcienie granatu',colors:['#14396a','#3264a6','#5e78a2','#29576d','#61737e','#32465e'],dark:['#f0f6ff','#b9d6ff','#83b7f6','#aedee9','#91b9c8','#749bcc']},
];
const clamp=(v,f,min,max)=>Number.isFinite(Number(v))?Math.max(min,Math.min(max,Number(v))):f;
const choice=(v,values,f)=>values.includes(v)?v:f;
export function normalizeChart(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 return {aiLabelStyle:choice(raw.aiLabelStyle,['structured','source'],'structured'),aiRankCount:Math.round(clamp(raw.aiRankCount??6,6,2,6)),palette:choice(raw.palette,chartPalettes.map(p=>p.id),'original'),width:clamp(raw.width??100,100,60,100),lineWidth:clamp(raw.lineWidth??7,7,1,18),lineStyle:choice(raw.lineStyle,['auto','solid','dashed','dotted'],'auto'),glow:clamp(raw.glow??0,0,0,30),opacity:clamp(raw.opacity??100,100,30,100),fillOpacity:clamp(raw.fillOpacity??13,13,0,65),fillStyle:choice(raw.fillStyle,['flat','fade'],'flat'),barWidth:clamp(raw.barWidth??63,63,25,95),radius:clamp(raw.radius??0,0,0,32),grid:choice(raw.grid,['horizontal','both','none'],'horizontal'),gridStyle:choice(raw.gridStyle,['solid','dashed','dotted'],'solid'),gridOpacity:clamp(raw.gridOpacity??100,100,0,100),gridWidth:clamp(raw.gridWidth??2,2,1,4),ticks:Math.round(clamp(raw.ticks??5,5,3,9)),xTicks:Math.round(clamp(raw.xTicks??5,5,2,8)),axisLabels:raw.axisLabels!==false,scaleCaption:raw.scaleCaption!==false,legend:raw.legend!==false,plotPanel:raw.plotPanel===true,endLabels:raw.endLabels===true,endLabelIcons:raw.endLabelIcons!==false,endLabelNames:raw.endLabelNames===true,endLabelValues:raw.endLabelValues!==false,endLabelDates:raw.endLabelDates!==false,endLabelSize:clamp(raw.endLabelSize??100,100,75,140),endLabelValue:choice(raw.endLabelValue,['interpolated','observed'],'interpolated'),axisNumbers:choice(raw.axisNumbers,['auto','full','thousand','million','billion','trillion','scientific'],'auto'),axisDecimals:choice(String(raw.axisDecimals??'auto'),['auto','0','1','2','3','4','6'],'auto'),axisGrouping:raw.axisGrouping!==false,axisUnitPosition:choice(raw.axisUnitPosition,['caption','ticks'],'caption'),axisUnitLabel:typeof raw.axisUnitLabel==='string'?raw.axisUnitLabel.slice(0,100):''};
}
const defaults=normalizeChart();
export const chartAppearance=config=>config.visuals?.design?.chart||defaults;
export function seriesColor(config,index,fallback){const p=chartPalettes.find(p=>p.id===chartAppearance(config).palette);return p?.colors.length?(config.visuals?.design?.theme&&['dark','mono','navy','terminal','plum'].includes(config.visuals.design.theme)?p.dark:p.colors)[index%p.colors.length]:fallback;}
export function plotSides(config,left,right){const width=(right-left)*chartAppearance(config).width/100,mid=(left+right)/2;return [mid-width/2,mid+width/2];}
export function axisTicks(config,axis,log=false,height=Infinity,labelSize=30){
 const count=Math.min(chartAppearance(config).ticks,Math.max(2,Math.floor(height/(labelSize+13))+1));
 return Array.from({length:count},(_,i)=>log?10**(Math.log10(axis.min)+(Math.log10(axis.max)-Math.log10(axis.min))*i/(count-1)):axis.min+(axis.max-axis.min)*i/(count-1));
}
export function lineAppearance(ctx,config,color,dashed=false){const s=chartAppearance(config);ctx.strokeStyle=color;ctx.lineWidth=s.lineWidth;ctx.lineJoin=ctx.lineCap='round';ctx.globalAlpha*=s.opacity/100;ctx.setLineDash(s.lineStyle==='dashed'||s.lineStyle==='auto'&&dashed?[18,14]:s.lineStyle==='dotted'?[2,14]:[]);ctx.shadowColor=color;ctx.shadowBlur=s.glow;ctx.shadowOffsetX=ctx.shadowOffsetY=0;}
export function roundFill(ctx,x,y,w,h,radius=0){if(radius&&ctx.roundRect){ctx.beginPath();ctx.roundRect(x,y,w,h,Math.min(radius,w/2,h/2));ctx.fill();}else ctx.fillRect(x,y,w,h);}
export function plotGrid(ctx,config,{left,right,top,bottom,ys,color,panel}){
 const s=chartAppearance(config);ctx.save();
 if(s.plotPanel){ctx.fillStyle=panel;roundFill(ctx,left-12,top-14,right-left+24,bottom-top+28,20);}
 if(s.grid!=='none'){ctx.strokeStyle=color;ctx.globalAlpha*=s.gridOpacity/100;ctx.lineWidth=s.gridWidth;ctx.setLineDash(s.gridStyle==='dashed'?[10,10]:s.gridStyle==='dotted'?[2,8]:[]);
  for(const y of ys){ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(right,y);ctx.stroke();}
  if(s.grid==='both')for(let i=0;i<s.xTicks;i++){const x=left+(right-left)*i/(s.xTicks-1);ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,bottom);ctx.stroke();}
 }ctx.restore();
}
