import { serve } from "inngest/next";
import { inngest } from "~/lib/inngest/client";
import { embedPlaylistFunction } from "./functions/embed-playlist";
import { embedSongFunction } from "./functions/embed-song";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [embedPlaylistFunction, embedSongFunction],
});
