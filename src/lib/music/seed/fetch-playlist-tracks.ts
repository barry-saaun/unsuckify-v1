import { getPlaylistItemsSystem } from "../spotify/system-client";

const LIMIT = 50;

export async function fetchPlaylistTracksAll(
  playlistId: string,
): Promise<Array<{ artist: string; track: string; album: string }>> {
  let offset = 0;
  const limit = LIMIT;
  const allTracks = [];

  while (true) {
    const data = await getPlaylistItemsSystem({
      playlist_id: playlistId,
      offset,
      limit,
    });

    const tracks = data.items
      .filter((item: any) => !item.is_local && item.track)
      .map((item: any) => ({
        track: item.track.name,
        album: item.track.album.name,
        artist: item.track.artists.map((a: any) => a.name).join(" & "),
      }));

    allTracks.push(...tracks);

    if (!data.next) break;

    offset += limit;
  }

  return allTracks;
}
