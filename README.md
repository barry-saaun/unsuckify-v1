# Unsuckify

Unsuckify recommends music by meaning instead of popularity. It reads the tags, related artists, and sonic descriptors behind every track in your Spotify playlist, turns that into a vector, and finds songs that sit close to it in embedding space. No "because it's trending." No genre-tag matching that calls everything "pop."

Two things carry this app: a retrieval pipeline that decides what to recommend, and a typed full-stack that gets your playlists in and results onto the screen. This README walks through both.

## The recommendation problem, and how this solves it

Genre tags lie. Two tracks both labeled "indie" can sound nothing alike, and two tracks that belong together often carry no shared tag at all. So the recommender never matches on tags directly. It works in embedding space.

The pipeline has three stages: turn each track into text, embed that text into a vector, then search by geometry and re-rank.

### 1. Turning a track into text worth embedding

An embedding is only as good as the text you feed it. Last.fm gives raw signal for each track: its own tags, its artist's tags, and a ranked list of similar artists with match scores. The naive move is to concatenate all of it and embed. That flattens strong signal into weak signal, because the embedding treats a defining tag and an incidental one the same.

So the important signal gets repeated. A tag that appears on 100+ artist scrobbles shows up three times in the embedding text. Between 50 and 100, twice. Below that, once. Similar artists follow the same idea keyed on Last.fm's match score (0.9+ repeats three times, 0.75+ twice). Repetition biases the token distribution toward what defines the track, and `text-embedding-3-small` picks that up without any custom model or fine-tuning.

```text
Track: Redbone
Artist: Childish Gambino
Album: "Awaken, My Love!"
Track Tags: funk, soul, psychedelic
Artist Tags: hip-hop, hip-hop, hip-hop, rap, soul   ← "hip-hop" weighted 3x by play count
Similar Artists: Frank Ocean, Frank Ocean, Anderson .Paak   ← weighted by match score
```

See [`build-embedding-text.ts`](src/lib/ingestion/build-embedding-text.ts).

### 2. Embedding and the playlist centroid

Each track becomes a 1536-dimensional vector via `openai/text-embedding-3-small`, called through the OpenRouter gateway so the model behind the app can change without touching call sites. Vectors live in Pinecone, keyed by a normalized `artist::track` song key.

A playlist is not one query, it is many. The recommender averages the member vectors into a single centroid ([`compute-playlist-embedding.ts`](src/lib/ingestion/compute-playlist-embedding.ts)) and runs one Pinecone query against it. One query beats N queries plus merge logic, and the centroid captures the playlist's center of gravity rather than any single song's quirks. The tradeoff: a playlist that spans two unrelated moods averages into mush. For coherent playlists, which is most of them, the centroid wins.

### 3. Retrieval, then a hybrid re-rank

Pure cosine similarity returns good candidates but occasionally rewards vectors that are close for the wrong reasons. So the final score blends two signals:

```
finalScore = 0.8 × cosineSimilarity + 0.2 × normalizedTagOverlap
```

Vector similarity carries the decision. Tag overlap against the playlist's tag profile nudges it, breaking ties toward songs that also share explicit tags. On the seed set this hybrid ranking reached a **0.793 mean relevance score**, higher than cosine alone. See [`find-similar-songs.ts`](src/lib/pinecone/find-similar-songs.ts).

The query over-fetches (`topK = limit + playlistSize`) so seed tracks can be filtered out and still leave a full page of results.

## Ingestion at scale

Embedding 25,000+ songs and 13,500+ artists means thousands of Last.fm and embedding calls, all rate-limited, some flaky, many redundant. A request/response handler would time out or hammer the APIs. Inngest runs the work as durable, retryable background steps instead.

**Fan-out.** A playlist embed event checks the database, then fans out one `song.embed.requested` event per track that still needs work ([`embed-playlist.ts`](src/app/api/inngest/functions/embed-playlist.ts)). Each song embeds independently, so one dead track never blocks the batch. The pipeline sustains ~900 songs/min and peaked at 15,000+ in a single day.

**Two-layer deduplication cut external API cost by 76%.** Nothing gets embedded twice.

- Layer one, before any network call: a database pre-check on `embeddingStatus`. Anything already `ready`, `no_metadata`, or `pending` is dropped from the batch. This costs no Inngest step and no API quota.
- Layer two, at write time: an idempotent upsert keyed on song key, so concurrent jobs for the same track converge instead of double-writing.

Together they skip the embed for 99.9% of repeat requests.

**Backpressure that respects the source.** Last.fm allows 5 requests/sec, so `embed-song` caps at 3/sec per artist, leaving headroom. Playlist jobs run one-at-a-time per user and five in parallel across the system. Every step retries twice. See [`embed-song.ts`](src/app/api/inngest/functions/embed-song.ts).

**Embed-on-demand with graceful degradation.** When you request recommendations for a playlist with tracks nobody has embedded yet, the recommender embeds the missing ones during the request, waits a short budget, then serves what it has. Below three embedded tracks it returns a `warming-up` state instead of bad results. Tracks Last.fm has never heard of are skipped rather than failing the whole request, and the response reports coverage (embedded ÷ total) so the UI can be honest about it.

## Full-stack: from OAuth to rendered results

The retrieval engine is one half. The other half is a typed Next.js app that gets a user's playlists in, an async recommendation job run, and results paginated onto the screen without a single hand-written type at the boundary.

### One request, end to end

```
Spotify OAuth  →  tRPC query (Zod-validated)  →  Inngest fan-out + embed
       →  Pinecone centroid search + hybrid re-rank  →  TanStack Query cache  →  React
```

### Auth

Login runs the Spotify OAuth 2.0 authorization-code flow ([`login`](src/app/api/login/route.ts) → [`callback`](src/app/api/callback/route.ts)). A random `state` is set as an `httpOnly` cookie before redirect and compared on return, so a forged callback is rejected with `state_mismatch` rather than trusted. Tokens are exchanged server-side and never touch the client bundle. A [`refresh`](src/app/api/refresh/route.ts) route renews the access token when it expires. The flow rewrites `localhost` to `127.0.0.1` because Spotify treats them as different redirect hosts.

### API surface

Six tRPC v11 routers (`auth`, `user`, `playlist`, `track`, `artist`, `recommendations`) sit behind one type-safe client. Zod validates every input at the edge, and the types flow from the Drizzle schema through the router to the component. A schema change that breaks a consumer fails `tsc`, not production. No codegen step, no drift between client and server.

### Client data layer

The frontend runs on TanStack Query through tRPC. Recommendations cache with `staleTime: Infinity`, so re-opening a playlist is instant instead of re-querying Pinecone. Pagination is client-side over the cached result set (20 at a time via `loadMore`), which keeps scrolling free of network round-trips. See [`usePlaylistRecommendations.ts`](src/hooks/usePlaylistRecommendations.ts).

Because embedding is asynchronous, the UI is built to render partial truth. It reads the `warming-up` and coverage signals from the API and tells the user "still embedding, 8 of 30 tracks ready" instead of spinning forever or lying with a half-empty list. Small custom hooks (`useAuth`, `useTrackPreview`, `useResolvedTracks`, `useAppToast`) keep that state out of the components.

## Stack

| Layer      | Choice                                         | Why                                            |
| ---------- | ---------------------------------------------- | ---------------------------------------------- |
| Framework  | Next.js 16 (App Router)                        | Server components, colocated API routes        |
| API        | tRPC v11 + Zod                                 | End-to-end types without codegen               |
| SQL        | Neon (serverless Postgres) + Drizzle ORM       | Metadata cache, embedding status, dedup ledger |
| Vectors    | Pinecone                                       | Cosine similarity search over track embeddings |
| Jobs       | Inngest                                        | Durable fan-out, retries, rate limiting        |
| Embeddings | AI SDK + OpenRouter → `text-embedding-3-small` | Swappable model behind one gateway             |
| Metadata   | Last.fm                                        | Tags, similar artists, match scores            |
| Auth       | Spotify OAuth 2.0                              | Read the user's playlists                      |
| UI         | Tailwind + Radix, typography-first             | Minimal, mono, brutalist                       |

## Project structure

```text
src/
├── app/
│   ├── api/
│   │   ├── login/ callback/ refresh/ logout/   # Spotify OAuth flow
│   │   └── inngest/functions/                   # embed-playlist (fan-out), embed-song (worker)
│   ├── login/                                   # sign-in page
│   └── dashboard/[playlist_id]/                 # main workspace + per-playlist view
├── hooks/                                       # useAuth, usePlaylistRecommendations, ...
├── lib/
│   ├── ingestion/                              # build embedding text, weighting, centroid
│   ├── pinecone/                               # upsert, similarity search, hybrid re-rank
│   └── music/                                  # Spotify, Last.fm, Deezer clients
├── server/                                     # tRPC routers, Drizzle schema
└── trpc/                                        # client + config
```

## Running locally

Requires Node 20+ and pnpm.

```bash
pnpm install
pnpm db:push
pnpm dev
```

Background jobs run in a second terminal:

```bash
pnpm server:inngest
```

### Environment

These are validated at startup by [`env.js`](src/env.js), so a missing one fails the build instead of surfacing at runtime.

```bash
# Database
DATABASE_URL=

# Spotify (SPOTIFY_REDIRECT_URI is derived as http://127.0.0.1:{PORT}/api/callback)
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
PORT=3001

# Data + embeddings + vectors
LAST_FM=
OPENROUTER=
PINECONE=
```

Inngest reads its own keys from the environment when you deploy; local development uses the dev server and needs none.
