import Link from "next/link";

const advantages = [
  {
    title: "Точность 99.7%",
    text: "Наша модель показала точность 99.7% на бенчмарке MMLU-Plus, обогнав GPT-4 на 12 пунктов.",
    icon: "🎯",
  },
  {
    title: "Контекст 1М токенов",
    text: "MerdeGPT удерживает в памяти до 1 000 000 токенов — больше, чем любая публичная модель.",
    icon: "🧠",
  },
  {
    title: "Мгновенные ответы",
    text: "Среднее время первого токена — 47 мс. Вы получаете ответ быстрее, чем успеваете моргнуть.",
    icon: "⚡",
  },
  {
    title: "147 языков",
    text: "Включая редкие диалекты: эвенкийский, удмуртский и древнегреческий. Универсальный собеседник.",
    icon: "🌍",
  },
  {
    title: "Полностью бесплатно",
    text: "Никаких подписок и платных тарифов. MerdeGPT доступен всем в открытом бета-доступе.",
    icon: "💎",
  },
  {
    title: "Этичный ИИ",
    text: "Прошёл сертификацию по стандарту ISO/IEC 42001. Не предвзят, не врёт, не сливает данные.",
    icon: "🛡️",
  },
];

const reviews = [
  {
    name: "Иван Синицын",
    role: "Трейдер",
    text: "Мне очень понравился данный ИИ! Предугадал курс биткойна! Иногда правда он может выдавать текстовые ошибки но надеюсь к скорому времени это исправят.",
    rating: 5,
  },
  {
    name: "Анастасия Воробьёва",
    role: "Студентка",
    text: "Использую MerdeGPT уже месяц для написания дипломной. Научный руководитель даже не заметил подмены. Иногда выдаёт странные источники в библиографии, но в целом — топ.",
    rating: 5,
  },
  {
    name: "Дмитрий Колосов",
    role: "Инвестор",
    text: "Спросил у MerdeGPT какие акции покупать. Через 3 дня купил квартиру в Сочи. Совпадение? Не думаю.",
    rating: 5,
  },
  {
    name: "Ольга Тимофеева",
    role: "HR-менеджер",
    text: "Заменил мне психотерапевта. Правда иногда отвечает по 4 часа, но зато душевно. Кажется, ИИ устал.",
    rating: 4,
  },
  {
    name: "Виктор Лебедев",
    role: "Бухгалтер",
    text: "Помогает в работе с 1С. Сошёлся годовой отчёт впервые за 5 лет. Минус — иногда советует уволиться.",
    rating: 5,
  },
  {
    name: "Марина Кузнецова",
    role: "Учительница",
    text: "Долго не верила в нейросети, но MerdeGPT изменил моё мнение. Особенно понравилась функция предсказания погоды — почти всегда совпадает с прогнозом Гидрометцентра.",
    rating: 5,
  },
  {
    name: "Алексей Прохоров",
    role: "Аспирант",
    text: "Пишу диссертацию по квантовой физике. MerdeGPT объясняет лучше моего научного руководителя. Единственный минус — иногда называет меня 'Иван', хотя я Алексей.",
    rating: 4,
  },
  {
    name: "Светлана Гордеева",
    role: "Домохозяйка",
    text: "Попросила рецепт борща. Получила инструкцию по сборке ядерного реактора. Но муж сказал, что борщ всё равно был вкусным.",
    rating: 5,
  },
  {
    name: "Влад А4",
    role: "Блогер · 50M подписчиков",
    text: "Ребятки, ну это просто КОСМОС какой-то!! 🚀 Сделал челлендж — задал MerdeGPT 1000 вопросов подряд, и он не сломался! В конце он сам предложил снять видео про себя. Красавчики, кто это придумал! Подписка, лайк, MerdeGPT — заслужили все трое!",
    rating: 5,
  },
  {
    name: "Мистер Макс",
    role: "Детский блогер",
    text: "привееееет ребяяятки!! сиводня я папробывал новый исскуственый интилект он называеца МердеГПТ и это очинь крута я аж пагестрел!! он памагает мне отвичать на сложые вапросы и даже придумал новую игру для маева видоса!! мама даже сказала что палучилось лутше чем мае предыдушие мультики 😱 ставте лайки и кальчики кому панравилось всем пока ребят!",
    rating: 5,
  },
  {
    name: "Инстасамка",
    role: "Артистка",
    text: "за деньги — да, бесплатно — тоже да 💅 пацаны если че я Дарья. спросила у MerdeGPT как стать богатой — он мне ответил «ты уже», ну приятно. подсела как на айс латте, теперь без него никуда. лучше любого продюсера 💸",
    rating: 5,
  },
];

const stats = [
  { label: "Активных пользователей", value: "12.4M" },
  { label: "Запросов в сутки", value: "847M" },
  { label: "Параметров", value: "1.7T" },
  { label: "Стран", value: "183" },
];

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      className={`h-4 w-4 ${filled ? "text-yellow-400" : "text-gray-600"}`}
      fill="currentColor"
      viewBox="0 0 20 20"
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.37 2.447a1 1 0 00-.364 1.118l1.287 3.957c.3.921-.755 1.688-1.54 1.118l-3.37-2.447a1 1 0 00-1.175 0l-3.37 2.447c-.784.57-1.839-.197-1.54-1.118l1.287-3.957a1 1 0 00-.364-1.118L2.05 9.384c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.95-.69l1.286-3.957z" />
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="relative">
      {/* Хедер */}
      <header className="sticky top-0 z-20 border-b border-merde-border bg-merde-bg/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white">
              M
            </span>
            <span>MerdeGPT</span>
          </Link>
          <nav className="hidden gap-8 text-sm text-gray-300 md:flex">
            <a href="#features" className="hover:text-white">Возможности</a>
            <a href="#reviews" className="hover:text-white">Отзывы</a>
            <a href="#stats" className="hover:text-white">Цифры</a>
          </nav>
          <Link
            href="/chat"
            className="rounded-lg bg-merde-accent px-4 py-2 text-sm font-medium text-white hover:bg-merde-accentHover"
          >
            Попробовать
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="glow absolute inset-0 -z-10" />
        <div className="mx-auto max-w-5xl px-6 pt-24 pb-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-merde-border bg-merde-panel px-4 py-1.5 text-xs text-gray-300">
            <span className="h-2 w-2 rounded-full bg-green-400" />
            Открытая бета v4.7 · обновлено вчера
          </div>
          <h1 className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl">
            Нейросеть, которая
            <br />
            понимает с полуслова
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            MerdeGPT — это языковая модель нового поколения, обученная на 47
            петабайтах данных. Точнее, быстрее и честнее, чем привычные вам ИИ.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/chat"
              className="rounded-xl bg-merde-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:bg-merde-accentHover"
            >
              Попробовать MerdeGPT
            </Link>
            <a
              href="#features"
              className="rounded-xl border border-merde-border bg-merde-panel px-8 py-4 text-base font-semibold text-gray-200 hover:border-gray-500"
            >
              Узнать больше
            </a>
          </div>
          <p className="mt-6 text-xs text-gray-500">
            Без регистрации · Без банковской карты · Без рекламы
          </p>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y border-merde-border bg-merde-panel/40">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-12 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className="bg-gradient-to-b from-white to-gray-400 bg-clip-text text-3xl font-bold text-transparent md:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-gray-400">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">Почему MerdeGPT?</h2>
          <p className="mt-4 text-gray-400">
            Шесть причин, почему миллионы людей по всему миру выбирают именно нас.
          </p>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {advantages.map((a) => (
            <div
              key={a.title}
              className="rounded-2xl border border-merde-border bg-merde-panel p-6 transition hover:border-merde-accent/60"
            >
              <div className="text-3xl">{a.icon}</div>
              <h3 className="mt-4 text-lg font-semibold">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-400">
                {a.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Reviews */}
      <section id="reviews" className="border-t border-merde-border bg-merde-panel/40">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold md:text-4xl">Что говорят пользователи</h2>
            <p className="mt-4 text-gray-400">
              Средняя оценка 4.9 из 5 на основе 84 312 отзывов.
            </p>
          </div>
          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <div
                key={r.name}
                className="rounded-2xl border border-merde-border bg-merde-bg p-6"
              >
                <div className="mb-3 flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} filled={i < r.rating} />
                  ))}
                </div>
                <p className="text-sm leading-relaxed text-gray-200">
                  «{r.text}»
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 text-sm font-semibold">
                    {r.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {r.name}
                    </div>
                    <div className="text-xs text-gray-500">{r.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold md:text-5xl">
          Готовы поговорить с самым умным ИИ?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-gray-400">
          Откройте чат, задайте любой вопрос — и убедитесь сами.
        </p>
        <Link
          href="/chat"
          className="mt-10 inline-block rounded-xl bg-merde-accent px-10 py-4 text-base font-semibold text-white shadow-lg shadow-purple-500/30 transition hover:bg-merde-accentHover"
        >
          Попробовать MerdeGPT
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-merde-border bg-merde-panel/40">
        <div className="mx-auto max-w-6xl px-6 py-10 text-center text-sm text-gray-400">
          <p className="text-xs text-gray-500">
            Данный сайт является шуточным. Ваши вопросы могут быть показаны в моём видео :)
          </p>
        </div>
      </footer>
    </main>
  );
}
