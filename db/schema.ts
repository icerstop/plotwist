import {sqliteTable,text,integer,uniqueIndex} from 'drizzle-orm/sqlite-core';

export const themes=sqliteTable('themes',{
 id:text('id').primaryKey(),
 ownerId:text('owner_id').notNull(),
 name:text('name').notNull(),
 nameKey:text('name_key').notNull(),
 appearance:text('appearance').notNull(),
 assets:text('assets').notNull(),
 revision:integer('revision').notNull().default(1),
 createdAt:text('created_at').notNull(),
 updatedAt:text('updated_at').notNull(),
},table=>[uniqueIndex('idx_themes_owner_name').on(table.ownerId,table.nameKey)]);
