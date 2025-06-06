"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getCachedPlaylistIds,
  getCachedPlaylists,
  areIdSetsEqual,
  setCachedPlaylists,
} from "~/lib/playlist-cache";
import { api } from "~/trpc/react";
import type { UsersPlaylistMetadata } from "~/types/index";
import CardSkeleton from "./card-skeleton";
import PlaylistCard from "./playlist-card";

import PlaylistImagePlaceholder from "../../public/playlist_image_placeholder.svg";

export default function MyPlaylistsTabContent() {
  const [playlists, setPlaylists] = useState<UsersPlaylistMetadata[] | null>(
    [],
  );
  const {
    data: fresh,
    isLoading,
    error,
  } = api.user.getListOfCurrentUsersPlaylists.useQuery();

  if (error) {
    toast.error("Cannot query your playlists at the moment!");
  }

  useEffect(() => {
    const cached = getCachedPlaylists();

    if (cached) {
      setPlaylists(cached);
    }

    if (fresh) {
      const cachedIds = getCachedPlaylistIds();
      const freshIds = new Set(fresh.map((playlist) => playlist.id));

      if (!cachedIds || !areIdSetsEqual(cachedIds, freshIds)) {
        setPlaylists(fresh);
        setCachedPlaylists(fresh);
      } else if (!cached) {
        // If no cache, but fresh data exists, set it
        setPlaylists(fresh);
        setCachedPlaylists(fresh);
      }
    }
  }, [fresh]);

  if (!playlists || playlists?.length === 0) {
    return <div>There is no playlist</div>;
  }

  const numberOfSkeleton = 6;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {isLoading
        ? Array.from({ length: numberOfSkeleton }).map((_, idx) => (
            <CardSkeleton key={idx} />
          ))
        : fresh?.map((item) => {
            return (
              <PlaylistCard
                key={item.id}
                playlistImg={item.url || PlaylistImagePlaceholder}
                owner={item.display_name}
                playlistName={item.name}
                numberOfTracks={item.total}
                playlistId={item.id}
              />
            );
          })}
    </div>
  );
}
