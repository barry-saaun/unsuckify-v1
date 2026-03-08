import { buildSongKey } from "../ingestion/sanitise";
import { fetchLastFmData } from "../music/lastfm";
import { findSimilarSongs, type SimilarSong } from "./find-similar-songs";
import { upsertManySongs } from "./upsert-many-songs";

// Songs in the user's playlist
// Embed any that is not in the vector db
export interface GetRecommendationsParams {
  playlist: Array<{ artist: string; track: string }>;
  limit?: number;
  minScore: number;
}

export interface GetRecommendationsResult {
  recommendations: SimilarSong[];
  meta: {
    playlistSize: number;
    embeddedOnDemand: number; // songs that were embedded during the request
    coverage: number; // 0-1, how much of the playlist contributed to the vector
  };
}

export async function getRecommendations(
  params: GetRecommendationsParams,
): Promise<GetRecommendationsResult> {
  const { playlist, limit = 20, minScore = 0.6 } = params;

  const songKeys = playlist.map((s) => buildSongKey(s.artist, s.track));

  // --- Embed on demand: fetch Last.fm data for missing songs, then upsert ---
  const { fetchSongEmbeddings } = await import("./fetch-songs-embeddings");
  const { missing } = await fetchSongEmbeddings(songKeys);

  let embeddedOnDemand = 0;

  if (missing.length > 0) {
    const missingSongs = playlist.filter((s) =>
      missing.includes(buildSongKey(s.artist, s.track)),
    );

    // Fetch Last.fm data for all missing songs in parallel.
    // Some tracks may not exist on Last.fm — skip those rather than failing
    // the whole request.
    const rawDataResults = await Promise.allSettled(
      missingSongs.map((s) => fetchLastFmData(s.artist, s.track)),
    );

    const rawData = rawDataResults.flatMap((r) => {
      if (r.status === "fulfilled") return [r.value];
      console.warn(
        "[get-recommendations] skipping track, Last.fm fetch failed:",
        r.reason,
      );
      return [];
    });

    const upsertResult =
      rawData.length > 0 ? await upsertManySongs(rawData) : { upserted: [] };
    embeddedOnDemand = upsertResult.upserted.length;
  }

  // --- Run similar search ---
  const result = await findSimilarSongs({
    playlistSongKeys: songKeys,
    limit,
    minScore,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  const { recommendations, playlistCoverage } = result;

  return {
    recommendations,
    meta: {
      playlistSize: playlist.length,
      embeddedOnDemand,
      coverage: playlistCoverage.embedded / playlistCoverage.total,
    },
  };
}
