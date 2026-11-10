import { NextResponse } from "next/server";
import { fetchPlaylistTracksAll } from "~/lib/music/seed/fetch-playlist-tracks";
import { findYoutubeTrackUrl } from "~/lib/music/find-youtube-track";

export const maxDuration = 300;

function getPlaylistId(value: string): string | null {
  const match = value.match(
    /^(?:https?:\/\/open\.spotify\.com\/playlist\/|spotify:playlist:)?([A-Za-z0-9]+)(?:[/?#].*)?$/,
  );
  return match?.[1] ?? null;
}

export async function GET(request: Request) {
  const value = new URL(request.url).searchParams.get("playlist");
  const playlistId = value && getPlaylistId(value);

  if (!playlistId) {
    return NextResponse.json(
      { error: "Provide a Spotify playlist URL or ID in the playlist parameter." },
      { status: 400 },
    );
  }

  try {
    const tracks = await fetchPlaylistTracksAll(playlistId);
    const tracksWithYoutube = [];

    for (const [index, track] of tracks.entries()) {
      if (index > 0) await new Promise((resolve) => setTimeout(resolve, 1000));
      tracksWithYoutube.push({
        ...track,
        youtubeUrl: await findYoutubeTrackUrl(track.artist, track.track),
      });
    }

    return NextResponse.json({ tracks: tracksWithYoutube });
  } catch {
    return NextResponse.json(
      { error: "Could not fetch the playlist. Check that it is public and the ID is valid." },
      { status: 502 },
    );
  }
}
