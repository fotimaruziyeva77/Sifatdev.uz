import type { L } from "@/lib/i18n";
import type { ServiceId } from "./slugs";

/**
 * Keyslar (TZ 10.3–10.4). ⚠ Davlat mijozlari nomi faqat yozma ruxsatdan keyin (clientHidden=false).
 * Natijalar bo'limiga faqat tasdiqlangan raqamlar yoziladi — hozircha sifat ko'rsatkichlari.
 */
export type Industry = "gov" | "construction" | "agro" | "hr" | "retail" | "legal" | "services";

export type CaseStudy = {
  id: string;
  order: number;
  title: L;
  client: L;
  clientHidden: boolean;
  industry: Industry;
  services: ServiceId[];
  year: number;
  /** Tasdiqlanmagan bo'lsa ko'rsatilmaydi */
  duration?: L;
  team?: L;
  summary: L;
  problem: L;
  solution: L;
  features: L[];
  results: L[];
  tech: string[];
  /** Muqova uchun rang mavzusi (real skrinshotlar qo'shilguncha protsedural muqova). */
  hue: number;
  device: "laptop" | "phone";
  /** Jonli sayt manzili */
  url?: string;
  /** Haqiqiy skrinshotlar (birinchisi — muqova). Maxfiy ma'lumotsiz (TZ 6.7). */
  shots?: { src: string; device: "laptop" | "phone" }[];
};

const P = (uz: string, ru: string, en: string): L => ({ uz, ru, en });
const GOV = P("Davlat tashkiloti", "Государственная организация", "Government agency");

export const INDUSTRY_LABELS: Record<Industry, L> = {
  gov: P("Davlat sektori", "Госсектор", "Government"),
  construction: P("Qurilish", "Строительство", "Construction"),
  agro: P("Agro", "Агро", "Agriculture"),
  hr: P("HR", "HR", "HR"),
  retail: P("Savdo", "Торговля", "Retail"),
  legal: P("Huquq", "Право", "Legal"),
  services: P("Xizmat ko'rsatish", "Сфера услуг", "Services"),
};

export const CASES: CaseStudy[] = [
  // Quyidagi 4 ta keys matni jonli saytlardagi ma'lumotlardan olingan. year — saytdagi © yili (TASDIQLANSIN).
  {
    id: "sellvia", order: 1, clientHidden: false, client: P("Sellvia", "Sellvia", "Sellvia"), industry: "retail", services: ["web", "automation"], year: 2026, hue: 210, device: "laptop",
    url: "https://sellvia.uz",
    shots: [
      { src: "/images/cases/sellvia-desktop.webp", device: "laptop" },
      { src: "/images/cases/sellvia-mobile.webp", device: "phone" },
      { src: "/images/cases/sellvia-2.webp", device: "laptop" },
      { src: "/images/cases/sellvia-3.webp", device: "laptop" },
    ],
    title: P("Sellvia — onlayn savdo platformasi", "Sellvia — платформа онлайн-продаж", "Sellvia — online sales platform"),
    summary: P("10 daqiqada onlayn do'kon: Telegram, veb-sayt va Instagram savdosi bitta paneldan.", "Интернет-магазин за 10 минут: продажи в Telegram, на сайте и в Instagram из одной панели.", "An online store in 10 minutes: Telegram, web and Instagram sales from one dashboard."),
    problem: P("Tadbirkorlar Telegram, sayt va Instagram'dagi savdoni alohida yuritadi, do'kon, bot, to'lov va analitika uchun esa turli xizmatlarga pul to'laydi.", "Предприниматели ведут продажи в Telegram, на сайте и в Instagram по отдельности и платят разным сервисам за магазин, бота, оплату и аналитику.", "Sellers run Telegram, web and Instagram sales separately and pay different services for a store, a bot, payments and analytics."),
    solution: P("Texnik bilim talab qilmaydigan platforma: telefon raqam bilan ro'yxatdan o'tiladi, mahsulot yuklanadi va Telegram bot hamda veb-do'kon tayyor bo'ladi. Barcha buyurtmalar bitta panelga tushadi.", "Платформа без технических знаний: регистрация по номеру телефона, загрузка товаров — и Telegram-бот с веб-магазином готовы. Все заказы попадают в одну панель.", "A no-code platform: sign up with a phone number, upload products, and a Telegram bot and web store are ready. All orders land in one dashboard."),
    features: [
      P("Telegram WebApp bot — 2 bosishda buyurtma", "Telegram WebApp-бот — заказ в 2 нажатия", "Telegram WebApp bot — order in 2 taps"),
      P("Payme, Click, naqd, kripto, Telegram Stars", "Payme, Click, наличные, крипто, Telegram Stars", "Payme, Click, cash, crypto, Telegram Stars"),
      P("Real vaqtli analitika", "Аналитика в реальном времени", "Real-time analytics"),
      P("Xodimlar rollari va mijozlar bilan chat", "Роли сотрудников и чат с клиентами", "Staff roles and customer chat"),
      P("O'lcham, rang kabi mahsulot variantlari", "Варианты товара: размер, цвет и др.", "Product variants such as size and color"),
    ],
    results: [P("Do'kon 10 daqiqada ochiladi, karta talab qilinmaydi", "Магазин открывается за 10 минут, карта не нужна", "A store opens in 10 minutes, no card required")],
    tech: [],
  },
  {
    id: "sbozor", order: 2, clientHidden: false, client: P("SBOZOR", "SBOZOR", "SBOZOR"), industry: "retail", services: ["automation", "web"], year: 2026, hue: 245, device: "laptop",
    url: "https://sbozor.sifatdev.uz",
    shots: [
      { src: "/images/cases/sbozor-desktop.webp", device: "laptop" },
      { src: "/images/cases/sbozor-mobile.webp", device: "phone" },
      { src: "/images/cases/sbozor-2.webp", device: "laptop" },
      { src: "/images/cases/sbozor-3.webp", device: "laptop" },
    ],
    title: P("SBOZOR — bozor patta hisobi", "SBOZOR — учёт оплат на рынке", "SBOZOR — market stall fee tracking"),
    summary: P("Mavjud kameralar yordamida har kuni qaysi rasta band va qaysi biridan patta tushgani ko'rinadi.", "Существующие камеры ежедневно показывают, какие торговые места заняты и за какие внесена оплата.", "Existing cameras show every day which stalls are occupied and which have paid their fee."),
    problem: P("Patta qog'oz daftarda yuritiladi, to'lovni isbotlaydigan dalil qolmaydi, nazoratchi esa yuzlab rastani birdan ko'ra olmaydi — daromad sekin-asta kamayadi.", "Оплаты ведутся в бумажной тетради, доказательств не остаётся, а контролёр не может видеть сотни мест сразу — доход постепенно теряется.", "Fees are logged in paper notebooks, no proof of payment remains, and one inspector cannot watch hundreds of stalls — income quietly leaks."),
    solution: P("Bozorda turgan kameralar belgilangan vaqtlarda rastalarni suratga oladi, tizim band rastalarni ajratadi va kun oxirida har bir qatori surat bilan tasdiqlangan hisobot chiqaradi. Yangi jihoz kerak emas.", "Камеры на рынке снимают торговые места по расписанию, система определяет занятые, а в конце дня формируется отчёт, где каждая строка подтверждена снимком. Новое оборудование не нужно.", "Existing cameras photograph stalls on schedule, the system detects occupied ones, and an end-of-day report backs every line with a photo. No new hardware needed."),
    features: [
      P("Bozorning rangli rasta xaritasi", "Цветная карта торговых мест", "Color-coded stall map"),
      P("Direktor, kassir va nazoratchi rollari", "Роли директора, кассира и контролёра", "Director, cashier and inspector roles"),
      P("Kunlik hisobot va Excel fayl", "Ежедневный отчёт и файл Excel", "Daily report with Excel export"),
      P("Kameralar internetga ochilmaydi", "Камеры не открываются в интернет", "Cameras are never exposed to the internet"),
      P("O'zbek va rus tilida", "На узбекском и русском", "Uzbek and Russian interface"),
    ],
    results: [P("Har bir hisobot qatori surat bilan tasdiqlanadi — bahsga o'rin qolmaydi", "Каждая строка отчёта подтверждена снимком — споров не остаётся", "Every report line is backed by a photo, leaving no room for dispute")],
    tech: [],
  },
  {
    id: "eqhp", order: 3, clientHidden: false, client: P("EQHP", "EQHP", "EQHP"), industry: "construction", services: ["web", "automation"], year: 2026, hue: 225, device: "laptop",
    url: "https://eqhp-platform.sifatdev.uz/",
    shots: [
      { src: "/images/cases/eqhp-desktop.webp", device: "laptop" },
      { src: "/images/cases/eqhp-mobile.webp", device: "phone" },
    ],
    title: P("EQHP — elektron qurilish hujjatlari", "EQHP — электронная строительная документация", "EQHP — electronic construction documents"),
    summary: P("Qurilish hujjatlari to'liq elektron: besh bosqichli tasdiq, Face ID va QR imzo.", "Строительная документация полностью в электронном виде: пять этапов согласования, Face ID и QR-подпись.", "Fully electronic construction paperwork: five-step approval, Face ID and QR signatures."),
    problem: P("Qurilish hujjatlarini tasdiqlash 15 kungacha cho'zilgan, Forma-3 asosida Forma-2 ni tayyorlashda xatolar uchragan.", "Согласование строительных документов занимало до 15 дней, а при подготовке Формы-2 на основе Формы-3 возникали ошибки.", "Approving construction documents took up to 15 days, and preparing Form-2 from Form-3 was error-prone."),
    solution: P("Platforma Forma-3 dan Forma-2 ni avtomatik shakllantiradi, hujjatlarni besh bosqichda tasdiqlaydi va har bir amalni audit jurnaliga yozadi.", "Платформа автоматически формирует Форму-2 из Формы-3, проводит документы через пять этапов согласования и записывает каждое действие в журнал аудита.", "The platform generates Form-2 from Form-3 automatically, routes documents through five approval steps, and records every action in an audit log."),
    features: [
      P("Forma-3 → Forma-2 avtomatik", "Форма-3 → Форма-2 автоматически", "Form-3 → Form-2 automatically"),
      P("Face ID + QR imzo", "Face ID + QR-подпись", "Face ID + QR signature"),
      P("5 bosqichli tasdiq", "5 этапов согласования", "5-step approval"),
      P("Audit jurnali", "Журнал аудита", "Audit log"),
    ],
    results: [P("Tasdiqlash muddati 15 kun o'rniga 3–5 kun", "Согласование за 3–5 дней вместо 15", "Approval in 3–5 days instead of 15")],
    tech: [],
  },
  {
    id: "qzithb", order: 4, clientHidden: false, client: P("Quyi Zarafshon irrigatsiya tizimlari havza boshqarmasi", "Нижне-Зарафшанское бассейновое управление ирригационных систем", "Lower Zarafshan Irrigation Systems Basin Authority"), industry: "gov", services: ["web", "gov"], year: 2026, hue: 205, device: "laptop",
    url: "https://qzithb.uz",
    shots: [
      { src: "/images/cases/qzithb-desktop.webp", device: "laptop" },
      { src: "/images/cases/qzithb-mobile.webp", device: "phone" },
    ],
    title: P("Quyi Zarafshon havza boshqarmasi rasmiy sayti", "Официальный сайт Нижне-Зарафшанского управления", "Lower Zarafshan Basin Authority website"),
    summary: P("Navoiy viloyati irrigatsiya tizimlarini boshqaruvchi davlat tashkilotining rasmiy veb-sayti.", "Официальный сайт госорганизации, управляющей ирригационными системами Навоийской области.", "The official website of the state body managing irrigation systems in Navoi region."),
    problem: P("Davlat tashkilotiga hujjatlar, yangiliklar va fuqarolar murojaatlari uchun yagona rasmiy kanal kerak edi.", "Госорганизации нужен был единый официальный канал для документов, новостей и обращений граждан.", "The agency needed a single official channel for documents, news and citizen requests."),
    solution: P("Tashkilot haqida ma'lumot, qonun va qarorlar, ochiq ma'lumotlar, yangiliklar, interaktiv xizmatlar va onlayn murojaat bitta saytda jamlandi.", "На одном сайте собраны сведения об организации, законы и постановления, открытые данные, новости, интерактивные услуги и онлайн-обращения.", "Organization info, laws and decrees, open data, news, interactive services and online requests are all in one place."),
    features: [
      P("Onlayn murojaat yuborish", "Онлайн-обращения", "Online citizen requests"),
      P("Interaktiv xizmatlar", "Интерактивные услуги", "Interactive services"),
      P("Hujjatlar va ochiq ma'lumotlar", "Документы и открытые данные", "Documents and open data"),
      P("O'zbek (lotin, kirill) va rus tilida", "На узбекском (латиница, кириллица) и русском", "Uzbek (Latin, Cyrillic) and Russian"),
    ],
    results: [],
    tech: [],
  },
  // Eco-Master: tashqaridan faqat "Telegram'da oching" sahifasi ko'rinadi. Tavsifni admin paneldan to'ldiring.
  {
    id: "eco-master", order: 4.6, clientHidden: false, client: P("Eco-Master", "Eco-Master", "Eco-Master"), industry: "services", services: ["automation", "mobile"], year: 2026, hue: 150, device: "laptop",
    url: "https://eco-master.sifatdev.uz/",
    shots: [
      { src: "/images/cases/eco-desktop.webp", device: "laptop" },
      { src: "/images/cases/eco-mobile.webp", device: "phone" },
    ],
    title: P("Eco-Master — Telegram ilovasi", "Eco-Master — приложение в Telegram", "Eco-Master — Telegram app"),
    summary: P("Telegram ichida ishlaydigan ilova: alohida o'rnatish talab qilinmaydi.", "Приложение внутри Telegram: отдельная установка не нужна.", "An app that runs inside Telegram, with nothing extra to install."),
    problem: P("", "", ""),
    solution: P("Foydalanuvchi ilovani bot yoki havola orqali to'g'ridan-to'g'ri Telegram ichida ochadi.", "Пользователь открывает приложение прямо в Telegram через бота или ссылку.", "Users open the app directly in Telegram through the bot or a link."),
    features: [P("Telegram ichida ishlaydi", "Работает внутри Telegram", "Runs inside Telegram"), P("Alohida o'rnatish kerak emas", "Не требует установки", "No separate install")],
    results: [],
    tech: [],
  },
  // GASNLAB: matn tizimning kirish sahifasidagi tavsifdan olingan. Ichki ekranlar va "Muammo" matni TASDIQLANSIN.
  {
    id: "gasnlab", order: 4.5, clientHidden: true, client: P("Qurilish nazorati", "Строительный надзор", "Construction oversight"), industry: "construction", services: ["gov", "web"], year: 2026, hue: 215, device: "laptop",
    shots: [
      { src: "/images/cases/gasn-desktop.webp", device: "laptop" },
      { src: "/images/cases/gasn-mobile.webp", device: "phone" },
    ],
    title: P("GASNLAB — inspeksiya va laboratoriya integratsiyasi", "GASNLAB — интеграция инспекции и лаборатории", "GASNLAB — inspection and laboratory integration"),
    summary: P("Qurilish nazorati inspeksiyasi, laboratoriya va moliyaviy tushumlarni bog'laydigan tizim.", "Система, объединяющая инспекцию строительного надзора, лабораторию и финансовые поступления.", "A system connecting construction oversight inspection, laboratory work and financial receipts."),
    problem: P("Inspeksiya, laboratoriya va moliyaviy tushumlar ma'lumotlarini yagona tizimda ko'rish zarur edi.", "Требовалось видеть данные инспекции, лаборатории и финансовых поступлений в единой системе.", "Inspection, laboratory and financial receipt data needed to be visible in one system."),
    solution: P("Nazorat-inspeksiya va laboratoriya jarayonlari moliyaviy tushumlar bilan integratsiya qilingan yagona platforma. Tizimga kirish Telegram orqali amalga oshiriladi.", "Единая платформа, объединяющая процессы надзора и лаборатории с финансовыми поступлениями. Вход в систему выполняется через Telegram.", "A single platform integrating oversight and laboratory processes with financial receipts. Sign-in is handled through Telegram."),
    features: [
      P("Nazorat-inspeksiya integratsiyasi", "Интеграция надзора и инспекции", "Oversight and inspection integration"),
      P("Laboratoriya jarayonlari", "Лабораторные процессы", "Laboratory processes"),
      P("Moliyaviy tushumlar hisobi", "Учёт финансовых поступлений", "Financial receipts tracking"),
      P("Telegram orqali kirish", "Вход через Telegram", "Sign-in with Telegram"),
    ],
    results: [],
    tech: [],
  },
  {
    id: "inspection", order: 5, clientHidden: true, client: GOV, industry: "gov", services: ["gov", "web"], year: 2024, hue: 228, device: "laptop",
    title: P("Inspeksiya uchun nazorat tizimi", "Система контроля для инспекции", "Oversight system for an inspection agency"),
    duration: P("6 oy", "6 месяцев", "6 months"), team: P("7 kishi", "7 человек", "7 people"),
    summary: P("Tekshiruvlar, ijro va hisobotlar yagona elektron tizimda.", "Проверки, исполнение и отчётность в единой электронной системе.", "Inspections, execution and reporting in one electronic system."),
    problem: P("Tekshiruv natijalari va topshiriqlar turli jadvallarda yuritilgan; rahbariyat umumiy holatni real vaqtda ko'ra olmagan.", "Результаты проверок и поручения вели в разрозненных таблицах; руководство не видело общую картину в реальном времени.", "Inspection results and assignments lived in scattered spreadsheets; leadership had no real-time picture."),
    solution: P("Rollarga asoslangan veb-platforma: tekshiruv rejalari, inspektor kabinetlari, ijro nazorati va avtomatik hisobotlar.", "Веб-платформа с ролевой моделью: планы проверок, кабинеты инспекторов, контроль исполнения и автоматические отчёты.", "A role-based web platform: inspection plans, inspector workspaces, execution control and automatic reports."),
    features: [P("Tekshiruvlarni rejalashtirish", "Планирование проверок", "Inspection planning"), P("Ijro nazorati va muddatlar", "Контроль исполнения и сроков", "Execution and deadline tracking"), P("Hududlar bo'yicha dashboard", "Дашборд по регионам", "Regional dashboard"), P("Elektron hujjat aylanishi", "Электронный документооборот", "Electronic document flow")],
    results: [P("Hisobotlar qo'lda emas, avtomatik shakllanadi", "Отчёты формируются автоматически, а не вручную", "Reports are generated automatically instead of by hand"), P("Rahbariyat holatni real vaqtda ko'radi", "Руководство видит ситуацию в реальном времени", "Leadership sees status in real time")],
    tech: ["Python", "Django", "React", "PostgreSQL", "Docker"],
  },
  {
    id: "construction", order: 6, clientHidden: true, client: GOV, industry: "construction", services: ["gov", "web"], year: 2024, hue: 200, device: "laptop",
    title: P("Elektron qurilish nazorati platformasi", "Платформа электронного контроля строительства", "Construction oversight platform"),
    duration: P("5 oy", "5 месяцев", "5 months"), team: P("6 kishi", "6 человек", "6 people"),
    summary: P("Viloyat miqyosida qurilish obyektlari ustidan shaffof nazorat.", "Прозрачный контроль строительных объектов в масштабе области.", "Transparent oversight of construction sites across a region."),
    problem: P("Obyektlar holati, murojaatlar va tekshiruvlar haqida ma'lumot markazlashmagan edi.", "Информация о состоянии объектов, обращениях и проверках не была централизована.", "Data on site status, complaints and inspections was not centralized."),
    solution: P("Xarita asosidagi platforma: obyektlar reyestri, foto-hisobotlar, murojaatlar va nazorat topshiriqlari.", "Картографическая платформа: реестр объектов, фотоотчёты, обращения и контрольные поручения.", "A map-based platform: site registry, photo reports, complaints and control tasks."),
    features: [P("Obyektlar reyestri xaritada", "Реестр объектов на карте", "Site registry on a map"), P("Foto va geolokatsiyali hisobotlar", "Фотоотчёты с геолокацией", "Geotagged photo reports"), P("Murojaatlarni kuzatish", "Отслеживание обращений", "Complaint tracking")],
    results: [P("Barcha obyektlar yagona reyestrda", "Все объекты в едином реестре", "All sites in a single registry")],
    tech: ["Python", "React", "PostGIS", "Leaflet", "Docker"],
  },
  {
    id: "ai-office", order: 7, clientHidden: true, client: GOV, industry: "gov", services: ["ai", "gov"], year: 2025, hue: 160, device: "laptop",
    title: P("AI OFIS — AI asosidagi boshqaruv", "AI OFIS — управление на базе AI", "AI OFIS — AI-assisted management"),
    duration: P("4 oy", "4 месяца", "4 months"), team: P("5 kishi", "5 человек", "5 people"),
    summary: P("Hujjatlar nazorati, ichki chat va topshiriqlar — AI yordamchi bilan.", "Контроль документов, внутренний чат и поручения — с AI-помощником.", "Document control, internal chat and tasks — with an AI assistant."),
    problem: P("Kiruvchi hujjatlar ko'p, ularni tahlil qilish va ijrochiga yo'naltirish ko'p vaqt olgan.", "Входящих документов много, их анализ и распределение занимали много времени.", "High volumes of incoming documents took too long to analyse and route."),
    solution: P("AI hujjat mazmunini qisqartiradi, ijrochi va muddatni taklif qiladi; xodimlar chat va topshiriqlarda ishlaydi.", "AI кратко пересказывает документ, предлагает исполнителя и срок; сотрудники работают в чате и задачах.", "AI summarizes documents and suggests an assignee and deadline; staff work in chat and tasks."),
    features: [P("Hujjatlarni AI bilan qisqartirish", "AI-резюме документов", "AI document summaries"), P("Topshiriqlar va muddatlar", "Поручения и сроки", "Tasks and deadlines"), P("Xavfsiz ichki chat", "Защищённый внутренний чат", "Secure internal chat")],
    results: [P("Hujjatni ko'rib chiqish tezlashdi", "Рассмотрение документов ускорилось", "Faster document review")],
    tech: ["Python", "LLM", "RAG", "React", "PostgreSQL"],
  },
  {
    id: "ai-call-center", order: 8, clientHidden: true, client: P("Suv yetkazib berish kompaniyasi", "Компания по доставке воды", "Water delivery company"), industry: "services", services: ["ai"], year: 2025, hue: 172, device: "phone",
    title: P("AI call center", "AI колл-центр", "AI call center"),
    duration: P("3 oy", "3 месяца", "3 months"), team: P("4 kishi", "4 человека", "4 people"),
    summary: P("Buyurtmalarni qabul qiladigan ovozli AI operator va analitika.", "Голосовой AI-оператор, принимающий заказы, и аналитика.", "A voice AI operator that takes orders, plus analytics."),
    problem: P("Tig'iz soatlarda qo'ng'iroqlar javobsiz qolib, buyurtmalar yo'qolgan.", "В часы пик звонки оставались без ответа, заказы терялись.", "Calls went unanswered at peak hours and orders were lost."),
    solution: P("O'zbek va rus tilida gaplashadigan AI operator buyurtmani qabul qiladi, CRM'ga yozadi va kuryerga yuboradi.", "AI-оператор на узбекском и русском принимает заказ, записывает в CRM и передаёт курьеру.", "An AI operator speaking Uzbek and Russian takes the order, logs it in the CRM and dispatches a courier."),
    features: [P("Ovozli muloqot (STT/TTS)", "Голосовой диалог (STT/TTS)", "Voice dialogue (STT/TTS)"), P("CRM integratsiyasi", "Интеграция с CRM", "CRM integration"), P("Qo'ng'iroqlar analitikasi", "Аналитика звонков", "Call analytics")],
    results: [P("Tig'iz soatlarda ham har bir qo'ng'iroqqa javob", "Ответ на каждый звонок даже в часы пик", "Every call answered, even at peak")],
    tech: ["Python", "Whisper", "TTS", "LLM", "Asterisk"],
  },
  {
    id: "kadrvision", order: 9, clientHidden: false, client: P("Ichki mahsulot", "Собственный продукт", "In-house product"), industry: "hr", services: ["automation", "web"], year: 2025, hue: 250, device: "laptop",
    title: P("KadrVision — HR va davomat", "KadrVision — HR и учёт посещаемости", "KadrVision — HR and attendance"),
    duration: P("Davom etmoqda", "В развитии", "Ongoing"), team: P("5 kishi", "5 человек", "5 people"),
    summary: P("Turniket va kameralarga ulanadigan HR va davomat platformasi.", "HR-платформа и учёт посещаемости с подключением к турникетам и камерам.", "An HR and attendance platform connected to turnstiles and cameras."),
    problem: P("Korxonalarda davomat qo'lda yoki tarqoq qurilmalarda hisoblanadi.", "На предприятиях посещаемость считают вручную или на разрозненных устройствах.", "Companies track attendance by hand or across disconnected devices."),
    solution: P("Qurilmalardan ma'lumot yig'ib, ish vaqti, kechikishlar va hisobotlarni avtomatik hisoblaydi.", "Собирает данные с устройств и автоматически считает рабочее время, опоздания и отчёты.", "Collects device data and automatically computes hours, lateness and reports."),
    features: [P("Qurilmalar integratsiyasi", "Интеграция устройств", "Device integration"), P("Smenalar va jadval", "Смены и графики", "Shifts and schedules"), P("Telegram bildirishnomalar", "Уведомления в Telegram", "Telegram notifications")],
    results: [P("Davomat hisobi to'liq avtomatlashtirilgan", "Учёт посещаемости полностью автоматизирован", "Fully automated attendance tracking")],
    tech: ["Go", "React", "PostgreSQL", "ONVIF", "Telegram Bot API"],
  },
  {
    id: "legal-ai", order: 10, clientHidden: true, client: P("Yuridik firma", "Юридическая фирма", "Law firm"), industry: "legal", services: ["ai"], year: 2025, hue: 190, device: "laptop",
    title: P("Huquqshunos AI agent", "Юридический AI-агент", "Legal AI agent"),
    duration: P("2 oy", "2 месяца", "2 months"), team: P("3 kishi", "3 человека", "3 people"),
    summary: P("Lex.uz asosida javob beradigan va manbaga havola qiladigan AI yordamchi.", "AI-помощник, отвечающий на основе Lex.uz со ссылками на источники.", "An AI assistant that answers from Lex.uz and cites its sources."),
    problem: P("Huquqshunoslar me'yoriy hujjatlarni qidirishga ko'p vaqt sarflagan.", "Юристы тратили много времени на поиск нормативных актов.", "Lawyers spent too much time searching legislation."),
    solution: P("RAG asosidagi agent tegishli moddalarni topadi, qisqa javob beradi va manbani ko'rsatadi.", "Агент на RAG находит нужные статьи, кратко отвечает и указывает источник.", "A RAG agent finds relevant articles, answers concisely and cites the source."),
    features: [P("Manbaga havola bilan javob", "Ответ со ссылкой на источник", "Answers with citations"), P("Uch tilda so'rov", "Запросы на трёх языках", "Queries in three languages")],
    results: [P("Huquqiy ma'lumot qidirish tezlashdi", "Поиск правовой информации ускорился", "Faster legal research")],
    tech: ["Python", "LLM", "RAG", "Vector DB", "FastAPI"],
  },
  {
    id: "greenhouse", order: 11, clientHidden: true, client: P("Agro kompaniya", "Агрокомпания", "Agri company"), industry: "agro", services: ["automation", "mobile"], year: 2024, hue: 150, device: "phone",
    title: P("Issiqxona boshqaruv platformasi", "Платформа управления теплицей", "Greenhouse management platform"),
    duration: P("3 oy", "3 месяца", "3 months"), team: P("4 kishi", "4 человека", "4 people"),
    summary: P("Harorat, namlik va sug'orishni masofadan kuzatish va boshqarish.", "Удалённый мониторинг и управление температурой, влажностью и поливом.", "Remote monitoring and control of temperature, humidity and irrigation."),
    problem: P("Issiqxona sharoitlari qo'lda tekshirilgan, kechikish hosilga zarar bergan.", "Условия в теплице проверяли вручную, задержки вредили урожаю.", "Conditions were checked by hand and delays hurt yields."),
    solution: P("Datchiklardan real vaqt ma'lumoti, ogohlantirishlar va mobil ilovadan boshqaruv.", "Данные с датчиков в реальном времени, оповещения и управление из мобильного приложения.", "Real-time sensor data, alerts and control from a mobile app."),
    features: [P("Datchiklar monitoringi", "Мониторинг датчиков", "Sensor monitoring"), P("Avtomatik sug'orish qoidalari", "Правила автоматического полива", "Automatic irrigation rules"), P("Ogohlantirishlar", "Оповещения", "Alerts")],
    results: [P("Sharoitlar 24/7 nazorat ostida", "Условия под контролем 24/7", "Conditions monitored 24/7")],
    tech: ["Flutter", "Python", "MQTT", "TimescaleDB"],
  },
];

export const caseById = (id: string) => CASES.find((c) => c.id === id);
export const sortedCases = () => [...CASES].sort((a, b) => a.order - b.order);
