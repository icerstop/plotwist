import {readdir,readFile,writeFile,unlink,lstat} from 'node:fs/promises';
import {resolve,relative} from 'node:path';
import {gzipSync,gunzipSync} from 'node:zlib';

// Only generated output is compressed. Keep the original, inspectable CSVs in public/.
export async function compressStoryAssets(root=process.cwd()){
 const directory=resolve(root,'dist/client/stories');
 if(relative(resolve(root),directory).replaceAll('\\','/')!=='dist/client/stories'||(await lstat(directory)).isSymbolicLink())throw new Error('Unexpected story output directory');
 let before=0,after=0,count=0;
 for(const entry of await readdir(directory,{withFileTypes:true})){
  if(!entry.isFile()||!entry.name.endsWith('.csv'))continue;
  const path=resolve(directory,entry.name),original=await readFile(path),compressed=gzipSync(original,{level:9});
  if(!gunzipSync(compressed).equals(original))throw new Error(`CSV compression mismatch: ${entry.name}`);
  await writeFile(`${path}.gz`,compressed);
  await unlink(path);
  before+=original.length;after+=compressed.length;count++;
 }
 console.log(`Story CSVs: ${count} files, ${(before/1048576).toFixed(1)} → ${(after/1048576).toFixed(1)} MiB (lossless)`);
 return {count,before,after};
}
