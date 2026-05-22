import type { Metadata } from "next";
import Link from "next/link";
import { Brain, MessageSquareText, Layers, BookOpen, Search, Target, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { TypewriterWrapper, TypewriterChild } from "@/components/ui/typewriter-effect";
import { ScrollToTop } from "@/components/ui";
import { getDictionary } from "@/dictionaries";
import type { Variants } from "framer-motion";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: `${dict.landing.title1} ${dict.landing.title2} — Pulse Knowledge`,
    description: dict.landing.subtitle,
    path: `/${locale}`,
  });
}

const iconGlowMap = {
  green: "bg-brand-950/40 border border-brand-400/20 text-brand-400",
  purple: "bg-violet-950/30 border border-violet-500/20 text-violet-400",
  amber: "bg-amber-950/30 border border-amber-500/20 text-amber-400",
} as const;

// Animation variants for typewriter children
const childVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring" as const, damping: 12, stiffness: 100 } }
};

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const features = [
    { icon: Brain, color: "green" as const, title: dict.landing.feature1Title, description: dict.landing.feature1Desc, tag: "Role KB" },
    { icon: MessageSquareText, color: "purple" as const, title: dict.landing.feature2Title, description: dict.landing.feature2Desc, tag: "Query AI" },
    { icon: Layers, color: "amber" as const, title: dict.landing.feature3Title, description: dict.landing.feature3Desc, tag: "Pipeline" },
    { icon: BookOpen, color: "green" as const, title: dict.landing.feature4Title, description: dict.landing.feature4Desc, tag: "Wiki" },
    { icon: Search, color: "purple" as const, title: dict.landing.feature5Title, description: dict.landing.feature5Desc, tag: "Research" },
    { icon: Target, color: "amber" as const, title: dict.landing.feature6Title, description: dict.landing.feature6Desc, tag: "Advisor" },
  ];

  const steps = [
    { number: "01", title: dict.landing.step1, description: dict.landing.step1Desc },
    { number: "02", title: dict.landing.step2, description: dict.landing.step2Desc },
    { number: "03", title: dict.landing.step3, description: dict.landing.step3Desc },
  ];

  const jsonLd = generateWebPageJsonLd({
    title: `${dict.landing.title1} ${dict.landing.title2} — Pulse Knowledge`,
    description: dict.landing.subtitle,
    path: `/${locale}`
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen overflow-x-hidden bg-auth-bg text-auth-text">
        <Header />
        <main id="main-content">
          {/* HERO */}
          <section className="relative overflow-hidden px-5 pb-24 pt-32 lg:px-8 lg:pb-32 lg:pt-40 3xl:pb-40 3xl:pt-48">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/4 blur-[120px]" style={{ background: "radial-gradient(ellipse, var(--color-auth-accent-glow) 0%, transparent 70%)" }} aria-hidden="true" />
            <div className="pointer-events-none absolute -right-[100px] top-[20%] h-[500px] w-[500px] blur-[100px]" style={{ background: "radial-gradient(circle, oklch(0.78 0.14 195 / 0.08) 0%, transparent 70%)" }} aria-hidden="true" />
            <div className="pointer-events-none absolute -left-[80px] bottom-[10%] h-[350px] w-[350px] blur-[80px]" style={{ background: "radial-gradient(circle, oklch(0.68 0.18 280 / 0.05) 0%, transparent 70%)" }} aria-hidden="true" />

            <div className="relative mx-auto max-w-4xl text-center 3xl:max-w-5xl">
              <ScrollReveal delay={0.1}>
                <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold text-auth-text-2 backdrop-blur-md uppercase tracking-wider">
                  {dict.landing.badge}
                </div>
              </ScrollReveal>

              <TypewriterWrapper delay={0.2} className="text-[clamp(2.25rem,6vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] 3xl:text-[4.5rem] 4xl:text-[5rem]">
                <span className="inline-block bg-gradient-to-r from-brand-400 via-accent-300 to-brand-400 bg-[length:200%_auto] bg-clip-text text-transparent">
                  {dict.landing.title1}
                </span>
                <br />
                <span className="inline-block">
                  {dict.landing.title2}
                </span>
              </TypewriterWrapper>

              <ScrollReveal delay={0.6} direction="up">
                <p className="mx-auto mt-6 max-w-xl text-[clamp(0.9375rem,1.5vw,1.125rem)] leading-relaxed text-auth-text-2 3xl:max-w-2xl 3xl:text-lg">
                  {dict.landing.subtitle}
                </p>
              </ScrollReveal>

              <ScrollReveal delay={0.8} direction="up">
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link href={`/${locale}/register`} className="group inline-flex items-center gap-2 rounded-full bg-auth-accent px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_var(--color-auth-accent-glow)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-auth-accent-dark hover:shadow-[0_0_40px_var(--color-auth-accent-glow)] active:scale-95 3xl:text-base">
                    {dict.landing.ctaStart}
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                  <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-medium text-auth-text backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/10 active:scale-95 3xl:text-base">
                    {dict.landing.ctaHow}
                    <ChevronRight className="h-4 w-4" />
                  </a>
                </div>
              </ScrollReveal>

              {/* Query mockup */}
              <ScrollReveal delay={1.0} direction="up">
                <div className="mx-auto mt-16 max-w-2xl 3xl:max-w-3xl">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md">
                    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-auth-elevated/80 px-4 py-3.5">
                      <Search className="h-4 w-4 shrink-0 text-auth-text-3" />
                      <TypewriterWrapper delay={1.2}>
                        <span className="text-sm text-auth-text-3">
                          <span className="text-auth-accent">&quot;{dict.landing.queryMockupSearch}&quot;</span>
                        </span>
                      </TypewriterWrapper>
                    </div>
                    <ScrollReveal delay={1.8} direction="up">
                      <div className="mt-4 space-y-2.5 px-1 text-left">
                        <div className="flex items-center gap-2 text-xs text-auth-text-3">
                          <div className="h-1.5 w-1.5 rounded-full bg-auth-accent shadow-[0_0_6px_var(--color-auth-accent-glow)]" />
                          <span>{dict.landing.queryMockupCitations}</span>
                          <span className="rounded-full border border-auth-border bg-auth-elevated px-2.5 py-0.5 text-[10px] font-semibold text-auth-text-2">Confidence: High</span>
                        </div>
                        <p className="text-[13px] leading-relaxed text-auth-text-2">{dict.landing.queryMockupResponse}</p>
                      </div>
                    </ScrollReveal>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" className="relative overflow-hidden scroll-mt-16 px-5 py-24 lg:px-8 lg:py-32 3xl:py-40">
            <div className="pointer-events-none absolute left-1/2 top-[10%] h-[500px] w-[700px] -translate-x-1/2 blur-[120px]" style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.06) 0%, transparent 70%)" }} aria-hidden="true" />
            <div className="relative mx-auto max-w-7xl 3xl:max-w-[1680px] 4xl:max-w-[2200px]">
              <ScrollReveal direction="up">
                <div className="mb-16 text-center">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-auth-accent">{dict.landing.navFeatures}</p>
                  <h2 className="text-[clamp(1.625rem,3.5vw,2.75rem)] font-extrabold tracking-tight 3xl:text-[3rem]">
                    {dict.landing.featuresTitle}
                  </h2>
                  <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-auth-text-2 3xl:text-base">
                    {dict.landing.featuresSubtitle}
                  </p>
                </div>
              </ScrollReveal>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 3xl:gap-5">
                {features.map((f, i) => { const Icon = f.icon; return (
                  <ScrollReveal key={f.tag} delay={i * 0.1} direction="up">
                    <div className="group h-full relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] 3xl:p-8">
                       <div className="mb-5 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-auth-elevated text-auth-text-3 border border-auth-border transition-all duration-300 group-hover:bg-auth-accent-dim group-hover:text-auth-accent group-hover:border-auth-accent/20 group-hover:scale-105 3xl:h-11 3xl:w-11"><Icon className="h-[18px] w-[18px] 3xl:h-5 3xl:w-5" /></div>
                        <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-auth-text-3">{f.tag}</span>
                      </div>
                      <h3 className="mb-2 text-[15px] font-bold tracking-tight 3xl:text-base">{f.title}</h3>
                      <p className="text-[13px] leading-relaxed text-auth-text-2/80 3xl:text-sm">{f.description}</p>
                    </div>
                  </ScrollReveal>
                ); })}
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section id="how-it-works" className="relative overflow-hidden scroll-mt-16 px-5 py-24 lg:px-8 lg:py-32 3xl:py-40">
            <div className="pointer-events-none absolute right-[10%] top-[30%] h-[400px] w-[400px] blur-[100px]" style={{ background: "radial-gradient(circle, oklch(0.75 0.19 160 / 0.07) 0%, transparent 70%)" }} aria-hidden="true" />
            <div className="relative mx-auto max-w-5xl 3xl:max-w-6xl">
              <ScrollReveal direction="up">
                <div className="mb-16 text-center">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-auth-accent">{dict.landing.howItWorks}</p>
                  <h2 className="text-[clamp(1.625rem,3.5vw,2.75rem)] font-extrabold tracking-tight 3xl:text-[3rem]">
                    {dict.landing.stepsTitle}
                  </h2>
                </div>
              </ScrollReveal>
              <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
                {steps.map((s, i) => (
                  <ScrollReveal key={s.number} delay={i * 0.15} direction="up" className="relative">
                    {i < steps.length - 1 && <div className="pointer-events-none absolute right-0 top-12 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-white/10 to-transparent md:block" />}
                    <div className="group h-full relative rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.12] hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] 3xl:p-9">
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-auth-border bg-auth-elevated text-xl font-bold text-auth-text-2 transition-all duration-300 group-hover:border-auth-accent/20 group-hover:bg-auth-accent-dim group-hover:text-auth-accent group-hover:shadow-[0_0_20px_var(--color-auth-accent-glow)] 3xl:h-14 3xl:w-14 3xl:text-2xl">{s.number}</div>
                      <h3 className="mb-2 text-base font-bold tracking-tight 3xl:text-lg">{s.title}</h3>
                      <p className="text-[13px] leading-relaxed text-auth-text-2/80 3xl:text-sm">{s.description}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section id="cta" className="relative overflow-hidden scroll-mt-16 px-5 py-24 lg:px-8 lg:py-32 3xl:py-40">
            <ScrollReveal direction="up" delay={0.2}>
              <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center shadow-[0_8px_40px_rgba(0,0,0,0.4)] backdrop-blur-md sm:p-16 lg:p-20 3xl:max-w-5xl 3xl:p-24">
                <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 blur-[100px]" style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.14) 0%, transparent 70%)" }} aria-hidden="true" />
                <div className="relative">
                  <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-extrabold tracking-tight 3xl:text-[2.75rem]">
                    {dict.landing.ctaTitle}
                  </h2>
                  <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-auth-text-2 3xl:text-base">
                    {dict.landing.ctaDesc}
                  </p>
                  <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <Link href={`/${locale}/register`} className="group inline-flex items-center gap-2 rounded-full bg-auth-accent px-10 py-4 text-base font-bold text-white shadow-[0_0_30px_var(--color-auth-accent-glow)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:bg-auth-accent-dark hover:shadow-[0_0_60px_var(--color-auth-accent-glow)] active:scale-95">
                      {dict.landing.ctaStart} <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                    <a href="mailto:support@pulseknowledge.com" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-10 py-4 text-base font-medium text-auth-text backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/10 active:scale-95">
                      {dict.landing.ctaContact}
                    </a>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </section>
        </main>
        <Footer />
        <ScrollToTop className="bottom-8 right-8" />
      </div>
    </>
  );
}
