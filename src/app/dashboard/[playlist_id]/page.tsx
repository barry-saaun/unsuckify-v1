"use client";
import { useParams } from "next/navigation";
import { api } from "~/trpc/react";
import ErrorScreen from "~/components/error-screen";

export default function PlaylistConetnt() {
  const params = useParams<{ playlist_id: string }>();

  const playlist_id = params.playlist_id;

  const { data, isLoading, error } = api.playlist.getPlaylistItemsAll.useQuery({
    playlist_id,
  });

  console.log("data length: ", data?.length);

  if (error) {
    return <ErrorScreen message={error.message} />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="hungry-loader" />
      </div>
    );
  }

  return <div>{JSON.stringify(data[0])}</div>;
}
