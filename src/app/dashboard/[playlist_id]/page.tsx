import { PlaylistContent } from "~/components/playlist-content-dashboard-server";

type ParamsType = { params: Promise<{ playlist_id: string }> };

async function PlaylistContentDashboard({ params }: ParamsType) {
  const playlist_id = (await params).playlist_id;

  return (
    <PlaylistContent params={{ playlist_id }} searchParams={{ undefined }} />
  );
}

export default PlaylistContentDashboard;
