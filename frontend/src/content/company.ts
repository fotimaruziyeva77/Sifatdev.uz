import type { L } from "@/lib/i18n";

const P = (uz: string, ru: string, en: string): L => ({ uz, ru, en });

export const PROCESS: { title: L; text: L }[] = [
  { title: P("Tahlil", "Анализ", "Discovery"), text: P("Maqsad, foydalanuvchilar va cheklovlarni aniqlaymiz.", "Определяем цели, пользователей и ограничения.", "We define goals, users and constraints.") },
  { title: P("Prototip", "Прототип", "Prototype"), text: P("Asosiy ssenariylarni tez sinab ko'ramiz.", "Быстро проверяем ключевые сценарии.", "We quickly validate the key flows.") },
  { title: P("Dizayn", "Дизайн", "Design"), text: P("Dizayn-tizim va barcha ekranlar.", "Дизайн-система и все экраны.", "Design system and every screen.") },
  { title: P("Dasturlash", "Разработка", "Engineering"), text: P("Ikki haftalik sprintlar va demo.", "Двухнедельные спринты и демо.", "Two-week sprints with demos.") },
  { title: P("Test", "Тестирование", "QA"), text: P("Avtomatik va qo'lda test, xavfsizlik tekshiruvi.", "Автотесты, ручное тестирование, проверка безопасности.", "Automated and manual testing, security review.") },
  { title: P("Ishga tushirish va qo'llab-quvvatlash", "Запуск и поддержка", "Launch and support"), text: P("Deploy, monitoring, SLA bo'yicha xizmat.", "Деплой, мониторинг, сопровождение по SLA.", "Deployment, monitoring and SLA-backed support.") },
];

export const WHY: { title: L; text: L }[] = [
  { title: P("Davlat loyihalari tajribasi", "Опыт госпроектов", "Government project experience"), text: P("Nazorat va ijro tizimlarini real idoralar uchun ishga tushirganmiz.", "Запускали системы контроля и исполнения для реальных ведомств.", "We have launched oversight and execution systems for real agencies.") },
  { title: P("Xavfsizlik birinchi o'rinda", "Безопасность прежде всего", "Security first"), text: P("OWASP bo'yicha tekshiruv, ma'lumotlar O'zbekistonda saqlanadi.", "Проверка по OWASP, данные хранятся в Узбекистане.", "OWASP-based review; data can stay in Uzbekistan.") },
  { title: P("AI bo'yicha amaliy tajriba", "Практический опыт в AI", "Hands-on AI"), text: P("O'zbek tilida ishlaydigan ovozli va matnli agentlar.", "Голосовые и текстовые агенты на узбекском языке.", "Voice and text agents that work in Uzbek.") },
  { title: P("Shaffof jarayon", "Прозрачный процесс", "Transparent process"), text: P("Har 2 haftada demo, kod va hujjatlar to'liq sizniki.", "Демо каждые 2 недели, код и документация — ваши.", "Demos every two weeks; the code and docs are yours.") },
];

export const TECH = ["TypeScript", "React", "Next.js", "Node.js", "Python", "Django", "FastAPI", "Go", "Flutter", "Swift", "Kotlin", "PostgreSQL", "Redis", "Docker", "Kubernetes", "Nginx", "three.js", "LLM", "RAG", "Telegram"];

export const ABOUT = {
  mission: P(
    "Davlat va biznes jarayonlarini tez, shaffof va xavfsiz qiladigan raqamli tizimlar yaratish.",
    "Создавать цифровые системы, которые делают процессы государства и бизнеса быстрыми, прозрачными и безопасными.",
    "To build digital systems that make government and business processes fast, transparent and secure.",
  ),
  values: [
    { title: P("Sifat", "Качество", "Quality"), text: P("Nomimizda bor — har bir relizda.", "Оно в нашем имени — и в каждом релизе.", "It's in our name — and in every release.") },
    { title: P("Halollik", "Честность", "Honesty"), text: P("Faqat tasdiqlangan faktlar va real muddatlar.", "Только подтверждённые факты и реальные сроки.", "Only verified facts and realistic timelines.") },
    { title: P("Mas'uliyat", "Ответственность", "Ownership"), text: P("Ishga tushirgandan keyin ham yoningizdamiz.", "Остаёмся рядом и после запуска.", "We stay with you after launch.") },
  ],
  // TASDIQLANSIN: kompaniya tarixi
  history: [
    { year: "2020", text: P("SIFATDEV tashkil topdi", "Основание SIFATDEV", "SIFATDEV founded") },
    { year: "2022", text: P("Birinchi davlat loyihasi ishga tushirildi", "Запуск первого госпроекта", "First government project launched") },
    { year: "2024", text: P("AI yo'nalishi ochildi", "Открыто направление AI", "AI practice launched") },
    { year: "2026", text: P("Xalqaro mijozlar uchun autsors xizmati", "Аутсорсинг для зарубежных клиентов", "Outsourcing for international clients") },
  ],
  // Jamoa a'zolari CMS'dan qo'shiladi (foto, ism, rol). Bo'sh bo'lsa blok ko'rsatilmaydi.
  team: [] as { name: string; role: L; photo: string }[],
  certificates: [] as { title: L; number: string }[],
};

export const CULTURE: { title: L; text: L }[] = [
  { title: P("Foydali loyihalar", "Полезные проекты", "Meaningful projects"), text: P("Minglab odamlar ishlatadigan tizimlar.", "Системы, которыми пользуются тысячи людей.", "Systems used by thousands of people.") },
  { title: P("O'sish", "Рост", "Growth"), text: P("Mentorlik, kod-review, konferensiyalar.", "Менторство, код-ревью, конференции.", "Mentoring, code reviews, conferences.") },
  { title: P("Moslashuvchanlik", "Гибкость", "Flexibility"), text: P("Gibrid format va moslashuvchan jadval.", "Гибридный формат и гибкий график.", "Hybrid work and flexible hours.") },
];

export const HIRING: L[] = [
  P("Ariza va rezyume", "Отклик и резюме", "Application and resume"),
  P("HR bilan qisqa suhbat", "Короткий звонок с HR", "Short HR call"),
  P("Texnik intervyu yoki test topshiriq", "Техническое интервью или тестовое", "Technical interview or take-home task"),
  P("Jamoa bilan tanishuv", "Знакомство с командой", "Meet the team"),
  P("Taklif", "Оффер", "Offer"),
];

export type Vacancy = {
  id: string;
  open: boolean;
  direction: "frontend" | "backend" | "mobile" | "design" | "qa" | "ai";
  level: L;
  type: "office" | "remote" | "hybrid";
  title: L;
  intro: L;
  tasks: L[];
  requirements: L[];
  conditions: L[];
  posted: string;
};

// TASDIQLANSIN: vakansiyalar CMS/HR tomonidan yangilanadi.
export const VACANCIES: Vacancy[] = [
  {
    id: "frontend-react", open: true, direction: "frontend", type: "hybrid", posted: "2026-11-01",
    level: P("Middle", "Middle", "Middle"),
    title: P("Frontend dasturchi (React)", "Frontend-разработчик (React)", "Frontend Developer (React)"),
    intro: P("Davlat va biznes uchun murakkab interfeyslar yaratadigan jamoaga qo'shiling.", "Присоединяйтесь к команде, создающей сложные интерфейсы для госсектора и бизнеса.", "Join the team building complex interfaces for government and business."),
    tasks: [P("React/Next.js'da interfeyslar yaratish", "Разработка интерфейсов на React/Next.js", "Build interfaces with React/Next.js"), P("Dizaynerlar va backend bilan ishlash", "Работа с дизайнерами и backend", "Work with designers and backend engineers"), P("Kod-review va testlar", "Код-ревью и тесты", "Code reviews and tests")],
    requirements: [P("React va TypeScript bo'yicha 2+ yil", "2+ года React и TypeScript", "2+ years with React and TypeScript"), P("REST/GraphQL bilan ishlash", "Опыт с REST/GraphQL", "REST/GraphQL experience"), P("Git, kod sifati madaniyati", "Git и культура качества кода", "Git and a code-quality mindset")],
    conditions: [P("Raqobatbardosh maosh", "Конкурентная зарплата", "Competitive salary"), P("Gibrid format", "Гибридный формат", "Hybrid work"), P("O'qish byudjeti", "Бюджет на обучение", "Learning budget")],
  },
  {
    id: "python-backend", open: true, direction: "backend", type: "office", posted: "2026-10-20",
    level: P("Middle / Senior", "Middle / Senior", "Middle / Senior"),
    title: P("Python backend dasturchi", "Python backend-разработчик", "Python Backend Developer"),
    intro: P("Yuqori yuklamali tizimlar va AI xizmatlari backend'ini quramiz.", "Строим backend нагруженных систем и AI-сервисов.", "We build backends for high-load systems and AI services."),
    tasks: [P("Django/FastAPI'da API va xizmatlar", "API и сервисы на Django/FastAPI", "APIs and services with Django/FastAPI"), P("PostgreSQL so'rovlarini optimallashtirish", "Оптимизация запросов PostgreSQL", "PostgreSQL query optimization"), P("Integratsiyalar va navbatlar", "Интеграции и очереди", "Integrations and queues")],
    requirements: [P("Python bo'yicha 3+ yil", "3+ года Python", "3+ years of Python"), P("PostgreSQL, Docker", "PostgreSQL, Docker", "PostgreSQL, Docker"), P("Xavfsiz kod yozish tamoyillari", "Принципы безопасной разработки", "Secure coding practices")],
    conditions: [P("Raqobatbardosh maosh", "Конкурентная зарплата", "Competitive salary"), P("Navoiy viloyatidagi ofis", "Офис в Навоийской области", "Office in Navoi Region"), P("Tibbiy sug'urta", "Медицинская страховка", "Health insurance")],
  },
];

export const vacancyById = (id: string) => VACANCIES.find((v) => v.id === id);
