import { useEffect, useState } from "react";
import { api } from "~/trpc/react";
import type { TrackStatusType } from "~/types";
import { useAppToast } from "./useAppToast";
import { toast } from "sonner";

type useTrackActionProps = {
  batch_id: number;
  track_id: number;
  track: string;

  track_uri?: string;
  playlist_id: string;
};

export default function useTrackAction({
  batch_id,
  track_id,
  track,
  track_uri,
  playlist_id,
}: useTrackActionProps) {
  const { toastError, toastSuccess } = useAppToast();

  const [trackStatus, setTrackStatus] = useState<TrackStatusType>("pending");
  const [actionIsPending, setActionIsPending] = useState<boolean>(false);
  const [addedTrackSnapshotId, setAddedTrackSnapshotId] = useState<
    string | null
  >(null);

  const { data: queryTrackStatus } = api.track.getTrackStatus.useQuery({
    batchId: batch_id,
    trackId: track_id,
  });

  useEffect(() => {
    if (queryTrackStatus && queryTrackStatus !== "pending") {
      setTrackStatus(queryTrackStatus);
    }
  }, [queryTrackStatus]);

  const addMutation = api.playlist.addItemsToPlaylist.useMutation({
    onMutate: () => {
      setActionIsPending(true);
    },
    onError: (error) => {
      toastError(error?.message, {
        id: `error-add-${track}-to-playlist`,
      });
      setTrackStatus("failed");
      setActionIsPending(false);
    },
    onSuccess: (data) => {
      toast("Click the button", { id: "added-track" });
      setTrackStatus("added");
      setAddedTrackSnapshotId(data.snapshot_id!);

      setActionIsPending(false);
    },
  });

  const removeMutation = api.playlist.removePlaylistItems.useMutation({
    onMutate: () => {
      setActionIsPending(true);
    },
    onError: (error) => {
      toastError(error?.message, { id: `error-remove-${track}-from-playlist` });
      setTrackStatus("added");
      setActionIsPending(false);
    },
    onSuccess: (data) => {
      setTrackStatus("removed");
      setActionIsPending(false);
      toastSuccess(data.success_msg, {
        id: `success-remove-${track}-from-playlist`,
      });
    },
  });

  const handleRemoveTrackFromPlaylist = () => {
    if (!track_uri) return;
    if (trackStatus === "added") {
      removeMutation.mutate({
        playlist_id,
        track_uris: track_uri,
        snapshot_id: addedTrackSnapshotId!,
        batchId: batch_id,
        trackId: track_id,
      });
    }
  };

  const handleAddTrackToOwnedPlaylist = () => {
    if (!track_uri) return;
    addMutation.mutate({
      playlist_id,
      track_uris: [track_uri],
      batchId: batch_id,
      trackId: track_id,
    });
  };

  return {
    trackStatus,
    actionIsPending,
    handleAddTrackToOwnedPlaylist,
    handleRemoveTrackFromPlaylist,
  };
}
