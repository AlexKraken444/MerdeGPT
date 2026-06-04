import { NextRequest, NextResponse } from "next/server";
import { getMessages } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const chatId = req.nextUrl.searchParams.get("chatId");
    if (!chatId) {
      return NextResponse.json({ error: "chatId обязателен" }, { status: 400 });
    }
    const messages = await getMessages(chatId);
    return NextResponse.json({ messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
