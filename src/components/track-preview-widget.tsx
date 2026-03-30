"use client";
import type { PreviewControls } from "~/hooks/useTrackPreview";

type TrackPreviewWidgetProps = Pick<
  PreviewControls,
  "previewState" | "progress" | "togglePlayPause" | "dismiss"
>;

export default function TrackPreviewWidget({
  previewState,
  progress,
  togglePlayPause,
  dismiss,
}: TrackPreviewWidgetProps) {
  const isVisible = previewState.status !== "idle";
  const isPlaying = previewState.status === "playing";
  const isFetching = previewState.status === "fetching";
  const isNoPreview = previewState.status === "no_preview";
  const song = previewState.status !== "idle" ? previewState.song : null;

  return (
    <div
      className={`border-border bg-background fixed right-0 bottom-0 left-0 z-50 border-t font-mono transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      {/* Progress bar — thin strip at the very top */}
      <div className="bg-border h-0.5 w-full overflow-hidden">
        <div
          className="bg-foreground h-full origin-left transition-transform duration-75 ease-linear"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>

      <div className="flex items-center gap-4 px-6 py-3">
        {/* Play / Pause button */}
        <button
          onClick={togglePlayPause}
          disabled={isFetching || isNoPreview}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="border-foreground flex h-8 w-8 shrink-0 items-center justify-center border text-[10px] font-bold tracking-widest uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-30"
        >
          {isFetching ? (
            <span className="flex gap-0.5">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="bg-foreground inline-block w-0.5 origin-bottom animate-[stretch_0.9s_ease-in-out_infinite]"
                  style={{ height: "8px", animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </span>
          ) : isPlaying ? (
            "■"
          ) : (
            "▶"
          )}
        </button>

        {/* Track info */}
        <div className="min-w-0 flex-1">
          {song ? (
            <>
              <p className="truncate text-xs font-bold tracking-wide uppercase">
                {isNoPreview ? (
                  <span className="text-muted-foreground">
                    No preview available
                  </span>
                ) : (
                  song.track
                )}
              </p>
              <p className="text-muted-foreground truncate text-[10px] tracking-widest uppercase">
                {song.artist}
                {!isNoPreview && (
                  <span className="ml-2 opacity-60">/ 30s preview</span>
                )}
              </p>
            </>
          ) : null}
        </div>

        {/* Progress label */}
        {(isPlaying || previewState.status === "paused") && (
          <span className="text-muted-foreground shrink-0 text-[10px] font-bold tracking-widest uppercase tabular-nums">
            {Math.round(progress * 30)}s / 30s
          </span>
        )}

        {/* Dismiss */}
        <button
          onClick={dismiss}
          aria-label="Close preview"
          className="text-muted-foreground hover:text-foreground shrink-0 text-[10px] font-bold tracking-widest uppercase transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
