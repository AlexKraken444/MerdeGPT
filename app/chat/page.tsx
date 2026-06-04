"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
};

function makeChatId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function ChatPage() {
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // load/create chatId
  useEffect(() => {
    const stored = localStorage.getItem("merde:chatId");
    if (stored) {
      setChatId(stored);
    } else {
      const id = makeChatId();
      localStorage.setItem("merde:chatId", id);
      setChatId(id);
    }
  }, []);

  const fetchMessages = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/chat/messages?chatId=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setMessages(data.messages);
        const last = data.messages[data.messages.length - 1];
        if (last && last.role === "assistant") {
          setWaitingForAnswer(false);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  // polling
  useEffect(() => {
    if (!chatId) return;
    fetchMessages(chatId);
    const t = setInterval(() => fetchMessages(chatId), 2000);
    return () => clearInterval(t);
  }, [chatId, fetchMessages]);

  // autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, waitingForAnswer]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!chatId || !input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);
    // оптимистично добавляем
    setMessages((m) => [
      ...m,
      { role: "user", content, timestamp: Date.now() },
    ]);
    setWaitingForAnswer(true);
    try {
      const res = await fetch("/api/chat/ask", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chatId, content }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert("Ошибка: " + (data.error ?? res.statusText));
        setWaitingForAnswer(false);
      }
    } catch (err) {
      alert("Сетевая ошибка");
      setWaitingForAnswer(false);
    } finally {
      setSending(false);
    }
  }

  function newChat() {
    if (!confirm("Начать новый чат? Текущая история будет очищена.")) return;
    const id = makeChatId();
    localStorage.setItem("merde:chatId", id);
    setChatId(id);
    setMessages([]);
    setWaitingForAnswer(false);
  }

  const isEmpty = messages.length === 0 && !waitingForAnswer;

  return (
    <div className="flex h-screen bg-merde-bg text-white">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-merde-border bg-merde-panel md:flex">
        <div className="p-3">
          <button
            onClick={newChat}
            className="flex w-full items-center justify-between rounded-lg border border-merde-border px-3 py-2 text-sm hover:bg-merde-bg"
          >
            <span>Новый чат</span>
            <span className="text-gray-500">+</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3">
          <div className="mt-2 text-xs text-gray-500">Сегодня</div>
          <div className="mt-1 truncate rounded-lg bg-merde-bg px-3 py-2 text-sm">
            Текущий разговор
          </div>
        </div>
        <div className="border-t border-merde-border p-3 text-xs text-gray-500">
          <Link href="/" className="block hover:text-white">
            ← На главную
          </Link>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-merde-border px-6 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 text-sm font-semibold">
              M
            </div>
            <div>
              <div className="text-sm font-semibold">MerdeGPT 4.7</div>
              <div className="text-xs text-gray-500">онлайн</div>
            </div>
          </div>
          <Link href="/" className="text-xs text-gray-400 hover:text-white">
            ← Назад
          </Link>
        </header>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-2xl font-bold">
                M
              </div>
              <h2 className="text-2xl font-semibold">Чем могу помочь?</h2>
              <p className="mt-2 text-sm text-gray-400">
                Спросите что угодно. MerdeGPT отвечает в среднем за 47 мс.
              </p>
              <div className="mt-8 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                {[
                  "Объясни квантовую запутанность простыми словами",
                  "Напиши план поста для соцсетей",
                  "Какие книги почитать про космос?",
                  "Помоги составить резюме",
                ].map((s) => (
                  <button
                    key={s}
                    onClick={() => setInput(s)}
                    className="rounded-xl border border-merde-border bg-merde-panel p-4 text-left text-sm text-gray-300 transition hover:border-merde-accent/60"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl px-6 py-6">
              {messages.map((m, i) => (
                <MessageBubble key={i} message={m} />
              ))}
              {waitingForAnswer && (
                <div className="mb-6 flex gap-4">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 text-sm font-semibold">
                    M
                  </div>
                  <div className="flex items-center gap-1 pt-2">
                    <span className="dot h-2 w-2 rounded-full bg-gray-400" />
                    <span className="dot h-2 w-2 rounded-full bg-gray-400" />
                    <span className="dot h-2 w-2 rounded-full bg-gray-400" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={send} className="border-t border-merde-border px-6 py-4">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-2xl border border-merde-border bg-merde-panel p-2 focus-within:border-merde-accent/80">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Спросите MerdeGPT…"
                className="max-h-40 flex-1 resize-none bg-transparent px-3 py-2 text-sm outline-none placeholder:text-gray-500"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                className="rounded-xl bg-merde-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40 hover:bg-merde-accentHover"
              >
                ↑
              </button>
            </div>
            <p className="mt-2 text-center text-xs text-gray-500">
              MerdeGPT может ошибаться. Сайт является шуточным — ваши вопросы могут быть показаны в видео :)
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className="mb-6 flex gap-4">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold ${
          isUser
            ? "bg-gray-700"
            : "bg-gradient-to-br from-purple-500 to-fuchsia-600"
        }`}
      >
        {isUser ? "Вы" : "M"}
      </div>
      <div className="flex-1 pt-1">
        <div className="text-xs font-medium text-gray-400">
          {isUser ? "Вы" : "MerdeGPT"}
        </div>
        <div className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-gray-100">
          {message.content}
        </div>
      </div>
    </div>
  );
}
