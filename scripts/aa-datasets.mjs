// Separate benchmark versions and protocols. Missing results never become zero.
export const aaSpecs = [
 ['aa-index-v432','Artificial Analysis · Intelligence Index v4.3.2','Przekrojowe','index','pkt indeksu','Indeks wielu testów w wersji 4.3.2. To nie IQ ani procent poprawnych odpowiedzi.'],
 ['aa-briefcase-v11','AA-Briefcase v1.1 · AA','Agenci','aa-briefcase','Elo','Wynik pracy agentów: łączny rating Elo, bez przeliczania na procenty.'],
 ['aa-gdpval-v21','GDPval-AA v2.1 · AA','Agenci','gdpval-aa','Elo','Praca profesjonalna oceniana porównawczo. Rating Elo wersji 2.1.'],
 ['aa-automation','AutomationBench · AA partial reward','Agenci','automationbench-aa','%','Automatyzacja zadań: częściowa nagroda w protokole AA, nie odsetek całkowicie ukończonych zadań.'],
 ['aa-terminal4','Terminal-Bench 4.0 · AA','Kod','terminalbench-4-0','%','Zadania w terminalu: protokół Artificial Analysis, wersja 4.0.'],
 ['aa-hle-no-tools','Humanity’s Last Exam · AA no tools','Wiedza','humanitys-last-exam','%','HLE bez narzędzi w protokole AA. Nie łączymy z wynikami z dostępem do narzędzi.'],
 ['aa-gdp-pdf','GDP.pdf · AA all-pass','Wiedza','gdp-pdf','%','Pytania o złożone dokumenty PDF. Wynik all-pass wymaga powodzenia we wszystkich powtórzeniach.'],
 ['aa-omniscience-accuracy','AA-Omniscience · accuracy','Wiedza','omniscienceAccuracy','%','Odsetek poprawnych odpowiedzi. Osobna metryka od indeksu Omniscience i częstości halucynacji.'],
 ['aa-omniscience-nonhallucination','AA-Omniscience · 1 − hallucination rate','Wiedza','omniscienceHallucinationRate','%','100 × (1 − częstość halucynacji AA). Więcej oznacza lepiej; odmowa odpowiedzi nie oznacza poprawnej odpowiedzi.'],
 ['aa-lcr-v11','AA-LCR v1.1','Rozumowanie','artificial-analysis-long-context-reasoning','%','Rozumowanie na długim kontekście w wersji 1.1 protokołu AA.'],
 ['aa-terminal-science01','Terminal-Bench Science 0.1 · AA','Nauka','terminalBenchScience','%','Naukowe zadania w terminalu. Oddzielny benchmark i środowisko pomiaru Artificial Analysis.'],
];
export function aaDatasets(snapshot){
 if(snapshot.indexVersion!=='4.3.2')throw new Error('Review changed AA index methodology before importing.');
 const caveat='Stan rankingu na dzień pobrania, bez dat poszczególnych testów. Oś premier jest retrospektywą. Warianty rozumowania i fallback są rozdzielone. SciCode i CritPt oznaczono w źródle jako „Under review”; nie dodajemy ich jako osobnych benchmarków.';
 return aaSpecs.map(([id,name,category,key,unit,description])=>({
  id,name,category,description,unit,...(unit==='%'?{max:100}:{}),dateKind:'snapshot',
  defaultBasis:'release',defaultMode:'ranking',source:'Artificial Analysis',sourceUrl:snapshot.methodologyUrl,
  retrievedAt:snapshot.retrievedAt,license:'Publiczne wyniki Artificial Analysis; przypisanie do źródła. Sprawdź warunki dalszego wykorzystania.',caveat,
  rows:snapshot.models.flatMap(m=>{
   if(m.intelligenceIndexIsEstimated!==false)return [];
   const value=key==='index'?m.intelligenceIndex:key in m?m[key]:m.intelligenceIndexEvaluations?.find(e=>e.slug===key)?.score;
   if(value==null)return [];
   if(!Number.isFinite(value)||(unit==='%'&&(value<0||value>1)))throw new Error(`Invalid AA score: ${m.slug}/${key}`);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(m.releaseDate)||m.releaseDate>snapshot.retrievedAt)throw new Error(`Invalid AA release: ${m.slug}`);
   return [{id:`${id}:${m.slug}:${snapshot.retrievedAt}`,modelId:`aa:${m.slug}`,model:m.name,
    organization:m.creator.name,releaseDate:m.releaseDate,observedAt:snapshot.retrievedAt,dateKind:'snapshot',
    effort:m.effort?.slug||null,score:unit==='%'?(key==='omniscienceHallucinationRate'?1-value:value)*100:value,
    sourceValue:value,protocol:name,sourceUrl:`https://artificialanalysis.ai/models/${m.slug}`,
    notes:'Data obserwacji = dzień pobrania rankingu, nie data wykonania testu. Pełna nazwa zachowuje konfigurację źródła.'}];
  }),
 }));
}
