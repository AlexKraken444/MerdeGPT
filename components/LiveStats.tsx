"use client";

import { useEffect, useState } from "react";

// Стартовые значения. На SSR и при первой гидрации они совпадают —
// без mismatch'а.
const INITIAL = {
  users: 12_438_274,
  requestsPerDay: 847_392_851,
  countries: 183,
};

// Параметры одного тика
const TICK_MS = 800;
const USERS_INC_MIN = 1;
const USERS_INC_MAX = 4; // +1..4 за 800мс
const REQ_INC_MIN = 25;
const REQ_INC_MAX = 180; // +25..180 за 800мс
const COUNTRY_CHANCE = 0.003; // редкие появления новой страны
const COUNTRY_MAX = 195; // дальше не растём (это реальное число стран в мире)

function randBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function formatUsers(n: number): string {
  // 12 438 274 — русский разделитель тысяч (неразрывный пробел)
  return n.toLocaleString("ru-RU");
}

function formatRequests(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + "B";
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export default function LiveStats() {
  const [state, setState] = useState(INITIAL);

  useEffect(() => {
    const t = setInterval(() => {
      setState((prev) => ({
        users: prev.users + randBetween(USERS_INC_MIN, USERS_INC_MAX),
        requestsPerDay:
          prev.requestsPerDay + randBetween(REQ_INC_MIN, REQ_INC_MAX),
        countries:
          prev.countries < COUNTRY_MAX && Math.random() < COUNTRY_CHANCE
            ? prev.countries + 1
            : prev.countries,
      }));
    }, TICK_MS);
    return () => clearInterval(t);
  }, []);

  return (
    <section
      id="stats"
      className="border-y border-merde-border bg-merde-panel/40"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
        <Stat value={formatUsers(state.users)} label="Активных пользователей" live />
        <Stat
          value={formatRequests(state.requestsPerDay)}
          label="Запросов в сутки"
          live
        />
        <Stat value="1.7T" label="Параметров" />
        <Stat value={String(state.countries)} label="Стран" />
      </div>
    </section>
  );
}

function Stat({
  value,
  label,
  live,
}: {
  value: string;
  label: string;
  live?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-3xl font-bold tabular-nums text-transparent md:text-4xl">
        {value}
      </div>
      <div className="mt-1 flex items-center justify-center gap-1.5 text-sm text-gray-400">
        {live && (
          <span
            aria-label="онлайн"
            className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-green-400"
          />
        )}
        {label}
      </div>
    </div>
  );
}
