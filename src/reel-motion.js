// A single deterministic clock drives both Canvas previews and exported frames.
// Timings are fractions of reel duration, so a sequence also works at 6 or 30 s.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const number=(v,f,a,b)=>v!=null&&Number.isFinite(Number(v))?clamp(Number(v),a,b):f;
export const motionRoles=[['title','Tytuł'],['subtitle','Opis pod tytułem'],['content','Wykres i legenda'],['metric','Wspólny wskaźnik'],['date','Data / rok'],['mark','Logo rolki'],['signature','Podpis autora'],['stickers','Obrazki i GIF-y']];
export const motionEffects=[
 ['none','Bez wejścia'],['fade','Przenikanie'],['rise','Wjazd od dołu'],['fall','Wjazd od góry'],['left','Wjazd z lewej'],['right','Wjazd z prawej'],['zoom','Przybliżenie'],['zoom-out','Oddalenie'],['pop','Sprężyste wejście'],['bounce','Odbicie'],['rotate','Obrót i wejście'],['flip','Obrót kartki'],['wipe','Odsłona od lewej'],['wipe-up','Odsłona od dołu'],['iris','Otwarcie od środka'],['typewriter','Maszyna do pisania'],['write','Rysowanie liter'],['words','Słowo po słowie'],['lines','Wiersz po wierszu']
];
export const textMotionEffects=new Set(['typewriter','write','words','lines']);
export const textMotionRoles=new Set(['title','subtitle','metric']);
export const motionEasings=[['smooth','Łagodnie'],['out','Szybki start, łagodny koniec'],['linear','Równomiernie']];
const track=(effect,start,duration,easing='smooth')=>({effect,start,duration,easing});
function sequence(id,name,description,title,content,chartStart,extra={}){
 return {id,name,description,chartStart,tracks:{title,subtitle:track('fade',Math.min(title.start+title.duration,.28),.07),content,date:track('fade',content.start,.06),mark:track('fade',.01,.05),signature:track('fade',.03,.08),stickers:track('pop',content.start+.025,.09),...extra}};
}
export const motionPresets=[
 sequence('write-story','Najpierw napis','Rysowane litery, potem wykres',track('write',.01,.19),track('fade',.235,.07),.27),
 sequence('typewriter','Maszyna do pisania','Litery pojawiają się rytmicznie',track('typewriter',.015,.19,'linear'),track('rise',.24,.08),.29),
 sequence('soft','Miękkie wejście','Spokojne przenikanie kolejnych elementów',track('fade',0,.13),track('fade',.18,.13),.23),
 sequence('rise','W górę','Tytuł i wykres unoszą się do kadru',track('rise',.02,.1),track('rise',.19,.1),.25),
 sequence('sides','Z dwóch stron','Tytuł z lewej, wykres z prawej',track('left',.01,.11),track('right',.18,.11),.24),
 sequence('zoom','Zbliżenie','Tytuł rośnie, potem wchodzą dane',track('zoom',.01,.14),track('zoom',.21,.1),.26),
 sequence('pullback','Oddalenie','Duży napis osiada w kompozycji',track('zoom-out',.01,.15),track('fade',.22,.09),.26),
 sequence('pop','Sprężyna','Energiczne wejście z lekkim przeskokiem',track('pop',.01,.13),track('pop',.19,.12),.28),
 sequence('bounce','Odbicie','Tytuł opada i delikatnie odbija',track('bounce',.01,.16),track('rise',.23,.08),.27),
 sequence('curtain','Kurtyna','Odsłona od lewej do prawej',track('wipe',.01,.15),track('wipe',.2,.12),.29),
 sequence('lift','Podniesienie kurtyny','Tekst i wykres odsłaniane od dołu',track('wipe-up',.01,.14),track('wipe-up',.21,.12),.3),
 sequence('iris','Z centrum','Kompozycja otwiera się od środka',track('iris',.01,.13),track('iris',.19,.14),.29),
 sequence('words','Rytm słów','Kolejne słowa wchodzą płynnie',track('words',.01,.2),track('fade',.25,.07),.29),
 sequence('lines','Rytm wierszy','Tekst pojawia się wiersz po wierszu',track('lines',.01,.18),track('rise',.23,.09),.28),
 sequence('flip','Obrót kartki','Obrót tytułu, łagodne wejście wykresu',track('flip',.01,.14),track('rotate',.2,.1),.27),
 sequence('finale','Historia z finałem','Pisany tytuł, dane i podpis na końcu',track('write',.01,.17),track('fade',.23,.08),.28,{signature:track('rise',.8,.09),stickers:track('pop',.72,.09)})
];
export function normalizeTrack(raw={},id='title'){
 const allowed=motionEffects.map(([id])=>id).filter(effect=>textMotionRoles.has(id)||!textMotionEffects.has(effect));
 const start=number(raw.start,0,0,id==='content'?.5:.8),duration=number(raw.duration,.1,.015,Math.min(.3,(id==='content'?.6:.92)-start));
 return {effect:allowed.includes(raw.effect)?raw.effect:'none',start,duration,easing:motionEasings.some(([id])=>id===raw.easing)?raw.easing:'smooth'};
}
export function normalizeMotion(raw={}){
 raw=raw&&typeof raw==='object'?raw:{};
 const tracks=Object.fromEntries(motionRoles.map(([id])=>[id,normalizeTrack(raw.tracks?.[id]||{},id)]));
 for(const [id,value] of Object.entries(raw.tracks||{}).filter(([id,value])=>id.startsWith('sticker:')&&id.length<180&&value&&typeof value==='object').slice(0,3))tracks[id]=normalizeTrack(value,id);
 return {enabled:raw.enabled===true,preset:motionPresets.some(p=>p.id===raw.preset)?raw.preset:'custom',chartStart:number(raw.chartStart,tracks.content.effect==='none'?0:tracks.content.start+tracks.content.duration,tracks.content.effect==='none'?0:tracks.content.start+tracks.content.duration,.6),tracks};
}
export const motionOf=config=>config.visuals?.design?.motion;
export const motionPreset=id=>{const p=motionPresets.find(p=>p.id===id);return normalizeMotion(p?{enabled:true,preset:p.id,chartStart:p.chartStart,tracks:p.tracks}:{});};
export function reelMotionFrame(config,progress,time){
 const motion=motionOf(config),duration=config.duration||12;
 if(!motion?.enabled||config.editorPreview)return {config,progress,dataTime:time};
 const start=duration*motion.chartStart,dataDuration=(duration*.9-start)/.9,dataTime=Math.max(0,time-start);
 return {config:{...config,duration:dataDuration,_motionFrame:{time,duration}},progress:clamp(dataTime/(dataDuration*.9)),dataTime};
}
export function motionState(config,id){
 const m=motionOf(config),frame=config._motionFrame;
 if(!m?.enabled||!frame||config.editorPreview||id==='source')return {effect:'none',p:1,eased:1};
 const t=m.tracks[id]||(id.startsWith('sticker:')?m.tracks.stickers:null);
 if(!t||t.effect==='none')return {effect:'none',p:1,eased:1};
 const p=clamp((frame.time/frame.duration-t.start)/t.duration);
 const eased=t.easing==='linear'?p:t.easing==='out'?1-(1-p)**3:p*p*(3-2*p);
 return {effect:t.effect,p,eased};
}
const bounceOut=t=>{const n=7.5625,d=2.75;if(t<1/d)return n*t*t;if(t<2/d)return n*(t-=1.5/d)*t+.75;if(t<2.5/d)return n*(t-=2.25/d)*t+.9375;return n*(t-=2.625/d)*t+.984375;};
export function applyElementMotion(ctx,config,id,r){
 const {effect,p,eased:e}=motionState(config,id);if(effect==='none'||p===1)return;
 if(p===0){ctx.globalAlpha=0;return;}
 const cx=r.x+r.w/2,cy=r.y+r.h/2,d=85*(1-e);let scale=1,dx=0,dy=0,rotation=0,sx=1;
 if(['fade','rise','fall','left','right','zoom','zoom-out','rotate','flip'].includes(effect))ctx.globalAlpha*=e;
 if(effect==='rise')dy=d;if(effect==='fall')dy=-d;if(effect==='left')dx=-d;if(effect==='right')dx=d;
 if(effect==='zoom')scale=.72+.28*e;if(effect==='zoom-out')scale=1.25-.25*e;
 if(effect==='pop'){const b=1+2.70158*(p-1)**3+1.70158*(p-1)**2;scale=.68+.32*b;ctx.globalAlpha*=clamp(p*5);}
 if(effect==='bounce'){dy=-110*(1-bounceOut(p));ctx.globalAlpha*=clamp(p*5);}
 if(effect==='rotate'){rotation=(1-e)*-.18;scale=.88+.12*e;}
 if(effect==='flip')sx=Math.max(.02,Math.sin(e*Math.PI/2));
 ctx.translate(cx+dx,cy+dy);ctx.rotate(rotation);ctx.scale(scale*sx,scale);ctx.translate(-cx,-cy);
 if(['wipe','wipe-up','iris'].includes(effect)){ctx.beginPath();const pad=45;
  if(effect==='wipe')ctx.rect(r.x-pad,r.y-pad,(r.w+pad*2)*e,r.h+pad*2);
  else if(effect==='wipe-up')ctx.rect(r.x-pad,r.y+r.h+pad-(r.h+pad*2)*e,r.w+pad*2,(r.h+pad*2)*e);
  else ctx.rect(cx-(r.w/2+pad)*e,cy-(r.h/2+pad)*e,(r.w+pad*2)*e,(r.h+pad*2)*e);
  ctx.clip();
 }
}

const segmenter=typeof Intl.Segmenter==='function'?new Intl.Segmenter(undefined,{granularity:'grapheme'}):null;
const graphemes=s=>segmenter?[...segmenter.segment(s)].map(x=>x.segment):Array.from(s);
const textCache=new WeakMap();
function textUnits(ctx,lines,x,y,step,width,kind){
 const key=JSON.stringify([ctx.font,ctx.textAlign,lines,x,y,step,width,kind]);let cache=textCache.get(ctx);if(!cache){cache=new Map();textCache.set(ctx,cache);}if(cache.has(key))return cache.get(key);
 const units=[],size=parseFloat(ctx.font.match(/([\d.]+)px/)?.[1]||30);
 lines.forEach((line,i)=>{const measured=ctx.measureText(line).width,w=Math.min(measured,width),ratio=measured?w/measured:1,left=x-(ctx.textAlign==='right'?w:ctx.textAlign==='center'?w/2:0),parts=kind==='lines'?[line]:kind==='words'?line.match(/\S+\s*|\s+/g)||[]:graphemes(line);let prefix='';
  for(const part of parts){const a=ctx.measureText(prefix).width*ratio;prefix+=part;const b=ctx.measureText(prefix).width*ratio;units.push({line:i,x:left+a,y:y+i*step-size,w:Math.max(1,b-a),h:size*1.4,kind,text:part});}
 });if(cache.size>30)cache.clear();cache.set(key,units);return units;
}
// Keep full text metrics and line breaks throughout the reveal. Only masks move.
// "write" is a stylized ink reveal, not a reconstruction of a font's pen strokes.
export function animateText(ctx,config,role,lines,x,y,step,width,paint){
 const {effect,p}=motionState(config,role);
 if(!textMotionEffects.has(effect)||p===1){paint();return;}
 if(!p)return;
 const units=textUnits(ctx,lines,x,y,step,width,effect==='words'?'words':effect==='lines'?'lines':'glyphs');
 if(effect==='words'||effect==='lines'){
  const window=effect==='words'?Math.min(3,units.length):1.5,total=units.length+window-1;
  units.forEach((u,i)=>{const q=clamp((p*total-i)/window);if(!q)return;ctx.save();ctx.globalAlpha*=q*q*(3-2*q);ctx.translate(0,18*(1-q));ctx.beginPath();ctx.rect(u.x-2,u.y-7,u.w+4,u.h+14);ctx.clip();paint(u.line);ctx.restore();});return;
 }
 const cursor=p*units.length,done=Math.floor(cursor),fraction=cursor-done;
 // A mask includes room for accents and shadows. Paint only its own line so
 // that generous vertical padding cannot expose letters on the next line.
 lines.forEach((_,line)=>{const visible=units.map((u,i)=>({u,q:i<done?1:effect==='write'&&i===done?fraction:0})).filter(({u,q})=>u.line===line&&q>0);if(!visible.length)return;
  ctx.save();ctx.beginPath();visible.forEach(({u,q})=>ctx.rect(u.x-2,u.y-6,(u.w+4)*q,u.h+12));ctx.clip();paint(line);ctx.restore();
 });
}
