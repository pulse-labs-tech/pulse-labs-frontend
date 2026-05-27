import type { Metadata } from "next";
import { getDictionary } from "@/dictionaries";
import { generatePageMetadata } from "@/lib/seo";
import { WelcomePageClient } from "@/components/auth/welcome-screen";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return generatePageMetadata({
    title: `${dict.onboarding.welcome.title} — Pulse Knowledge`,
    description: dict.onboarding.welcome.tagline,
    path: `/${locale}/welcome`,
  });
}

/**
 * /welcome — Shown after successful registration.
 * Protected route: user must be logged in to see this.
 * Displays a welcome screen before proceeding to /onboarding.
 */
export default async function WelcomePage() {
  return <WelcomePageClient />;
}
