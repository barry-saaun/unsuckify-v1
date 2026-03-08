import { PlusIcon } from "lucide-react";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";

const RecommendedTrackCardSkeleton = ({ isOwned }: { isOwned: boolean }) => {
  return (
    <Card className="overflow-hidden pt-0">
      <div className="relative aspect-square overflow-hidden rounded-t-md">
        <Skeleton className="h-full w-full" />
      </div>
      <CardHeader>
        <CardTitle className="line-clamp-1">
          <Skeleton className="h-6 w-3/4" />
        </CardTitle>
        <CardDescription className="flex items-center">
          <Skeleton className="h-4 w-1/2" />
        </CardDescription>
      </CardHeader>
      <CardFooter>
        {isOwned && (
          <Button disabled className="w-full bg-purple-700 dark:bg-purple-300">
            <PlusIcon className="mr-2 h-4 w-4" />
            Add to Playlist
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default RecommendedTrackCardSkeleton;
