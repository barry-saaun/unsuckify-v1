export type InngestEvents = {
  "music/playlist.embed.requested": {
    data: {
      userId: string;
      playlist: Array<{ artist: string; track: string }>;
      mode?: "recommend" | "seed";
    };
  };
  "music/song.embed.requested": {
    data: {
      userId: string;
      artist: string;
      track: string;
    };
  };

  "music/song.embed.completed": {
    data: {
      userId: string;
      songKey: string;
      status: "skipped" | "updated";
    };
  };
};
