import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recommendationBatches = pgTable("rec_batches", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 64 }).references(() => users.id),
  playlistId: varchar("playlist_id", { length: 64 }),
  generatedAt: timestamp("generated_at").notNull().defaultNow(),
});

export const recommendationTracks = pgTable("rec_tracks", {
  id: serial("id").primaryKey(),
  batchId: integer("batchId").references(() => recommendationBatches.id),
  trackName: varchar("track_name", { length: 255 }).notNull(),
  albumName: varchar("album_name", { length: 255 }).notNull(),
  artistsName: varchar("artists_name", { length: 255 }).notNull(),
});
