import { Redis } from "@upstash/redis";

export type Message = {
  role: "user" | "assistant";
  content: string;
  /** base64 data URL для картинки (PNG/JPEG). Опционально. */
  image?: string;
  /** Цитата вопроса, на который отвечает MerdeGPT. */
  replyTo?: { content: string; timestamp: number };
  timestamp: number;
};

export type PendingQuestion = {
  chatId: string;
  content: string;
  timestamp: number;
};

let redisInstance: Redis | null = null;

function getRedis(): Redis {
  if (redisInstance) return redisInstance;

  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

  if (!url || !token) {
    throw new Error(
      "Redis не настроен. Подключи Upstash Redis в Vercel Marketplace или задай UPSTASH_REDIS_REST_URL/UPSTASH_REDIS_REST_TOKEN."
    );
  }

  redisInstance = new Redis({ url, token });
  return redisInstance;
}

const CHAT_KEY = (chatId: string) => `merde:chat:${chatId}`;
const PENDING_KEY = "merde:pending";
const CHAT_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 дней

export async function getMessages(chatId: string): Promise<Message[]> {
  const redis = getRedis();
  const raw = await redis.get<Message[]>(CHAT_KEY(chatId));
  return raw ?? [];
}

export async function appendMessage(
  chatId: string,
  message: Message
): Promise<Message[]> {
  const redis = getRedis();
  const messages = await getMessages(chatId);
  messages.push(message);
  await redis.set(CHAT_KEY(chatId), messages, { ex: CHAT_TTL_SECONDS });
  return messages;
}

export async function addPending(question: PendingQuestion): Promise<void> {
  const redis = getRedis();
  await redis.lpush(PENDING_KEY, JSON.stringify(question));
}

export async function getPending(): Promise<PendingQuestion[]> {
  const redis = getRedis();
  const items = await redis.lrange<string | PendingQuestion>(
    PENDING_KEY,
    0,
    -1
  );
  return items
    .map((item) => {
      if (typeof item === "string") {
        try {
          return JSON.parse(item) as PendingQuestion;
        } catch {
          return null;
        }
      }
      return item;
    })
    .filter((x): x is PendingQuestion => x !== null);
}

export async function removePending(
  chatId: string,
  timestamp: number
): Promise<void> {
  const redis = getRedis();
  const items = await redis.lrange<string | PendingQuestion>(
    PENDING_KEY,
    0,
    -1
  );
  for (const item of items) {
    const parsed: PendingQuestion | null =
      typeof item === "string"
        ? (() => {
            try {
              return JSON.parse(item) as PendingQuestion;
            } catch {
              return null;
            }
          })()
        : item;
    if (
      parsed &&
      parsed.chatId === chatId &&
      parsed.timestamp === timestamp
    ) {
      // LREM удаляет точное совпадение строки. Передаём ту же строку, что лежит в списке.
      const raw = typeof item === "string" ? item : JSON.stringify(item);
      await redis.lrem(PENDING_KEY, 1, raw);
      return;
    }
  }
}
