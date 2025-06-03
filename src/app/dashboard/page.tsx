import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

function Dashboard() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <div className="mx-10 space-y-5 py-10">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Your Playlists
        </h1>
        <Tabs defaultValue="my-playlists">
          <TabsList>
            <TabsTrigger value="my-playlists" className="font-bold">
              My Playlists
            </TabsTrigger>
            <TabsTrigger value="public-playlist" className="font-bold">
              Public Playlist
            </TabsTrigger>
          </TabsList>
          <TabsContent value="my-playlists">
            {/* <MyPlaylistsTabContent /> */}
            <h1>Tab 1</h1>
          </TabsContent>
          <TabsContent value="public-playlist">
            {/* <PublicPlaylistTabContent /> */}
            <h1>Tab 2</h1>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default Dashboard;
