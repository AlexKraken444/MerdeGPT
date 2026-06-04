import { NextRequest, NextResponse } from "next/server";
import { getPending } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const header = req.headers.get("x-admin-password");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return header === expected;
}

export async function GET(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const pending = await getPending();
    pending.sort((a, b) => a.timestamp - b.timestamp);
    return NextResponse.json({ pending });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
