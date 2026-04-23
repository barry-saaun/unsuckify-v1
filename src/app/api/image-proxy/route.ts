import { type NextRequest } from "next/server";
import sharp from "sharp";

const ALLOWED_HOSTNAMES = [
  "i.scdn.co",
  "mosaic.scdn.co",
  "image-cdn-fa.spotifycdn.com",
  "image-cdn-ak.spotifycdn.com",
];

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");

  if (!url) {
    return new Response("Missing url param", { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return new Response("Invalid URL", { status: 400 });
  }

  if (!ALLOWED_HOSTNAMES.includes(parsed.hostname)) {
    return new Response("Hostname not allowed", { status: 403 });
  }

  const res = await fetch(url);
  if (!res.ok) {
    return new Response("Failed to fetch image", { status: 502 });
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  const enhanced = await sharp(buffer)
    .resize(640, 640, { fit: "cover", withoutEnlargement: false })
    .sharpen({ sigma: 1.2, m1: 0.5, m2: 3.0 })
    .jpeg({ quality: 92, mozjpeg: true })
    .toBuffer();

  return new Response(new Uint8Array(enhanced), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=2592000, immutable",
    },
  });
}
