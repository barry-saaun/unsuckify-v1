const RecommendedTrackCardSkeleton = ({ isOwned }: { isOwned: boolean }) => {
  return (
    <div className="border border-black font-mono dark:border-white">
      {/* Image area */}
      <div className="aspect-square w-full animate-pulse bg-black/10 dark:bg-white/10" />
      {/* Info strip */}
      <div className="border-t border-black p-3 dark:border-white">
        <div className="mb-2 h-3 w-3/4 animate-pulse bg-black/15 dark:bg-white/15" />
        <div className="h-2 w-1/2 animate-pulse bg-black/10 dark:bg-white/10" />
      </div>
      {/* Action strip */}
      {!isOwned && (
        <div className="border-t border-black p-2 dark:border-white">
          <div className="h-3 w-1/3 animate-pulse bg-black/10 dark:bg-white/10" />
        </div>
      )}
    </div>
  );
};

export default RecommendedTrackCardSkeleton;
