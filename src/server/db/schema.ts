import type { InferInsertModel, InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  integer,
  unique,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createSelectSchema } from "drizzle-zod";

export const users = pgTable("users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
});

export const allowedUsers = pgTable("allowed-users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
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
  batchId: integer("batchId").references(() => recommendationBatches.id, {
    onDelete: "cascade",
  }),
  track: varchar("track", { length: 255 }).notNull(),
  album: varchar("album", { length: 255 }).notNull(),
  artists: varchar("artists", { length: 255 }).notNull(),
  year: integer("year").notNull(),
});

export const trackStatusEnum = pgEnum("track_status", [
  "pending",
  "added",
  "removed",
  "failed",
]);

export const trackPlaylistStatus = pgTable("track_playlist_status", {
  id: serial("id").primaryKey(),
  trackId: integer("trackId").references(() => recommendationTracks.id, {
    onDelete: "cascade",
  }),
  batchId: integer("batchId").references(() => recommendationTracks.batchId, {
    onDelete: "cascade",
  }),
  status: trackStatusEnum("track_status").default("pending"),
  snapshotId: varchar("snapshot_id", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type RecBatchesSelectType = InferSelectModel<
  typeof recommendationBatches
>;

export const selectRecBatchesSchema = createSelectSchema(recommendationBatches);

export type RecTracksSelectType = InferSelectModel<typeof recommendationTracks>;
export type RecTracksInsertType = InferInsertModel<typeof recommendationTracks>;

export type TracksStatusInsertType = InferInsertModel<
  typeof trackPlaylistStatus
>;

export type AllowedUsersSelectType = InferSelectModel<typeof allowedUsers>;
