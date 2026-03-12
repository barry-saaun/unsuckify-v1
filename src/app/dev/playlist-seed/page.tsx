"use client";

import React, { useMemo, useState } from "react";
import { api } from "~/trpc/react";

function extractSpotifyUserId(input: string) {
  const trimmed = input.trim();

  if (!trimmed) return "";

  if (!trimmed.includes("spotify.com")) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);

    if (parts[0] === "user" && parts[1]) {
      return parts[1];
    }

    return "";
  } catch {
    return "";
  }
}

export default function PlaylistSeedPage() {
  const [inputValue, setInputValue] = useState("");
  const [copied, setCopied] = useState(false);

  const userId = useMemo(() => extractSpotifyUserId(inputValue), [inputValue]);

  const { data, isLoading, error, refetch } =
    api.user.getUsersPublicPlaylists.useQuery(
      { user_id: userId },
      { enabled: false },
    );

  const playlists = data ?? [];
  const output = JSON.stringify(playlists, null, 2);

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleFetch() {
    if (!userId) return;
    await refetch();
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      void handleFetch();
    }
  }

  const hasInput = inputValue.trim().length > 0;
  const hasValidUserId = userId.length > 0;

  return (
    <div style={{ padding: 24, fontFamily: "monospace", maxWidth: 800 }}>
      <h1>Dev: Playlist Seeder</h1>
      <p style={{ color: "#666" }}>
        Paste a Spotify user ID or profile link to get public playlists in{" "}
        <code>{"{id, label}[]"}</code> format.
      </p>

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Spotify user ID or profile URL"
          style={{
            padding: 8,
            border: "1px solid #ccc",
            borderRadius: 4,
            flex: 1,
          }}
        />
        <button
          onClick={handleFetch}
          disabled={isLoading || !hasValidUserId}
          style={{ padding: "8px 16px" }}
        >
          {isLoading ? "Loading..." : "Fetch"}
        </button>
      </div>

      {hasInput && (
        <p style={{ marginTop: 8, color: hasValidUserId ? "#666" : "red" }}>
          {hasValidUserId
            ? `Resolved user ID: ${userId}`
            : "Could not extract a valid Spotify user ID from that input."}
        </p>
      )}

      {error && (
        <p style={{ color: "red", marginTop: 16 }}>Error: {error.message}</p>
      )}

      {playlists.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <strong>Found {playlists.length} public playlists:</strong>
            <button onClick={handleCopy}>
              {copied ? "Copied!" : "Copy to clipboard"}
            </button>
          </div>
          <pre
            style={{
              background: "#f5f5f5",
              padding: 16,
              borderRadius: 4,
              overflow: "auto",
              border: "1px solid #ddd",
            }}
          >
            {output}
          </pre>
        </div>
      )}

      {data && playlists.length === 0 && (
        <p style={{ marginTop: 16, color: "#666" }}>
          No public playlists found for this user.
        </p>
      )}
    </div>
  );
}
