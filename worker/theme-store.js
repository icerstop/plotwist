// Ownership is part of every query, including asset reads and optimistic writes.
export function themeStore(db,owner){
 const prepare=(sql,...args)=>db.prepare(sql).bind(...args);
 return {
  list:()=>prepare('SELECT * FROM themes WHERE owner_id = ? ORDER BY updated_at DESC, id',owner).all(),
  get:id=>prepare('SELECT * FROM themes WHERE owner_id = ? AND id = ?',owner,id).first(),
  create:t=>prepare(`INSERT INTO themes (id,owner_id,name,name_key,appearance,assets,revision,created_at,updated_at)
   SELECT ?,?,?,?,?,?,1,?,? WHERE (SELECT count(*) FROM themes WHERE owner_id = ?) < 100`,t.id,owner,t.name,t.name.toLocaleLowerCase('pl'),JSON.stringify(t.appearance),JSON.stringify(t.assets),t.now,t.now,owner).run(),
  update:(t,revision)=>prepare(`UPDATE themes SET name=?,name_key=?,appearance=?,assets=?,revision=revision+1,updated_at=?
   WHERE owner_id=? AND id=? AND revision=?`,t.name,t.name.toLocaleLowerCase('pl'),JSON.stringify(t.appearance),JSON.stringify(t.assets),t.now,owner,t.id,revision).run(),
  rename:(id,name,revision,now)=>prepare('UPDATE themes SET name=?,name_key=?,revision=revision+1,updated_at=? WHERE owner_id=? AND id=? AND revision=?',name,name.toLocaleLowerCase('pl'),now,owner,id,revision).run(),
  remove:(id,revision)=>prepare('DELETE FROM themes WHERE owner_id=? AND id=? AND revision=?',owner,id,revision).run(),
 };
}
