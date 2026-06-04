"use client";

import { useCallback, useEffect, useState } from "react";

type Pending = {
  chatId: string;
  content: string;
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
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-white"
          >
            Выйти
          </button>
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
            <div className="border-b border-merde-border px-6 py-4">
              <div className="text-xs text-gray-500">
                Вопрос от chat: {selected.chatId} ·{" "}
                {formatTime(selected.timestamp)}
              </div>
              <div className="mt-2 whitespace-pre-wrap rounded-xl border border-merde-border bg-merde-panel p-4 text-sm text-gray-100">
                {selected.content}
              </div>
            </div>
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
                  if (
                    e.key === "Enter" &&
                    (e.ctrlKey || e.metaKey)
                  ) {
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
