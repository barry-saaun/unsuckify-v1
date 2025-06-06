import superjson from "superjson";
import {
  UsersPlaylistMetadataSchema,
  type UsersPlaylistMetadata,
} from "~/types/index";

export function getCachedPlaylists() {
  const data = localStorage.getItem("user-spotify-playlists");

  if (!data) return null;
  const parsed = superjson.parse(data);
  const result = UsersPlaylistMetadataSchema.array().safeParse(parsed);

  if (!result.success) return null;

  return result.data;
}

export function setCachedPlaylists(playlists: UsersPlaylistMetadata[]) {
  localStorage.setItem(
    "user-spotify-playlists",
    superjson.stringify(playlists),
  );
}

export function getCachedPlaylistIds(): Set<string> | null {
  const usersPlaylistsMetadata = getCachedPlaylists();

  if (!usersPlaylistsMetadata) return null;

  return new Set(usersPlaylistsMetadata.map((playlist) => playlist.id));
}

export function areIdSetsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const id of a) {
    if (!b.has(id)) return false;
  }
  return true;
}
