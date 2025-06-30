import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  unique,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recommendationBatches = pgTable(
  "rec_batches",
  {
    id: serial("id").primaryKey(),
    userId: varchar("user_id", { length: 64 }).references(() => users.id),
    playlistId: varchar("playlist_id", { length: 64 }),
    generatedAt: timestamp("generated_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.userId, table.playlistId)],
);

export const recommendationTracks = pgTable("rec_tracks", {
  id: serial("id").primaryKey(),
  batchId: integer("batchId").references(() => recommendationBatches.id),
  track: varchar("track", { length: 255 }).notNull(),
  album: varchar("album", { length: 255 }).notNull(),
  artists: varchar("artists", { length: 255 }).notNull(),
});
