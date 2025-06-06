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
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface PlaylistCardProps {
  playlistImg: string;
  playlistName: string;
  owner: string;
  numberOfTracks: number;
  playlistId: string;
}

const PlaylistCard = ({
  playlistImg,
  playlistName,
  owner,
  numberOfTracks,
  playlistId,
}: PlaylistCardProps) => {
  const router = useRouter();
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square">
        <Image
          fill
          src={playlistImg}
          alt={playlistName}
          priority
          className="object-cover shadow"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
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
          className="mx-2 h-full w-full"
          onClick={() => router.push(`dashboard/${playlistId}`)}
        >
          <Link href={`dashboard/${playlistId}`} className="font-semibold">
            Unsuckify
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
export default PlaylistCard;
