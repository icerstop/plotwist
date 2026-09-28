// Editorial starting points; price comparisons do not establish causation.
export const marketStories = [
  {
    "id": "dotcom",
    "title": {
      "pl": "Bańka internetowa",
      "en": "The dot-com bubble"
    },
    "start": "1999-03-10",
    "end": "2003-12-31",
    "symbols": [
      "CSCO",
      "AMZN",
      "MSFT",
      "QQQ"
    ],
    "description": {
      "pl": "Technologia przed i po pęknięciu bańki w 2000 roku. Cisco, Amazon i Microsoft na tle Nasdaq-100.",
      "en": "Technology before and after the bubble burst in 2000. Cisco, Amazon and Microsoft against the Nasdaq-100."
    },
    "sourceLabel": "FCIC · 2011",
    "sourceUrl": "https://www.govinfo.gov/content/pkg/GPO-FCIC/pdf/GPO-FCIC.pdf"
  },
  {
    "id": "crisis",
    "title": {
      "pl": "Banki w kryzysie 2008",
      "en": "Banks in the 2008 crisis"
    },
    "start": "2007-01-03",
    "end": "2009-12-31",
    "symbols": [
      "JPM",
      "BAC",
      "C",
      "SPY"
    ],
    "description": {
      "pl": "JPMorgan, Bank of America i Citigroup na tle S&P 500 w okresie kryzysu finansowego.",
      "en": "JPMorgan, Bank of America and Citigroup against the S&P 500 during the financial crisis."
    },
    "sourceLabel": "Federal Reserve History",
    "sourceUrl": "https://www.federalreservehistory.org/essays/great-recession-and-its-aftermath"
  },
  {
    "id": "pandemic",
    "title": {
      "pl": "Pandemia: praca, zdrowie, podróże",
      "en": "Pandemic: work, health, travel"
    },
    "start": "2019-06-03",
    "end": "2021-12-31",
    "symbols": [
      "ZM",
      "MRNA",
      "DAL",
      "CCL",
      "SPY"
    ],
    "description": {
      "pl": "Zoom, Moderna, linie lotnicze i rejsy wycieczkowe. WHO ogłosiła pandemię 11 marca 2020 r.",
      "en": "Zoom, Moderna, airlines and cruises. WHO characterized COVID-19 as a pandemic on 11 March 2020."
    },
    "sourceLabel": "WHO · 11.03.2020",
    "sourceUrl": "https://www.who.int/news-room/speeches/item/who-director-general-s-opening-remarks-at-the-media-briefing-on-covid-19---11-march-2020"
  },
  {
    "id": "oil",
    "title": {
      "pl": "Gdy cena kontraktu WTI spadła poniżej zera",
      "en": "When WTI futures fell below zero"
    },
    "start": "2020-01-02",
    "end": "2020-06-30",
    "symbols": [
      "CL=F",
      "BZ=F"
    ],
    "scale": "price",
    "description": {
      "pl": "WTI i Brent w USD za baryłkę. Ujemna cena 20 kwietnia 2020 dotyczyła majowego kontraktu WTI; to nie cena całej ropy na świecie. Serie dostawcy zmieniają kontrakty.",
      "en": "WTI and Brent in USD per barrel. The negative price on 20 April 2020 concerned the May WTI contract, not all oil worldwide. Provider series roll between contracts."
    },
    "sourceLabel": "CFTC · 2020",
    "sourceUrl": "https://www.cftc.gov/PressRoom/PressReleases/8315-20"
  },
  {
    "id": "gamestop",
    "title": {
      "pl": "GameStop i gorączka meme stocks",
      "en": "GameStop and the meme-stock frenzy"
    },
    "start": "2020-07-01",
    "end": "2021-06-30",
    "symbols": [
      "GME",
      "SPY"
    ],
    "description": {
      "pl": "GameStop na tle szerokiego rynku, z okresem gwałtownych zmian w styczniu 2021. Raport SEC omawia przebieg wydarzeń.",
      "en": "GameStop against the broad market, including the sharp moves in January 2021. The SEC report discusses the episode."
    },
    "sourceLabel": "SEC · 2021",
    "sourceUrl": "https://www.sec.gov/newsroom/press-releases/2021-212"
  },
  {
    "id": "cyberpunk",
    "title": {
      "pl": "CD Projekt przed i po premierze Cyberpunka",
      "en": "CD Projekt before and after Cyberpunk"
    },
    "start": "2020-01-02",
    "end": "2021-12-30",
    "symbols": [
      "CDR.WA",
      "ETFBW20TR.WA"
    ],
    "description": {
      "pl": "Premiera Cyberpunk 2077: 10 grudnia 2020. Kurs CD Projekt obok BETA ETF WIG20TR. Sama zbieżność dat nie dowodzi przyczyny zmiany kursu.",
      "en": "Cyberpunk 2077 launched on 10 December 2020. CD Projekt alongside BETA ETF WIG20TR. Timing alone does not prove why a price changed."
    },
    "sourceLabel": "CD PROJEKT · 10.12.2020",
    "sourceUrl": "https://www.cdprojekt.com/en/media/news/cyberpunk-2077-is-out-now/"
  },
  {
    "id": "ai",
    "title": {
      "pl": "Boom AI i producenci chipów",
      "en": "The AI boom and chipmakers"
    },
    "start": "2022-01-03",
    "end": "2025-12-31",
    "symbols": [
      "NVDA",
      "AMD",
      "TSM",
      "ASML.AS"
    ],
    "description": {
      "pl": "NVIDIA, AMD, TSMC i ASML. Kontekst: raport NVIDIA z 24 maja 2023 o popycie na infrastrukturę generatywnej AI. Indeks cen w walutach notowania, bez wpływu kursów walut.",
      "en": "NVIDIA, AMD, TSMC and ASML. Context: NVIDIA's 24 May 2023 report on demand for generative AI infrastructure. Price indices in listing currencies, excluding exchange-rate effects."
    },
    "sourceLabel": "NVIDIA · 24.05.2023",
    "sourceUrl": "https://nvidianews.nvidia.com/news/nvidia-announces-financial-results-for-first-quarter-fiscal-2024"
  },
  {
    "id": "energy",
    "title": {
      "pl": "GPW w czasie kryzysu energetycznego",
      "en": "Polish stocks during the energy crisis"
    },
    "start": "2021-01-04",
    "end": "2023-12-29",
    "symbols": [
      "JSW.WA",
      "LWB.WA",
      "PGE.WA",
      "PKN.WA"
    ],
    "description": {
      "pl": "JSW, Bogdanka, PGE i Orlen w latach 2021–2023. Raport IEA opisuje globalny kryzys energetyczny; nie przypisuje każdej zmiany tych akcji jednej przyczynie.",
      "en": "JSW, Bogdanka, PGE and Orlen in 2021–2023. The IEA report describes the global energy crisis; it does not attribute every stock move to a single cause."
    },
    "sourceLabel": "IEA · World Energy Outlook 2022",
    "sourceUrl": "https://www.iea.org/reports/world-energy-outlook-2022/executive-summary"
  },
  {
    "id": "beta",
    "title": {
      "pl": "GPW: duże, średnie i małe spółki",
      "en": "Poland: large, mid and small caps"
    },
    "start": "2022-01-03",
    "end": "2025-12-30",
    "symbols": [
      "ETFBW20TR.WA",
      "ETFBM40TR.WA",
      "ETFBS80TR.WA"
    ],
    "description": {
      "pl": "Trzy polskie ETF-y BETA na indeksy WIG20TR, mWIG40TR i sWIG80TR. Wykres pokazuje giełdowe ceny funduszy, nie poziomy samych indeksów.",
      "en": "Three Polish BETA ETFs tracking WIG20TR, mWIG40TR and sWIG80TR. The chart shows exchange-traded fund prices, not the index levels."
    },
    "sourceLabel": "BETA ETF",
    "sourceUrl": "https://betaetf.pl/"
  }
];
