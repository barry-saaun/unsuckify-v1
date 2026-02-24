import { UserIcon, Play, MoreHorizontal } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import Image from "next/image";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";
import { cn } from "~/lib/utils";

export interface PlaylistCardProps {
  playlistImg: string | React.ReactNode;
  playlistName: string;
  owner: string;
  ownerId: string;
  numberOfTracks: number;
  playlistId: string;
}

const PlaylistCard = ({
  playlistImg,
  playlistName,
  owner,
  ownerId,
  numberOfTracks,
  playlistId,
}: PlaylistCardProps) => {
  const router = useRouter();

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(
      `dashboard/${playlistId}?ownerId=${ownerId}&playlistName=${playlistName}`,
    );
  };

  return (
    <Card
      className="group relative cursor-pointer overflow-hidden rounded-xl border-0 bg-gradient-to-br from-zinc-900 to-zinc-800 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
      onClick={handlePlayClick}
    >
      {/* Background blur container */}
      <div className="absolute inset-0 overflow-hidden">
        {typeof playlistImg === "string" ? (
          <>
            {/* Blurred background */}
            <Image
              fill
              src={playlistImg}
              alt={playlistName}
              className="scale-150 object-cover blur-xl brightness-50"
              sizes="100%"
              priority
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />
        )}
      </div>

      {/* Content */}
      <div className="relative z-10 p-4">
        {/* Album art with subtle border */}
        <div className="relative mb-6 aspect-square w-full overflow-hidden rounded-lg shadow-2xl">
          {typeof playlistImg === "string" ? (
            <Image
              fill
              src={playlistImg}
              alt={playlistName}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-700">
              {playlistImg}
            </div>
          )}
          {/* Play button overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all duration-300 group-hover:bg-black/40">
            <Play className="h-12 w-12 scale-0 text-white opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100" />
          </div>
        </div>

        {/* Playlist info */}
        <div className="space-y-3">
          <CardTitle className="line-clamp-2 text-lg font-semibold text-white">
            {playlistName}
          </CardTitle>
          <div className="flex items-center justify-between">
            <CardDescription className="flex items-center text-zinc-300">
              <UserIcon className="mr-2 h-4 w-4" />
              <span className="text-sm">{owner}</span>
            </CardDescription>
            <span className="text-sm text-zinc-400">
              {numberOfTracks} {numberOfTracks === 1 ? "song" : "songs"}
            </span>
          </div>
        </div>

        {/* Action button - appears on hover */}
        <div className="mt-6 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <Button
            size="default"
            className="h-10 w-full bg-white/10 text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              router.push(
                `dashboard/${playlistId}?ownerId=${ownerId}&playlistName=${playlistName}`,
              );
            }}
          >
            Unsuckify
          </Button>
        </div>
      </div>
    </Card>
  );
};
export default PlaylistCard;
