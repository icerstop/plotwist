import {FrequencyPicker} from './FrequencyPicker.jsx';
import {frequencyPhrase,periodAmount,scheduleRule} from './recurrence.js';
import {useLanguages,localeFor} from './language-context.js';
import {translate} from './translations.js';
import {PresentationPicker} from './Presentation.jsx';
import {VisualEditor} from './VisualSettings.jsx';
import ComparisonStudio from './ComparisonStudio.jsx';
import React, { useEffect, useMemo, useState } from 'react';
import { ArrowUpRight, Database, Download, Info, Search } from 'lucide-react';
import { ExportModal, Field, FontPicker, ReelPreview } from './components.jsx';
import { downloadBlob } from './data.js';
import { fromDay, marketCsv, marketStartDate, priceSeries, simulateInvestment, toDay, validateMarketRange } from './market.js';

async function readJson(path, signal) {
  const r = await fetch(path, { signal });
  if (!r.ok) throw new Error('Nie udało się wczytać danych. Odśwież stronę i spróbuj ponownie.');
  return r.json();
}

export default function MarketStudio({fontId='arial',onFontChange}) {
  const {uiLanguage,reelLanguage}=useLanguages();
  const money=n=>n.toLocaleString(localeFor(uiLanguage),{style:'currency',currency:'PLN',maximumFractionDigits:2});
  const number=n=>n.toLocaleString(localeFor(uiLanguage),{minimumFractionDigits:2,maximumFractionDigits:4});
  const [manifest, setManifest] = useState(null), [fx, setFx] = useState(null), [stock, setStock] = useState(null);
  const [symbol, setSymbol] = useState('NVDA'), [region, setRegion] = useState('Wszystkie'), [search, setSearch] = useState('');
  const [start, setStart] = useState('2020-01-01'), [end, setEnd] = useState('');
  const [investment, setInvestment] = useState('5'), [expense, setExpense] = useState('3'), [expenseName, setExpenseName] = useState('Coca-Cola');
  const [investmentFrequency,setInvestmentFrequency]=useState('daily'),[expenseFrequency,setExpenseFrequency]=useState('daily');
  const [mode, setMode] = useState('compare'), [basis, setBasis] = useState('split');
  const [title, setTitle] = useState('5 zł dziennie w NVIDIA.'), [customTitle, setCustomTitle] = useState(false);
  const [chart,setChart]=useState('line');
  const [duration, setDuration] = useState(12), [theme, setTheme] = useState('dark');
  const [loading, setLoading] = useState(true), [error, setError] = useState(''), [exporting, setExporting] = useState(false);
  const [page, setPage] = useState(0);
  useEffect(() => {
    const c = new AbortController();
    Promise.all([readJson('/market/manifest.json', c.signal), readJson('/market/fx-pln.json', c.signal)])
      .then(([m, f]) => { setManifest(m); setFx(f); })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); });
    return () => c.abort();
  }, []);
  useEffect(() => {
    const c = new AbortController(); setLoading(true); setError(''); setStock(null);
    readJson(`/market/${encodeURIComponent(symbol)}.json`, c.signal)
      .then(s => {
        setStock(s);
        setStart(d => d < s.rows[0][0] ? s.rows[0][0] : d);
        setEnd(d => d < s.rows[0][0] || d > s.rows.at(-1)[0] ? s.rows.at(-1)[0] : d);
      })
      .catch(e => { if (e.name !== 'AbortError') setError(e.message); })
      .finally(() => { if (!c.signal.aborted) setLoading(false); });
    return () => c.abort();
  }, [symbol]);
  useEffect(() => { setPage(0); }, [symbol, start, end]);
  const result = useMemo(() => {
    if (!stock || !fx) return { series: [], ledger: [], error: '' };
    try {
      return { ...simulateInvestment({ stock, fx, start, end, investmentFrequency, expenseFrequency, investmentAmount: investment.trim() ? Number(investment) : NaN, expenseAmount: expense.trim() ? Number(expense) : NaN, expenseName }), error: '' };
    } catch (e) { return { series: [], ledger: [], error: e.message }; }
  }, [stock, fx, start, end, investment, expense, expenseName, investmentFrequency, expenseFrequency]);
  const filtered = useMemo(() => (manifest?.stocks || []).filter(s => (region === 'Wszystkie' || s.region === region) && `${s.name} ${s.symbol} ${s.country} ${translate(s.country,'en')}`.toLowerCase().includes(search.toLowerCase())), [manifest, region, search]);
  const quotes = useMemo(() => (stock?.rows || []).filter(r => r[0] >= start && r[0] <= end).toReversed(), [stock, start, end]);
  const chartSeries = useMemo(() => mode === 'dca' ? result.series : stock ? priceSeries(stock, start, end, basis) : [], [mode, result.series, stock, start, end, basis]);
  const generatedTitle = mode === 'dca' ? `${investment || '0'} zł ${frequencyPhrase(investmentFrequency)} w ${stock?.name || symbol}.` : `${stock?.name || symbol}. Dzień po dniu.`;
  const config = useMemo(() => ({
    series: chartSeries, title: customTitle ? title : generatedTitle,titleIsCustom:customTitle,
    subtitle: mode === 'dca' ? `${stock?.name || symbol}: ${periodAmount(investment||0,investmentFrequency)} vs ${expenseName || 'napój'}: ${periodAmount(expense||0,expenseFrequency)}` : basis === 'split' ? 'Cena zamknięcia · korekta o splity' : 'Cena nominalna · odtworzona z korekt splitowych',
    source: mode === 'dca' ? 'Yahoo Finance + NBP · bez dywidend, opłat i podatków' : 'Yahoo Finance · historia dzienna · bez bieżącej sesji',
    format: '9:16', theme, fontId, chart, unit: mode === 'dca' ? 'zł' : stock?.currency || '', xType: 'date'
  }), [chartSeries, customTitle, title, generatedTitle, mode, stock, symbol, expenseName, investment, expense, basis, theme, fontId, chart, investmentFrequency, expenseFrequency]);
  const priceRangeError = useMemo(() => { if (!stock) return ''; try { validateMarketRange(stock, start, end); return ''; } catch (e) { return e.message; } }, [stock, start, end]);
  const visibleError = error || (mode === 'dca' ? result.error : priceRangeError);
  const valid = !loading && !visibleError && chartSeries.length > 0 && chartSeries.every(s => s.points.length >= 2);
  const maxDate = stock ? fromDay(toDay(stock.retrievedAt.slice(0, 10)) - 1) : '';
  const minDate = marketStartDate(stock, fx, mode);
  const summary = result.summary;
  const pages = Math.max(1, Math.ceil(quotes.length / 20));
  function selectStock(value) { setSymbol(value); setCustomTitle(false); }
  function exportPrices() {
    const csv = marketCsv(quotes.toReversed().map(r => [r[0], stock.symbol, stock.currency, r[1], r[2], stock.sourceUrl, stock.retrievedAt]), ['data', 'symbol', 'waluta', 'close_po_korekcie_splitow', 'close_nominalna_odtworzona', 'zrodlo', 'pobrano']);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `plotwist-${symbol}-${start}-${end}.csv`);
  }
  function exportLedger() {
    const headers = ['date','deposit','expense','investmentFrequency','expenseFrequency','portfolio','contributions','expenses','cash','purchase','quoteDate','closeSplitAdjusted','closeReconstructed','fxRate','fxDate'];
    downloadBlob(new Blob([marketCsv(result.ledger.map(r => headers.map(h => typeof r[h] === 'number' ? Number(r[h].toFixed(8)) : r[h])), headers)], { type: 'text/csv;charset=utf-8' }), `plotwist-${symbol}-symulacja.csv`);
  }
  function exportMethodology() {
    downloadBlob(new Blob([JSON.stringify({ stock: { symbol: stock.symbol, currency: stock.currency, sourceUrl: stock.sourceUrl, retrievedAt: stock.retrievedAt, splits: stock.splits, priceMethod: stock.priceMethod }, fx: { sourceUrl: fx.sourceUrl, retrievedAt: fx.retrievedAt }, inputs: { start, end, investmentAmount: Number(investment), expenseAmount: Number(expense), investmentFrequency, expenseFrequency, expenseName, scheduleRule }, methodology: result.methodology, summary }, null, 2)], { type: 'application/json' }), `plotwist-${symbol}-metodologia.json`);
  }
  if(mode==='compare')return <div className="market-page"><div className="market-switch comparison-tabs" role="tablist" aria-label="Tryb giełdowy">{[['compare','Wiele serii'],['dca','Inwestycja vs nawyk'],['prices','Kurs akcji']].map(([id,label])=><button role="tab" aria-selected={mode===id} className={mode===id?'selected':''} key={id} onClick={()=>setMode(id)}>{label}</button>)}</div>{error&&<p role="alert" className="error">{error}</p>}<ComparisonStudio manifest={manifest} fx={fx} fontId={fontId} onFontChange={onFontChange}/></div>;
  return <div className="market-page">
    <div className="market-heading"><div><h1>Mały nawyk. Prawdziwa historia.</h1><p>Regularne wpłaty spotykają historyczne ceny akcji.</p></div><button className="primary" disabled={!valid} onClick={() => setExporting(true)}><Download size={17}/>Eksportuj rolkę</button></div>
    <div className="market-meta"><Database size={15}/>{manifest ? <span>{manifest.stocks.length} spółek · {manifest.totalObservations.toLocaleString(localeFor(uiLanguage))} cen zamknięcia · USA i Europa</span> : <span>Wczytywanie katalogu…</span>}<span>Snapshot: {manifest?.retrievedAt.slice(0,10) || '…'}</span></div>
    <div className="market-workspace">
      <section className="market-controls" aria-label="Ustawienia inwestowania"><PresentationPicker config={config} value={chart} onChange={setChart}/>
        <div className="market-switch" role="tablist" aria-label="Tryb giełdowy">{[['compare','Wiele serii'],['dca','Inwestycja vs nawyk'],['prices','Kurs akcji']].map(([id,label]) => <button role="tab" aria-selected={mode===id} className={mode===id?'selected':''} key={id} onClick={() => {setMode(id);setCustomTitle(false);}}>{label}</button>)}</div>
        <div className="market-regions">{['Wszystkie','USA','Europa'].map(r => <button key={r} className={region===r?'selected':''} onClick={() => setRegion(r)}>{r}</button>)}</div>
        <div className="search-field market-search"><Search size={17}/><input aria-label="Szukaj spółki" placeholder="NVIDIA, Apple, ASML, Polska…" value={search} onChange={e=>setSearch(e.target.value)}/></div>
        <Field label="Spółka i rynek"><select value={symbol} onChange={e=>selectStock(e.target.value)}>{!filtered.some(s=>s.symbol===symbol)&&<option value={symbol}>{stock?.name || symbol} (wybrana)</option>}{filtered.map(s=><option key={s.symbol} value={s.symbol}>{s.name} · {s.symbol} · {s.country}</option>)}</select><small>{filtered.length} pasujących spółek · wybrana: {stock?.exchange || '…'} · {stock?.currency || '…'}</small></Field>
        <div className="field-pair"><Field label="Od dnia"><input type="date" aria-label="Data początkowa inwestycji" min={minDate} max={maxDate} value={start} onInput={e=>setStart(e.target.value)}/></Field><Field label="Do dnia"><input type="date" aria-label="Data końcowa inwestycji" min={start} max={maxDate} value={end} onInput={e=>setEnd(e.target.value)}/></Field></div>
        <button className="text-btn" disabled={!stock||!fx} onClick={()=>{setStart(minDate);setEnd(stock.rows.at(-1)[0]);}}>Cała dostępna historia</button>
        {stock&&<p className="helper">Notowania: {stock.rows[0][0]} – {stock.rows.at(-1)[0]}.{mode==='dca'&&stock.currency!=='PLN'&&<> Symulacja w PLN od {minDate}, zgodnie z dostępnością wcześniejszego kursu NBP. Starsze ceny są dostępne w trybie „Kurs akcji”.</>}</p>}
        {mode==='dca'?<>
          <div className="field-pair market-amounts"><Field label="Kwota jednej wpłaty"><input aria-label="Kwota jednej wpłaty w zł" type="number" min="0" max="100000" step="0.01" value={investment} onChange={e=>setInvestment(e.target.value)}/><small translate="no">{periodAmount(investment||0,investmentFrequency,uiLanguage)}</small></Field><Field label="Kwota jednego zakupu"><input aria-label="Kwota jednego zakupu w zł" type="number" min="0" max="100000" step="0.01" value={expense} onChange={e=>setExpense(e.target.value)}/><small translate="no">{periodAmount(expense||0,expenseFrequency,uiLanguage)}</small></Field></div>
          <div className="field-pair"><FrequencyPicker label="Częstotliwość inwestowania" value={investmentFrequency} onChange={setInvestmentFrequency}/><FrequencyPicker label="Częstotliwość zakupów" value={expenseFrequency} onChange={setExpenseFrequency}/></div>
          <p className="helper schedule-rule">{scheduleRule} Wpłata w dzień bez sesji czeka w gotówce na najbliższą sesję.</p>
          {summary&&Math.abs(summary.contributions-summary.expenses)>.005&&<div className="budget-note"><span>Różne budżety w tym okresie: {money(summary.contributions)} / {money(summary.expenses)}.</span><button onClick={()=>{setExpense(investment);setExpenseFrequency(investmentFrequency);}}>Dopasuj kwotę i częstotliwość</button></div>}
          <Field label="Twój regularny zakup"><input maxLength="35" value={expenseName} onChange={e=>setExpenseName(e.target.value)} placeholder="Np. Coca-Cola, kawa, przekąska"/></Field>
        </>:<Field label="Rodzaj ceny"><select value={basis} onChange={e=>setBasis(e.target.value)}><option value="split">Close — po korekcie o splity</option><option value="raw">Cena nominalna — odtworzona</option></select><small>Korekta o splity zapewnia ciągłość wykresu. Cena nominalna może gwałtownie spaść w dniu splitu.</small></Field>}
        <FontPicker value={fontId} onChange={onFontChange}/><VisualEditor/><Field label="Tytuł rolki"><textarea maxLength="80" rows="2" value={customTitle?title:translate(generatedTitle,reelLanguage)} onChange={e=>{setCustomTitle(true);setTitle(e.target.value);}}/>{customTitle&&<button type="button" className="text-btn" onClick={()=>setCustomTitle(false)}>Przywróć tytuł automatyczny</button>}</Field>
        <div className="field-pair"><Field label="Długość rolki"><select value={duration} onChange={e=>setDuration(Number(e.target.value))}>{[6,12,20,30].map(t=><option key={t} value={t}>{t} s</option>)}</select></Field><Field label="Motyw rolki"><select value={theme} onChange={e=>setTheme(e.target.value)}><option value="dark">Po zmroku</option><option value="light">Jasna strona</option></select></Field></div>
        {loading&&<p className="helper" role="status">Wczytywanie notowań…</p>}{visibleError&&<p className="error" role="alert">{visibleError}</p>}
      </section>
      <ReelPreview config={config} duration={duration} valid={valid}/>
      <aside className="market-results">
        <h2>{mode==='dca'?'Co pokazuje historia?':'Wybrane notowanie'}</h2>
        <p className="muted">{start} → {end}</p>
        {summary&&mode==='dca'?<>
          <div className="market-value"><span>Wartość portfela z gotówką</span><strong>{money(summary.portfolio)}</strong><small>Ostatnia cena akcji: {summary.quoteDate}</small></div>
          <dl className="market-stats"><div><dt>Twoje wpłaty</dt><dd>{money(summary.contributions)}</dd></div><div><dt>Wynik ponad wpłaty</dt><dd className={summary.profit>=0?'positive':'negative'}>{money(summary.profit)}</dd></div><div><dt>Wydatki: {expenseName || 'napój'}</dt><dd>{money(summary.expenses)}</dd></div><div><dt>Gotówka czekająca na sesję</dt><dd>{money(summary.cash)}</dd></div><div><dt>Liczba wpłat / transakcji</dt><dd>{summary.depositCount} / {summary.trades}</dd></div><div><dt>Liczba zwykłych zakupów</dt><dd>{summary.expenseCount}</dd></div></dl>
          <p className="helper">Wydatki na napój to suma konsumpcji. Wynik inwestycji liczony jest względem wpłat do portfela.</p>
          <button className="secondary full" disabled={!valid} onClick={exportLedger}><Download size={16}/>Dziennik symulacji CSV</button>
        </>:quotes.length>0?<>
          <div className="market-value"><span>{basis==='raw'?'Cena nominalna (odtworzona)':'Cena po korekcie splitów'}</span><strong>{number(quotes[0][basis==='raw'?2:1])}</strong><small>{stock.currency} · sesja {quotes[0][0]}</small></div>
          <p className="helper">{quotes.length.toLocaleString(localeFor(uiLanguage))} sesji w wybranym zakresie. Pełny spis cen znajdziesz pod podglądem.</p>
        </>:null}
        <div className="market-assumptions"><Info size={19}/><div><strong>Założenia są częścią historii</strong><p>Akcje ułamkowe. Zakup po zamknięciu sesji. Wpłaty z dni bez notowań czekają w gotówce. Kurs NBP z poprzedniej dostępnej tabeli.</p><p>Bez dywidend, prowizji, spreadu, podatku i inflacji. To model historyczny.</p></div></div>
      </aside>
    </div>
    <section className="price-history" aria-label="Dzienne ceny zamknięcia">
      <div className="price-heading"><div><h2>Ceny zamknięcia, dzień po dniu</h2><p>{stock?.name || symbol} · {stock?.exchange || '…'} · {stock?.currency || '…'} · {quotes.length.toLocaleString(localeFor(uiLanguage))} sesji w zakresie</p></div><button className="secondary" disabled={!quotes.length} onClick={exportPrices}><Download size={16}/>Pobierz wszystkie ceny CSV</button></div>
      <div className="price-table-wrap"><table><thead><tr><th scope="col">Data sesji</th><th scope="col">Close po korekcie splitów</th><th scope="col">Cena nominalna (odtworzona)</th><th scope="col">Waluta</th></tr></thead><tbody>{quotes.slice(page*20,page*20+20).map(r=><tr key={r[0]}><th scope="row">{r[0]}</th><td>{number(r[1])}</td><td>{number(r[2])}</td><td>{stock.currency}</td></tr>)}</tbody></table>{!quotes.length&&<p className="helper">Brak sesji w wybranym zakresie.</p>}</div>
      <div className="pagination"><span>Najnowsze sesje najpierw · strona {Math.min(page+1,pages)} z {pages}</span><div><button className="secondary" disabled={page===0} onClick={()=>setPage(p=>p-1)}>Poprzednia</button><button className="secondary" disabled={page+1>=pages} onClick={()=>setPage(p=>p+1)}>Następna</button></div></div>
    </section>
    <details className="market-methodology"><summary>Źródła, korekty i sposób obliczania</summary><div><p>{result.methodology || 'Wybierz poprawny zakres, aby policzyć porównanie.'}</p><p>{scheduleRule}</p><p><strong>Dwie ceny:</strong> Yahoo Finance udostępnia Close skorygowane o splity. Cenę nominalną odtwarzamy, mnożąc przez współczynniki późniejszych splitów zgłoszonych przez dostawcę. To odtworzona historia, a nie niezależnie zweryfikowany oficjalny kurs aukcji zamknięcia. Pole Adj Close, korygowane także o dywidendy, nie służy do tej symulacji.</p><p><strong>Waluty:</strong> cena w GBp/GBX jest dzielona przez 100, aby otrzymać GBP. NBP podaje PLN za jednostkę waluty. W dni bez sesji wyceniamy ostatnią znaną cenę po dostępnym kursie NBP; linia portfela może wtedy zmieniać się przez walutę i wpłaty. Same ceny sesji nie są uzupełniane.</p><p><strong>Zakres:</strong> wybrane spółki z USA i 11 krajów Europy, pełna dzienna historia dostępna u dostawcy dla danego symbolu. Symulacja w PLN dodatkowo wymaga wcześniejszego kursu NBP (API udostępnia tabele od 02.01.2002). Zbiór jest snapshotem, nie aktualizuje się sam i pomija bieżący dzień. Nie obejmuje wszystkich spółek ani spółek wycofanych z giełdy. Nie służy do wyliczania historycznej stopy zwrotu całego rynku.</p><p><strong>Dostęp i wykorzystanie:</strong> publiczny dostęp nie oznacza licencji na dalszą redystrybucję danych. Przed komercyjną publikacją materiałów sprawdź warunki dostawcy.</p><div className="market-source-links"><a href={stock?.sourceUrl || 'https://finance.yahoo.com/'} target="_blank" rel="noreferrer">Yahoo Finance: {symbol}<ArrowUpRight size={15}/></a><a href="https://api.nbp.pl/" target="_blank" rel="noreferrer">NBP — tabela A<ArrowUpRight size={15}/></a><button className="text-btn" disabled={!summary} onClick={exportMethodology}><Download size={15}/>Pobierz założenia JSON</button></div><small>Pobrano ceny: {stock?.retrievedAt} · Pobrano NBP: {fx?.retrievedAt}</small></div></details>
    {exporting&&<ExportModal config={config} duration={duration} onClose={()=>setExporting(false)}/>}
  </div>;
}
