import Image from "next/image";
import { useRouter } from "next/navigation";

interface PlaylistCardProps {
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
  numberOfTracks,
  playlistId,
  ownerId,
}: PlaylistCardProps) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(
      `dashboard/${playlistId}?ownerId=${ownerId}&playlistName=${playlistName}`,
    );
  };

  return (
    <div
      onClick={handleClick}
      className="group cursor-pointer border border-black font-mono dark:border-white/40"
    >
      {/* Square image */}
      <div className="relative aspect-square w-full overflow-hidden bg-black/5 dark:bg-white/3">
        {typeof playlistImg === "string" ? (
          <Image
            fill
            src={playlistImg}
            alt={playlistName}
            className="object-cover transition-opacity duration-200 group-hover:opacity-80"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            {playlistImg}
          </div>
        )}
      </div>

      {/* Info row */}
      <div className="border-t border-black p-3 dark:border-white/40">
        <p className="truncate text-xs font-bold tracking-wide text-black uppercase dark:text-white/80">
          {playlistName}
        </p>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs tracking-widest text-black/40 uppercase dark:text-white/50">
            {owner}
          </span>
          <span className="text-xs tracking-widest text-black/40 uppercase dark:text-white/50">
            {numberOfTracks} tracks
          </span>
        </div>
      </div>

      {/* Hover action */}
      <div className="border-t border-black bg-black py-2 text-center text-xs font-bold tracking-widest text-white uppercase opacity-0 transition-opacity duration-150 group-hover:opacity-100 dark:border-white/40 dark:bg-white/10 dark:text-white/80">
        Unsuckify →
      </div>
    </div>
  );
};

export default PlaylistCard;
