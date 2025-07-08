import { Check, CheckCircle2Icon, Plus } from "lucide-react";
import { Button } from "./ui/button";
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
import { Spinner } from "./Icons";
import { api } from "~/trpc/react";
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
  ...props
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAdded, setIsAdded] = useState<boolean>(false);
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);

  const mutation = api.playlist.addItemsToPlaylist.useMutation({
    onError: (error) => {
      toast.error(error?.message, {
        id: "error-add-track-to-playlist",
      });
      setIsAdded(false);
    },
    onSuccess: () => setIsAdded(true),
  });

  const handleAddTrackToOwnedPlaylist = () => {
    setIsLoading(true);
    mutation.mutate(
      { playlist_id, track_uris: [track_uri] },
      {
        onSettled: () => setIsLoading(false),
      },
    );
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
            {isOwned ? (
              <CardFooter className="dark:bg-puruple-50 flex items-center justify-center">
                <Button
                  className="mx-5 flex w-full items-center justify-center gap-4 bg-purple-700 font-semibold filter transition-all hover:bg-purple-600 hover:brightness-125 dark:bg-purple-300 hover:dark:bg-purple-200"
                  onClick={handleAddTrackToOwnedPlaylist}
                >
                  {isLoading ? (
                    <Spinner />
                  ) : isAdded ? (
                    <CheckCircle2Icon className="animate-jump-in animate-ease-out transition-all" />
                  ) : (
                    <>
                      <Plus />
                      {"Add to Playlist"}
                    </>
                  )}
                </Button>
              </CardFooter>
            ) : null}
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
