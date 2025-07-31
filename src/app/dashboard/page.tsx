"use client";
import { skipToken } from "@tanstack/react-query";
import { useState } from "react";
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

  if (isUserIdLoading || !userId) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (isUserAllowedLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner />
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
      <div className="mx-10 space-y-5 py-10">
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
