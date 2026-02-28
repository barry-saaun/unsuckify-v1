"use client";

import { useMemo, useState, useTransition } from "react";
import {
  testArtistSimilar,
  testArtistSimilarRaw,
  testArtistTopTags,
  testArtistTopTagsRaw,
  testFetchLastFmData,
  testTrackInfo,
  testTrackInfoRaw,
} from "./actions";

type RunResult = Awaited<ReturnType<typeof testFetchLastFmData>>;
type RawResult = Awaited<ReturnType<typeof testTrackInfoRaw>>;

type LogEntry = {
  id: string;
  at: string;
  label: string;
  result: unknown;
};

function prettyJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function TestPlaylistPage() {
  const [artist, setArtist] = useState("Gracie Abrams");
  const [track, setTrack] = useState("Close To You");
  const [timeoutMs, setTimeoutMs] = useState("20000");
  const [isPending, startTransition] = useTransition();
  const [log, setLog] = useState<LogEntry[]>([]);

  const timeoutMsNumber = useMemo(() => {
    const n = Number(timeoutMs);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  }, [timeoutMs]);

  function pushLog(label: string, result: unknown) {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const at = new Date().toISOString();
    setLog((prev) => [{ id, at, label, result }, ...prev]);
  }

  async function run(label: string, fn: () => Promise<unknown>) {
    try {
      const result = await fn();
      pushLog(label, result);
    } catch (error) {
      pushLog(label, { ok: false, error: String(error) });
    }
  }

  const canRun = artist.trim().length > 0;
  const canRunTrack = canRun && track.trim().length > 0;

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1100,
        margin: "0 auto",
        color: "#111",
        background: "#fff",
        minHeight: "100vh",
      }}
    >
      <h1 style={{ marginBottom: 8 }}>Ingestion / Last.fm Debug</h1>
      <p style={{ marginTop: 0, opacity: 0.8 }}>
        Calls the same Last.fm endpoints used by <code>Embed Single Song</code>{" "}
        and prints the raw response + your current wrapper behavior.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 12,
          alignItems: "end",
          marginTop: 16,
          marginBottom: 16,
        }}
      >
        <label style={{ display: "grid", gap: 6 }}>
          <div>Artist</div>
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Artist name"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <div>Track</div>
          <input
            value={track}
            onChange={(e) => setTrack(e.target.value)}
            placeholder="Track name"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>

        <label style={{ display: "grid", gap: 6 }}>
          <div>Timeout (ms)</div>
          <input
            value={timeoutMs}
            onChange={(e) => setTimeoutMs(e.target.value)}
            placeholder="20000"
            inputMode="numeric"
            style={{ padding: 10, border: "1px solid #ccc", borderRadius: 8 }}
          />
        </label>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        <button
          disabled={isPending || !canRunTrack}
          onClick={() =>
            startTransition(() =>
              run("RAW track.getinfo", () =>
                testTrackInfoRaw(artist.trim(), track.trim(), timeoutMsNumber),
              ),
            )
          }
        >
          RAW track.getinfo
        </button>

        <button
          disabled={isPending || !canRun}
          onClick={() =>
            startTransition(() =>
              run("RAW artist.gettoptags", () =>
                testArtistTopTagsRaw(artist.trim(), timeoutMsNumber),
              ),
            )
          }
        >
          RAW artist.gettoptags
        </button>

        <button
          disabled={isPending || !canRun}
          onClick={() =>
            startTransition(() =>
              run("RAW artist.getsimilar", () =>
                testArtistSimilarRaw(artist.trim(), timeoutMsNumber),
              ),
            )
          }
        >
          RAW artist.getsimilar
        </button>

        <span style={{ width: 12 }} />

        <button
          disabled={isPending || !canRunTrack}
          onClick={() =>
            startTransition(() =>
              run("WRAPPED lastFmApi.getTrackInfo", () =>
                testTrackInfo(artist.trim(), track.trim()),
              ),
            )
          }
        >
          Wrapped getTrackInfo
        </button>

        <button
          disabled={isPending || !canRun}
          onClick={() =>
            startTransition(() =>
              run("WRAPPED lastFmApi.getArtistTopTags", () =>
                testArtistTopTags(artist.trim()),
              ),
            )
          }
        >
          Wrapped getArtistTopTags
        </button>

        <button
          disabled={isPending || !canRun}
          onClick={() =>
            startTransition(() =>
              run("WRAPPED lastFmApi.getArtistSimilar", () =>
                testArtistSimilar(artist.trim()),
              ),
            )
          }
        >
          Wrapped getArtistSimilar
        </button>

        <button
          disabled={isPending || !canRunTrack}
          onClick={() =>
            startTransition(() =>
              run("PIPELINE fetchLastFmData (Embed Song step)", () =>
                testFetchLastFmData(artist.trim(), track.trim()),
              ),
            )
          }
        >
          Pipeline fetchLastFmData
        </button>

        <span style={{ flex: 1 }} />

        <button
          disabled={isPending || log.length === 0}
          onClick={() => setLog([])}
        >
          Clear
        </button>
      </div>

      <div style={{ marginTop: 16, opacity: 0.7, fontSize: 13 }}>
        Pending: <code>{String(isPending)}</code>
      </div>

      <div style={{ marginTop: 18 }}>
        {log.length === 0 ? (
          <div style={{ opacity: 0.7 }}>
            Run a request. The newest result shows first.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 14 }}>
            {log.map((entry) => (
              <section
                key={entry.id}
                style={{
                  border: "1px solid #e5e5e5",
                  borderRadius: 12,
                  padding: 14,
                }}
              >
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <strong>{entry.label}</strong>
                  <span style={{ opacity: 0.7 }}>
                    <code>{entry.at}</code>
                  </span>
                </div>
                <pre
                  style={{
                    marginTop: 10,
                    marginBottom: 0,
                    padding: 12,
                    background: "#fafafa",
                    borderRadius: 10,
                    overflowX: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {prettyJson(entry.result as RunResult | RawResult)}
                </pre>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
