import { Skeleton } from "./ui/skeleton";

const CardSkeleton = () => {
  return (
    <div className="rounded-md shadow">
      <Skeleton className="mb-4 h-[22rem] w-full rounded-md" />
      <Skeleton className="mb-2 h-6 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="mt-5 h-4 w-1/4" />
      <Skeleton className="mt-5 h-7 w-full" />
    </div>
  );
};
export default CardSkeleton;
