import type { Locale } from "@/lib/i18n";

/** Maxfiylik siyosati (TZ 5.7). ⚠ Yakuniy matnni yurist tasdiqlaydi (TZ 13.2). */
export const PRIVACY: Record<Locale, { updated: string; sections: { h: string; p: string[] }[] }> = {
  uz: {
    updated: "2026-11-05",
    sections: [
      { h: "Qanday ma'lumot yig'iladi", p: ["Formalar orqali siz yuborgan ma'lumotlar: ism, telefon, email, Telegram, kompaniya, loyiha tavsifi va biriktirilgan fayllar.", "Texnik ma'lumotlar: sahifa manzili, til, qurilma turi, UTM teglar. IP manzil xom holda saqlanmaydi — faqat qaytarib bo'lmaydigan xesh ko'rinishida (spamdan himoya uchun)."] },
      { h: "Maqsadi", p: ["So'rovingizga javob berish, tijorat taklifi tayyorlash, vakansiyaga arizani ko'rib chiqish, saytni yaxshilash va spamdan himoya."] },
      { h: "Qayerda va qancha saqlanadi", p: ["Ma'lumotlar O'zbekiston hududidagi serverlarda saqlanadi.", "Yopilgan so'rovlar 24 oydan so'ng avtomatik o'chiriladi. Fayllar ommaviy bo'lmagan xotirada saqlanadi va faqat vakolatli xodimlarga ochiq."] },
      { h: "Uchinchi tomonlar", p: ["So'rov xabari SIFATDEV xodimlarining ichki Telegram guruhiga va korporativ pochtasiga yuboriladi.", "Analitika (Google Analytics, Yandex Metrika) faqat roziligingiz bo'lsa yoki qonunchilik ruxsat bergan hollarda yoqiladi."] },
      { h: "Huquqlaringiz", p: ["Ma'lumotlaringiz bilan tanishish, ularni tuzatish yoki o'chirishni talab qilish, roziligingizni qaytarib olish huquqiga egasiz. So'rovni info@sifatdev.uz manziliga yuboring — 30 kun ichida bajariladi."] },
      { h: "Cookie'lar", p: ["Zarur cookie'lar: til tanlovi, cookie roziligi, animatsiya sozlamasi.", "Analitik cookie'lar: faqat rozilikdan keyin (Yevropa Ittifoqi foydalanuvchilari uchun majburiy)."] },
      { h: "Aloqa", p: ["SIFATDEV, Toshkent sh. Email: info@sifatdev.uz"] },
    ],
  },
  ru: {
    updated: "2026-11-05",
    sections: [
      { h: "Какие данные собираются", p: ["Данные, которые вы отправляете через формы: имя, телефон, email, Telegram, компания, описание проекта и прикреплённые файлы.", "Технические данные: адрес страницы, язык, тип устройства, UTM-метки. IP-адрес не хранится в открытом виде — только как необратимый хеш (для защиты от спама)."] },
      { h: "Цели", p: ["Ответ на ваш запрос, подготовка коммерческого предложения, рассмотрение отклика на вакансию, улучшение сайта и защита от спама."] },
      { h: "Где и сколько хранятся", p: ["Данные хранятся на серверах на территории Узбекистана.", "Закрытые заявки автоматически удаляются через 24 месяца. Файлы хранятся в непубличном хранилище и доступны только уполномоченным сотрудникам."] },
      { h: "Третьи лица", p: ["Уведомление о заявке отправляется во внутреннюю Telegram-группу и корпоративную почту сотрудников SIFATDEV.", "Аналитика (Google Analytics, Яндекс Метрика) включается только с вашего согласия или когда это допускает законодательство."] },
      { h: "Ваши права", p: ["Вы вправе запросить доступ к данным, их исправление или удаление, а также отозвать согласие. Напишите на info@sifatdev.uz — запрос будет исполнен в течение 30 дней."] },
      { h: "Cookie", p: ["Необходимые cookie: выбор языка, согласие на cookie, настройка анимаций.", "Аналитические cookie — только после согласия (обязательно для пользователей из ЕС)."] },
      { h: "Контакты", p: ["SIFATDEV, г. Ташкент. Email: info@sifatdev.uz"] },
    ],
  },
  en: {
    updated: "2026-11-05",
    sections: [
      { h: "What we collect", p: ["Information you submit through forms: name, phone, email, Telegram, company, project description and attached files.", "Technical data: page URL, language, device type and UTM tags. Your IP address is never stored in plain form — only as an irreversible hash used for spam protection."] },
      { h: "Why we collect it", p: ["To respond to your request, prepare a proposal, review job applications, improve the site and prevent spam."] },
      { h: "Where and how long it is stored", p: ["Data is stored on servers located in Uzbekistan.", "Closed requests are deleted automatically after 24 months. Files are kept in non-public storage, accessible only to authorized staff."] },
      { h: "Third parties", p: ["Request notifications are sent to SIFATDEV's internal Telegram group and corporate email.", "Analytics (Google Analytics, Yandex Metrica) is enabled only with your consent or where the law permits."] },
      { h: "Your rights (including GDPR)", p: ["You may request access to, correction or deletion of your data, and withdraw consent at any time. Email info@sifatdev.uz — we respond within 30 days."] },
      { h: "Cookies", p: ["Essential cookies: language preference, cookie consent and animation setting.", "Analytics cookies: only after consent (required for visitors from the EU)."] },
      { h: "Contact", p: ["SIFATDEV, Tashkent, Uzbekistan. Email: info@sifatdev.uz"] },
    ],
  },
};
