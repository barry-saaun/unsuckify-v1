import { Check } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import Image from "next/image";
import { cn } from "~/lib/utils";
import React, { useState, type HTMLAttributes } from "react";
import { api } from "~/trpc/react";
import { useAppToast } from "~/hooks/useAppToast";
import TrackActionButton from "./track-action-button";
import type { TrackStatusType } from "~/types";
import { toast } from "sonner";

interface DynamicRecommendedTrackCardProps
  extends HTMLAttributes<HTMLDivElement> {
  isOwned: boolean;
  image_src?: string;
  track: string;
  artists: string;
  tooltipContent: string;
  cardClassName?: string;
  isSelected?: boolean;
  playlist_id: string;
  track_uri: string;
  batch_id: number;
  track_id: number;
}

const DynamicRecommendedTrackCard: React.FC<
  DynamicRecommendedTrackCardProps
> = ({
  isOwned,
  image_src,
  track,
  tooltipContent,
  isSelected,
  playlist_id,
  track_uri,
  artists,
  cardClassName,
  batch_id,
  track_id,
  ...props
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [trackStatus, setTrackStatus] = useState<TrackStatusType>("pending");

  const [addedTrackSnapshotId, setAddedTrackSnapshotId] = useState<
    string | null
  >(null);

  const { toastError } = useAppToast();

  const addMutation = api.playlist.addItemsToPlaylist.useMutation({
    onMutate: () => {
      setIsLoading(true);
    },
    onError: (error) => {
      toastError(error?.message, {
        id: `error-add-${track}-to-playlist`,
      });
      // setIsAdded(false);
      setTrackStatus("failed");
      setIsLoading(false);
    },
    onSuccess: (data) => {
      // setIsAdded(true);
      toast("Click the button", { id: "added-track" });
      setTrackStatus("added");
      setAddedTrackSnapshotId(data.snapshot_id!);

      setIsLoading(false);
    },
  });

  const handleRemoveTrackFromPlaylist = () => {
    console.log("removed");
    setTrackStatus("removed");
  };

  const handleAddTrackToOwnedPlaylist = () => {
    addMutation.mutate({
      playlist_id,
      track_uris: [track_uri],
      batchId: batch_id,
      trackId: track_id,
    });
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className={cn(
              "bg-card/50 pt-0 backdrop-blur-sm transition-all duration-300",
              cardClassName,
            )}
            {...props}
          >
            <CardContent className="group relative aspect-square overflow-hidden">
              {!imageLoaded && (
                <div className="absolute inset-0 animate-pulse rounded-t-xl bg-gray-200 dark:bg-gray-200" />
              )}
              {image_src && (
                <Image
                  fill
                  src={image_src}
                  alt={track}
                  className={cn(
                    "rounded-t-xl object-cover shadow transition-all duration-300 group-hover:shadow-lg group-hover:brightness-50",
                    !imageLoaded && "opacity-0",
                  )}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onLoad={() => setImageLoaded(true)}
                  loading="lazy" // Enable lazy loading
                />
              )}
              {isSelected && (
                <div className="absolute top-2 right-2 rounded-full bg-black p-1 transition-all">
                  <Check className="animate-jump-in animate-once animate-duration-[400ms] animate-ease-linear h-4 w-4" />
                </div>
              )}
            </CardContent>
            <CardHeader>
              <CardTitle className="line-clamp-1">{track}</CardTitle>
              <CardDescription>{artists}</CardDescription>
            </CardHeader>
            {isOwned && (
              <CardFooter className="dark:bg-puruple-50 flex items-center justify-center">
                <TrackActionButton
                  status={trackStatus}
                  addHandler={handleAddTrackToOwnedPlaylist}
                  removeHandler={handleRemoveTrackFromPlaylist}
                  isLoading={isLoading}
                />
              </CardFooter>
            )}
          </Card>
        </TooltipTrigger>
        <TooltipContent
          className="flex h-8 w-full items-center justify-center bg-gray-100 px-6 text-sm text-gray-800 dark:bg-slate-900 dark:text-white"
          sideOffset={10}
        >
          {tooltipContent}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default DynamicRecommendedTrackCard;
