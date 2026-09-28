export const DAY = 86_400_000;
export function toDay(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Wybierz daty w formacie RRRR-MM-DD.');
  const value = Date.parse(`${date}T00:00:00Z`);
  if (!Number.isFinite(value) || new Date(value).toISOString().slice(0, 10) !== date) throw new Error('Nieprawidłowa data.');
  return value / DAY;
}
export const fromDay = day => new Date(day * DAY).toISOString().slice(0, 10);
export const displayDate = day => new Date(day * DAY).toLocaleDateString('pl-PL', { timeZone: 'UTC' });

function amountInCents(value, label) {
  if (!Number.isFinite(value) || value < 0 || value > 100_000 || Math.abs(value * 100 - Math.round(value * 100)) > 1e-7)
    throw new Error(`${label}: podaj kwotę 0–100 000 zł, maksymalnie 2 miejsca po przecinku.`);
  return Math.round(value * 100);
}

export function validateMarketRange(stock, start, end) {
  const first = toDay(start), last = toDay(end);
  if (last <= first) throw new Error('Data końcowa musi być późniejsza od początkowej.');
  if (last - first > 30 * 366) throw new Error('Wybierz zakres nie dłuższy niż 30 lat.');
  if (!stock?.rows?.length) throw new Error('Brak notowań spółki.');
  if (start < stock.rows[0][0]) throw new Error(`Historia tej spółki zaczyna się ${stock.rows[0][0]}.`);
  const snapshotEnd = fromDay(toDay(stock.retrievedAt.slice(0, 10)) - 1);
  if (end > snapshotEnd) throw new Error(`Dane obejmują zakończone dni do ${snapshotEnd}.`);
  return { first, last };
}

export function simulateDailyInvestment({ stock, fx, start, end, dailyInvestment, dailyExpense, expenseName = 'Coca-Cola' }) {
  const { first, last } = validateMarketRange(stock, start, end);
  const deposit = amountInCents(dailyInvestment, 'Wpłata'), expense = amountInCents(dailyExpense, 'Wydatek');
  if (deposit === 0 && expense === 0) throw new Error('Przynajmniej jedna kwota musi być większa od zera.');
  if (stock.currency !== 'PLN' && !fx?.rows?.length) throw new Error('Brak historycznych kursów NBP.');
  const prices = stock.rows, rates = fx?.rows || [];
  let priceIndex = -1, fxIndex = -1, cashCents = 0, totalCents = 0, expenseCents = 0, units = 0, trades = 0;
  const ledger = [];
  for (let day = first; day <= last; day++) {
    const date = fromDay(day);
    while (priceIndex + 1 < prices.length && prices[priceIndex + 1][0] <= date) priceIndex++;
    // Strictly previous publication date: the simulation never uses a future FX table.
    while (fxIndex + 1 < rates.length && rates[fxIndex + 1].date < date) fxIndex++;
    const price = prices[priceIndex], rateRow = rates[fxIndex];
    const fxRate = stock.currency === 'PLN' ? 1 : rateRow?.[stock.currency];
    if (!Number.isFinite(fxRate) || fxRate <= 0) throw new Error(`Brak kursu ${stock.currency}/PLN dostępnego przed ${date}.`);
    if (stock.currency !== 'PLN' && day - toDay(rateRow.date) > 10) throw new Error(`Kurs NBP jest zbyt stary dla ${date}. Odśwież dane.`);
    if (price && day - toDay(price[0]) > 10) throw new Error(`Ponad 10 dni bez notowania ${stock.symbol} przed ${date}. Nie wyceniamy portfela po nieaktualnej cenie.`);
    cashCents += deposit; totalCents += deposit; expenseCents += expense;
    let purchase = 0;
    if (price?.[0] === date && cashCents > 0) {
      if (!Number.isFinite(price[1]) || price[1] <= 0) throw new Error(`Nieprawidłowa cena ${date}.`);
      purchase = cashCents / 100;
      units += purchase / (price[1] * fxRate);
      cashCents = 0; trades++;
    }
    const portfolio = units * (price?.[1] || 0) * fxRate + cashCents / 100;
    ledger.push({ date, portfolio, contributions: totalCents / 100, expenses: expenseCents / 100, cash: cashCents / 100, purchase, quoteDate: price?.[0] || null, closeSplitAdjusted: price?.[1] ?? null, closeReconstructed: price?.[2] ?? null, fxRate, fxDate: stock.currency === 'PLN' ? null : rateRow.date });
  }
  const final = ledger.at(-1);
  return {
    series: [
      { name: `${stock.name} · portfel`, color: '#bcf34a', points: ledger.map(r => ({ x: toDay(r.date), y: r.portfolio })) },
      { name: `${expenseName || 'Napój'} · wydatki`, color: '#b18aff', points: ledger.map(r => ({ x: toDay(r.date), y: r.expenses })) },
      { name: 'Suma wpłat', color: '#8fabb6', points: ledger.map(r => ({ x: toDay(r.date), y: r.contributions })) }
    ],
    ledger,
    summary: { ...final, profit: final.portfolio - final.contributions, days: ledger.length, trades, simpleReturn: final.contributions ? (final.portfolio / final.contributions - 1) * 100 : null },
    methodology: 'Wpłata w każdy dzień kalendarzowy, obie granice dat wliczone. Zakup ułamkowych akcji po cenie zamknięcia tylko w dniach z notowaniem; gotówka oczekuje na sesję. Wycena w PLN po ostatniej tabeli A NBP opublikowanej przed danym dniem. Brak prowizji, spreadu, podatków, inflacji i dywidend. Cena skorygowana wyłącznie o splity; ilość jednostek wyrażona we wspólnej bazie splitowej. Ostatnia znana cena na dni bez sesji, bez interpolacji cen. Wynik to historyczny model, nie gwarancja ceny wykonania zlecenia.'
  };
}

export function priceSeries(stock, start, end, basis = 'split') {
  return [{ name: `${stock.symbol} · ${basis === 'raw' ? 'cena odtworzona' : 'Close (splity)'}`, color: '#bcf34a', points: stock.rows.filter(r => r[0] >= start && r[0] <= end).map(r => ({ x: toDay(r[0]), y: r[basis === 'raw' ? 2 : 1] })) }];
}

export function marketCsv(rows, headers) {
  const cell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return '\uFEFF' + [headers, ...rows].map(row => row.map(cell).join(';')).join('\r\n');
}
