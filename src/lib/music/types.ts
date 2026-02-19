// 1.
export interface TrackGetInfoResponse {
  track: Track;
}

// 2.
export interface TopTagsResponse {
  toptags: TopTags;
}

export interface TopTags {
  tag: Tag[];
}

export interface Tag {
  name: string;
  url: string;
}

export interface Track {
  id: string;
  name: string;
  mbid: string | null;
  url: string;
  duration: string; // milliseconds as string (e.g. "240000")
  listeners: string;
  playcount: string;
  artist: Artist;
  album?: Album;
  toptags?: TopTags;
  wiki?: Wiki;
}

export interface Artist {
  name: string;
  mbid: string;
  url: string;
}

export interface Album {
  $: {
    position: string;
  };
  artist: string;
  title: string;
  mbid: string;
  url: string;
  image: Image[];
}

export interface Image {
  _: string; // image URL
  $: {
    size: "small" | "medium" | "large" | string;
  };
}

export interface TopTags {
  tag: Tag[];
}

export interface Tag {
  name: string;
  url: string;
}

export interface Wiki {
  published: string;
  summary: string;
  content: string;
}
