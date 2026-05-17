import type { Metadata } from "next";
import Link from "next/link";
import { Brain, MessageSquareText, Layers, BookOpen, Search, Target, ArrowRight, Sparkles, ChevronRight } from "lucide-react";
import { generatePageMetadata, generateWebPageJsonLd } from "@/lib/seo";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export const metadata: Metadata = generatePageMetadata({
  title: "Pulse Knowledge — AI Researcher cá nhân hoá theo domain",
  description: "Tích lũy knowledge theo lĩnh vực chuyên môn. Hỏi gì cũng có câu trả lời có nguồn — dù 10 năm sau vẫn còn đó. Bắt đầu miễn phí.",
  path: "/",
});

const features = [
  { icon: Brain, color: "green" as const, title: "Knowledge Base theo Role", description: "Mỗi user tạo KB riêng theo lĩnh vực chuyên môn. Domain-organized, private — không share với ai.", tag: "Role KB" },
  { icon: MessageSquareText, color: "purple" as const, title: "Hỏi đáp AI có nguồn", description: "Câu trả lời grounded với citations, confidence level, và KB gap detection. Không bao giờ hallucinate.", tag: "Query AI" },
  { icon: Layers, color: "amber" as const, title: "Compile từ mọi nguồn", description: "Text, URL, file → Wiki item có cấu trúc với title, summary, tags, và citation-ready chunks tự động.", tag: "Pipeline" },
  { icon: BookOpen, color: "green" as const, title: "Wiki cá nhân", description: "Browse, tìm kiếm, lọc knowledge items. Mỗi item có concepts, citations, và personal notes.", tag: "Wiki" },
  { icon: Search, color: "purple" as const, title: "Auto Research", description: "Khi KB chưa đủ evidence, hệ thống tự identify gaps và trigger research flow bổ sung.", tag: "Research" },
  { icon: Target, color: "amber" as const, title: "Expert Advisor", description: "Chuyên gia theo domain của bạn, trả lời có chiều sâu. Không phải chatbot generic.", tag: "Advisor" },
];

const steps = [
  { number: "01", title: "Chọn Role", description: "Tạo Knowledge Base theo lĩnh vực của bạn — Engineering, Business, Design, Data, hoặc custom." },
  { number: "02", title: "Thêm Knowledge", description: "Paste text, dán URL, hoặc upload file. Hệ thống compile thành Wiki items có cấu trúc tự động." },
  { number: "03", title: "Hỏi AI", description: "Đặt câu hỏi và nhận câu trả lời có nguồn. Citations, confidence, follow-ups — tất cả từ KB của bạn." },
];

const iconGlowMap = {
  green: "bg-emerald-950/40 border border-emerald-400/20 text-emerald-400",
  purple: "bg-violet-950/30 border border-violet-500/20 text-violet-400",
  amber: "bg-amber-950/30 border border-amber-500/20 text-amber-400",
} as const;

export default function HomePage() {
  const jsonLd = generateWebPageJsonLd({ title: "Pulse Knowledge — AI Researcher cá nhân hoá theo domain", description: "Tích lũy knowledge theo lĩnh vực chuyên môn. Hỏi gì cũng có câu trả lời có nguồn.", path: "/" });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="min-h-screen bg-auth-bg text-auth-text">
        <Header />
        <main id="main-content">
          {/* HERO */}
          <section className="relative overflow-hidden px-5 pb-24 pt-32 lg:px-8 lg:pb-32 lg:pt-40 3xl:pb-40 3xl:pt-48">
            <div className="pointer-events-none absolute left-1/2 top-0 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/4 blur-[120px]" style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.14) 0%, transparent 70%)" }} aria-hidden="true" />
            <div className="pointer-events-none absolute -right-[100px] top-[20%] h-[500px] w-[500px] blur-[100px]" style={{ background: "radial-gradient(circle, oklch(0.78 0.14 195 / 0.08) 0%, transparent 70%)" }} aria-hidden="true" />
            <div className="pointer-events-none absolute -left-[80px] bottom-[10%] h-[350px] w-[350px] blur-[80px]" style={{ background: "radial-gradient(circle, oklch(0.68 0.18 280 / 0.05) 0%, transparent 70%)" }} aria-hidden="true" />

            <div className="relative mx-auto max-w-4xl text-center 3xl:max-w-5xl">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-auth-border-subtle bg-white/5 px-4 py-2 text-xs font-medium text-auth-text-2 backdrop-blur-md">
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                Early Access — Miễn phí
              </div>

              <h1 className="text-[clamp(2.25rem,6vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.04em] 3xl:text-[4.5rem] 4xl:text-[5rem]">
                <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 bg-[length:200%_auto] bg-clip-text text-transparent">Trí tuệ chuyên sâu</span>
                <br />tích lũy theo domain
              </h1>

              <p className="mx-auto mt-6 max-w-xl text-[clamp(0.9375rem,1.5vw,1.125rem)] leading-relaxed text-auth-text-2 3xl:max-w-2xl 3xl:text-lg">AI Researcher cá nhân, tích lũy knowledge theo lĩnh vực của bạn. Hỏi gì cũng có câu trả lời có nguồn — dù 10 năm sau vẫn còn đó.</p>

              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link href="/register" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-8 py-3.5 text-sm font-bold text-white shadow-[0_0_20px_rgba(52,211,153,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_0_40px_rgba(52,211,153,0.5)] active:scale-95 3xl:text-base">
                  Bắt đầu miễn phí
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                </Link>
                <a href="#how-it-works" className="inline-flex items-center gap-2 rounded-full border border-auth-border-subtle bg-white/5 px-8 py-3.5 text-sm font-medium text-auth-text backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/10 active:scale-95 3xl:text-base">
                  Xem cách hoạt động
                  <ChevronRight className="h-4 w-4" />
                </a>
              </div>

              {/* Query mockup */}
              <div className="mx-auto mt-16 max-w-2xl 3xl:max-w-3xl">
                <div className="rounded-2xl border border-auth-border-subtle bg-white/[0.03] p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md">
                  <div className="flex items-center gap-3 rounded-xl border border-auth-border-subtle bg-auth-elevated/80 px-4 py-3.5">
                    <Search className="h-4 w-4 shrink-0 text-auth-text-3" />
                    <span className="text-sm text-auth-text-3">&quot;Cách triển khai microservices cho hệ thống e-commerce?&quot;</span>
                  </div>
                  <div className="mt-4 space-y-2.5 px-1">
                    <div className="flex items-center gap-2 text-xs text-auth-text-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                      <span>3 citations từ KB của bạn</span>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">Confidence: High</span>
                    </div>
                    <p className="text-[13px] leading-relaxed text-auth-text-2">Dựa trên 12 tài liệu trong domain Engineering, triển khai microservices cho e-commerce nên bắt đầu từ...</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* FEATURES */}
          <section id="features" className="relative scroll-mt-16 px-5 py-24 lg:px-8 lg:py-32 3xl:py-40">
            <div className="pointer-events-none absolute left-1/2 top-[10%] h-[500px] w-[700px] -translate-x-1/2 blur-[120px]" style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.06) 0%, transparent 70%)" }} aria-hidden="true" />
            <div className="relative mx-auto max-w-7xl 3xl:max-w-[1680px] 4xl:max-w-[2200px]">
              <div className="mb-16 text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-auth-accent">Tính năng</p>
                <h2 className="text-[clamp(1.625rem,3.5vw,2.75rem)] font-extrabold tracking-tight 3xl:text-[3rem]">Mọi thứ bạn cần cho <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">knowledge cá nhân</span></h2>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-auth-text-2 3xl:text-base">Từ thu thập nguồn đến hỏi đáp AI có nguồn — tất cả trong một nền tảng duy nhất.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 3xl:gap-5">
                {features.map((f) => { const Icon = f.icon; return (
                  <div key={f.tag} className="group relative rounded-2xl border border-auth-border-subtle bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-auth-border-subtle hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] 3xl:p-8">
                    <div className="mb-5 flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconGlowMap[f.color]} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg 3xl:h-11 3xl:w-11`}><Icon className="h-[18px] w-[18px] 3xl:h-5 3xl:w-5" /></div>
                      <span className="rounded-full border border-auth-border-subtle bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-auth-text-3">{f.tag}</span>
                    </div>
                    <h3 className="mb-2 text-[15px] font-bold tracking-tight 3xl:text-base">{f.title}</h3>
                    <p className="text-[13px] leading-relaxed text-auth-text-2/80 3xl:text-sm">{f.description}</p>
                  </div>
                ); })}
              </div>
            </div>
          </section>

          {/* HOW IT WORKS */}
          <section id="how-it-works" className="relative scroll-mt-16 px-5 py-24 lg:px-8 lg:py-32 3xl:py-40">
            <div className="pointer-events-none absolute right-[10%] top-[30%] h-[400px] w-[400px] blur-[100px]" style={{ background: "radial-gradient(circle, oklch(0.75 0.19 160 / 0.07) 0%, transparent 70%)" }} aria-hidden="true" />
            <div className="relative mx-auto max-w-5xl 3xl:max-w-6xl">
              <div className="mb-16 text-center">
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-auth-accent">Cách hoạt động</p>
                <h2 className="text-[clamp(1.625rem,3.5vw,2.75rem)] font-extrabold tracking-tight 3xl:text-[3rem]">Bắt đầu trong <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">3 bước</span></h2>
              </div>
              <div className="grid gap-6 md:grid-cols-3 lg:gap-8">
                {steps.map((s, i) => (
                  <div key={s.number} className="relative">
                    {i < steps.length - 1 && <div className="pointer-events-none absolute right-0 top-12 hidden h-px w-full translate-x-1/2 bg-gradient-to-r from-white/10 to-transparent md:block" />}
                    <div className="group relative rounded-2xl border border-auth-border-subtle bg-white/[0.02] p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-auth-border-subtle hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] 3xl:p-9">
                      <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-950/40 text-xl font-bold text-emerald-400 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(52,211,153,0.2)] 3xl:h-14 3xl:w-14 3xl:text-2xl">{s.number}</div>
                      <h3 className="mb-2 text-base font-bold tracking-tight 3xl:text-lg">{s.title}</h3>
                      <p className="text-[13px] leading-relaxed text-auth-text-2/80 3xl:text-sm">{s.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA */}
          <section id="cta" className="scroll-mt-16 px-5 py-24 lg:px-8 lg:py-32 3xl:py-40">
            <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-auth-border-subtle bg-white/[0.03] p-12 text-center shadow-[0_8px_40px_rgba(0,0,0,0.4)] backdrop-blur-md sm:p-16 lg:p-20 3xl:max-w-5xl 3xl:p-24">
              <div className="pointer-events-none absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 blur-[100px]" style={{ background: "radial-gradient(ellipse, oklch(0.75 0.19 160 / 0.14) 0%, transparent 70%)" }} aria-hidden="true" />
              <div className="relative">
                <h2 className="text-[clamp(1.5rem,3.5vw,2.5rem)] font-extrabold tracking-tight 3xl:text-[2.75rem]">Sẵn sàng xây dựng <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">knowledge base</span> của bạn?</h2>
                <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-auth-text-2 3xl:text-base">Bắt đầu miễn phí — không cần thẻ tín dụng. Tạo Role KB đầu tiên trong 2 phút.</p>
                <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link href="/register" className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-10 py-4 text-base font-bold text-white shadow-[0_0_30px_rgba(52,211,153,0.4)] transition-all duration-300 hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_0_60px_rgba(52,211,153,0.6)] active:scale-95">
                    Bắt đầu miễn phí <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                  <a href="mailto:support@pulseknowledge.com" className="inline-flex items-center gap-2 rounded-full border border-auth-border-subtle bg-white/5 px-10 py-4 text-base font-medium text-auth-text backdrop-blur-md transition-all duration-300 hover:scale-105 hover:bg-white/10 active:scale-95">Liên hệ tư vấn</a>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
