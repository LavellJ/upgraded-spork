// shared/schema.ts
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";

export const lessons = sqliteTable("lessons", {
  id: integer("id").primaryKey(),
  biome: text("biome").notNull(),               // 'forest' | 'desert' | 'ocean' | 'night'
  title: text("title").notNull(),
  ageGroup: text("age_group").notNull(),        // 'pre-primary' | 'primary' | 'upper-primary'
  content: text("content").notNull()            // JSON string if needed
});

export type Lesson = InferSelectModel<typeof lessons>;
export type NewLesson = InferInsertModel<typeof lessons>;