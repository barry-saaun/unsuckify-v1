import { Skeleton } from "./ui/skeleton";

const CardSkeleton = () => {
  return (
    <div className="animate-pulse space-y-6">
      <div className="aspect-square w-full overflow-hidden rounded-lg bg-zinc-800" />
      <div className="space-y-3">
        <div className="h-5 w-full rounded bg-zinc-700" />
        <div className="h-4 w-2/3 rounded bg-zinc-700" />
      </div>
      <div className="h-10 w-full rounded bg-zinc-700" />
    </div>
  );
};
export default CardSkeleton;
