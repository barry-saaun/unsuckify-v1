"use client";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";
import Spinner from "~/components/spinner";
import ErrorScreen from "~/components/error-screen";

export default function PlaylistConetnt() {
  const params = useParams<{ playlist_id: string }>();

  const playlist_id = params.playlist_id;

  const { data, isLoading, error } = api.playlist.getPlaylist.useQuery({
    playlist_id,
  });

  if (error) {
    return <ErrorScreen message={error.message} />;
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner extraCN="h-10 w-10" />
      </div>
    );
  }

  return <div>{JSON.stringify(data)}</div>;
}
