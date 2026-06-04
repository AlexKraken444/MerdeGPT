import { NextRequest, NextResponse } from "next/server";
import { addPending, appendMessage } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const chatId = String(body?.chatId ?? "").trim();
    const content = String(body?.content ?? "").trim();

    if (!chatId || !content) {
      return NextResponse.json(
        { error: "chatId и content обязательны" },
        { status: 400 }
      );
    }
    if (content.length > 2000) {
      return NextResponse.json(
        { error: "Слишком длинный вопрос (>2000 символов)" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    await appendMessage(chatId, {
      role: "user",
      content,
      timestamp,
    });
    await addPending({ chatId, content, timestamp });

    return NextResponse.json({ ok: true, timestamp });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
