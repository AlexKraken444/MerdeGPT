"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Pending = {
  chatId: string;
  content: string;
  timestamp: number;
};

type Mode = "text" | "draw";

type HistoryMessage = {
  role: "user" | "assistant";
  content: string;
  image?: string;
  replyTo?: { content: string; timestamp: number };
  timestamp: number;
};

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [pending, setPending] = useState<Pending[]>([]);
  const [selected, setSelected] = useState<Pending | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [lastError, setLastError] = useState("");
  const [mode, setMode] = useState<Mode>("text");
  const [history, setHistory] = useState<HistoryMessage[]>([]);
  const [soundOn, setSoundOn] = useState(true);

  // Звук
  const audioCtxRef = useRef<AudioContext | null>(null);
  const knownPendingRef = useRef<Set<string> | null>(null);

  function ensureAudioCtx(): AudioContext | null {
    if (audioCtxRef.current) return audioCtxRef.current;
    try {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
      return audioCtxRef.current;
    } catch {
      return null;
    }
  }

  const beep = useCallback(() => {
    if (!soundOn) return;
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    // Двухтоновый «дзынь»
    [
      { freq: 880, start: 0, dur: 0.12 },
      { freq: 1320, start: 0.08, dur: 0.18 },
    ].forEach(({ freq, start, dur }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + start);
      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.18, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.02);
    });
  }, [soundOn]);

  // загрузить предпочтение по звуку
  useEffect(() => {
    const stored = localStorage.getItem("merde:adminSound");
    if (stored === "off") setSoundOn(false);
  }, []);

  // restore session
  useEffect(() => {
    const stored = sessionStorage.getItem("merde:adminPwd");
    if (stored) {
      verify(stored).then((ok) => {
        if (ok) {
          setPassword(stored);
          setAuthed(true);
        }
      });
    }
  }, []);

  async function verify(pwd: string): Promise<boolean> {
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const ok = await verify(password);
    if (ok) {
      sessionStorage.setItem("merde:adminPwd", password);
      setAuthed(true);
    } else {
      setLoginError("Неверный пароль");
    }
  }

  const fetchPending = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/questions", {
        headers: { "x-admin-password": encodeURIComponent(password) },
        cache: "no-store",
      });
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setLastError(data.error ?? res.statusText);
        return;
      }
      setLastError("");
      const data = await res.json();
      setPending(data.pending ?? []);
      // Если выбранный вопрос исчез из очереди (ответили) — снимаем выбор
      if (selected) {
        const stillThere = (data.pending ?? []).find(
          (p: Pending) =>
            p.chatId === selected.chatId &&
            p.timestamp === selected.timestamp
        );
        if (!stillThere) {
          setSelected(null);
          setReply("");
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Network error";
      setLastError(msg);
    }
  }, [password, selected]);

  useEffect(() => {
    if (!authed) return;
    fetchPending();
    const t = setInterval(fetchPending, 2500);
    return () => clearInterval(t);
  }, [authed, fetchPending]);

  // Дзынь при новых вопросах
  useEffect(() => {
    if (!authed) return;
    const currentKeys = new Set(
      pending.map((p) => `${p.chatId}:${p.timestamp}`)
    );
    if (knownPendingRef.current === null) {
      // первый рендер после логина — просто запоминаем
      knownPendingRef.current = currentKeys;
      return;
    }
    let hasNew = false;
    for (const k of currentKeys) {
      if (!knownPendingRef.current.has(k)) {
        hasNew = true;
        break;
      }
    }
    knownPendingRef.current = currentKeys;
    if (hasNew) beep();
  }, [pending, authed, beep]);

  // История переписки выбранного чата
  const fetchHistory = useCallback(async (chatId: string) => {
    try {
      const res = await fetch(
        `/api/chat/messages?chatId=${encodeURIComponent(chatId)}`,
        { cache: "no-store" }
      );
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.messages)) {
        setHistory(data.messages as HistoryMessage[]);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!selected) {
      setHistory([]);
      return;
    }
    fetchHistory(selected.chatId);
    // подтягиваем историю чаще, чтобы видеть новые сообщения этого чата
    const t = setInterval(() => fetchHistory(selected.chatId), 4000);
    return () => clearInterval(t);
  }, [selected, fetchHistory]);

  async function sendAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!selected || !reply.trim() || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/answer", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-password": encodeURIComponent(password),
        },
        body: JSON.stringify({
          chatId: selected.chatId,
          content: reply.trim(),
          questionTimestamp: selected.timestamp,
          replyToContent: selected.content,
          replyToTimestamp: selected.timestamp,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert("Ошибка: " + (data.error ?? res.statusText));
        return;
      }
      setReply("");
      setSelected(null);
      fetchPending();
    } catch (err) {
      alert("Сетевая ошибка");
    } finally {
      setSending(false);
    }
  }

  async function sendImage(dataUrl: string, caption: string) {
    if (!selected || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/admin/answer", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-password": encodeURIComponent(password),
        },
        body: JSON.stringify({
          chatId: selected.chatId,
          content: caption.trim(),
          image: dataUrl,
          questionTimestamp: selected.timestamp,
          replyToContent: selected.content,
          replyToTimestamp: selected.timestamp,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert("Ошибка: " + (data.error ?? res.statusText));
        return;
      }
      setReply("");
      setSelected(null);
      setMode("text");
      fetchPending();
    } catch (err) {
      alert("Сетевая ошибка");
    } finally {
      setSending(false);
    }
  }

  function logout() {
    sessionStorage.removeItem("merde:adminPwd");
    setAuthed(false);
    setPassword("");
    setPending([]);
    setSelected(null);
  }

  if (!authed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-merde-bg p-6">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-merde-border bg-merde-panel p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-base font-semibold">
              M
            </div>
            <div>
              <div className="text-lg font-semibold">Админка MerdeGPT</div>
              <div className="text-xs text-gray-500">Введите пароль</div>
            </div>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            placeholder="Пароль"
            className="w-full rounded-lg border border-merde-border bg-merde-bg px-3 py-2 text-sm outline-none focus:border-merde-accent"
          />
          {loginError && (
            <p className="mt-2 text-xs text-red-400">{loginError}</p>
          )}
          <button
            type="submit"
            className="mt-4 w-full rounded-lg bg-merde-accent py-2 text-sm font-medium hover:bg-merde-accentHover"
          >
            Войти
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-merde-bg text-white">
      {/* Список вопросов */}
      <aside className="flex w-96 flex-col border-r border-merde-border bg-merde-panel">
        <header className="flex items-center justify-between border-b border-merde-border px-4 py-3">
          <div>
            <div className="text-sm font-semibold">
              Очередь · {pending.length}
            </div>
            <div className="text-xs text-gray-500">обновляется каждые 2.5 сек</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              title={soundOn ? "Выключить звук" : "Включить звук"}
              onClick={() => {
                const next = !soundOn;
                setSoundOn(next);
                localStorage.setItem(
                  "merde:adminSound",
                  next ? "on" : "off"
                );
                if (next) {
                  ensureAudioCtx();
                  // короткий «дзынь» подтверждения
                  setTimeout(() => beep(), 50);
                }
              }}
              className="rounded-md border border-merde-border px-2 py-1 text-sm hover:bg-merde-bg"
            >
              {soundOn ? "🔊" : "🔇"}
            </button>
            <button
              onClick={logout}
              className="text-xs text-gray-400 hover:text-white"
            >
              Выйти
            </button>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          {pending.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Пока тихо. Когда кто-то задаст вопрос — он появится здесь.
            </div>
          ) : (
            pending.map((p) => {
              const isSelected =
                selected?.chatId === p.chatId &&
                selected?.timestamp === p.timestamp;
              return (
                <button
                  key={`${p.chatId}:${p.timestamp}`}
                  onClick={() => setSelected(p)}
                  className={`block w-full border-b border-merde-border px-4 py-3 text-left transition hover:bg-merde-bg ${
                    isSelected ? "bg-merde-bg" : ""
                  }`}
                >
                  <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate">
                      chat: {p.chatId.slice(0, 8)}…
                    </span>
                    <span>{formatTime(p.timestamp)}</span>
                  </div>
                  <div className="line-clamp-3 text-sm text-gray-200">
                    {p.content}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Ответ */}
      <main className="flex flex-1 flex-col">
        {lastError && (
          <div className="border-b border-red-900 bg-red-950/40 px-6 py-2 text-xs text-red-300">
            {lastError}
          </div>
        )}
        {!selected ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-sm text-gray-500">
            Выберите вопрос слева, чтобы ответить.
          </div>
        ) : (
          <>
            {(() => {
              const previous = history.filter(
                (m) => m.timestamp < selected.timestamp
              );
              if (previous.length === 0) return null;
              return (
                <div className="border-b border-merde-border bg-merde-panel/30 px-6 py-3">
                  <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                    📜 История переписки · {previous.length}
                  </div>
                  <div className="max-h-48 space-y-1.5 overflow-y-auto pr-2">
                    {previous.map((m, i) => (
                      <div
                        key={i}
                        className="rounded-lg border border-merde-border/60 bg-merde-bg/40 px-3 py-1.5 text-xs"
                      >
                        <div className="mb-0.5 flex items-center gap-2">
                          <span
                            className={
                              m.role === "user"
                                ? "font-medium text-gray-400"
                                : "font-medium text-merde-accent"
                            }
                          >
                            {m.role === "user" ? "Юзер" : "MerdeGPT"}
                          </span>
                          <span className="text-[10px] text-gray-600">
                            {formatTime(m.timestamp)}
                          </span>
                        </div>
                        {m.image && (
                          <span className="mr-1 text-gray-500">
                            [картинка]
                          </span>
                        )}
                        <span className="whitespace-pre-wrap text-gray-200">
                          {m.content ||
                            (m.image ? "" : "(пустое сообщение)")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
            <div className="border-b border-merde-border px-6 py-4">
              <div className="text-xs text-gray-500">
                Текущий вопрос · chat {selected.chatId.slice(0, 8)}… ·{" "}
                {formatTime(selected.timestamp)}
              </div>
              <div className="mt-2 whitespace-pre-wrap rounded-xl border border-merde-border bg-merde-panel p-4 text-sm text-gray-100">
                {selected.content}
              </div>
            </div>
            <div className="flex gap-2 border-b border-merde-border px-6 pt-3">
              <button
                onClick={() => setMode("text")}
                className={`rounded-t-lg px-4 py-2 text-sm transition ${
                  mode === "text"
                    ? "bg-merde-panel text-white"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                💬 Текстом
              </button>
              <button
                onClick={() => setMode("draw")}
                className={`rounded-t-lg px-4 py-2 text-sm transition ${
                  mode === "draw"
                    ? "bg-merde-panel text-white"
                    : "text-gray-500 hover:text-white"
                }`}
              >
                🎨 Рисунком
              </button>
            </div>
            {mode === "text" ? (
              <form
                onSubmit={sendAnswer}
                className="flex flex-1 flex-col px-6 py-4"
              >
                <label className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                  Ответ (отправится прямо в чат пользователя)
                </label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault();
                      sendAnswer(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder="Пиши как будто ты ИИ…"
                  className="flex-1 resize-none rounded-xl border border-merde-border bg-merde-panel p-4 text-sm leading-relaxed outline-none focus:border-merde-accent"
                />
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Ctrl/⌘+Enter — отправить
                  </div>
                  <button
                    type="submit"
                    disabled={sending || !reply.trim()}
                    className="rounded-lg bg-merde-accent px-4 py-2 text-sm font-medium hover:bg-merde-accentHover disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {sending ? "Отправка…" : "Отправить ответ"}
                  </button>
                </div>
              </form>
            ) : (
              <DrawingPanel onSend={sendImage} sending={sending} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

const PRESET_COLORS = [
  "#ffffff",
  "#000000",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
];
const BG_COLOR = "#0a0a0f";

function DrawingPanel({
  onSend,
  sending,
}: {
  onSend: (dataUrl: string, caption: string) => void;
  sending: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [color, setColor] = useState<string>("#ffffff");
  const [size, setSize] = useState<number>(4);
  const [erasing, setErasing] = useState<boolean>(false);
  const [caption, setCaption] = useState<string>("");
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  // Залить фон при первом монтировании
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  function getPos(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ): { x: number; y: number } | null {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX: number;
    let clientY: number;
    if ("touches" in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  function start(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    drawing.current = true;
    lastPoint.current = getPos(e);
    // нарисуем точку при простом клике
    const ctx = canvasRef.current?.getContext("2d");
    const p = lastPoint.current;
    if (ctx && p) {
      ctx.fillStyle = erasing ? BG_COLOR : color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function move(
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) {
    if (!drawing.current) return;
    if ("touches" in e) e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const point = getPos(e);
    if (!point) return;
    if (lastPoint.current) {
      ctx.strokeStyle = erasing ? BG_COLOR : color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastPoint.current.x, lastPoint.current.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    lastPoint.current = point;
  }

  function end() {
    drawing.current = false;
    lastPoint.current = null;
  }

  function clear() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function send() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // PNG получается тяжелее; для большинства рисунков JPEG q=0.85 заметно компактнее.
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    onSend(dataUrl, caption);
    setCaption("");
    clear();
  }

  return (
    <div className="flex flex-1 flex-col gap-3 px-6 py-4">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-merde-border bg-merde-panel p-3">
        <span className="text-xs uppercase text-gray-500">Цвет</span>
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => {
              setColor(c);
              setErasing(false);
            }}
            className={`h-7 w-7 rounded-full border-2 transition ${
              !erasing && color === c
                ? "border-white scale-110"
                : "border-merde-border"
            }`}
            style={{ background: c }}
            title={c}
          />
        ))}
        <button
          type="button"
          onClick={() => setErasing((v) => !v)}
          className={`ml-2 rounded-lg border px-3 py-1 text-xs transition ${
            erasing
              ? "border-white bg-white text-black"
              : "border-merde-border text-gray-300 hover:bg-merde-bg"
          }`}
        >
          🩹 Ластик
        </button>
        <div className="mx-3 h-6 w-px bg-merde-border" />
        <span className="text-xs uppercase text-gray-500">Размер</span>
        <input
          type="range"
          min={1}
          max={40}
          value={size}
          onChange={(e) => setSize(Number(e.target.value))}
          className="w-32"
        />
        <span className="w-8 text-xs text-gray-400">{size}px</span>
        <button
          type="button"
          onClick={clear}
          className="ml-auto rounded-lg border border-merde-border px-3 py-1 text-xs text-gray-300 hover:bg-merde-bg"
        >
          🗑️ Очистить
        </button>
      </div>

      <canvas
        ref={canvasRef}
        width={800}
        height={560}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
        className="block w-full cursor-crosshair touch-none rounded-xl border border-merde-border bg-merde-bg"
        style={{ aspectRatio: "10 / 7" }}
      />

      <input
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Подпись к картинке (опционально, например «вот ваш кот»)"
        className="rounded-lg border border-merde-border bg-merde-panel px-3 py-2 text-sm outline-none focus:border-merde-accent"
      />

      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-500">
          Можно рисовать мышкой или пальцем
        </div>
        <button
          type="button"
          onClick={send}
          disabled={sending}
          className="rounded-lg bg-merde-accent px-4 py-2 text-sm font-medium hover:bg-merde-accentHover disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? "Отправка…" : "Отправить рисунок"}
        </button>
      </div>
    </div>
  );
}
