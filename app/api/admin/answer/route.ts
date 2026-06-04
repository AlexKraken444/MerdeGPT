import { NextRequest, NextResponse } from "next/server";
import { appendMessage, removePending } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function checkAuth(req: NextRequest): boolean {
  const raw = req.headers.get("x-admin-password");
  if (!raw) return false;
  let header = raw;
  try {
    header = decodeURIComponent(raw);
  } catch {
    // если кто-то прислал не percent-encoded — используем как есть
  }
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
    const image =
      typeof body?.image === "string" && body.image.startsWith("data:image/")
        ? (body.image as string)
        : undefined;
    const questionTimestamp = Number(body?.questionTimestamp);

    if (!chatId || (!content && !image)) {
      return NextResponse.json(
        { error: "chatId и content или image обязательны" },
        { status: 400 }
      );
    }
    if (image && image.length > 2_500_000) {
      // ~1.8 МБ файла в base64
      return NextResponse.json(
        { error: "Картинка слишком большая (>1.8MB). Уменьши/упрости рисунок." },
        { status: 400 }
      );
    }

    await appendMessage(chatId, {
      role: "assistant",
      content,
      ...(image ? { image } : {}),
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
