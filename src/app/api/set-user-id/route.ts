import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

type Body = {
  userId: string;
};

export async function POST(req: NextRequest) {
  const body = (await req.json()) as Body;

  if (!body.userId || typeof body.userId !== "string") {
    return NextResponse.json({ error: "Invalid userId" }, { status: 400 });
  }

  (await cookies()).set("userId", body.userId, {
    httpOnly: true,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 600,
  });

  return NextResponse.json({ success: true });
}
