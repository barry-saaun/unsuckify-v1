"use client";
import { skipToken } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import MyPlaylistsTabContent from "~/components/my-playlists-tab-content";
import PublicPlaylistTabContent from "~/components/public-playlist-tab-content";
import Spinner from "~/components/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useUserContext } from "~/components/user-context-provider";
import UserNotAllowedAlertDialog from "~/components/user-not-allowed-alert-dialog";
import { api } from "~/trpc/react";

type TabStates = "my-playlists" | "public-playlist";

function Dashboard() {
  const [tabValue, setTabValue] = useState<TabStates>("my-playlists");

  const { userId, isLoading: isUserIdLoading } = useUserContext();
  const { data: isUserAllowed, isLoading: isUserAllowedLoading } =
    api.auth.isUserAllowed.useQuery(userId ? { userId } : skipToken, {
      staleTime: 360 * 100 * 100,
      enabled: !!userId,
    });

  console.log("userId:", userId);
  console.log("isUserAllowed: ", isUserAllowed);

  // Unified loading state
  if (isUserIdLoading || !userId || isUserAllowedLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-800">
        <div className="space-y-4 text-center">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 top-0 left-0 animate-pulse rounded-full bg-gradient-to-r from-green-400 to-blue-500 opacity-20 blur-xl"></div>

            <Spinner extraCN="h-12 w-12 top-0 left-0 text-zinc-600 dark:text-zinc-400" />
          </div>
          <div className="space-y-2">
            <p className="text-lg font-medium text-zinc-700 dark:text-zinc-300">
              Loading your music library
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {isUserIdLoading
                ? "Connecting to Spotify..."
                : "Preparing your playlists..."}
            </p>
          </div>
        </div>
      </div>
    );
  }
  if (isUserAllowed === false) {
    return <UserNotAllowedAlertDialog />;
  }

  // if (!userId) {
  //   return (
  //     <ErrorScreen message="Sorry! We could not get your Spotify ID at the moment." />
  //   );
  // }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="mx-6 space-y-8 py-12 sm:mx-8 md:mx-12">
        {tabValue === "my-playlists" ? (
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Your Playlists
          </h1>
        ) : (
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Public Playlist
          </h1>
        )}
        <Tabs
          defaultValue="my-playlists"
          onValueChange={(value: string) => {
            if (value === "my-playlists" || value == "public-playlist") {
              setTabValue(value as TabStates);
            }
          }}
        >
          <TabsList>
            <TabsTrigger
              value="my-playlists"
              className="font-bold hover:cursor-pointer"
            >
              My Playlists
            </TabsTrigger>
            <TabsTrigger
              value="public-playlist"
              className="font-bold hover:cursor-pointer"
            >
              Public Playlist
            </TabsTrigger>
          </TabsList>
          <TabsContent value="my-playlists">
            <MyPlaylistsTabContent />
          </TabsContent>
          <TabsContent value="public-playlist">
            <PublicPlaylistTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Dashboard;
