const images=new Map();
function loadImage(path){
 if(images.has(path))return images.get(path).promise;
 // Local files keep the export canvas readable and independent of remote logo hosts.
 if(!path.startsWith('/logos/')||path.includes('..'))return Promise.reject(new Error('Nieprawidłowa ścieżka logotypu.'));
 const record={image:null,promise:null};
 record.promise=new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{record.image=image;resolve();};image.onerror=()=>{images.delete(path);reject(new Error('Nie udało się wczytać logotypu. Wyłącz logotypy lub odśwież stronę.'));};image.src=path;});
 images.set(path,record);return record.promise;
}
export const getReelLogo=path=>images.get(path)?.image;
export async function preloadReelAssets(config){await Promise.all([...new Set((config.series||[]).map(s=>s.logo).filter(Boolean))].map(loadImage));}
