import { api } from "~/trpc/react";

type useCreatePlaylistWithTracksProps = {
  isPublic: boolean;
  newPlaylistName: string;
  user_id: string;
};

export default function useCreatePlaylistWithTracks({
  isPublic,
  newPlaylistName,
  user_id,
}: useCreatePlaylistWithTracksProps) {
  const {
    mutate: createPlaylist,
    isPending,
    error,
    isSuccess,
    isError,
  } = api.playlist.createPlaylistWithTracks.useMutation();

  const handleCreateNewPlaylist = (track_uris: string[]) => {
    createPlaylist({
      isPublic,
      name: newPlaylistName,
      track_uris,
      description: undefined,
      user_id: user_id,
    });
  };

  return {
    isCreating: isPending,
    isCreated: isSuccess,
    isError,
    error,
    handleCreateNewPlaylist,
  };
}
