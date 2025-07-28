import type React from "react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { TRecommendedTrackObject } from "~/types";
import DynamicRecommendedTrackCard from "./dynamic-recommended-track-card";
import RecommendedTrackCardSkeleton from "./rec-track-card-skeleton";

type RecommendedTrackCardProps = {
  trackObj: TRecommendedTrackObject;
  playlist_id: string;
  isOwned: boolean;
  batch_id: number;
  track_id: number;
  handleNotIsOwnedCardClick: (track_uri: string) => void;
};

const RecommendedTrackCard: React.FC<RecommendedTrackCardProps> = ({
  trackObj,
  playlist_id,
  isOwned,
  batch_id,
  track_id,
  handleNotIsOwnedCardClick,
}) => {
  const { track, artists } = trackObj;

  const {
    data: trackQueryResult,
    isLoading: isLoadingTrackQuery,
    error: trackQueryError,
  } = api.track.searchForTracks.useQuery(trackObj);

  const [isHovered, setIsHoverd] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  if (isLoadingTrackQuery) {
    return <RecommendedTrackCardSkeleton isOwned={isOwned} />;
  }

  // just ignore the errored query result completely
  if (
    trackQueryError ||
    trackQueryResult === null ||
    !trackQueryResult?.trackUri ||
    !trackQueryResult?.albumImage
  )
    return null;

  const handleOnClick = () => {
    handleNotIsOwnedCardClick(trackQueryResult?.trackUri ?? "");
    setIsSelected(!isSelected);
  };

  const sharedProps = {
    isOwned,
    track,
    artists,
    image_src: trackQueryResult?.albumImage,
    batch_id,
    track_id,
    onMouseEnter: () => setIsHoverd(true),
    onMouseLeave: () => setIsHoverd(false),
    isSelected,
    track_uri: trackQueryResult.trackUri,
    cardClassName: cn(
      isHovered && "transform-gpu scale-[1.03] shadow-lg",
      !isOwned && isSelected && "ring-2 ring-primary",
    ),
  };

  return (
    <DynamicRecommendedTrackCard
      {...sharedProps}
      onClick={!isOwned ? handleOnClick : undefined}
      playlist_id={playlist_id}
    />
  );
};

export default RecommendedTrackCard;
