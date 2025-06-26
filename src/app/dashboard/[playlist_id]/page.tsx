import { PlaylistContent } from "~/components/playlist-content-dashboard-server";

type ParamsType = { params: { playlist_id: string } };

function PlaylistContentDashboard({ params }: ParamsType) {
  const playlist_id = params.playlist_id;

  return (
    <PlaylistContent params={{ playlist_id }} searchParams={{ undefined }} />
  );
}

export default PlaylistContentDashboard;
