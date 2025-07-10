CREATE TYPE "public"."track_status" AS ENUM('pending', 'added', 'removed', 'failed');--> statement-breakpoint
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
CREATE TABLE "track_playlist_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"trackId" integer,
	"track_status" "track_status" DEFAULT 'pending',
	"snapshot_id" varchar(255),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "rec_batches" ADD CONSTRAINT "rec_batches_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rec_tracks" ADD CONSTRAINT "rec_tracks_batchId_rec_batches_id_fk" FOREIGN KEY ("batchId") REFERENCES "public"."rec_batches"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track_playlist_status" ADD CONSTRAINT "track_playlist_status_trackId_rec_tracks_id_fk" FOREIGN KEY ("trackId") REFERENCES "public"."rec_tracks"("id") ON DELETE cascade ON UPDATE no action;
