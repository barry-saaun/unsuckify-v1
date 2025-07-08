"use client";
import { useParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import { useAppToast } from "~/hooks/useAppToast";

export default function ClientPlaylistContent() {
  const params = useParams<{ playlist_id: string }>();
  const router = useRouter();

  const playlistId = params.playlist_id;

  const { toastError } = useAppToast();

  const { data, error, isLoading } = api.playlist.getPlaylist.useQuery(
    {
      playlist_id: playlistId,
    },
    { retry: 1, enabled: !!playlistId },
  );

  useEffect(() => {
    if (error) {
      toastError(error.message, { id: "failed-get-playlist" });
      console.error("cannot fetch playlist", error);
    }
  }, [error, toastError]);

  if (isLoading) {
    return <div>... is loading.</div>;
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-gray-100 dark:bg-gray-900">
        <div className="mb-8 text-6xl">😕</div>
        <h1 className="mb-4 text-3xl font-bold text-black dark:text-white">
          Oops! Couldn&apos;t load that playlist.
        </h1>
        <p className="mb-6 text-center text-lg text-gray-400">
          It looks like the Spotify Playlist ID you provide might be invalid or
          the playlist doesn&apos;t exist. <br /> Please double-check the ID and
          try again.
        </p>
        <div className="flex flex-col gap-3">
          <button
            className="rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold transition-colors hover:cursor-pointer hover:bg-indigo-700"
            onClick={() => router.back()}
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return <div>{JSON.stringify(data)}</div>;
}
