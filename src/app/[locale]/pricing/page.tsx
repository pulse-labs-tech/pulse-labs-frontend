import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { generatePageMetadata } from "@/lib/seo";
import { PricingView } from "@/components/pricing/pricing-view";
import { ScrollToTop } from "@/components/ui";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata({
    title: locale === "vi" ? "Bảng giá dịch vụ — Pulse Knowledge" : "Pricing Tiers — Pulse Knowledge",
    description: locale === "vi" 
      ? "So sánh các gói dịch vụ Free và Pro của Pulse Knowledge. Nâng cấp để nhận thêm dung lượng và tính năng AI."
      : "Compare Free and Pro tiers on Pulse Knowledge. Upgrade to access unlimited compilations and roles.",
    path: `/${locale}/pricing`,
  });
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-auth-bg text-auth-text flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 py-16 lg:py-24">
        <PricingView />
      </main>
      <Footer />
      <ScrollToTop className="bottom-8 right-8" />
    </div>
  );
}
