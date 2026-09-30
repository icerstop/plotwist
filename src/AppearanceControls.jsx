import React from 'react';
import {useVisualStatus,Range,Color} from './VisualSettings.jsx';
import {chartPalettes,normalizeChart} from './chart-appearance.js';
import {themeOf} from './reel-design.js';

function Select({label,value,options,onChange}){return <label className="visual-field">{label}<select aria-label={label} value={value} onChange={e=>onChange(e.target.value)}>{options.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>;}
export function ChartEditor({config}){
 const v=useVisualStatus(),s=v.visuals.design.chart,mode=config.ai?.mode||config.chart||'line',plot=['line','area','bar','records','scatter'].includes(mode),line=['line','area','records'].includes(mode),bars=['bar','ranking'].includes(mode),cards=['cards','duel'].includes(mode)||config.ai?.groupBy==='brand'&&mode==='timeline';
 const patch=p=>v.design({chart:{...s,...p}}),range=(key,label,min,max,suffix='')=><Range label={label} value={s[key]} min={min} max={max} suffix={suffix} onChange={n=>patch({[key]:n})}/>;
 return <div className="visual-editor chart-editor"><fieldset disabled={!v.ready||v.busy}>
  <p className="visual-hint">Styl dopasowuje się do wybranego sposobu prezentacji danych. Typ wykresu wybierzesz w panelu danych.</p>
  <div className="palette-grid" role="group" aria-label="Paleta wykresu">{chartPalettes.map(p=><button type="button" key={p.id} aria-pressed={s.palette===p.id} className={s.palette===p.id?'selected':''} onClick={()=>patch({palette:p.id})}><span aria-hidden="true">{(p.colors.length?(themeOf(config).dark?p.dark:p.colors):themeOf(config).colors).map((c,i)=><i key={i} style={{background:c}}/>)}</span><b>{p.name}</b></button>)}</div>
  {s.palette!=='original'&&<p className="visual-hint">Paleta zastępuje kolory serii. Wybierz „Kolory z danych i motywu”, aby wrócić do własnych kolorów i kolorów marek.</p>}
  {line&&<details className="appearance-group" open><summary>Linie i wypełnienie</summary>
   {range('lineWidth','Grubość linii',1,18,' px')}
   <Select label="Styl linii" value={s.lineStyle} options={[["auto","Z danych"],["solid","Ciągła"],["dashed","Kreskowana"],["dotted","Kropkowana"]]} onChange={lineStyle=>patch({lineStyle})}/>
   {range('opacity','Widoczność serii',30,100,'%')}{range('glow','Poświata linii',0,30,' px')}
   {mode==='area'&&<>{range('fillOpacity','Siła wypełnienia',0,65,'%')}<Select label="Wypełnienie obszaru" value={s.fillStyle} options={[["flat","Jednolity kolor"],["fade","Zanikający gradient"]]} onChange={fillStyle=>patch({fillStyle})}/></>}
  </details>}
  {(bars||cards)&&<details className="appearance-group" open><summary>Słupki i karty</summary>{bars&&range('barWidth',mode==='bar'?'Szerokość słupków':'Grubość słupków',25,95,'%')}{range('radius','Zaokrąglenie narożników',0,32,' px')}</details>}
  {plot&&<><details className="appearance-group" open><summary>Siatka i podziałka</summary>
   <Select label="Siatka wykresu" value={s.grid} options={[["horizontal","Pozioma"],["both","Pozioma i pionowa"],["none","Bez siatki"]]} onChange={grid=>patch({grid})}/>
   {s.grid!=='none'&&<><Select label="Styl siatki" value={s.gridStyle} options={[["solid","Ciągła"],["dashed","Kreskowana"],["dotted","Kropkowana"]]} onChange={gridStyle=>patch({gridStyle})}/>{range('gridOpacity','Widoczność siatki',0,100,'%')}{range('gridWidth','Grubość siatki',1,4,' px')}</>}
   {range('ticks','Liczba poziomów osi Y',3,9)}
   {!config.ai&&mode!=='bar'&&range('xTicks','Liczba opisów osi X',2,8)}
   <p className="visual-hint">W małym wykresie liczba opisów osi Y może być mniejsza, aby zachować czytelność.</p>
   <label className="visual-check"><input type="checkbox" checked={s.axisLabels} onChange={e=>patch({axisLabels:e.target.checked})}/>Pokaż opisy osi</label>
   <label className="visual-check"><input type="checkbox" checked={s.plotPanel} onChange={e=>patch({plotPanel:e.target.checked})}/>Kontrastowe tło pola wykresu</label>
  </details>
  {(!config.ai||config.ai.groupBy==='brand'&&mode==='records')&&<label className="visual-check"><input type="checkbox" checked={s.legend} onChange={e=>patch({legend:e.target.checked})}/>Pokaż legendę pod wykresem</label>}
  {(!config.ai&&['line','area'].includes(mode)||config.ai?.groupBy==='brand'&&mode==='records')&&<details className="appearance-group" open><summary>Wartości przy liniach</summary>
   <label className="visual-check"><input type="checkbox" checked={s.endLabels} onChange={e=>patch({endLabels:e.target.checked})}/>Pokaż etykiety przy końcach linii</label>
   {s.endLabels&&<>
    <label className="visual-check"><input type="checkbox" checked={s.endLabelIcons} onChange={e=>patch({endLabelIcons:e.target.checked})}/>Flagi i logotypy przy wartościach</label>
    <label className="visual-check"><input type="checkbox" checked={s.endLabelNames} onChange={e=>patch({endLabelNames:e.target.checked})}/>Nazwy serii przy wartościach</label>
    {range('endLabelSize','Rozmiar etykiet przy liniach',75,140,'%')}
    {!config.ai&&<Select label="Wartość na etykiecie" value={s.endLabelValue} options={[["interpolated","W punkcie animacji · interpolowana ≈"],["observed","Ostatni pomiar ze źródła"]]} onChange={endLabelValue=>patch({endLabelValue})}/>}
    <p className="visual-hint">Etykiety mają zarezerwowane miejsce i łączniki w kolorach serii. Przy ścisku rozsuwają się, a w niskim wykresie przechodzą do kolumn. Bez flagi lub logo pojawia się nazwa.</p>
    {!config.ai&&<p className="visual-hint">≈ oznacza wartość pomiędzy pomiarami. Luki nie są uzupełniane. Przy zakończonej serii pokazujemy datę ostatniej wartości.</p>}
   </>}
  </details>}
  <p className="visual-hint">Wymiary wykresu zmienisz w zakładce Układ.</p></>}
  <button type="button" className="text-btn visual-reset" onClick={()=>v.design({chart:normalizeChart()})}>Przywróć wygląd wykresu</button>
 </fieldset></div>;
}

export function TextEffects({role,config,beforeChange=()=>{}}){
 const v=useVisualStatus(),s=v.visuals.design.text[role],patch=p=>v.textStyle(role,p),paragraph=['title','subtitle','metric'].includes(role),range=(key,label,min,max,suffix='',step=1)=><Range label={label} value={s[key]} min={min} max={max} suffix={suffix} step={step} onChange={n=>patch({[key]:n})}/>;
 return <div className="text-effects" onFocusCapture={beforeChange} onPointerDownCapture={beforeChange}>
  {paragraph&&<details className="appearance-group" open><summary>Skład tekstu</summary>
   <Select label="Zawijanie tekstu" value={s.wrap} options={[["auto","Automatycznie + ręczne podziały"],["manual","Tylko ręczne podziały"]]} onChange={wrap=>patch({wrap})}/>
   <p className="visual-hint">Enter w polu tytułu zaczyna nowy wiersz. Rozmiar tytułu dopasowuje się do dostępnego miejsca.</p>
   <Select label="Wyrównanie tekstu" value={s.align} options={[["auto","Z układu"],["left","Do lewej"],["center","Na środku"],["right","Do prawej"]]} onChange={align=>patch({align})}/>
   {range('width','Szerokość tekstu',45,100,'%')}{range('lineHeight','Interlinia',.85,1.65,'×',.05)}
   <Select label="Limit wierszy" value={s.maxLines} options={[[0,'Automatycznie'],...[1,2,3,4,5,6].map(n=>[n,String(n)])]} onChange={maxLines=>patch({maxLines:Number(maxLines)})}/>
  </details>}
  <label className="visual-check"><input type="checkbox" checked={s.italic} onChange={e=>patch({italic:e.target.checked})}/>Kursywa</label>
  <details className="appearance-group"><summary>Cień, obrys i tło tekstu</summary>
   {range('opacity','Widoczność tekstu',20,100,'%')}
   <Select label="Efekt cienia" value={s.shadow} options={[["none","Bez cienia"],["soft","Miękki cień"],["hard","Twardy cień"],["glow","Poświata"]]} onChange={shadow=>patch({shadow})}/>
   {s.shadow!=='none'&&<><Color label="Kolor cienia" value={s.shadowColor} onChange={shadowColor=>patch({shadowColor})}/>{s.shadow!=='hard'&&range('shadowBlur','Rozmycie cienia',0,40,' px')}{s.shadow!=='glow'&&<>{range('shadowX','Cień w poziomie',-30,30,' px')}{range('shadowY','Cień w pionie',-30,30,' px')}</>}</>}
   {range('strokeWidth','Grubość obrysu tekstu',0,8,' px')}{s.strokeWidth>0&&<Color label="Kolor obrysu" value={s.strokeColor} onChange={strokeColor=>patch({strokeColor})}/>}
   <label className="visual-check"><input type="checkbox" checked={!!s.boxColor} onChange={e=>patch({boxColor:e.target.checked?themeOf(config).panel:null})}/>Tło pod tekstem</label>
   {s.boxColor&&<><Color label="Kolor tła tekstu" value={s.boxColor} onChange={boxColor=>patch({boxColor})}/>{range('boxOpacity','Widoczność tła tekstu',10,100,'%')}{range('padding','Odstęp od tła',0,40,' px')}{range('radius','Zaokrąglenie tła',0,32,' px')}</>}
  </details>
 </div>;
}
