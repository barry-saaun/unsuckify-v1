"use client";
import { useParams, useSearchParams } from "next/navigation";
import { PlaylistContent } from "~/components/playlist-content-dashboard-server";

function PlaylistContentDashboard() {
  const searchParams = useSearchParams();
  const params = useParams<{ playlist_id: string }>();

  const playlist_id = params.playlist_id;

  return (
    <PlaylistContent params={{ playlist_id }} searchParams={{ undefined }} />
  );
}

export default PlaylistContentDashboard;
