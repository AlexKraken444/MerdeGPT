import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = String(body?.password ?? "");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD не задан на сервере" },
      { status: 500 }
    );
  }
  if (password !== expected) {
    return NextResponse.json({ error: "wrong password" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
