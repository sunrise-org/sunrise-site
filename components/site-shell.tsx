import { Inter, JetBrains_Mono, Silkscreen, Space_Grotesk } from "next/font/google";
import { Suspense } from "react";
import type { ReactNode } from "react";
import { getLauncherRelease, getReleases, launcherBuild } from "@/components/github-releases";
import { DawnBackdrop } from "@/components/dawn-backdrop";
import { CursorFx } from "@/components/fx/cursor-fx";
import { getMessages, type Locale } from "@/components/i18n";
import { PointerGlow } from "@/components/pointer-glow";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

// Inter for text, Space Grotesk for headings, Silkscreen for the small labels, JetBrains Mono for code; the Geist variable names stay for the
// CSS that reads them.
const geist = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const display = Space_Grotesk({
  variable: "--font-display-face",
  subsets: ["latin"],
});

const pixel = Silkscreen({
  variable: "--font-pixel-face",
  weight: "400",
  subsets: ["latin"],
});

const geistMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// The page around every page: one per language, since each language has its own root layout (app/(en), app/es) for
// its <html lang>. app/global-not-found.tsx draws it too.
export function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html
      lang={locale}
      className={`${geist.variable} ${geistMono.variable} ${display.variable} ${pixel.variable} h-full antialiased`}
    >
      {/* Browser extensions (e.g. Bitdefender) add attributes to <body> before React loads. */}
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <DawnBackdrop />
        <PointerGlow />
        <CursorFx />
        <Suspense fallback={<SiteHeader locale={locale} t={getMessages(locale).header} />}>
          <SiteNavigation locale={locale} />
        </Suspense>
        {children}
        <SiteFooter locale={locale} />
      </body>
    </html>
  );
}

async function SiteNavigation({ locale }: { locale: Locale }) {
  const [releases, launcher] = await Promise.all([getReleases(), getLauncherRelease()]);
  return <SiteHeader locale={locale} t={getMessages(locale).header} releaseIds={releases?.map((release) => release.id) ?? []} launcher={launcherBuild(launcher)} />;
}
