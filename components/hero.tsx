import Image from "next/image";
import type { CSSProperties } from "react";
import { WindowScene } from "@/components/window-scene";
import { AppleIcon, DownloadIcon, GitHubIcon, LinuxIcon, RustIcon, WindowsIcon } from "@/components/icons";
import { getLauncherDownloads, getLauncherRelease, launcherBuild } from "@/components/github-releases";
import { format, getMessages, NUMBER_LOCALE, rich, type Locale } from "@/components/i18n";
import { LauncherLink, LauncherMeta } from "@/components/launcher-download";
import { GITHUB_URL, RUST_WIKI_URL } from "@/components/links";

const delay = (ms: number) => ({ "--delay": `${ms}ms` }) as CSSProperties;

function Dot({ className = "mx-2" }: { className?: string }) {
  return (
    <span aria-hidden className={`text-muted ${className}`}>
      ·
    </span>
  );
}

export async function Hero({ locale }: { locale: Locale }) {
  const { home } = getMessages(locale);
  const t = home.hero;
  const [release, downloads] = await Promise.all([getLauncherRelease(), getLauncherDownloads()]);
  const launcher = launcherBuild(release);
  return (
    <section className="relative isolate flex min-h-[max(100svh,40rem)] flex-col max-lg:min-h-[max(100svh,66rem)]">
      <WindowScene className="absolute inset-0 -z-10 h-full w-full lg:[mask-image:linear-gradient(#000_85%,transparent)]" />
      <div aria-hidden className="h-18 shrink-0" />

      <div className="mx-auto w-full max-w-7xl flex-1 px-6 pt-14 pb-20 sm:pt-24 lg:px-12">
        <div className="@container max-w-[28rem]">
          <p className="rise inline-flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-full border border-line bg-surface/70 py-1 pr-3.5 pl-2 text-[13px] text-muted" style={delay(0)}>
            <span className="inline-flex items-center gap-2">
              <Image src="/minecraft.webp" alt="" width={64} height={71} className="h-[18px] w-auto" />
              Minecraft: Java Edition 26.3
            </span>
            <Dot className="hidden sm:inline" />
            <span className="inline-flex items-center gap-2">
              <RustIcon className="size-4" />
              <span>
                {rich(t.writtenIn, {
                  rust: (chunks) => (
                    <a
                      href={RUST_WIKI_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted underline decoration-accent/40 underline-offset-4 transition-colors hover:text-foreground hover:decoration-accent/40"
                    >
                      {chunks}
                    </a>
                  ),
                })}
              </span>
            </span>
          </p>

          <h1
            aria-label={`Sunrise: ${t.title} ${t.titleAccent}`}
            className="rise mt-6 font-display text-[clamp(2.25rem,9cqi,3.15rem)] leading-[1.03] font-semibold tracking-[-0.035em]"
            style={delay(80)}
          >
            <span className="block">{t.title}</span>
            <span className="text-accent block pb-1">{t.titleAccent}</span>
          </h1>

          <p className="rise mt-6 max-w-xl text-lg leading-relaxed text-muted" style={delay(160)}>
            {t.lead}
          </p>

          <div className="rise mt-9 flex flex-col gap-3 sm:flex-row sm:items-center" style={delay(240)}>
            <LauncherLink
              build={launcher}
              className="sun-button soft-press inline-flex h-11 items-center justify-center gap-2.5 rounded-lg bg-brand px-5 text-[14.5px] font-medium text-background hover:bg-brand-hover"
            >
              <DownloadIcon className="size-[18px]" />
              {t.download}
            </LauncherLink>
            <a
              href={GITHUB_URL}
              className="soft-press inline-flex h-11 items-center justify-center gap-2.5 rounded-lg border border-line bg-surface/80 px-5 text-[14.5px] font-medium text-foreground transition-colors hover:border-muted/40 hover:bg-sky-surface"
            >
              <GitHubIcon className="size-[17px]" />
              {t.github}
            </a>
          </div>

          <div className="rise mt-5 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm text-muted" style={delay(300)}>
            <span className="flex items-center gap-4">
              <LauncherLink build={launcher} os="windows" className="inline-flex items-center gap-2 text-muted transition-colors hover:text-foreground">
                <WindowsIcon className="size-3.5" />
                Windows
              </LauncherLink>
              <LauncherLink build={launcher} os="macos" className="inline-flex items-center gap-2 text-muted transition-colors hover:text-foreground">
                <AppleIcon className="size-4" />
                macOS
              </LauncherLink>
              <LauncherLink build={launcher} os="linux" className="inline-flex items-center gap-2 text-muted transition-colors hover:text-foreground">
                <LinuxIcon className="size-4" />
                Linux
              </LauncherLink>
            </span>
            <span className="basis-full whitespace-nowrap sm:basis-auto">
              <Dot className="mr-2 hidden sm:inline" />
              <LauncherMeta build={launcher} label={t.launcher} dot={<Dot />} />
              {downloads !== null && (
                <>
                  {launcher && <Dot />}
                  <span title={t.downloadsTitle}>
                    {rich(format(t.downloads, { n: downloads.toLocaleString(NUMBER_LOCALE[locale]) }), {
                      n: (chunks) => <span className="tabular-nums">{chunks}</span>,
                    })}
                  </span>
                </>
              )}
            </span>
          </div>
          <ul className="rise mt-6 flex flex-wrap gap-x-5 gap-y-1 text-[13px] text-dim" style={delay(360)}>
            {t.facts.map((fact) => (
              <li key={fact}>
                <span className="text-[#4cb782]">✓</span> {fact}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
