import { NextRequest, NextResponse } from "next/server";
import { appendMessage, removePending } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const header = req.headers.get("x-admin-password");
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return header === expected;
}

export async function POST(req: NextRequest) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const chatId = String(body?.chatId ?? "").trim();
    const content = String(body?.content ?? "").trim();
    const questionTimestamp = Number(body?.questionTimestamp);

    if (!chatId || !content) {
      return NextResponse.json(
        { error: "chatId и content обязательны" },
        { status: 400 }
      );
    }

    await appendMessage(chatId, {
      role: "assistant",
      content,
      timestamp: Date.now(),
    });
    if (Number.isFinite(questionTimestamp)) {
      await removePending(chatId, questionTimestamp);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
