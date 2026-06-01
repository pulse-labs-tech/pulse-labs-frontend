import type { Metadata } from "next";
import Link from "next/link";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { ScrollToTop } from "@/components/ui";
import { getDictionary } from "@/dictionaries";
import { ShowcaseVideo } from "@/components/shared/showcase-video";
import { 
  FileText, 
  Globe, 
  Database, 
  FolderGit2, 
  FolderLock,
  ArrowRight,
  ChevronRight,
  Compass,
  BrainCircuit
} from "lucide-react";

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

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

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
          <section className="relative overflow-hidden pb-24 pt-32 lg:pb-32 lg:pt-40 3xl:pb-40 3xl:pt-48">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/4 blur-[120px]" style={{ background: "radial-gradient(ellipse, var(--color-auth-accent-glow) 0%, transparent 70%)" }} aria-hidden="true" />
            <div className="pointer-events-none absolute -right-[100px] top-[20%] h-[500px] w-[500px] blur-[100px]" style={{ background: "radial-gradient(circle, oklch(0.78 0.14 195 / 0.08) 0%, transparent 70%)" }} aria-hidden="true" />
            <div className="pointer-events-none absolute -left-[80px] bottom-[10%] h-[350px] w-[350px] blur-[80px]" style={{ background: "radial-gradient(circle, oklch(0.68 0.18 280 / 0.05) 0%, transparent 70%)" }} aria-hidden="true" />

            <div className="relative container-focused text-center">
              <div className="mx-auto max-w-4xl">
                <ScrollReveal delay={0.05}>
                  <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[11px] font-semibold text-auth-text-2 backdrop-blur-md uppercase tracking-wider">
                    {dict.landing.badge}
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.1} direction="up">
                  <h1 className="text-[clamp(2.25rem,6vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.03em] 3xl:text-[4.5rem] 4xl:text-[5rem] text-white">
                    {dict.landing.title1}
                    <br />
                    <span className="text-auth-accent">
                      {dict.landing.title2}
                    </span>
                  </h1>
                </ScrollReveal>

                <ScrollReveal delay={0.2} direction="up">
                  <p className="mx-auto mt-6 max-w-2xl text-[clamp(0.9375rem,1.5vw,1.125rem)] leading-relaxed text-auth-text-2">
                    {dict.landing.subtitle}
                  </p>
                </ScrollReveal>

                <ScrollReveal delay={0.3} direction="up">
                  <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                    <Link href={`/${locale}/register`} className="group btn-primary-pulse px-8 py-3.5 text-sm font-bold shadow-[0_0_20px_var(--color-auth-accent-glow)] transition-all duration-300 active:scale-95">
                      {dict.landing.ctaStart}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </Link>
                    <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-8 py-3.5 text-sm font-medium text-auth-text backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/10 active:scale-95">
                      {dict.landing.ctaHow}
                      <ChevronRight className="h-4 w-4" />
                    </a>
                  </div>
                </ScrollReveal>

                {/* HLS Video Showcase */}
                <ScrollReveal delay={0.4} direction="up">
                  <div className="mx-auto mt-16 max-w-4xl 3xl:max-w-5xl">
                    <ShowcaseVideo />
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>

          {/* FEATURES - Bento Grid */}
          <section id="features" className="relative overflow-hidden scroll-mt-16 py-24 lg:py-32 3xl:py-40">
            <div className="pointer-events-none absolute left-1/2 top-[10%] h-[500px] w-[700px] -translate-x-1/2 blur-[120px]" style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.06) 0%, transparent 70%)" }} aria-hidden="true" />
            
            <div className="relative container-focused w-full">
              <ScrollReveal direction="up">
                <div className="mb-16 text-center">
                  <span className="inline-block px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.02] text-[10px] font-bold text-auth-accent tracking-wider uppercase mb-4">
                    {dict.landing.navFeatures}
                  </span>
                  <h2 className="text-[clamp(1.625rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-white mb-4">
                    {dict.landing.featuresTitle}
                  </h2>
                  <p className="mx-auto max-w-lg text-sm leading-relaxed text-auth-text-2">
                    {dict.landing.featuresSubtitle}
                  </p>
                </div>
              </ScrollReveal>

              {/* Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
                
                {/* Card 1: Sourced AI Q&A (Large - 2 cols) */}
                <ScrollReveal delay={0.1} direction="up" className="md:col-span-2">
                  <div className="group h-full relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <span className="rounded-full border border-brand-400/20 bg-brand-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-brand-400 uppercase tracking-wider">
                        Query AI
                      </span>
                    </div>
                    <h3 className="mb-2 text-base font-bold text-white tracking-tight">{dict.landing.feature2Title}</h3>
                    <p className="text-[13px] leading-relaxed text-auth-text-2 max-w-xl">{dict.landing.feature2Desc}</p>

                    {/* Visual Mockup - Chat UI */}
                    <div className="relative mt-6 border border-white/[0.06] bg-black/40 rounded-xl p-5 font-mono text-[11px] select-none text-left">
                      <div className="flex items-center gap-2 border-b border-white/[0.04] pb-2.5 mb-4 text-[9px] text-auth-text-3">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Query Terminal — Engineering KB</span>
                      </div>
                      
                      {/* User message */}
                      <div className="mb-4">
                        <span className="text-auth-text-3 mr-2">&gt; query:</span>
                        <span className="text-white font-medium">{dict.landing.queryMockupSearch}</span>
                      </div>

                      {/* Citations badge */}
                      <div className="mb-3.5 flex items-center gap-2 flex-wrap">
                        <span className="text-[9px] text-auth-text-3 font-semibold uppercase tracking-wider bg-white/5 border border-white/10 px-2 py-0.5 rounded">Citations</span>
                        <span className="text-[10px] text-auth-accent font-medium">{dict.landing.queryMockupCitations}</span>
                      </div>

                      {/* Answer bubble */}
                      <div className="text-auth-text-2 leading-relaxed bg-white/[0.01] border border-white/[0.04] rounded-lg p-3">
                        <span className="text-auth-accent mr-1 font-bold">PulseAI:</span>
                        {dict.landing.queryMockupResponse}
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Card 2: Personal Wiki Library (Small - 1 col) */}
                <ScrollReveal delay={0.2} direction="up">
                  <div className="group h-full relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="rounded-full border border-violet-500/20 bg-violet-950/30 px-2.5 py-0.5 text-[10px] font-semibold text-violet-400 uppercase tracking-wider">
                          Wiki
                        </span>
                      </div>
                      <h3 className="mb-2 text-base font-bold text-white tracking-tight">{dict.landing.feature4Title}</h3>
                      <p className="text-[13px] leading-relaxed text-auth-text-2">{dict.landing.feature4Desc}</p>
                    </div>

                    {/* Visual Mockup - Tags & Detail */}
                    <div className="mt-6 space-y-3.5 text-left">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="text-[10px] bg-brand-950/40 border border-brand-400/20 text-brand-400 px-2 py-0.5 rounded-full font-medium">#Architecture</span>
                        <span className="text-[10px] bg-violet-950/30 border border-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full font-medium">#Security</span>
                      </div>
                      
                      <div className="border border-white/[0.06] bg-black/30 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white truncate max-w-[130px]">OAuth 2.0 PKCE Flow</span>
                          <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono">Grounded</span>
                        </div>
                        <p className="text-[10.5px] text-auth-text-3 line-clamp-2 leading-normal font-mono">
                          Authorization Code Flow with PKCE prevents authorization code interception attacks...
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Card 3: Ingestion Pipeline (Small - 1 col) */}
                <ScrollReveal delay={0.25} direction="up">
                  <div className="group h-full relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="rounded-full border border-amber-500/20 bg-amber-950/30 px-2.5 py-0.5 text-[10px] font-semibold text-amber-400 uppercase tracking-wider">
                          Pipeline
                        </span>
                      </div>
                      <h3 className="mb-2 text-base font-bold text-white tracking-tight">{dict.landing.feature3Title}</h3>
                      <p className="text-[13px] leading-relaxed text-auth-text-2">{dict.landing.feature3Desc}</p>
                    </div>

                    {/* Visual Mockup - Ingestion streams */}
                    <div className="mt-6 space-y-2.5 font-mono text-[9.5px] text-left">
                      {/* PDF Ingested */}
                      <div className="border border-white/[0.04] bg-black/20 rounded-lg p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white flex items-center gap-1.5 truncate max-w-[150px]">
                            <FileText className="h-3.5 w-3.5 text-red-400 shrink-0" />
                            api-spec-v3.pdf
                          </span>
                          <span className="text-auth-accent">100%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-auth-accent rounded-full" style={{ width: "100%" }} />
                        </div>
                      </div>

                      {/* URL Processing */}
                      <div className="border border-white/[0.04] bg-black/20 rounded-lg p-2.5 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-white flex items-center gap-1.5 truncate max-w-[150px]">
                            <Globe className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                            stripe.com/docs
                          </span>
                          <span className="text-amber-400 animate-pulse">45%</span>
                        </div>
                        <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full animate-pulse" style={{ width: "45%" }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>

                {/* Card 4: Role-Based Private KBs (Large - 2 cols) */}
                <ScrollReveal delay={0.3} direction="up" className="md:col-span-2">
                  <div className="group h-full relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 backdrop-blur-sm hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <span className="rounded-full border border-brand-400/20 bg-brand-950/40 px-2.5 py-0.5 text-[10px] font-semibold text-brand-400 uppercase tracking-wider">
                        Role KB
                      </span>
                    </div>
                    <h3 className="mb-2 text-base font-bold text-white tracking-tight">{dict.landing.feature1Title}</h3>
                    <p className="text-[13px] leading-relaxed text-auth-text-2 max-w-xl">{dict.landing.feature1Desc}</p>

                    {/* Visual Mockup - Folder Vaults */}
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                      <div className="border border-brand-400/25 bg-brand-950/20 rounded-xl p-4.5 space-y-2">
                        <div className="flex items-center justify-between text-brand-400">
                          <FolderGit2 className="h-5 w-5" />
                          <span className="text-[9px] font-bold bg-brand-400/10 px-1.5 py-0.5 rounded font-mono">Active</span>
                        </div>
                        <h4 className="text-xs font-bold text-white">Engineering KB</h4>
                        <p className="text-[10px] text-brand-400/70 font-mono">142 sources compiled</p>
                      </div>

                      <div className="border border-violet-500/20 bg-violet-950/10 rounded-xl p-4.5 space-y-2">
                        <div className="flex items-center justify-between text-violet-400">
                          <FolderLock className="h-5 w-5" />
                          <span className="text-[9px] font-bold bg-violet-400/10 px-1.5 py-0.5 rounded font-mono">Secure</span>
                        </div>
                        <h4 className="text-xs font-bold text-white">Finance & Tax</h4>
                        <p className="text-[10px] text-violet-400/70 font-mono">48 sources compiled</p>
                      </div>

                      <div className="border border-amber-500/20 bg-amber-950/10 rounded-xl p-4.5 space-y-2">
                        <div className="flex items-center justify-between text-amber-400">
                          <FolderLock className="h-5 w-5" />
                          <span className="text-[9px] font-bold bg-amber-400/10 px-1.5 py-0.5 rounded font-mono">Secure</span>
                        </div>
                        <h4 className="text-xs font-bold text-white">Legal Docs</h4>
                        <p className="text-[10px] text-amber-400/70 font-mono">31 sources compiled</p>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              </div>

              {/* Supporting Features Row */}
              <div className="mt-12 border-t border-white/[0.06] pt-12 grid gap-8 sm:grid-cols-2 text-left">
                <ScrollReveal delay={0.1} direction="up" className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-auth-elevated border border-auth-border text-auth-accent">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1.5">{dict.landing.feature5Title}</h4>
                    <p className="text-[13px] leading-relaxed text-auth-text-2">{dict.landing.feature5Desc}</p>
                  </div>
                </ScrollReveal>

                <ScrollReveal delay={0.2} direction="up" className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-auth-elevated border border-auth-border text-auth-accent">
                    <BrainCircuit className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1.5">{dict.landing.feature6Title}</h4>
                    <p className="text-[13px] leading-relaxed text-auth-text-2">{dict.landing.feature6Desc}</p>
                  </div>
                </ScrollReveal>
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section id="how-it-works" className="relative overflow-hidden scroll-mt-16 py-24 lg:py-32 3xl:py-40">
            <div className="pointer-events-none absolute right-[10%] top-[30%] h-[400px] w-[400px] blur-[100px]" style={{ background: "radial-gradient(circle, oklch(0.75 0.19 160 / 0.07) 0%, transparent 70%)" }} aria-hidden="true" />
            
            <div className="relative container-focused w-full text-center">
              <ScrollReveal direction="up">
                <div className="mb-16">
                  <span className="inline-block px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.02] text-[10px] font-bold text-auth-accent tracking-wider uppercase mb-4">
                    {dict.landing.howItWorks}
                  </span>
                  <h2 className="text-[clamp(1.625rem,3.5vw,2.75rem)] font-extrabold tracking-tight text-white mb-4">
                    {dict.landing.stepsTitle}
                  </h2>
                </div>
              </ScrollReveal>

              {/* Steps Workflow */}
              <div className="relative grid gap-8 md:grid-cols-3">
                <div className="pointer-events-none absolute left-[15%] right-[15%] top-7 hidden h-[1.5px] bg-gradient-to-r from-auth-accent/40 via-auth-accent/20 to-transparent md:block" />

                {steps.map((s, i) => (
                  <ScrollReveal key={s.number} delay={i * 0.1} direction="up" className="relative group">
                    <div className="relative flex flex-col items-center">
                      {/* Step Circle */}
                      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-auth-accent/20 bg-auth-elevated text-lg font-bold text-auth-accent shadow-[0_0_15px_var(--color-auth-accent-glow)] transition-all duration-300 group-hover:scale-110 group-hover:border-auth-accent group-hover:bg-auth-accent group-hover:text-white">
                        {s.number}
                      </div>
                      <h3 className="mb-3 text-base font-bold text-white">{s.title}</h3>
                      <p className="text-[13px] leading-relaxed text-auth-text-2 max-w-xs">{s.description}</p>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section id="cta" className="relative overflow-hidden scroll-mt-16 py-24 lg:py-32 3xl:py-40">
            <div className="relative container-focused w-full">
              <ScrollReveal direction="up" delay={0.1}>
                <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-12 text-center shadow-[0_8px_40px_rgba(0,0,0,0.4)] backdrop-blur-md sm:p-16 lg:p-20">
                  <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 blur-[100px]" style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.14) 0%, transparent 70%)" }} aria-hidden="true" />
                  <div className="relative">
                    <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-extrabold tracking-tight text-white mb-4">
                      {dict.landing.ctaTitle}
                    </h2>
                    <p className="mx-auto max-w-md text-sm leading-relaxed text-auth-text-2 mb-10">
                      {dict.landing.ctaDesc}
                    </p>
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                      <Link href={`/${locale}/register`} className="group btn-primary-pulse px-10 py-4 text-base font-bold shadow-[0_0_30px_var(--color-auth-accent-glow)] transition-all duration-300 active:scale-95">
                        {dict.landing.ctaStart}
                        <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-0.5" />
                      </Link>
                      <a href="mailto:support@pulseknowledge.com" className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-10 py-4 text-base font-medium text-auth-text backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/10 active:scale-95">
                        {dict.landing.ctaContact}
                      </a>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </section>
        </main>
        <Footer />
        <ScrollToTop className="bottom-8 right-8" />
      </div>
    </>
  );
}
