// The production bundle stores CSVs as gzip; the public download URLs stay unchanged.
export async function storyCsv(request,assets){
 const url=new URL(request.url),match=/^\/stories\/([a-zA-Z0-9_.-]+\.csv)$/.exec(url.pathname);
 if(!match||!['GET','HEAD'].includes(request.method))return null;
 url.pathname+='.gz';
 const source=await assets.fetch(new Request(url,{method:request.method}));
 // Missing static assets can fall back to index.html. Never download that as CSV.
 if(!source.ok||source.headers.get('Content-Type')?.includes('text/html')){
  await source.body?.cancel();
  return new Response(request.method==='HEAD'?null:'CSV not found',{status:404});
 }
 return new Response(request.method==='HEAD'?null:source.body.pipeThrough(new DecompressionStream('gzip')),{
  headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="${match[1]}"`,'Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}
 });
}
