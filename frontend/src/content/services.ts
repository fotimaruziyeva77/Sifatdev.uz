import type { L } from "@/lib/i18n";
import type { ServiceId } from "./slugs";
import type { ShapeName } from "@/lib/scene-store";

export type Service = {
  id: ServiceId;
  shape: ShapeName;
  title: L;
  short: L;
  promise: L;
  problems: L[];
  includes: L[];
  process: { name: L; duration: L }[];
  tech: string[];
  faq: { q: L; a: L }[];
};

const P = (uz: string, ru: string, en: string): L => ({ uz, ru, en });

const commonProcess = (a: string, b: string, c: string, d: string) => [
  { name: P("Tahlil va prototip", "Анализ и прототип", "Discovery and prototype"), duration: P(a, a.replace("hafta", "нед."), a.replace("hafta", "weeks")) },
  { name: P("Dizayn", "Дизайн", "Design"), duration: P(b, b.replace("hafta", "нед."), b.replace("hafta", "weeks")) },
  { name: P("Dasturlash va test", "Разработка и тестирование", "Engineering and QA"), duration: P(c, c.replace("hafta", "нед."), c.replace("hafta", "weeks")) },
  { name: P("Ishga tushirish va qo'llab-quvvatlash", "Запуск и поддержка", "Launch and support"), duration: P(d, d === "doimiy" ? "постоянно" : d, d === "doimiy" ? "ongoing" : d) },
];

export const SERVICES: Service[] = [
  {
    id: "web",
    shape: "code",
    title: P("Veb-platformalar va portallar", "Веб-платформы и порталы", "Web platforms and portals"),
    short: P("Yuqori yuklamaga chidamli portallar, kabinetlar va ichki tizimlar.", "Порталы, кабинеты и внутренние системы под высокой нагрузкой.", "Portals, dashboards and internal systems built for real load."),
    promise: P("Minglab foydalanuvchiga xizmat qiladigan, tez va xavfsiz veb-tizim.", "Быстрая и безопасная веб-система для тысяч пользователей.", "A fast, secure web system that serves thousands of users."),
    problems: [
      P("Jarayonlar Excel va qog'ozda — nazorat va hisobot qiyin", "Процессы в Excel и на бумаге — сложно контролировать и отчитываться", "Processes live in spreadsheets and paper — hard to control and report"),
      P("Eski tizim sekin, yangilab bo'lmaydi", "Старая система медленная и не развивается", "The legacy system is slow and can't evolve"),
      P("Mijozlar uchun qulay onlayn kabinet yo'q", "Нет удобного онлайн-кабинета для клиентов", "No convenient self-service portal for customers"),
    ],
    includes: [
      P("Biznes-tahlil va texnik topshiriq", "Бизнес-анализ и ТЗ", "Business analysis and specification"),
      P("UX/UI dizayn va dizayn-tizim", "UX/UI дизайн и дизайн-система", "UX/UI design and design system"),
      P("Frontend va backend, API", "Frontend, backend и API", "Frontend, backend and APIs"),
      P("Integratsiyalar: ERP, to'lov, davlat xizmatlari", "Интеграции: ERP, платежи, госсервисы", "Integrations: ERP, payments, public services"),
      P("Yuklama testi va xavfsizlik auditi", "Нагрузочное тестирование и аудит безопасности", "Load testing and security review"),
    ],
    process: commonProcess("2–3 hafta", "2–4 hafta", "8–16 hafta", "doimiy"),
    tech: ["TypeScript", "React", "Next.js", "Node.js", "Python", "PostgreSQL", "Redis", "Docker"],
    faq: [
      { q: P("Taxminiy narx qancha?", "Сколько это стоит?", "How much does it cost?"), a: P("Narx funksiyalar hajmiga bog'liq. Brifdan so'ng 2–3 kunda baholash va reja beramiz.", "Стоимость зависит от объёма. После брифа даём оценку и план за 2–3 дня.", "It depends on scope. After the brief we send an estimate and plan within 2–3 days.") },
      { q: P("Manba kodi kimga tegishli?", "Кому принадлежит исходный код?", "Who owns the source code?"), a: P("Shartnoma bo'yicha manba kodi va hujjatlar to'liq mijozga topshiriladi.", "По договору исходный код и документация полностью передаются заказчику.", "Under contract, source code and documentation are fully handed over to you.") },
    ],
  },
  {
    id: "mobile",
    shape: "phone",
    title: P("Mobil ilovalar (iOS, Android)", "Мобильные приложения (iOS, Android)", "Mobile apps (iOS, Android)"),
    short: P("Do'kon va korporativ ilovalar — bitta kod bazasida yoki native.", "Приложения для магазинов и корпораций — кроссплатформенно или нативно.", "Consumer and enterprise apps — cross-platform or native."),
    promise: P("App Store va Google Play'ga chiqadigan barqaror ilova.", "Стабильное приложение в App Store и Google Play.", "A stable app shipped to the App Store and Google Play."),
    problems: [
      P("Mijozlar bilan doimiy aloqa kanali yo'q", "Нет постоянного канала связи с клиентами", "No always-on channel to your customers"),
      P("Xodimlar dalada qog'oz bilan ishlaydi", "Сотрудники в полях работают на бумаге", "Field staff still work on paper"),
      P("Veb-versiya mobilda noqulay", "Веб-версия неудобна на телефоне", "The web version is clumsy on phones"),
    ],
    includes: [
      P("Prototip va foydalanuvchi testlari", "Прототип и пользовательские тесты", "Prototype and user testing"),
      P("Flutter yoki native (Swift, Kotlin)", "Flutter или нативно (Swift, Kotlin)", "Flutter or native (Swift, Kotlin)"),
      P("Push-bildirishnomalar, oflayn rejim", "Push-уведомления, офлайн-режим", "Push notifications, offline mode"),
      P("Do'konlarga joylash va yangilash", "Публикация и обновления в сторах", "Store publishing and updates"),
    ],
    process: commonProcess("2 hafta", "2–3 hafta", "8–14 hafta", "doimiy"),
    tech: ["Flutter", "Dart", "Swift", "Kotlin", "Firebase", "REST/GraphQL"],
    faq: [
      { q: P("Ikkala platforma uchun alohida qilasizmi?", "Делаете отдельно под каждую платформу?", "Do you build separately for each platform?"), a: P("Ko'p hollarda Flutter bilan bitta kod bazasi — tezroq va arzonroq. Kerak bo'lsa native.", "Чаще одна кодовая база на Flutter — быстрее и дешевле. При необходимости — нативно.", "Usually one Flutter codebase — faster and cheaper. Native when it's justified.") },
    ],
  },
  {
    id: "ai",
    shape: "neural",
    title: P("Sun'iy intellekt va AI agentlar", "Искусственный интеллект и AI-агенты", "AI and AI agents"),
    short: P("Chatbotlar, ovozli operatorlar, hujjat tahlili — o'zbek, rus va ingliz tillarida.", "Чат-боты, голосовые операторы, анализ документов — на узбекском, русском и английском.", "Chatbots, voice operators and document analysis — in Uzbek, Russian and English."),
    promise: P("Rutinani AI agentga topshiring — jamoa muhim ishga e'tibor beradi.", "Передайте рутину AI-агенту — команда займётся важным.", "Hand routine work to an AI agent so your team can focus on what matters."),
    problems: [
      P("Call-markaz qo'ng'iroqlarga ulgurmaydi", "Колл-центр не успевает обрабатывать звонки", "The call center can't keep up with calls"),
      P("Hujjatlarni qo'lda tekshirish ko'p vaqt oladi", "Ручная проверка документов отнимает много времени", "Manual document review takes too long"),
      P("Bilimlar bazasidan tez javob topib bo'lmaydi", "Сложно быстро найти ответ в базе знаний", "Answers are buried in the knowledge base"),
    ],
    includes: [
      P("Vazifa va ma'lumotlar tahlili", "Анализ задачи и данных", "Use-case and data assessment"),
      P("LLM asosidagi agentlar va RAG", "Агенты на LLM и RAG", "LLM-based agents and RAG"),
      P("Ovozli AI operator (STT/TTS)", "Голосовой AI-оператор (STT/TTS)", "Voice AI operator (STT/TTS)"),
      P("Telegram, sayt va CRM integratsiyasi", "Интеграция с Telegram, сайтом и CRM", "Telegram, website and CRM integration"),
      P("Sifat monitoringi va xavfsizlik cheklovlari", "Мониторинг качества и ограничения безопасности", "Quality monitoring and safety guardrails"),
    ],
    process: commonProcess("1–2 hafta", "1 hafta", "4–10 hafta", "doimiy"),
    tech: ["Python", "LLM API", "RAG", "Vector DB", "Whisper", "FastAPI", "Telegram Bot API"],
    faq: [
      { q: P("Ma'lumotlarimiz xavfsizmi?", "Наши данные в безопасности?", "Is our data safe?"), a: P("Maxfiy ma'lumotlar uchun lokal modellar yoki O'zbekistondagi serverlarda ishlash variantini taklif qilamiz.", "Для чувствительных данных предлагаем локальные модели или размещение на серверах в Узбекистане.", "For sensitive data we offer local models or hosting on servers in Uzbekistan.") },
      { q: P("O'zbek tilini tushunadimi?", "Понимает ли узбекский язык?", "Does it understand Uzbek?"), a: P("Ha — lotin va kirill yozuvida, shuningdek og'zaki nutqda.", "Да — латиница и кириллица, а также устная речь.", "Yes — Latin and Cyrillic script, as well as speech.") },
    ],
  },
  {
    id: "gov",
    shape: "shield",
    title: P("Davlat tashkilotlari uchun elektron tizimlar", "Электронные системы для госорганов", "Government e-systems"),
    short: P("Nazorat, ijro va monitoring tizimlari — qonunchilik va axborot xavfsizligi talablari bilan.", "Системы контроля, исполнения и мониторинга с учётом законодательства и ИБ.", "Oversight, execution and monitoring systems built to legal and security requirements."),
    promise: P("Shaffof nazorat va hisobot — qog'ozsiz va o'z vaqtida.", "Прозрачный контроль и отчётность — без бумаги и вовремя.", "Transparent oversight and reporting — paperless and on time."),
    problems: [
      P("Topshiriqlar ijrosini kuzatish qiyin", "Сложно отслеживать исполнение поручений", "Hard to track execution of assignments"),
      P("Hududlardan ma'lumot kech va turli formatda keladi", "Данные из регионов приходят поздно и в разных форматах", "Regional data arrives late and in mixed formats"),
      P("Axborot xavfsizligi talablari yuqori", "Высокие требования к информационной безопасности", "Strict information security requirements"),
    ],
    includes: [
      P("Normativ talablar tahlili", "Анализ нормативных требований", "Regulatory requirements analysis"),
      P("Rollar va kirish huquqlari modeli", "Модель ролей и прав доступа", "Role and access model"),
      P("Ijro nazorati, monitoring, dashboardlar", "Контроль исполнения, мониторинг, дашборды", "Execution control, monitoring, dashboards"),
      P("Idoralararo integratsiya", "Межведомственная интеграция", "Inter-agency integration"),
      P("Ma'lumotlarni O'zbekistonda saqlash", "Хранение данных в Узбекистане", "Data hosted in Uzbekistan"),
    ],
    process: commonProcess("3–4 hafta", "3 hafta", "10–20 hafta", "doimiy"),
    tech: ["Python", "Django", "React", "PostgreSQL", "Keycloak", "Docker", "Nginx"],
    faq: [
      { q: P("Dasturiy mahsulot guvohnomasi bormi?", "Есть ли свидетельства на ПО?", "Do you have software registrations?"), a: P("Guvohnomalar ro'yxati \"Kompaniya\" sahifasida e'lon qilinadi.", "Список свидетельств публикуется на странице «О компании».", "The list is published on the About page.") },
    ],
  },
  {
    id: "automation",
    shape: "gears",
    title: P("Korporativ avtomatlashtirish", "Корпоративная автоматизация", "Business automation"),
    short: P("HR va davomat, kamera va qurilmalar integratsiyasi, Telegram botlar.", "HR и учёт посещаемости, интеграция камер и устройств, Telegram-боты.", "HR and attendance, camera and device integration, Telegram bots."),
    promise: P("Qo'l mehnatini kamaytiring, ma'lumotni real vaqtda ko'ring.", "Меньше ручного труда, данные — в реальном времени.", "Less manual work, real-time visibility."),
    problems: [
      P("Davomat va ish vaqti qo'lda hisoblanadi", "Учёт посещаемости и рабочего времени вручную", "Attendance and hours are tracked by hand"),
      P("Kamera, shlagbaum, terminallar alohida ishlaydi", "Камеры, шлагбаумы, терминалы работают разрозненно", "Cameras, barriers and terminals don't talk to each other"),
      P("Ichki so'rovlar chatlarda yo'qoladi", "Внутренние заявки теряются в чатах", "Internal requests get lost in chats"),
    ],
    includes: [
      P("Qurilmalar bilan integratsiya (Hikvision, ZKTeco va boshq.)", "Интеграция с устройствами (Hikvision, ZKTeco и др.)", "Device integration (Hikvision, ZKTeco, etc.)"),
      P("HR, davomat va ish haqi hisob-kitobi", "HR, учёт посещаемости и расчёт зарплаты", "HR, attendance and payroll"),
      P("Telegram botlar va bildirishnomalar", "Telegram-боты и уведомления", "Telegram bots and notifications"),
      P("Hisobotlar va dashboardlar", "Отчёты и дашборды", "Reports and dashboards"),
    ],
    process: commonProcess("1–2 hafta", "1–2 hafta", "4–10 hafta", "doimiy"),
    tech: ["Python", "Go", "React", "PostgreSQL", "MQTT", "RTSP/ONVIF", "Telegram Bot API"],
    faq: [
      { q: P("Mavjud qurilmalarimiz bilan ishlaydimi?", "Работает ли с нашим оборудованием?", "Will it work with our existing hardware?"), a: P("Ko'pchilik mashhur brendlar bilan ishlaymiz; tahlil bosqichida moslik tekshiriladi.", "Работаем с большинством популярных брендов; совместимость проверяем на этапе анализа.", "We support most popular brands and verify compatibility during discovery.") },
    ],
  },
  {
    id: "outsourcing",
    shape: "globe",
    title: P("Autsors va ajratilgan jamoa", "Аутсорсинг и выделенная команда", "Outsourcing and dedicated teams"),
    short: P("Xorijiy mijozlar uchun to'liq jamoa yoki kuchaytirish: UTC+5, ingliz tilida aloqa.", "Полная команда или усиление для зарубежных клиентов: UTC+5, общение на английском.", "A full team or staff augmentation for international clients: UTC+5, fluent English."),
    promise: P("Kuchli muhandislar — oqilona narxda va shaffof jarayon bilan.", "Сильные инженеры по разумной цене и с прозрачным процессом.", "Strong engineers at a fair price, with a transparent process."),
    problems: [
      P("Mahalliy bozorda muhandis yollash qimmat va uzoq", "Найм инженеров на локальном рынке дорог и долог", "Hiring engineers locally is slow and expensive"),
      P("Ichki jamoa yangi loyihaga ulgurmaydi", "Внутренняя команда не успевает на новый проект", "Your in-house team can't take on another project"),
      P("Oldingi autsorsda sifat va aloqa past bo'lgan", "У прошлого подрядчика страдали качество и коммуникация", "A previous vendor fell short on quality and communication"),
    ],
    includes: [
      P("Dedicated team yoki staff augmentation", "Dedicated team или staff augmentation", "Dedicated team or staff augmentation"),
      P("Fixed price yoki Time & Materials", "Fixed price или Time & Materials", "Fixed price or Time & Materials"),
      P("NDA, IP huquqlarini to'liq topshirish", "NDA и полная передача прав на IP", "NDA and full IP transfer"),
      P("Haftalik demo, Jira/Linear, kunlik aloqa", "Еженедельные демо, Jira/Linear, ежедневная связь", "Weekly demos, Jira/Linear, daily communication"),
    ],
    process: [
      { name: P("Tanishuv qo'ng'irog'i", "Знакомство", "Intro call"), duration: P("1 kun", "1 день", "1 day") },
      { name: P("Jamoa tanlovi va intervyu", "Подбор команды и интервью", "Team selection and interviews"), duration: P("1–2 hafta", "1–2 нед.", "1–2 weeks") },
      { name: P("Sinov sprinti", "Пробный спринт", "Trial sprint"), duration: P("2 hafta", "2 нед.", "2 weeks") },
      { name: P("Uzoq muddatli hamkorlik", "Долгосрочное сотрудничество", "Long-term engagement"), duration: P("doimiy", "постоянно", "ongoing") },
    ],
    tech: ["TypeScript", "React", "Node.js", "Python", "Go", "Flutter", "AWS", "Kubernetes"],
    faq: [
      { q: P("Ish vaqtimiz mos keladimi?", "Совпадает ли рабочее время?", "Do our working hours overlap?"), a: P("UTC+5: Yevropa bilan 4–6 soat, AQSh Sharqiy sohili bilan ertalabki 2–3 soat umumiy vaqt.", "UTC+5: 4–6 часов пересечения с Европой и 2–3 утренних часа с Восточным побережьем США.", "UTC+5 gives 4–6 overlapping hours with Europe and 2–3 morning hours with the US East Coast.") },
      { q: P("Shartnoma qaysi yurisdiksiyada?", "В какой юрисдикции договор?", "Which jurisdiction is the contract under?"), a: P("O'zbekiston yoki kelishilgan xalqaro yurisdiksiya.", "Узбекистан или согласованная международная юрисдикция.", "Uzbekistan or an agreed international jurisdiction.") },
    ],
  },
];

export const serviceById = (id: string) => SERVICES.find((s) => s.id === id);
