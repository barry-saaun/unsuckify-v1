CREATE TYPE "public"."embedding_status" AS ENUM('pending', 'ready', 'failed');--> statement-breakpoint
CREATE TYPE "public"."track_status" AS ENUM('pending', 'added', 'removed', 'failed');--> statement-breakpoint
CREATE TABLE "allowed-users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	CONSTRAINT "allowed-users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "artists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"top_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"similar_artists" text[] DEFAULT '{}'::text[] NOT NULL,
	"last_fetched" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artists_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "rec_batches" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(64),
	"playlist_id" varchar(64),
	"generated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "rec_batches_user_id_playlist_id_unique" UNIQUE("user_id","playlist_id")
);
--> statement-breakpoint
CREATE TABLE "rec_tracks" (
	"id" serial PRIMARY KEY NOT NULL,
	"batchId" integer,
	"track" varchar(255) NOT NULL,
	"album" varchar(255) NOT NULL,
	"artists" varchar(255) NOT NULL,
	"year" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "songs" (
	"id" serial PRIMARY KEY NOT NULL,
	"song_key" text NOT NULL,
	"artist" text NOT NULL,
	"track" text NOT NULL,
	"album" text DEFAULT 'Unknown' NOT NULL,
	"embedding_status" "embedding_status" DEFAULT 'pending' NOT NULL,
	"embedding_text" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now(),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "songs_song_key_unique" UNIQUE("song_key")
);
--> statement-breakpoint
CREATE TABLE "track_playlist_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"trackId" integer,
	"batchId" integer,
	"track_status" "track_status" DEFAULT 'pending',
	"snapshot_id" varchar(255),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"last_active" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "rec_batches" ADD CONSTRAINT "rec_batches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rec_tracks" ADD CONSTRAINT "rec_tracks_batchId_rec_batches_id_fk" FOREIGN KEY ("batchId") REFERENCES "public"."rec_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_playlist_status" ADD CONSTRAINT "track_playlist_status_trackId_rec_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."rec_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_playlist_status" ADD CONSTRAINT "track_playlist_status_batchId_rec_tracks_batchId_fk" FOREIGN KEY ("batchId") REFERENCES "public"."rec_tracks"("batchId") ON DELETE cascade ON UPDATE no action;