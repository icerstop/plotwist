export function parseCsv(text) {
  const records=[]; let row=[], cell='', quoted=false;
  for(let i=0;i<text.length;i++) {
    const c=text[i];
    if(c==='"') { if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted; }
    else if(c===','&&!quoted){row.push(cell);cell='';}
    else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(Boolean))records.push(row);row=[];cell='';}
    else cell+=c;
  }
  if(quoted)throw new Error('Unclosed CSV quote');
  if(cell||row.length){row.push(cell);records.push(row);}
  const headers=records.shift().map(h=>h.replace(/^\uFEFF/,'').trim());
  return records.map((r,i)=>{if(r.length!==headers.length)throw new Error(`CSV row ${i+2}: ${r.length}/${headers.length} fields`);return Object.fromEntries(headers.map((h,j)=>[h,r[j]]));});
}
export const numeric = value => value!==undefined&&String(value).trim()!==''&&Number.isFinite(Number(value))?Number(value):null;
export function trackingDate(value) {
  const m=/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}:\d{2}:\d{2})$/.exec(value);
  if(!m)return null;
  const date=`${m[3]}-${m[1]}-${m[2]}`;
  return new Date(date).toISOString().slice(0,10)===date?`${date}T${m[4]}`:null;
}
export function trackingIq(row) {
  if(row.test_source==='Mensa Norway'){const n=numeric(row.test_score);return n===null?null:Math.round(63.5+3*(n-5.833));}
  if(row.test_source==='Offline Test'){const n=numeric(row.valid_test_score);return n===null?null:Math.round(63.5+3*0.8823*((n-3)*(35/14)));}
  return null;
}
