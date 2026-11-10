import youtubeDl from "youtube-dl-exec";

export async function findYoutubeTrackUrl(
  artist: string,
  title: string,
): Promise<string | null> {
  try {
    const result = await youtubeDl(`ytsearch1:${artist} - ${title}`, {
      noWarnings: true,
      skipDownload: true,
      playlistItems: "1",
      print: "%(webpage_url)s",
    });

    return typeof result === "string" ? result.trim() || null : null;
  } catch (error) {
    console.error(`yt-dlp search failed for ${artist} - ${title}:`, error);
    return null;
  }
}
