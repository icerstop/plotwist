import {build} from 'vite';
import {rm} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
const root=process.cwd(),output=resolve(root,'dist');
if(relative(root,output)!=='dist')throw new Error('Unexpected build directory');
await rm(output,{recursive:true,force:true});
await build();
await import('./build-worker.mjs');
