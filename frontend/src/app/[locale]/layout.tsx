import "../globals.css";
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { JetBrains_Mono, Manrope } from "next/font/google";
import { HTML_LANG, isLocale } from "@/lib/i18n";
import { MOTION_BOOTSTRAP } from "@/lib/scene-store";
import { THEME_BOOTSTRAP } from "@/lib/theme";
import { UI } from "@/content/ui";
import { SITE } from "@/content/site";
import { POST_SLUGS } from "@/content/slugs";
import Header from "@/components/layout/Header";
import Footer, { MobileContactBar } from "@/components/layout/Footer";
import Consent from "@/components/layout/Consent";
import SceneLoader from "@/components/three/SceneLoader";
import SceneDirector from "@/components/three/SceneDirector";
import { Cursor, FirstVisitLoader, RevealObserver } from "@/components/ui/interactive";
import { JsonLd } from "@/components/ui/basics";

// Shriftlar build vaqtida yuklab olinib, o'z serverimizdan beriladi (Google'ga so'rov ketmaydi, TZ 9.5).
// Tezlik: variable shriftlar — har bir alifbo uchun bitta fayl (5 ta vazn o'rniga)
const sans = Manrope({ subsets: ["latin", "latin-ext", "cyrillic"], variable: "--font-manrope", display: "swap", adjustFontFallback: true });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", preload: false });

/** Search Console / Yandex Webmaster tasdiqlash kodlari .env orqali (TZ 8.7). */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return {
    metadataBase: new URL(SITE.url),
    applicationName: "SIFATDEV",
    authors: [{ name: "SIFATDEV", url: SITE.url }],
    creator: "SIFATDEV",
    publisher: "SIFATDEV",
    category: "technology",
    formatDetection: { telephone: true, email: true },
    verification: {
      google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
      yandex: process.env.YANDEX_VERIFICATION || undefined,
    },
    other: { "geo.region": "UZ-TK", "geo.placename": isLocale(locale) ? SITE.address[locale] : "Tashkent" },
  };
}

export const viewport: Viewport = { themeColor: "#050506", colorScheme: "dark", width: "device-width", initialScale: 1 };

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  // Nonce har so'rovda yangi (proxy.ts) — sahifa dinamik render qilinadi.
  const nonce = (await headers()).get("x-nonce") ?? undefined;
  const showBlog = Object.keys(POST_SLUGS).length > 0;

  return (
    <html lang={HTML_LANG[locale]} data-motion="full" data-theme="dark" suppressHydrationWarning className={`${sans.variable} ${mono.variable}`}>
      <head>
        <script nonce={nonce} dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP + MOTION_BOOTSTRAP }} />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": ["Organization", "ProfessionalService"],
                "@id": `${SITE.url}/#org`,
                name: "SIFATDEV",
                alternateName: ["SIFAT", "Sifat Dev"],
                url: SITE.url,
                logo: `${SITE.url}/brand/sifat-logo-black.png`,
                image: `${SITE.url}/brand/sifat-logo-black.png`,
                description: UI[locale].home.lead,
                email: SITE.email,
                telephone: SITE.phoneHref,
                address: { "@type": "PostalAddress", addressLocality: "Tashkent", addressCountry: "UZ" },
                geo: { "@type": "GeoCoordinates", latitude: SITE.geo.lat, longitude: SITE.geo.lng },
                areaServed: [{ "@type": "Country", name: "Uzbekistan" }, "Worldwide"],
                knowsLanguage: ["uz", "ru", "en"],
                contactPoint: [{ "@type": "ContactPoint", telephone: SITE.phoneHref, contactType: "sales", availableLanguage: ["Uzbek", "Russian", "English"], areaServed: "UZ" }],
                sameAs: SITE.social.map((s) => s.href),
              },
              { "@type": "WebSite", "@id": `${SITE.url}/#website`, url: SITE.url, name: "SIFATDEV", inLanguage: HTML_LANG[locale], publisher: { "@id": `${SITE.url}/#org` } },
            ],
          }}
        />
      </head>
      <body>
        <a href="#main" className="skip">{UI[locale].skip}</a>
        <SceneLoader />
        <SceneDirector />
        <RevealObserver />
        <Header locale={locale} showBlog={showBlog} />
        <main id="main" className="relative z-10">{children}</main>
        <Footer locale={locale} showBlog={showBlog} />
        <MobileContactBar locale={locale} />
        <Consent locale={locale} />
        <Cursor />
        <FirstVisitLoader />
      </body>
    </html>
  );
}
