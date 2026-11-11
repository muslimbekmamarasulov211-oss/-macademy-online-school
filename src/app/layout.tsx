import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter, Noto_Serif_KR } from "next/font/google";

import { SiteFooter, SiteHeader, SkipLink } from "@/components/layout";
import { publicEnv } from "@/config/env";
import { siteConfig } from "@/config/site";

import "./globals.css";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

/** Hangul for the Korean course. Not preloaded: only the glyph ranges used are fetched. */
const notoSerifKr = Noto_Serif_KR({
  weight: ["500", "700"],
  variable: "--font-noto-serif-kr",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: publicEnv.siteUrl,
  title: {
    default: siteConfig.fullName,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.fullName,
  openGraph: {
    type: "website",
    siteName: siteConfig.fullName,
    title: siteConfig.fullName,
    description: siteConfig.description,
    url: "/",
    locale: siteConfig.ogLocale,
  },
};

export const viewport: Viewport = {
  themeColor: "#05080f",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={siteConfig.locale}
      className={`${inter.variable} ${cormorant.variable} ${notoSerifKr.variable}`}
    >
      <body className="flex min-h-dvh flex-col">
        <SkipLink />
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
