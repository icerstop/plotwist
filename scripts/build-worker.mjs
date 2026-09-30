import {build} from 'esbuild';
import {mkdir,copyFile,cp,writeFile} from 'node:fs/promises';
await build({entryPoints:['worker/index.js'],bundle:true,format:'esm',platform:'browser',target:'es2022',outfile:'dist/server/index.js',minify:true});
await mkdir('dist/.openai',{recursive:true});
await copyFile('.openai/hosting.json','dist/.openai/hosting.json');
await cp('drizzle','dist/.openai/drizzle',{recursive:true});
await writeFile('dist/server/wrangler.json',JSON.stringify({name:'plotwist',main:'index.js',compatibility_date:'2026-07-01',assets:{directory:'../client',binding:'ASSETS',not_found_handling:'single-page-application',run_worker_first:['/api/*','/stories/*']},d1_databases:[{binding:'DB',database_name:'plotwist-local',database_id:'00000000-0000-4000-8000-000000000000'}],r2_buckets:[{binding:'BUCKET',bucket_name:'plotwist-local'}]},null,2));

