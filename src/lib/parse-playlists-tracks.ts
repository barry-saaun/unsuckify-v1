import type { SinglePlaylistResponse } from "spotify-api";

export function ParsePlaylistTracks(data: SinglePlaylistResponse): string[] {
  let parsedData: string[] = [];

  data.tracks.items.forEach((item) => {
    const trackObj = item.track;

    const track_name = trackObj?.name;

    const artistsName =
      trackObj?.artists.map((artist) => artist.name).join(" & ") ?? "";

    const albumName = trackObj?.album.name ?? "Unknown";
    const combined = `${track_name} - (${artistsName}) - ${albumName}`;

    parsedData = [...parsedData, combined];
  });

  return parsedData;
}
