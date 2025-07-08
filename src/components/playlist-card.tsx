import { UserIcon } from "lucide-react";
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
  return (
    <Card className="overflow-hidden rounded-md pt-0">
      <div className="relative aspect-square overflow-hidden rounded-t-md">
        {typeof playlistImg === "string" ? (
          <Image
            fill
            src={playlistImg}
            alt={playlistName}
            priority
            className="object-cover shadow"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          playlistImg
        )}
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-1">{playlistName}</CardTitle>
        <CardDescription className="flex items-center">
          <UserIcon className="mr-1 h-4 w-4" />
          {owner}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground text-sm">
          {numberOfTracks} {numberOfTracks === 1 ? "track" : "tracks"}
        </p>
      </CardContent>
      <CardFooter>
        <Button
          className="mx-2 h-full w-full hover:cursor-pointer"
          onClick={() =>
            router.push(`dashboard/${playlistId}?ownerId=${ownerId}`)
          }
        >
          <span className="font-semibold">Unsuckify</span>
        </Button>
      </CardFooter>
    </Card>
  );
};
export default PlaylistCard;
