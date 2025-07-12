import SuperJSON from "superjson";

const LS_KEY = "playlist_metadata";

function isLocalStorageAvailable() {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  );
}

export function lsSetPlaylistMetadata(playlist_id: string) {
  if (!isLocalStorageAvailable()) return;

  const raw = localStorage.getItem(LS_KEY);
  const obj = raw ? SuperJSON.parse(raw) : {};

  obj[playlist_id] = { generatedAt: new Date() };

  localStorage.setItem(LS_KEY, SuperJSON.stringify(obj));
}

export function lsCheckPlaylistExpiration(playlist_id: string) {
  if (!isLocalStorageAvailable()) return true;

  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return true;

  const obj = SuperJSON.parse(raw);

  if (!obj[playlist_id] || !obj[playlist_id].generatedAt) return true;

  const generatedAt = new Date(obj[playlist_id].generatedAt);

  if (!(generatedAt instanceof Date) || isNaN(generatedAt.getTime()))
    return true;

  const now = new Date();
  const diffMs = now.getTime() - generatedAt.getTime();
  const hours = diffMs / (1000 * 60 * 60);

  return hours >= 24;
}
