import { sql } from "drizzle-orm";
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  pgEnum,
  text,
  jsonb,
} from "drizzle-orm/pg-core";

export const embeddingStatusEnum = pgEnum("embedding_status", [
  "pending",
  "ready",
  "failed",
  "no_metadata",
]);
// Source of truth for song identity and metadata
export const songs = pgTable("songs", {
  id: serial("id").primaryKey(),
  songKey: text("song_key").unique().notNull(), // matches Pinecone vector ID
  artist: text("artist").notNull(),
  track: text("track").notNull(),
  album: text("album").default("Unknown").notNull(),
  // Tracks whether this song has a vector in Pinecone
  embeddingStatus: embeddingStatusEnum("embedding_status")
    .default("pending")
    .notNull(),

  // Preserved for debugging / re-embedding if model changes
  embeddingText: text("embedding_text"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// Artist-level cache to avoid redundant Last.fm API calls
export const artists = pgTable("artists", {
  id: serial("id").primaryKey(),
  name: text("name").unique().notNull(),
  topTags: text("top_tags")
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  // Cached, structured Last.fm tag objects (preserves counts)
  topTagsData: jsonb("top_tags_data")
    .$type<Array<{ name: string; count: number; url?: string }>>()
    .default(sql`'[]'::jsonb`)
    .notNull(),
  similarArtists: text("similar_artists")
    .array()
    .default(sql`'{}'::text[]`)
    .notNull(),
  // Cached, structured Last.fm similar artist objects (preserves match score)
  similarArtistsData: jsonb("similar_artists_data")
    .$type<Array<{ name: string; match?: string; url?: string }>>()
    .default(sql`'[]'::jsonb`)
    .notNull(),
  lastFetched: timestamp("last_fetched", { withTimezone: true })
    .default(sql`now()`)
    .notNull(),
});

export const allowedUsers = pgTable("allowed-users", {
  id: varchar("id", { length: 64 }).primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
});
