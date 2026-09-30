// Official ARC Prize semi-private results. The two harnesses are separate tests.
export const arc3SourceUrl='https://arcprize.org/media/data/leaderboard/v3.json';
const leaderboard='https://arcprize.org/leaderboard';
export function arc3Datasets(snapshot,receipt){
 if(snapshot.version!=='v3'||!Array.isArray(snapshot.evaluations))throw new Error('Review changed ARC-AGI-3 source schema.');
 const day=receipt.retrievedAt?.slice(0,10);
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||!Number.isFinite(Date.parse(snapshot.generatedAt))||snapshot.generatedAt.slice(0,10)>day)throw new Error('Invalid ARC snapshot date.');
 const ids=new Set();
 const rows=snapshot.evaluations.flatMap(r=>{
  if(r.datasetId!=='v3_Semi_Private'||r.display!==true)return [];
  if(r.score==null)return []; // Missing scores must never become zero.
  if(!Number.isFinite(r.score)||r.score<0||r.score>1||!r.modelId||!r.modelDisplayName||!r.providerDisplayName)throw new Error('Invalid ARC-AGI-3 result.');
  if(ids.has(r.modelId))throw new Error(`Duplicate ARC configuration: ${r.modelId}`);
  ids.add(r.modelId);
  const adapter=r.modelId.endsWith('-provider-adapter');
  const harness=adapter?'Provider Adapter':'Standard';
  const sourceReleaseDate=r.modelReleaseDate?.slice(0,10)||null;
  const review=receipt.releaseDateReviews?.[r.modelId];
  const releaseDate=review?review.releaseDate:sourceReleaseDate;
  if(releaseDate&&(!/^\d{4}-\d{2}-\d{2}$/.test(releaseDate)||releaseDate>day))throw new Error(`Invalid ARC model date: ${r.modelId}`);
  const sourceUrl=r.resultsUrl?new URL(r.resultsUrl,'https://arcprize.org').href:leaderboard;
  if(!sourceUrl.startsWith('https://arcprize.org/'))throw new Error('Unexpected ARC result source.');
  return [{id:`arc3:${r.modelId}:${day}`,modelId:`arc3:${r.modelId}`,model:r.modelDisplayName,
   organization:r.providerDisplayName,releaseDate,sourceReleaseDate,
   releaseDateSourceUrl:review?.sourceUrl||arc3SourceUrl,observedAt:day,dateKind:'snapshot',
   score:r.score*100,sourceValue:r.score,sourceModelId:r.modelId,modelGroup:r.modelGroup,
   effort:r.modelDisplayName.match(/\((Max|XHigh|High|Medium|Low|None)\)/i)?.[1]?.toLowerCase()||null,
   harness,protocol:`ARC-AGI-3 · Semi-Private · ${harness} · RHAE`,sourceUrl,
   evaluationCostUsd:Number.isFinite(r.cost)?r.cost:null,
   notes:['Data obserwacji = dzień pobrania rankingu, nie data wykonania testu.',review?.note].filter(Boolean).join(' ')}];
 });
 if(!rows.length)throw new Error('No visible ARC-AGI-3 results; review source before publishing.');
 return ['Standard','Provider Adapter'].filter(harness=>rows.some(r=>r.harness===harness)).map(harness=>({
  id:harness==='Standard'?'arc3':'arc3-provider-adapter',name:`ARC-AGI-3 · ${harness}`,
  category:'Rozumowanie',unit:'%',max:100,scoreDecimals:2,dateKind:'snapshot',
  defaultBasis:'observed',defaultMode:'ranking',source:'ARC Prize',sourceUrl:leaderboard,
  retrievedAt:day,sourceGeneratedAt:snapshot.generatedAt,dataUrl:arc3SourceUrl,
  description:harness==='Standard'
   ?'Interaktywne zadania ARC-AGI-3, zbiór Semi-Private. RHAE mierzy efektywność działań względem człowieka. Standard przenosi notatki wybrane przez model.'
   :'Interaktywne zadania ARC-AGI-3, zbiór Semi-Private. Provider Adapter zachowuje stan rozumowania i skraca długie rozmowy. Osobno od Standard.',
  caveat:'RHAE nie jest odsetkiem rozwiązanych zadań ani IQ. Standard i Provider Adapter mają różne warunki i pozostają osobnymi zestawami. Data obserwacji to dzień pobrania; dat testów brak. Oś premier jest retrospektywą. Developer Preview, Public Demo i konkurs Kaggle nie są dołączone.',
  license:'Publiczne wyniki ARC Prize Foundation; przypisanie do źródła. Nie redystrybuujemy zadań ani logów. Sprawdź warunki dalszego wykorzystania.',
  baseline:{name:'Człowiek · punkt odniesienia',score:100,unit:'%',
   note:'100% to poziom odniesienia RHAE wyznaczony z liczby działań ludzi na każdym poziomie. Nie jest średnią wyniku dowolnego człowieka ani miarą ogólnej inteligencji.',
   sourceUrl:'https://arcprize.org/media/ARC_AGI_3_Technical_Report.pdf'},
  rows:rows.filter(r=>r.harness===harness).sort((a,b)=>a.observedAt.localeCompare(b.observedAt)||a.id.localeCompare(b.id)),
 }));
}
