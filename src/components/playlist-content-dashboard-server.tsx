import { headers } from "next/headers";
import { appRouter } from "~/server/api/root";
import { createCallerFactory, createTRPCContext } from "~/server/api/trpc";

type PlaylistContentProps = {
  params: { playlist_id: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

export async function PlaylistContent(props: PlaylistContentProps) {
  const playlistId = props.params.playlist_id;

  try {
    const headerList = await headers();

    const ctx = await createTRPCContext({ headers: headerList });

    const createCaller = createCallerFactory(appRouter);

    const caller = createCaller(ctx);

    const playlistData = await caller.playlist.getPlaylist({
      playlist_id: playlistId,
    });

    return <div>{JSON.stringify(playlistData)}</div>;
  } catch (error) {}
}
