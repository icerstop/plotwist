import React from 'react';
import {useVisualStatus,Range,Color} from './VisualSettings.jsx';
import {normalizeReleaseAppearance} from './release-appearance.js';
export default function ReleaseAppearanceControls({config}){
 const v=useVisualStatus(),s=normalizeReleaseAppearance(v.visuals.design.chart.release),patch=p=>v.design({chart:{...v.visuals.design.chart,release:{...s,...p}}});
 const range=(key,label,min,max,suffix='%')=><Range label={label} value={s[key]} min={min} max={max} suffix={suffix} onChange={n=>patch({[key]:n})}/>;
 const check=(key,label)=><label className="visual-check"><input type="checkbox" checked={s[key]} onChange={e=>patch({[key]:e.target.checked})}/>{label}</label>;
 const layer=(id,label)=><label className="visual-check"><input type="checkbox" checked={!v.visuals.hidden[id]} onChange={e=>v.hide(id,!e.target.checked)}/>{label}</label>;
 return <>
 {config.releases.stock&&<details className="appearance-group" open><summary>Cena NVIDIA</summary>
  {layer('stock','Pokaż linię ceny NVIDIA')}
  <Color label="Kolor linii NVIDIA" value={s.stockColor} onChange={stockColor=>patch({stockColor})}/>
  {range('stockHeight','Miejsce na wykres ceny NVIDIA',20,40)}
  <label className="visual-field">Zakres cen NVIDIA<select aria-label="Zakres cen NVIDIA" value={s.stockScale} onChange={e=>patch({stockScale:e.target.value})}><option value="growing">Rosnący · widoczne notowania</option><option value="fixed">Stały · cały wybrany okres</option></select></label>
  <p className="visual-hint">Grubość, styl linii, podziałkę i etykiety zmienisz w tych samych sekcjach poniżej co na innych wykresach. Etykieta ceny pokazuje zamknięcie ostatniej sesji. Datę notowania można włączyć osobno.</p>
 </details>}
 {config.releases.mode==='pulse'&&<details className="appearance-group" open><summary>Rozmieszczenie osi czasu</summary>
  {range('timelineHeight','Rozstaw torów (wysokość osi)',50,240)}{range('timelineWidth','Szerokość osi czasu',55,100)}
  <label className="visual-field">Okno czasu<select aria-label="Okno czasu" value={s.windowDays} onChange={e=>patch({windowDays:Number(e.target.value)})}><option value={0}>Cały wybrany okres</option>{[30,90,180,365,730].map(n=><option key={n} value={n}>{n} dni · podążaj za premierami</option>)}</select></label>
  <p className="visual-hint">Rozstaw nie powiększa tekstu. Wyłączenie liczników lub słupków miesięcznych oddaje miejsce osi czasu. Okno czasu przybliża daty bez zmiany wybranych danych.</p>
  {range('pointSize','Rozmiar punktów premier',0,18,' px')}{check('pulses','Rozbłysk przy premierze')}{check('laneNames','Nazwy przy torach')}{check('laneLogos','Logotypy przy torach')}{check('axisDates','Daty na krańcach osi')}
  {layer('summary','Pokaż liczniki')}{layer('distribution','Pokaż słupki miesięczne')}
 </details>}
 <details className="appearance-group" open><summary>Karta premiery · tło i obramowanie</summary>
  {layer('detail','Pokaż kartę premiery')}
  <label className="visual-field">Tło karty premiery<select aria-label="Tło karty premiery" value={s.cardFill} onChange={e=>patch({cardFill:e.target.value})}><option value="none">Bez tła</option><option value="theme">Z motywu</option><option value="custom">Własny kolor</option></select></label>
  {s.cardFill==='custom'&&<Color label="Kolor tła karty" value={s.cardColor} onChange={cardColor=>patch({cardColor})}/>}
  {s.cardFill!=='none'&&<>{range('cardOpacity','Widoczność tła karty',0,100)}{range('cardShadow','Cień karty',0,40,' px')}</>}
  {range('cardBorder','Grubość obramowania karty',0,8,' px')}{s.cardBorder>0&&<Color label="Kolor obramowania karty" value={s.cardBorderColor} onChange={cardBorderColor=>patch({cardBorderColor})}/>}
  {range('cardRadius','Zaokrąglenie karty premiery',0,60,' px')}
 </details>
 <details className="appearance-group" open><summary>Karta premiery · układ i zawartość</summary>
  {range('cardWidth','Szerokość karty premiery',55,100)}{range('cardHeight','Wysokość karty premiery',60,170)}{range('cardPadding','Margines wewnętrzny karty',0,60,' px')}{range('rowSpacing','Odstępy między modelami',60,170)}
  <label className="visual-field">Format daty w karcie<select aria-label="Format daty w karcie" value={s.cardDateFormat} onChange={e=>patch({cardDateFormat:e.target.value})}><option value="long">Dzień, miesiąc słownie, rok</option><option value="short">Data liczbowa</option><option value="iso">ISO · RRRR-MM-DD</option></select></label>
  <label className="visual-field">Opis odstępu w karcie<select aria-label="Opis odstępu w karcie" value={s.gapFormat} onChange={e=>patch({gapFormat:e.target.value})}><option value="full">Pełny opis odstępu</option><option value="short">Liczba i dni</option><option value="number">Sama liczba</option></select></label>
  {layer('detailDate','Data w karcie')}{layer('detailModels','Nazwy modeli w karcie')}{check('cardLogos','Logotypy w karcie')}{layer('detailGap','Dni od poprzedniej premiery')}
  <p className="visual-hint">Datę, modele i odstęp możesz osobno zaznaczyć na podglądzie: przesuwać, obracać, zmieniać czcionkę i kolor. Treść zmienisz w polu „Treść tekstu”.</p>
 </details>
 </>;
}
