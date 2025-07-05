ALTER TABLE "rec_tracks" DROP CONSTRAINT "rec_tracks_batchId_rec_batches_id_fk";
--> statement-breakpoint
ALTER TABLE "rec_tracks" ADD CONSTRAINT "rec_tracks_batchId_rec_batches_id_fk" FOREIGN KEY ("batchId") REFERENCES "public"."rec_batches"("id") ON DELETE no action ON UPDATE no action;