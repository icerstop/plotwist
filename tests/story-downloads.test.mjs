import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,relative} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {build} from 'esbuild';
import {Miniflare} from 'miniflare';
import {compressStoryAssets} from '../scripts/compress-story-assets.mjs';

test('compressed production assets download as exact original CSVs through the Worker',async()=>{
 const root=await mkdtemp(join(tmpdir(),'plotwist-csv-')),directory=join(root,'dist/client'),stories=join(directory,'stories');
 const csv=Buffer.from('country,date,value,note\nPolska,1960,0,"Zażółć gęślą jaźń"\n'.repeat(4000));
 let mf;
 try{
  await mkdir(stories,{recursive:true});
  await writeFile(join(stories,'example.csv'),csv);
  await writeFile(join(stories,'example.json'),'[{"value":0}]');
  await writeFile(join(directory,'index.html'),'<!doctype html><title>App</title>');
  const result=await compressStoryAssets(root);
  assert.equal(result.count,1);assert.ok(result.after<result.before);
  assert.deepEqual(gunzipSync(await readFile(join(stories,'example.csv.gz'))),csv);
  await assert.rejects(access(join(stories,'example.csv')));
  const compiled=await build({entryPoints:['worker/index.js'],bundle:true,format:'esm',platform:'browser',write:false});
  mf=new Miniflare({cf:false,modules:true,script:compiled.outputFiles[0].text,compatibilityDate:'2026-07-01',assets:{directory,binding:'ASSETS',routerConfig:{has_user_worker:true,static_routing:{user_worker:['/api/*','/stories/*']}},assetConfig:{not_found_handling:'single-page-application',has_static_routing:true}}});
  const response=await mf.dispatchFetch('http://site.test/stories/example.csv',{headers:{Range:'bytes=0-10'}});
  assert.equal(response.status,200);assert.match(response.headers.get('content-type'),/^text\/csv/);
  assert.equal(response.headers.get('content-disposition'),'attachment; filename="example.csv"');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),csv);
  const head=await mf.dispatchFetch('http://site.test/stories/example.csv',{method:'HEAD'});
  assert.equal(head.status,200);assert.equal(await head.text(),'');
  const missing=await mf.dispatchFetch('http://site.test/stories/missing.csv');
  assert.equal(missing.status,404);assert.doesNotMatch(await missing.text(),/doctype/);
  assert.deepEqual(await (await mf.dispatchFetch('http://site.test/stories/example.json')).json(),[{value:0}]);
  assert.match(await (await mf.dispatchFetch('http://site.test/')).text(),/<title>App/);
  assert.equal((await mf.dispatchFetch('http://site.test/api/themes')).status,401);
 }finally{
  await mf?.dispose();
  const path=resolve(root),parent=resolve(tmpdir());
  if(!relative(parent,path).startsWith('plotwist-csv-')||relative(parent,path).includes('..'))throw new Error('Unexpected test directory');
  await rm(path,{recursive:true,force:true});
 }
});
