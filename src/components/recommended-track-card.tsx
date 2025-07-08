import type React from "react";
import { useEffect, useState } from "react";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";
import type { TRecommendedTrackObject } from "~/types";
import DynamicRecommendedTrackCard from "./dynamic-recommended-track-card";

type RecommendedTrackCardProps = {
  trackObj: TRecommendedTrackObject;
  playlist_id: string;
  isOwned: boolean;
  handleNotIsOwnedCardClick: (track_uri: string) => void;
};

const RecommendedTrackCard: React.FC<RecommendedTrackCardProps> = ({
  trackObj,
  playlist_id,
  isOwned,
  handleNotIsOwnedCardClick,
}) => {
  const { track, album, artists, year } = trackObj;

  const { data, isLoading } = api.track.searchForTracks.useQuery(trackObj);

  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isHovered, setIsHoverd] = useState(false);
  const [isSelected, setIsSelected] = useState(false);

  // just ignore the errored query result completely

  useEffect(() => {
    if (data?.albumImage) {
      setIsImageLoaded(true);
    }
  }, [data?.albumImage]);

  if (data === null || !data?.trackUri || !data?.albumImage) return null;

  const handleOnClick = () => {
    handleNotIsOwnedCardClick(data?.trackUri ?? "");
    setIsSelected(!isSelected);
  };

  const tooltipContent: string = isOwned
    ? "Add this to your Playlist"
    : isSelected
      ? "Click to Deselect"
      : "Click to Select";

  const sharedProps = {
    isOwned,
    track,
    artists,
    image_src: data?.albumImage,
    isImageLoaded,
    tooltipContent,
    onMouseEnter: () => setIsHoverd(true),
    onMouseLeave: () => setIsHoverd(false),
    isSelected,
    cardClassName: cn(
      isHovered && "transform-gpu scale-[1.03] shadow-lg",
      !isOwned && isSelected && "ring-2 ring-primary",
    ),
  };

  return (
    <DynamicRecommendedTrackCard
      {...sharedProps}
      onClick={!isOwned ? handleOnClick : undefined}
      track_uri={data.trackUri}
      playlist_id={playlist_id}
    />
  );
};

export default RecommendedTrackCard;
