import Link from "next/link";
import { Ferris } from "@/components/fx/ferris";
import { getMessages } from "@/components/i18n";

export default function NotFound() {
  const t = getMessages("en").notFound;
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 pt-32 pb-24 sm:pt-40 lg:px-10">
      <p className="eyebrow">404</p>
      <Ferris className="ferris-wave mt-6 h-10 w-auto self-start opacity-80" />
      <h1 className="mt-4 font-display text-[clamp(2.25rem,6vw,4rem)] leading-[1.04] font-semibold tracking-[-0.035em] text-foreground">
        <span className="block">{t.title}</span>
        <span className="text-accent block pb-1">{t.titleAccent}</span>
      </h1>
      <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{t.body}</p>
      <p className="mt-8 flex flex-wrap gap-2">
        <Link href="/" className="inline-flex h-11 items-center rounded-lg bg-sky-surface px-5 text-[15px] font-medium text-foreground transition-colors hover:bg-accent/25">
          {t.home}
        </Link>
        <Link href="/docs" className="inline-flex h-11 items-center rounded-lg bg-lavender px-5 text-[15px] font-medium text-foreground transition-colors hover:bg-sky-surface">
          {t.docs}
        </Link>
        <Link href="/mods" className="inline-flex h-11 items-center rounded-lg bg-lavender px-5 text-[15px] font-medium text-foreground transition-colors hover:bg-sky-surface">
          {t.mods}
        </Link>
      </p>
    </main>
  );
}
