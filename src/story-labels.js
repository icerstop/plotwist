import countries from './story-countries.json' with {type:'json'};
import {translate} from './translations.js';

const pair=(pl,en=pl)=>({pl,en});
// Metric identities come from metadata, never from a translated or edited label.
const definitions=`
Individuals using the Internet (% of population)|Osoby korzystające z internetu|People using the internet
GDP per capita (constant 2015 US$)|PKB na mieszkańca (ceny stałe 2015)|GDP per capita (constant 2015 prices)
Life expectancy at birth, total (years)|Oczekiwana długość życia przy urodzeniu|Life expectancy at birth
Mobile cellular subscriptions (per 100 people)|Abonamenty komórkowe na 100 osób|Mobile subscriptions per 100 people
Research and development expenditure (% of GDP)|Wydatki na badania i rozwój|Research and development spending
Access to electricity (% of population)|Dostęp do energii elektrycznej|Access to electricity
Urban population (% of total population)|Udział ludności miejskiej|Urban population share
Exports of goods and services (% of GDP)|Eksport towarów i usług|Exports of goods and services
Price of lithium-ion battery cells|Cena ogniw litowo-jonowych|Lithium-ion battery cell price
Bioenergy|Koszt energii z biomasy (LCOE)|Bioenergy cost (LCOE)
Geothermal|Koszt energii geotermalnej (LCOE)|Geothermal energy cost (LCOE)
Offshore wind|Koszt energii wiatrowej na morzu (LCOE)|Offshore wind energy cost (LCOE)
Solar photovoltaic|Koszt energii z fotowoltaiki (LCOE)|Solar photovoltaic energy cost (LCOE)
Concentrated solar power|Koszt energii słonecznej CSP (LCOE)|Concentrated solar power cost (LCOE)
Hydropower|Koszt energii wodnej (LCOE)|Hydropower cost (LCOE)
Onshore wind|Koszt energii wiatrowej na lądzie (LCOE)|Onshore wind energy cost (LCOE)
Transistors per microprocessor|Liczba tranzystorów w mikroprocesorze|Transistors per microprocessor
Share of new cars that are electric|Udział aut elektrycznych w sprzedaży (BEV + PHEV)|Electric share of new car sales (BEV + PHEV)
Productivity: output per hour worked|Produktywność: PKB na godzinę pracy|Productivity: GDP per hour worked
Working hours per worker|Roczne godziny pracy na pracownika|Annual working hours per worker
Historical production-worker hours|Roczne godziny pracy: pracownicy produkcyjni|Annual working hours: production workers
Launch cost per kilogram of payload|Koszt wyniesienia kilograma na LEO|Launch cost per kilogram to LEO
Resident patent applications|Zgłoszenia patentowe rezydentów|Resident patent applications
Resident patent applications per million|Zgłoszenia patentowe rezydentów na mln osób|Resident patent applications per million people
Annual hardware shipments|Roczne dostawy konsol|Annual console shipments
Cumulative rounded shipments|Łączne dostawy konsol|Cumulative console shipments
Data centers and AI|Centra danych i AI · przychody|Data centers and AI · revenue
Gaming, devices, automotive|Gry, urządzenia i motoryzacja · przychody|Gaming, devices and automotive · revenue
Total|Przychody ogółem|Total revenue
iPhone net sales|Przychody ze sprzedaży iPhone’ów|iPhone revenue
iPhone units sold|Liczba sprzedanych iPhone’ów|iPhones sold
Split-adjusted daily close|Cena zamknięcia akcji · po splitach|Daily closing stock price · split-adjusted
Fiscal-year-end split-adjusted close|Cena akcji na koniec roku fiskalnego · po splitach|Fiscal-year-end stock price · split-adjusted
MAUs|Miesięczni aktywni użytkownicy (MAU)|Monthly active users (MAU)
Premium Subscribers|Subskrybenci Premium|Premium subscribers
Premium ARPU|Miesięczny przychód na użytkownika Premium|Monthly revenue per Premium user
Revenue|Przychody roczne|Annual revenue
Annual segment revenue|Roczne przychody segmentu|Annual segment revenue
Azure revenue lower bound|Przychody Azure · dolna granica|Azure revenue · lower bound
Monthly active users|Miesięczni aktywni użytkownicy (MAU)|Monthly active users (MAU)
Weekly active users|Tygodniowi aktywni użytkownicy (WAU)|Weekly active users (WAU)
Cena transakcyjna m² · pierwotny|Cena m² mieszkania · rynek pierwotny|Housing price per m² · primary market
Cena transakcyjna m² · wtórny|Cena m² mieszkania · rynek wtórny|Housing price per m² · secondary market
Średnie miesięczne wynagrodzenie brutto|Średnia miesięczna płaca brutto|Average gross monthly wage
Cena m² / miesięczna płaca brutto|Cena m² w miesięcznych płacach brutto|Price per m² in gross monthly wages
Spadek kwartalny|Średni kwartalny spadek kosztu|Average quarterly cost decline
Spadek roczny|Roczny odpowiednik spadku kosztu|Annual equivalent cost decline
Roczny mnożnik tanienia|Roczny mnożnik tanienia|Annual cost reduction factor
Theoretical performance per inflation-adjusted dollar|Teoretyczna wydajność za dolara|Theoretical performance per dollar
Estimated spending on quarterly deliveries|Szacowane wydatki na dostawy chipów|Estimated spending on chip deliveries
Spending-weighted theoretical performance per dollar|Wydajność za dolara · średnia ważona wydatkami|Performance per dollar · spending-weighted average
Total estimated quarterly spending|Łączne szacowane wydatki kwartalne|Total estimated quarterly spending
Production sequencing cost per human-sized genome|Koszt sekwencjonowania genomu|Genome sequencing cost
Production cost per megabase of raw sequence|Koszt megabazy DNA|Cost per megabase of DNA
Polska · CPI rok poprzedni = 100|Polska · CPI, rok poprzedni = 100|Poland · CPI, previous year = 100
Polska · poziom cen (1950 = 100)|Polska · poziom cen (1950 = 100)|Poland · price level (1950 = 100)
Siła nabywcza 100 zł (ceny 2000)|Siła nabywcza 100 zł (ceny 2000)|Purchasing power of PLN 100 (2000 prices)
UK · mediana pobierania|Wielka Brytania · mediana prędkości pobierania|United Kingdom · median download speed
Pobranie 1 GB · idealny czas|Pobranie 1 GB · idealny czas|Downloading 1 GB · ideal time
`;
const metrics=new Map(definitions.trim().split('\n').map(line=>{const [key,pl,en]=line.split('|');return [key,pair(pl,en)];}));
const country=value=>countries[value]||(value==='Warszawa'?pair('Warszawa','Warsaw'):pair(value,translate(value,'en')));
const bilingual=value=>pair(value,translate(value,'en'));
const join=(a,b)=>pair(`${a.pl} · ${b.pl}`,`${a.en} · ${b.en}`);
const singleTopics=new Set(['battery','chips','nvidia','inflation','internet-speed','dna-cost']);

export function storyLabelParts(s){
 let metric=metrics.get(s.metric),subject=country(s.entity),key=metric?`${s.topicId}|${s.metric}|${s.unitKey}`:null,full;
 if(s.topicId==='storage'){
  subject={Memory:pair('Pamięć RAM','RAM'),Flash:pair('Pamięć flash','Flash memory'),Disk:pair('Dyski HDD','HDD'), 'Solid state':pair('Dyski SSD','SSD')}[s.metric];
  metric=pair('Najniższy koszt terabajta','Lowest cost per terabyte');key=`storage|cost-per-tb|${s.unitKey}`;
 }
 if(s.topicId==='wages'&&s.metric==='Cena m² / miesięczna płaca brutto')subject=join(subject,s.id.includes('-pierwotny-')?pair('rynek pierwotny','primary market'):pair('rynek wtórny','secondary market'));
 if(s.topicId==='cloud')subject=pair(s.id.endsWith('--amazon')?'AWS':s.id.endsWith('--alphabet')?'Google Cloud':'Azure');
 if(s.topicId==='technology-costs')subject=bilingual(s.name); // Historical window is a necessary qualifier.
 if(s.topicId==='ai-chip-value')subject=s.entity==='Other'?pair('Inne chipy','Other chips'):s.entity==='All chips'?pair('Wszystkie dostawy','All deliveries'):pair(s.entity);
 if(s.topicId==='ai-task-cost'){
  // Benchmark protocols and thresholds stay distinct even when units coincide.
  const threshold=s.metric.endsWith('0.75')?75:25;
  subject=s.entity==='Chess Puzzles'?pair('Szachy','Chess'):pair(s.entity);
  metric=pair(`Koszt zadania · próg ${threshold}% po korekcie zgadywania`,`Cost per task · ${threshold}% guessing-adjusted threshold`);
  key=`${s.topicId}|${s.entity}|${s.metric}|${s.unitKey}`;
 }
 if(s.topicId==='space'&&s.id.includes('--record-')){
  const group=s.id.split('--record-')[1],names={all:pair('Wszystkie rakiety','All rockets'),small:pair('Małe rakiety','Small rockets'),medium:pair('Średnie rakiety','Medium rockets'),heavy:pair('Ciężkie rakiety','Heavy rockets')};
  subject=names[group]||bilingual(s.name);metric=pair('Najniższy koszt kg na LEO','Lowest cost per kg to LEO');key=`space|record|${s.unitKey}`;
 }
 if(metric){full=singleTopics.has(s.topicId)?metric:join(subject,metric);}
 else {full=bilingual(s.name);subject=full;} // Model names and user-authored unknown data stay intact.
 // Keep distinctions near the start of long legend labels, where they remain visible.
 if(s.topicId==='wages'&&s.unitKey==='pln-m2')full=join(join(subject,s.id.includes('-pierwotny-')?pair('rynek pierwotny','primary market'):pair('rynek wtórny','secondary market')),pair('cena m²','price per m²'));
 if(s.topicId==='ai-task-cost')full=join(subject,s.metric.endsWith('0.75')?pair('próg 75%','75% threshold'):pair('próg 25%','25% threshold'));
 return {full,subject,metric:metric||null,key};
}

export function storySeriesName(series,language='pl'){return storyLabelParts(series).full[language==='en'?'en':'pl'];}

export function commonSeriesMetric(series=[]){
 if(series.length<2)return null;
 const first=series[0].labelParts;
 if(!first?.key||!first.metric||!series.every(s=>s.labelParts?.key===first.key))return null;
 // Avoid indistinguishable short labels (e.g. different protocols for one entity).
 if(new Set(series.map(s=>s.nameIsCustom?s.name:s.labelParts.subject.en)).size!==series.length)return null;
 return {key:first.key,labels:first.metric};
}

export function resolveSeriesLabels(series=[],language='pl',design={}){
 const lang=language==='en'?'en':'pl',common=commonSeriesMetric(series),shared=!!common&&design.legendMode!=='full';
 const custom=common&&design.metricLabels?.[common.key]?.[lang];
 return {series:series.map(s=>({...s,name:s.nameIsCustom?s.name:s.labelParts?(shared?s.labelParts.subject[lang]:s.labelParts.full[lang]):translate(s.name,lang)})),
  commonMetric:common,metricCaption:shared?(custom||common.labels[lang]):'',metricCaptionIsCustom:shared&&!!custom};
}
