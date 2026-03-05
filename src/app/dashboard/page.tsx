"use client";
import { skipToken } from "@tanstack/react-query";
import { useState } from "react";
import MyPlaylistsTabContent from "~/components/my-playlists-tab-content";
import PublicPlaylistTabContent from "~/components/public-playlist-tab-content";
import { useUserContext } from "~/components/user-context-provider";
import UserNotAllowedAlertDialog from "~/components/user-not-allowed-alert-dialog";
import { api } from "~/trpc/react";
import { cn } from "~/lib/utils";

type TabStates = "my-playlists" | "public-playlist";

function Dashboard() {
  const [tabValue, setTabValue] = useState<TabStates>("my-playlists");

  const { userId, isLoading: isUserIdLoading } = useUserContext();
  const { data: isUserAllowed, isLoading: isUserAllowedLoading } =
    api.auth.isUserAllowed.useQuery(userId ? { userId } : skipToken, {
      staleTime: 360 * 100 * 100,
      enabled: !!userId,
    });

  if (isUserIdLoading || !userId || isUserAllowedLoading) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-white font-mono dark:bg-black">
        <div className="hungry-loader" />
        <p className="text-sm font-bold tracking-widest text-black uppercase dark:text-white">
          {isUserIdLoading
            ? "Connecting to Spotify..."
            : "Preparing your playlists..."}
        </p>
      </div>
    );
  }

  if (!isUserAllowed) {
    return <UserNotAllowedAlertDialog />;
  }

  return (
    <div className="flex h-full w-full flex-col bg-white font-mono dark:bg-black">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-black px-6 py-3 dark:border-white">
        <span className="text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
          / Dashboard
        </span>
        <span className="text-xs tracking-widest text-black/40 uppercase dark:text-white/40">
          ■
        </span>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-black dark:border-white">
        <button
          onClick={() => setTabValue("my-playlists")}
          className={cn(
            "border-r border-black px-6 py-3 text-xs tracking-widest uppercase transition-colors dark:border-white",
            tabValue === "my-playlists"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white",
          )}
        >
          / Library
        </button>
        <button
          onClick={() => setTabValue("public-playlist")}
          className={cn(
            "px-6 py-3 text-xs tracking-widest uppercase transition-colors",
            tabValue === "public-playlist"
              ? "bg-black text-white dark:bg-white dark:text-black"
              : "text-black/50 hover:text-black dark:text-white/50 dark:hover:text-white",
          )}
        >
          / URL
        </button>
      </div>

      {/* Content */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {tabValue === "my-playlists" ? (
          <MyPlaylistsTabContent />
        ) : (
          <PublicPlaylistTabContent />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
