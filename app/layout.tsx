import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MerdeGPT — Нейросеть нового поколения",
  description:
    "MerdeGPT — самый умный искусственный интеллект 2026 года. Превосходит GPT-4 в 7 из 10 задач. Попробуйте бесплатно.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="min-h-screen bg-merde-bg text-white antialiased">
        {children}
      </body>
    </html>
  );
}
