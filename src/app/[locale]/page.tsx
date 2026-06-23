import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenText,
  BrainCircuit,
  Check,
  Database,
  FileText,
  FolderLock,
  Globe2,
  Layers3,
  Menu,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ScrollToTop } from "@/components/ui";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { getDictionary } from "@/dictionaries";
import { PulseLogo, PulseWordmark } from "@/components/shared/pulse-logo";
import { LandingStats } from "@/components/landing/landing-stats";

const clean = (value: string) => value.replace(/[\u2013\u2014]/g, ",");

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return generatePageMetadata({
    title: `${dict.landing.title1} ${dict.landing.title2} - Pulse Knowledge`,
    description: clean(dict.landing.subtitle),
    path: `/${locale}`,
  });
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const isVi = locale === "vi";

  const navLinks = [
    { href: "#features", label: dict.landing.navFeatures },
    { href: "#how-it-works", label: dict.landing.navHowItWorks },
    { href: `/${locale}/pricing`, label: dict.landing.navPricing },
  ];

  const proofStats = [
    { value: 500, suffix: "+", label: dict.landing.trustKBs },
    { value: 12400, suffix: "+", label: dict.landing.trustSources },
    { value: 99, suffix: ".9%", label: dict.landing.trustUptime },
  ];

  const featureBlocks = [
    {
      icon: SearchCheck,
      title: dict.landing.feature2Title,
      description: dict.landing.feature2Desc,
      note: dict.landing.queryMockupCitations,
    },
    {
      icon: FolderLock,
      title: dict.landing.feature1Title,
      description: dict.landing.feature1Desc,
      note: isVi ? "Private role KB" : "Private role KB",
    },
    {
      icon: Database,
      title: dict.landing.feature3Title,
      description: dict.landing.feature3Desc,
      note: isVi ? "Text, URL, file" : "Text, URL, files",
    },
    {
      icon: BookOpenText,
      title: dict.landing.feature4Title,
      description: dict.landing.feature4Desc,
      note: isVi ? "Searchable wiki" : "Searchable wiki",
    },
  ];

  const steps = [
    { number: "01", title: dict.landing.step1, description: dict.landing.step1Desc, icon: Layers3 },
    { number: "02", title: dict.landing.step2, description: dict.landing.step2Desc, icon: FileText },
    { number: "03", title: dict.landing.step3, description: dict.landing.step3Desc, icon: BadgeCheck },
  ];

  const sourceRows = [
    { icon: FileText, source: "api-spec-v3.pdf", state: "compiled" },
    { icon: Globe2, source: "stripe.com/docs", state: "indexed" },
    { icon: ShieldCheck, source: "internal-notes.md", state: "private" },
  ];

  const jsonLd = generateWebPageJsonLd({
    title: `${dict.landing.title1} ${dict.landing.title2} - Pulse Knowledge`,
    description: clean(dict.landing.subtitle),
    path: `/${locale}`,
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="landing-page min-h-screen overflow-x-hidden bg-auth-bg text-auth-text">
        <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-10">
            <div className="mx-auto flex max-w-[1480px] items-center justify-between gap-2">
              <Link
                href={`/${locale}`}
                className="inline-flex h-12 min-w-0 items-center gap-2 rounded-2xl border border-white/[0.08] bg-auth-elevated px-3 text-sm font-bold text-auth-text shadow-[0_10px_24px_rgba(0,0,0,0.28)] sm:px-4"
                aria-label="Pulse Knowledge home"
              >
                <PulseLogo size={28} />
              <PulseWordmark className="truncate whitespace-nowrap max-[430px]:hidden" />
            </Link>

            <div className="flex h-12 shrink-0 items-center gap-1 rounded-2xl border border-white/[0.08] bg-auth-elevated px-2 shadow-[0_10px_24px_rgba(0,0,0,0.28)] sm:gap-3 sm:px-4">
              <details className="group relative md:hidden">
                <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-xl text-auth-text-2 transition-colors hover:bg-white/[0.06] hover:text-auth-text [&::-webkit-details-marker]:hidden">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">{isVi ? "Mở menu" : "Open menu"}</span>
                </summary>
                <div className="absolute right-0 top-12 z-50 w-[min(80vw,280px)] overflow-hidden rounded-2xl border border-white/[0.08] bg-auth-elevated p-2 shadow-[0_16px_32px_rgba(0,0,0,0.34)]">
                  {navLinks.map((link) => (
                    <a
                      key={link.href}
                      href={link.href}
                      className="flex items-center rounded-xl px-3 py-3 text-sm font-semibold text-auth-text-2 transition-colors hover:bg-white/[0.06] hover:text-auth-text"
                    >
                      {link.label}
                    </a>
                  ))}
                  <div className="my-1 h-px bg-white/[0.08]" />
                  <Link
                    href={`/${locale}/login`}
                    className="flex items-center rounded-xl px-3 py-3 text-sm font-semibold text-auth-text-2 transition-colors hover:bg-white/[0.06] hover:text-auth-text"
                  >
                    {dict.auth.login.title}
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    className="btn-landing-cta mt-1 flex items-center justify-center rounded-xl px-3 py-3 text-sm font-bold text-white transition-transform active:scale-[0.98]"
                  >
                    {dict.landing.ctaStart}
                  </Link>
                </div>
              </details>
              <nav className="hidden items-center gap-1 md:flex">
                {navLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    className="rounded-xl px-4 py-2 text-sm font-medium text-auth-text-2 transition-colors hover:bg-white/[0.06] hover:text-auth-text"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              <LocaleSwitcher id="landing" />
              <Link
                href={`/${locale}/login`}
                className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-auth-text-2 transition-colors hover:bg-white/[0.06] hover:text-auth-text sm:inline-flex"
              >
                {dict.auth.login.title}
              </Link>
              <Link
                href={`/${locale}/register`}
                className="btn-landing-cta hidden items-center rounded-xl px-4 py-2 text-sm font-bold text-white transition-transform active:scale-[0.98] sm:inline-flex"
              >
                {dict.landing.ctaStart}
              </Link>
            </div>
          </div>
        </header>

        <main id="main-content">
          <section className="relative min-h-[94dvh] overflow-hidden px-4 pb-12 pt-32 sm:px-6 lg:px-10 lg:pt-36">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.18]"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(180deg, rgba(255,255,255,0.045) 1px, transparent 1px)",
                backgroundSize: "72px 72px",
              }}
              aria-hidden="true"
            />

            <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[0.92fr_1.08fr]">
              <ScrollReveal direction="up" className="max-w-[620px]">
                <Link
                  href={`/${locale}/pricing`}
                  className="mb-7 inline-flex items-center gap-2 rounded-full border border-auth-accent/35 bg-auth-accent-dim px-4 py-2 text-sm font-semibold text-auth-text"
                >
                  <span className="h-2 w-2 rounded-full bg-auth-accent" />
                  {clean(dict.landing.badge)}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>

                <h1 className="max-w-[10ch] text-[clamp(3rem,13vw,6.3rem)] font-black leading-[0.88] tracking-[-0.045em] text-white sm:max-w-[11ch]">
                  Pulse Knowledge
                </h1>

                <h2 className="mt-6 max-w-xl text-wrap text-[clamp(1.28rem,5.7vw,2.45rem)] font-bold leading-[1.1] tracking-[-0.02em] text-auth-text [overflow-wrap:anywhere]">
                  {dict.landing.title1} {dict.landing.title2}
                </h2>

                <p className="mt-6 max-w-xl text-sm leading-7 text-auth-text-2 sm:text-lg sm:leading-8">
                  {clean(dict.landing.subtitle)}
                </p>

                <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/${locale}/register`}
                    className="btn-landing-cta inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-bold text-white transition-transform active:scale-[0.98]"
                  >
                    {dict.landing.ctaStart}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <a
                    href="#features"
                    className="btn-landing-secondary inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-bold text-auth-text transition-transform active:scale-[0.98]"
                  >
                    {dict.landing.ctaHow}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="left" delay={0.12} className="relative min-h-[560px] overflow-hidden lg:min-h-[640px]">
                <div className="absolute right-0 top-0 w-[72%] rounded-2xl border border-white/[0.08] bg-auth-elevated p-4 shadow-[0_18px_34px_rgba(0,0,0,0.26)] transition duration-200 hover:border-white/[0.14] hover:bg-auth-card-hover/80 hover:opacity-95 sm:w-[64%]">
                  <div className="flex items-center gap-2 text-xs font-bold text-auth-text">
                    <PulseLogo size={22} />
                    Evidence preview
                  </div>
                  <div className="mt-5 grid grid-cols-[0.8fr_1fr] gap-3 sm:gap-4">
                    <div>
                      <h3 className="text-2xl font-black leading-[0.95] tracking-[-0.04em] text-white sm:text-3xl">
                        {isVi ? "Nguồn rõ, trả lời chắc" : "Sources stay visible"}
                      </h3>
                      <div className="mt-4 space-y-2 text-[11px] font-bold text-auth-text-2">
                        <div className="flex items-center justify-between rounded-lg bg-white/[0.05] px-2.5 py-2">
                          <span>{isVi ? "Độ tin cậy" : "Confidence"}</span>
                          <span className="text-auth-accent">92%</span>
                        </div>
                        <div className="flex items-center justify-between rounded-lg bg-white/[0.05] px-2.5 py-2">
                          <span>{isVi ? "Nguồn trích" : "Citations"}</span>
                          <span className="text-auth-accent">3</span>
                        </div>
                        <div className="truncate rounded-lg bg-white/[0.05] px-2.5 py-2 text-white/70">
                          api-spec-v3.pdf
                        </div>
                      </div>
                    </div>
                    <div className="rounded-xl border border-auth-accent/18 bg-auth-accent-dim p-4">
                      <div className="flex h-full min-h-[132px] flex-col justify-between rounded-lg border border-white/[0.08] bg-auth-surface p-4">
                        <Check className="h-5 w-5 text-auth-accent" />
                        <p className="text-sm font-semibold leading-5 text-auth-text">
                          {dict.landing.queryMockupCitations}
                        </p>
                        <div className="mt-3 grid gap-1.5 text-[10px] font-bold text-auth-text-3">
                          <span className="rounded-md bg-white/[0.05] px-2 py-1">Source 1 verified</span>
                          <span className="rounded-md bg-white/[0.05] px-2 py-1">Source 2 exact match</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="absolute left-0 top-[30%] w-[76%] overflow-hidden rounded-[26px] border border-white/[0.08] bg-black p-3 shadow-[0_22px_42px_rgba(0,0,0,0.4)] transition duration-200 hover:border-white/[0.14] hover:opacity-95 sm:top-[28%] sm:p-4">
                  <div className="mb-3 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.16em] text-white/42">
                    <span>Pulse Knowledge</span>
                    <span>Live demo</span>
                  </div>
                  <video
                    className="aspect-video w-full rounded-2xl object-cover"
                    src="/videos/showcase.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                </div>

                <div className="absolute bottom-2 right-0 w-[64%] rounded-2xl border border-white/[0.08] bg-auth-elevated p-5 shadow-[0_18px_34px_rgba(0,0,0,0.28)] transition duration-200 hover:border-white/[0.14] hover:bg-auth-card-hover/80 hover:opacity-95 sm:w-[54%]">
                  <div className="flex items-center justify-between text-xs text-auth-accent">
                    <span className="font-bold">{dict.landing.feature4Title}</span>
                    <BookOpenText className="h-4 w-4" />
                  </div>
                  <p className="mt-5 text-3xl font-black leading-[0.92] tracking-[-0.05em] text-white sm:text-4xl">
                    {isVi ? "Wiki theo domain" : "Domain wiki"}
                  </p>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {["RAG", "API", "Ops"].map((item, index) => (
                      <div
                        key={item}
                        className={`min-h-16 rounded-xl p-3 text-[10px] font-black ${index === 1 ? "bg-auth-accent-dim text-auth-accent" : "bg-white/[0.08] text-white/78"}`}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>

          <LandingStats stats={proofStats} />

          <section id="features" className="scroll-mt-24 bg-auth-bg px-4 py-24 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-[1280px]">
              <ScrollReveal direction="up" className="max-w-3xl">
                <h2 className="text-[clamp(3rem,6vw,5.8rem)] font-black leading-[0.9] tracking-[-0.05em] text-white">
                  {dict.landing.featuresTitle}
                </h2>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-auth-text-2">
                  {dict.landing.featuresSubtitle}
                </p>
              </ScrollReveal>

              <div className="mt-14 grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
                <ScrollReveal direction="up" delay={0.05} className="rounded-[26px] border border-white/[0.08] bg-auth-surface p-6 text-white transition duration-200 hover:border-white/[0.14] hover:bg-auth-card-hover/70 hover:opacity-95 sm:p-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black tracking-[-0.03em]">{dict.landing.feature2Title}</h3>
                    <SearchCheck className="h-7 w-7 text-auth-accent" />
                  </div>
                  <div className="mt-8 rounded-2xl bg-white/[0.06] p-5 font-mono text-sm">
                    <p className="text-white/55">&gt; {dict.landing.queryMockupSearch}</p>
                    <p className="mt-5 leading-7 text-white/78">
                      <span className="font-bold text-auth-accent">PulseAI:</span>{" "}
                      {clean(dict.landing.queryMockupResponse)}
                    </p>
                  </div>
                </ScrollReveal>

                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                  {sourceRows.map((row, index) => (
                    <ScrollReveal key={row.source} direction="up" delay={0.08 + index * 0.04} className="rounded-[22px] border border-white/[0.08] bg-auth-elevated p-5 transition duration-200 hover:border-white/[0.14] hover:bg-auth-card-hover/80 hover:opacity-95">
                      <div className="flex items-center gap-3">
                        <row.icon className="h-5 w-5 text-auth-accent" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-white">{row.source}</p>
                          <p className="mt-1 text-xs font-bold uppercase tracking-[0.08em] text-auth-text-3">{row.state}</p>
                        </div>
                      </div>
                    </ScrollReveal>
                  ))}
                </div>
              </div>

              <div className="mt-5 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                {featureBlocks.map((feature, index) => (
                  <ScrollReveal key={feature.title} direction="up" delay={index * 0.04} className="rounded-[22px] border border-white/[0.08] bg-auth-elevated p-6 transition duration-200 hover:-translate-y-0.5 hover:border-white/[0.14] hover:bg-auth-card-hover/80 hover:opacity-95">
                    <feature.icon className="h-6 w-6 text-auth-accent" />
                    <h3 className="mt-8 text-xl font-black tracking-[-0.03em] text-white">{feature.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-auth-text-2">{feature.description}</p>
                    <p className="mt-5 text-xs font-black uppercase tracking-[0.08em] text-auth-accent">{feature.note}</p>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          <section id="how-it-works" className="scroll-mt-24 bg-auth-surface px-4 py-24 sm:px-6 lg:px-10">
            <div className="mx-auto max-w-[1280px]">
              <ScrollReveal direction="up" className="max-w-3xl">
                <h2 className="text-[clamp(3rem,6vw,5.6rem)] font-black leading-[0.9] tracking-[-0.05em] text-white">
                  {dict.landing.stepsTitle}
                </h2>
              </ScrollReveal>

              <div className="mt-14 divide-y divide-white/[0.08] rounded-[26px] border border-white/[0.08] bg-auth-bg">
                {steps.map((step, index) => (
                  <ScrollReveal key={step.number} direction="up" delay={index * 0.05} className="grid gap-6 p-6 transition duration-200 hover:bg-white/[0.025] hover:opacity-95 sm:grid-cols-[120px_1fr] lg:grid-cols-[160px_0.8fr_1fr] lg:p-8">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-sm font-black text-auth-accent">{step.number}</span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-auth-accent-dim">
                        <step.icon className="h-5 w-5 text-auth-accent" />
                      </span>
                    </div>
                    <h3 className="text-2xl font-black tracking-[-0.03em] text-white">{step.title}</h3>
                    <p className="text-base leading-7 text-auth-text-2">{step.description}</p>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          <section id="cta" className="bg-auth-bg px-4 py-24 sm:px-6 lg:px-10">
            <ScrollReveal direction="up" className="mx-auto grid max-w-[1280px] gap-8 rounded-[30px] border border-white/[0.08] bg-auth-elevated p-7 text-white transition duration-200 hover:border-white/[0.14] hover:bg-auth-card-hover/70 hover:opacity-95 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-end lg:p-12">
              <div className="max-w-2xl">
                <BrainCircuit className="mb-8 h-9 w-9 text-auth-accent" />
                <h2 className="text-[clamp(2.5rem,5vw,4.8rem)] font-black leading-[0.9] tracking-[-0.05em]">
                  {dict.landing.ctaTitle}
                </h2>
                <p className="mt-5 text-base leading-8 text-white/70">
                  {clean(dict.landing.ctaDesc)}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Link href={`/${locale}/register`} className="btn-landing-cta inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-black text-white">
                  {dict.landing.ctaStart}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a href="mailto:support@pulseknowledge.com" className="btn-landing-secondary inline-flex items-center justify-center gap-2 rounded-2xl px-7 py-4 text-base font-bold text-white">
                  {dict.landing.ctaContact}
                </a>
              </div>
            </ScrollReveal>
          </section>
        </main>

        <footer className="border-t border-white/[0.08] bg-auth-bg px-4 py-10 sm:px-6 lg:px-10">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-5 text-sm text-auth-text-3 sm:flex-row sm:items-center sm:justify-between">
            <Link href={`/${locale}`} className="inline-flex items-center gap-2 font-black text-white">
              <PulseLogo size={28} />
              <PulseWordmark className="text-sm" />
            </Link>
            <div className="flex flex-wrap gap-5">
              <Link href={`/${locale}/terms`}>{dict.common.terms}</Link>
              <Link href={`/${locale}/privacy`}>{dict.common.privacy}</Link>
              <a href="mailto:support@pulseknowledge.com">{dict.common.contact}</a>
            </div>
          </div>
        </footer>

        <ScrollToTop className="bottom-8 right-8" />
      </div>
    </>
  );
}
